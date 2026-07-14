import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    query,
    where,
    serverTimestamp,
    DocumentData,
    QueryDocumentSnapshot,
    writeBatch,
    increment,
    onSnapshot,
    Unsubscribe,
    arrayUnion
} from 'firebase/firestore';
import { db } from './firebase';
import { CartItem, Order } from '../types';
import { partnerService } from './partnerService';

const getTimestampTime = (value: any): number => {
    if (!value) return 0;
    if (value instanceof Date) return value.getTime();
    if (typeof value?.toDate === 'function') return value.toDate().getTime();

    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
};

export const cartService = {
    /**
     * Salvar carrinho do usuário no Firestore (dentro do documento do usuário)
     */
    async saveCart(userId: string, cartItems: CartItem[]): Promise<{ success: boolean; error?: string }> {

        try {
            const cleanCart = cartItems.map((item) => ({
                id: item.id,
                name: item.name,
                price: item.price,
                image: item.image,
                qty: item.qty,
                category: item.category || "",
                brand: item.brand || "",
            }));

            await setDoc(doc(db, 'users', userId), {
                cart: cleanCart,
                cartUpdatedAt: new Date().toISOString(),
            }, { merge: true });

            return { success: true };
        } catch (error: any) {
            console.error('❌ [saveCart] Erro:', error.message);
            return { success: false, error: error.message };
        }
    },

    /**
     * Carregar carrinho do usuário
     */
    async loadCart(userId: string): Promise<CartItem[]> {

        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (!userDoc.exists()) {
                return [];
            }

            const userData = userDoc.data();
            const cart = userData?.cart || [];
            return cart;
        } catch (error) {
            console.error('❌ [loadCart] Erro:', error);
            return [];
        }
    },

    /**
     * Criar pedido COM ATUALIZAÇÃO DE ESTOQUE E COMISSÕES DE PARCEIROS
     */
    async createOrder(
        userId: string,
        cartItems: CartItem[],
        totalAmount: number,
        customerData: any,
        paymentMethod: string = "multicaixa",
        paymentProof?: string
    ): Promise<{ success: boolean; orderId?: string; orderNumber?: string; error?: string }> {

        try {
            const orderNumber = "ORD-" + Date.now().toString().slice(-8);

            // 1. Buscar informações dos produtos (para verificar parceiros)
            const productPromises = cartItems.map(async (item) => {
                if (item.id) {
                    const productDoc = await getDoc(doc(db, 'products', item.id));
                    if (productDoc.exists()) {
                        return { id: item.id, data: productDoc.data() };
                    }
                }
                return null;
            });

            const productsData = await Promise.all(productPromises);
            const productMap = new Map();
            productsData.forEach((p) => {
                if (p) productMap.set(p.id, p.data);
            });

            // 2. Criar pedido no Firestore
            const orderData = {
                userId: userId,
                orderNumber: orderNumber,
                items: cartItems.map((item) => {
                    const product = productMap.get(item.id);
                    const isPartner = product?.isPartnerProduct || false;
                    return {
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        image: item.image,
                        qty: item.qty,
                        category: item.category || "",
                        brand: item.brand || "",
                        isPartnerProduct: isPartner,
                        partnerId: product?.partnerId || null,
                        commissionRate: product?.commissionRate || 0,
                        commissionValue: isPartner
                            ? (item.price * (product?.commissionRate || 15)) / 100
                            : 0,
                    };
                }),
                total: totalAmount,
                status: "awaiting_payment",
                paymentMethod: paymentMethod,
                paymentProof: paymentProof || null,
                customer: customerData,
                partnerCommissions: [],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            // Usar Batch Write
            const batch = writeBatch(db);

            // Adicionar o pedido ao batch
            const orderRef = doc(collection(db, 'orders'));
            const orderId = orderRef.id;
            batch.set(orderRef, orderData);

            // 2. ATUALIZAR ESTOQUE DOS PRODUTOS
            for (const item of cartItems) {
                if (item.id && item.qty) {
                    const productRef = doc(db, 'products', item.id);
                    batch.update(productRef, {
                        stock: increment(-item.qty),
                    });
                }
            }

            // 3. REGISTRAR COMISSÕES DOS PARCEIROS
            const commissionPromises = cartItems.map(async (item) => {
                const product = productMap.get(item.id);
                if (product?.isPartnerProduct && product?.partnerId) {
                    const commissionValue = (item.price * (product.commissionRate || 15)) / 100;

                    await partnerService.registerCommission(
                        product.partnerId,
                        orderRef.id,
                        item.id,
                        item.name,
                        item.qty,
                        item.price,
                        product.commissionRate || 15
                    );

                    return {
                        partnerId: product.partnerId,
                        productId: item.id,
                        productName: item.name,
                        quantity: item.qty,
                        salePrice: item.price,
                        commissionRate: product.commissionRate || 15,
                        commissionValue: commissionValue * item.qty,
                        status: 'pending',
                    };
                }
                return null;
            });

            const commissionResults = await Promise.all(commissionPromises);
            const validCommissions = commissionResults.filter(c => c !== null);

            // Atualizar o pedido com as comissões
            if (validCommissions.length > 0) {
                await setDoc(orderRef, {
                    partnerCommissions: validCommissions,
                }, { merge: true });
            }

            // 4. LIMPAR CARRINHO DO USUÁRIO
            const userDocRef = doc(db, 'users', userId);
            batch.update(userDocRef, {
                cart: [],
                cartUpdatedAt: new Date().toISOString(),
            });

            // 5. EXECUTAR TODAS AS OPERAÇÕES EM LOTE
            await batch.commit();

            // 6. Retornar sucesso
            return {
                success: true,
                orderId: orderId,
                orderNumber: orderNumber,
            };

        } catch (error: any) {
            console.error('❌ [createOrder] Erro:', error.message);
            console.error('❌ [createOrder] Stack:', error.stack);
            return {
                success: false,
                error: error.message,
            };
        }
    },

    /**
     * Buscar pedidos do usuário
     */
    async getOrders(userId: string): Promise<Order[]> {

        try {
            const q = query(
                collection(db, 'orders'),
                where('userId', '==', userId)
            );
            const snapshot = await getDocs(q);

            let orders = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
                id: doc.id,
                ...doc.data() as Omit<Order, 'id'>,
            }));

            orders.sort((a, b) => {
                const dateA = getTimestampTime(a.createdAt);
                const dateB = getTimestampTime(b.createdAt);
                return dateB - dateA;
            });

            return orders;
        } catch (error) {
            console.error('❌ [getOrders] Erro:', error);
            return [];
        }
    },

    /**
     * Buscar todos os pedidos (Admin)
     */
    async getAllOrders(statusFilter: string = "all"): Promise<Order[]> {

        try {
            const q = statusFilter && statusFilter !== "all"
                ? query(collection(db, 'orders'), where('status', '==', statusFilter))
                : collection(db, 'orders');

            const snapshot = await getDocs(q);

            let orders = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
                id: doc.id,
                ...doc.data() as Omit<Order, 'id'>,
            }));

            orders.sort((a, b) => {
                const dateA = getTimestampTime(a.createdAt);
                const dateB = getTimestampTime(b.createdAt);
                return dateB - dateA;
            });

            return orders;
        } catch (error) {
            console.error('❌ [getAllOrders] Erro:', error);
            return [];
        }
    },

    /**
     * Atualizar status do pedido (com verificação de existência)
     */
    async updateOrderStatus(
        orderId: string,
        newStatus: string,
        validatedBy?: string,
        validatedByName?: string
    ): Promise<{ success: boolean; error?: string }> {

        try {
            // 🔥 1. VERIFICAR SE O DOCUMENTO EXISTE PRIMEIRO
            const orderRef = doc(db, 'orders', orderId);

            const orderSnap = await getDoc(orderRef);

            // 🔥 2. SE NÃO EXISTIR, RETORNAR ERRO
            if (!orderSnap.exists()) {
                console.error(`❌ [updateOrderStatus] Pedido não encontrado: ${orderId}`);
                return { success: false, error: 'Pedido não encontrado' };
            }

            const orderData = orderSnap.data();

            // 🔥 3. VALIDAÇÕES
            if (newStatus === 'paid' && !orderData.paymentProof) {
                console.error(`❌ [updateOrderStatus] Comprovativo não enviado`);
                return { success: false, error: 'Cliente não enviou comprovativo de pagamento' };
            }

            const now = new Date().toISOString();

            // 🔥 4. PREPARAR DADOS PARA ATUALIZAÇÃO
            const validationEntry = {
                validatedAt: now,
                validatedBy: validatedBy || 'unknown',
                validatedByName: validatedByName || 'Sistema',
                previousStatus: orderData.status,
                newStatus: newStatus,
            };

            const updateData: any = {
                status: newStatus,
                updatedAt: serverTimestamp(),
                validatedBy: newStatus === 'paid' ? (validatedBy || null) : null,
                validatedByName: newStatus === 'paid' ? (validatedByName || null) : null,
                validatedAt: newStatus === 'paid' ? now : null,
                validationHistory: arrayUnion(validationEntry),
            };


            // 🔥 5. ATUALIZAR O DOCUMENTO
            await updateDoc(orderRef, updateData);

            return { success: true };
        } catch (error: any) {
            console.error(`❌ [updateOrderStatus] Erro:`, error.message);
            console.error(`❌ [updateOrderStatus] Stack:`, error.stack);
            return { success: false, error: error.message };
        }
    },

    /**
     * Buscar pedido por ID
     */
    async getOrderById(orderId: string): Promise<Order | null> {

        try {
            const orderDoc = await getDoc(doc(db, 'orders', orderId));
            if (orderDoc.exists()) {
                return {
                    id: orderDoc.id,
                    ...orderDoc.data() as Omit<Order, 'id'>,
                };
            }
            return null;
        } catch (error) {
            console.error(`❌ [getOrderById] Erro:`, error);
            return null;
        }
    },

    /**
     * 🔥 LISTENER EM TEMPO REAL - Buscar pedidos do usuário
     */
    onUserOrders(
        userId: string,
        callback: (orders: Order[]) => void,
        onError?: (error: Error) => void
    ): Unsubscribe {

        try {
            const q = query(
                collection(db, 'orders'),
                where('userId', '==', userId)
            );

            return onSnapshot(q,
                (snapshot) => {
                    let orders = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
                        id: doc.id,
                        ...doc.data() as Omit<Order, 'id'>,
                    }));

                    orders.sort((a, b) => {
                        const dateA = getTimestampTime(a.createdAt);
                        const dateB = getTimestampTime(b.createdAt);
                        return dateB - dateA;
                    });

                    callback(orders);
                },
                (error) => {
                    console.error('❌ [onUserOrders] Erro:', error);
                    if (onError) onError(error);
                }
            );
        } catch (error) {
            console.error('❌ [onUserOrders] Erro ao criar listener:', error);
            if (onError) onError(error as Error);
            return () => { };
        }
    },

    /**
     * 🔥 LISTENER EM TEMPO REAL - Buscar todos os pedidos (Admin)
     */
    onAllOrders(
        callback: (orders: Order[]) => void,
        statusFilter?: string,
        onError?: (error: Error) => void
    ): Unsubscribe {

        try {
            let constraints: any[] = [];

            if (statusFilter && statusFilter !== "all") {
                constraints.push(where('status', '==', statusFilter));
            }

            const q = query(collection(db, 'orders'), ...constraints);

            return onSnapshot(q,
                (snapshot) => {
                    let orders = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
                        id: doc.id,
                        ...doc.data() as Omit<Order, 'id'>,
                    }));

                    orders.sort((a, b) => {
                        const dateA = getTimestampTime(a.createdAt);
                        const dateB = getTimestampTime(b.createdAt);
                        return dateB - dateA;
                    });

                    callback(orders);
                },
                (error) => {
                    console.error('❌ [onAllOrders] Erro:', error);
                    if (onError) onError(error);
                }
            );
        } catch (error) {
            console.error('❌ [onAllOrders] Erro ao criar listener:', error);
            if (onError) onError(error as Error);
            return () => { };
        }
    },

    /**
     * 🔥 LISTENER EM TEMPO REAL - Buscar pedido por ID
     */
    onOrderById(
        orderId: string,
        callback: (order: Order | null) => void,
        onError?: (error: Error) => void
    ): Unsubscribe {

        try {
            const orderRef = doc(db, 'orders', orderId);

            return onSnapshot(orderRef,
                (snapshot) => {
                    if (snapshot.exists()) {
                        callback({
                            id: snapshot.id,
                            ...snapshot.data() as Omit<Order, 'id'>,
                        });
                    } else {
                        callback(null);
                    }
                },
                (error) => {
                    console.error('❌ [onOrderById] Erro:', error);
                    if (onError) onError(error);
                }
            );
        } catch (error) {
            console.error('❌ [onOrderById] Erro ao criar listener:', error);
            if (onError) onError(error as Error);
            return () => { };
        }
    },

    /**
     * 🔥 BUSCAR COMISSÕES DE UM PEDIDO
     */
    async getOrderCommissions(orderId: string): Promise<any[]> {

        try {
            const orderDoc = await getDoc(doc(db, 'orders', orderId));
            if (orderDoc.exists()) {
                const data = orderDoc.data();
                const commissions = data.partnerCommissions || [];
                return commissions;
            }
            return [];
        } catch (error) {
            console.error('❌ [getOrderCommissions] Erro:', error);
            return [];
        }
    },

    /**
     * 🔥 PAGAR COMISSÃO DE PARCEIRO
     */
    async payPartnerCommission(
        commissionId: string,
        partnerId: string
    ): Promise<{ success: boolean; error?: string }> {

        try {
            const commissionRef = doc(db, 'partnerCommissions', commissionId);
            await updateDoc(commissionRef, {
                status: 'paid',
                paidAt: serverTimestamp(),
                paidBy: 'admin',
            });

            // Atualizar total de comissão paga do parceiro
            const partnerRef = doc(db, 'partners', partnerId);
            await updateDoc(partnerRef, {
                totalCommissionPaid: increment(1),
                updatedAt: serverTimestamp(),
            });

            return { success: true };
        } catch (error: any) {
            console.error('❌ [payPartnerCommission] Erro:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * 🔥 BUSCAR COMISSÕES DE UM PARCEIRO
     */
    async getPartnerCommissions(partnerId: string): Promise<any[]> {

        try {
            const q = query(
                collection(db, 'partnerCommissions'),
                where('partnerId', '==', partnerId),
                where('status', 'in', ['pending', 'paid'])
            );
            const snapshot = await getDocs(q);
            const commissions = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
                id: doc.id,
                ...doc.data(),
            }));
            return commissions;
        } catch (error) {
            console.error('❌ [getPartnerCommissions] Erro:', error);
            return [];
        }
    }
};

export default cartService;