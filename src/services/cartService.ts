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
            console.error("Erro ao salvar carrinho:", error);
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
            console.error("Erro ao carregar carrinho:", error);
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
                    return {
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        image: item.image,
                        qty: item.qty,
                        category: item.category || "",
                        brand: item.brand || "",
                        isPartnerProduct: product?.isPartnerProduct || false,
                        partnerId: product?.partnerId || null,
                        commissionRate: product?.commissionRate || 0,
                        commissionValue: product?.isPartnerProduct
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
                await updateDoc(orderRef, {
                    partnerCommissions: validCommissions,
                });
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
                orderId: orderRef.id,
                orderNumber: orderNumber,
            };

        } catch (error: any) {
            console.error("Erro no pedido:", error);
            return {
                success: false,
                error: error.message,
            };
        }
    },

    /**
     * Buscar pedidos do usuário (com ordenação no cliente para evitar índice)
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
            console.error("Erro ao buscar pedidos:", error);
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
            console.error("Erro ao buscar todos os pedidos:", error);
            return [];
        }
    },

    /**
     * Atualizar status do pedido (com validação de comprovativo e comissões)
     */
    async updateOrderStatus(
        orderId: string,
        newStatus: string,
        validatedBy?: string,
        validatedByName?: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const orderRef = doc(db, 'orders', orderId);
            const orderSnap = await getDoc(orderRef);

            if (!orderSnap.exists()) {
                return { success: false, error: 'Pedido não encontrado' };
            }

            const orderData = orderSnap.data();

            // 🔥 VALIDAÇÃO: Se for mudar para "paid", verificar comprovativo
            if (newStatus === 'paid' && !orderData.paymentProof) {
                return { success: false, error: 'Cliente não enviou comprovativo de pagamento' };
            }

            const now = new Date().toISOString();

            // 🔥 Registrar quem validou o pagamento
            const validationEntry = {
                validatedAt: now,
                validatedBy: validatedBy || 'unknown',
                validatedByName: validatedByName || 'Sistema',
                previousStatus: orderData.status,
                newStatus: newStatus,
            };

            // 🔥 Se o pedido for pago e tiver comissões, marcar como pendente de pagamento
            const updateData: any = {
                status: newStatus,
                updatedAt: serverTimestamp(),
                validatedBy: validatedBy || null,
                validatedByName: validatedByName || null,
                validatedAt: newStatus === 'paid' ? now : null,
                validationHistory: arrayUnion(validationEntry),
            };

            // Se for pago, marcar comissões como pendentes
            if (newStatus === 'paid' && orderData.partnerCommissions?.length > 0) {
                updateData.commissionStatus = 'pending_payment';
            }

            // Se for cancelado, cancelar comissões
            if (newStatus === 'cancelled' && orderData.partnerCommissions?.length > 0) {
                updateData.commissionStatus = 'cancelled';
                // Atualizar cada comissão
                for (const commission of orderData.partnerCommissions) {
                    await updateDoc(doc(db, 'partnerCommissions', commission.id), {
                        status: 'cancelled',
                        updatedAt: serverTimestamp(),
                    });
                }
            }

            await updateDoc(orderRef, updateData);

            return { success: true };
        } catch (error: any) {
            console.error("Erro ao atualizar status:", error);
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
            console.error('Erro ao buscar pedido:', error);
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
                    console.error('Erro no listener de pedidos:', error);
                    if (onError) onError(error);
                }
            );
        } catch (error) {
            console.error('Erro ao criar listener:', error);
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
                    console.error('Erro no listener de todos os pedidos:', error);
                    if (onError) onError(error);
                }
            );
        } catch (error) {
            console.error('Erro ao criar listener:', error);
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
                    console.error('Erro no listener do pedido:', error);
                    if (onError) onError(error);
                }
            );
        } catch (error) {
            console.error('Erro ao criar listener:', error);
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
                return data.partnerCommissions || [];
            }
            return [];
        } catch (error) {
            console.error('Erro ao buscar comissões:', error);
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
            console.error('Erro ao pagar comissão:', error);
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
            return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
                id: doc.id,
                ...doc.data(),
            }));
        } catch (error) {
            console.error('Erro ao buscar comissões do parceiro:', error);
            return [];
        }
    }
};

export default cartService;