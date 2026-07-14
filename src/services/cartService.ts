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
        console.log('🛒 [saveCart] Iniciando para usuário:', userId);
        console.log('🛒 [saveCart] Itens:', cartItems.length);
        
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

            console.log('✅ [saveCart] Carrinho salvo com sucesso');
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
        console.log('🛒 [loadCart] Carregando para usuário:', userId);
        
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (!userDoc.exists()) {
                console.log('⚠️ [loadCart] Usuário não encontrado');
                return [];
            }

            const userData = userDoc.data();
            const cart = userData?.cart || [];
            console.log('✅ [loadCart] Carrinho carregado:', cart.length, 'itens');
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
        console.log('📦 [createOrder] Iniciando criação de pedido');
        console.log('📦 [createOrder] Usuário:', userId);
        console.log('📦 [createOrder] Itens:', cartItems.length);
        console.log('📦 [createOrder] Total:', totalAmount);
        console.log('📦 [createOrder] Método:', paymentMethod);
        console.log('📦 [createOrder] Comprovativo:', paymentProof ? 'Sim' : 'Não');

        try {
            const orderNumber = "ORD-" + Date.now().toString().slice(-8);
            console.log('📦 [createOrder] Número do pedido:', orderNumber);

            // 1. Buscar informações dos produtos (para verificar parceiros)
            console.log('🔍 [createOrder] Buscando informações dos produtos...');
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
            console.log('✅ [createOrder] Produtos carregados:', productMap.size);

            // 2. Criar pedido no Firestore
            console.log('📝 [createOrder] Preparando dados do pedido...');
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
            console.log('📦 [createOrder] ID do pedido:', orderId);
            batch.set(orderRef, orderData);

            // 2. ATUALIZAR ESTOQUE DOS PRODUTOS
            console.log('📦 [createOrder] Atualizando estoque...');
            for (const item of cartItems) {
                if (item.id && item.qty) {
                    const productRef = doc(db, 'products', item.id);
                    batch.update(productRef, {
                        stock: increment(-item.qty),
                    });
                    console.log(`📦 [createOrder] Estoque atualizado: ${item.name} (-${item.qty})`);
                }
            }

            // 3. REGISTRAR COMISSÕES DOS PARCEIROS
            console.log('💰 [createOrder] Verificando comissões de parceiros...');
            const commissionPromises = cartItems.map(async (item) => {
                const product = productMap.get(item.id);
                if (product?.isPartnerProduct && product?.partnerId) {
                    const commissionValue = (item.price * (product.commissionRate || 15)) / 100;
                    console.log(`💰 [createOrder] Comissão para ${item.name}: ${commissionValue * item.qty} Kz`);

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
            console.log(`💰 [createOrder] Comissões registradas: ${validCommissions.length}`);

            // Atualizar o pedido com as comissões
            if (validCommissions.length > 0) {
                await updateDoc(orderRef, {
                    partnerCommissions: validCommissions,
                });
                console.log('💰 [createOrder] Comissões adicionadas ao pedido');
            }

            // 4. LIMPAR CARRINHO DO USUÁRIO
            console.log('🧹 [createOrder] Limpando carrinho...');
            const userDocRef = doc(db, 'users', userId);
            batch.update(userDocRef, {
                cart: [],
                cartUpdatedAt: new Date().toISOString(),
            });

            // 5. EXECUTAR TODAS AS OPERAÇÕES EM LOTE
            console.log('💾 [createOrder] Executando batch...');
            await batch.commit();
            console.log('✅ [createOrder] Batch executado com sucesso!');

            // 6. Retornar sucesso
            console.log(`🎉 [createOrder] Pedido #${orderNumber} criado com sucesso! ID: ${orderId}`);
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
        console.log('📋 [getOrders] Buscando pedidos para usuário:', userId);
        
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

            console.log(`✅ [getOrders] ${orders.length} pedidos encontrados`);
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
        console.log('📋 [getAllOrders] Buscando todos os pedidos. Filtro:', statusFilter);
        
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

            console.log(`✅ [getAllOrders] ${orders.length} pedidos encontrados`);
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
        console.log(`🔄 [updateOrderStatus] Atualizando pedido ${orderId} para: ${newStatus}`);
        console.log(`🔄 [updateOrderStatus] Validado por: ${validatedBy || 'Sistema'}`);

        try {
            // 🔥 1. VERIFICAR SE O DOCUMENTO EXISTE PRIMEIRO
            const orderRef = doc(db, 'orders', orderId);
            console.log(`🔍 [updateOrderStatus] Verificando se o pedido existe...`);
            
            const orderSnap = await getDoc(orderRef);

            // 🔥 2. SE NÃO EXISTIR, RETORNAR ERRO
            if (!orderSnap.exists()) {
                console.error(`❌ [updateOrderStatus] Pedido não encontrado: ${orderId}`);
                return { success: false, error: 'Pedido não encontrado' };
            }

            console.log(`✅ [updateOrderStatus] Pedido encontrado`);
            const orderData = orderSnap.data();
            console.log(`📊 [updateOrderStatus] Status atual: ${orderData.status}`);

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

            console.log(`📝 [updateOrderStatus] Dados para atualização:`, updateData);

            // 🔥 5. ATUALIZAR O DOCUMENTO
            console.log(`💾 [updateOrderStatus] Atualizando pedido...`);
            await updateDoc(orderRef, updateData);

            console.log(`✅ [updateOrderStatus] Pedido ${orderId} atualizado para: ${newStatus}`);
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
        console.log(`🔍 [getOrderById] Buscando pedido: ${orderId}`);
        
        try {
            const orderDoc = await getDoc(doc(db, 'orders', orderId));
            if (orderDoc.exists()) {
                console.log(`✅ [getOrderById] Pedido encontrado`);
                return {
                    id: orderDoc.id,
                    ...orderDoc.data() as Omit<Order, 'id'>,
                };
            }
            console.log(`⚠️ [getOrderById] Pedido não encontrado`);
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
        console.log(`👂 [onUserOrders] Iniciando listener para usuário: ${userId}`);
        
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

                    console.log(`📦 [onUserOrders] ${orders.length} pedidos atualizados`);
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
            return () => {};
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
        console.log(`👂 [onAllOrders] Iniciando listener. Filtro: ${statusFilter || 'todos'}`);
        
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

                    console.log(`📦 [onAllOrders] ${orders.length} pedidos atualizados`);
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
            return () => {};
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
        console.log(`👂 [onOrderById] Iniciando listener para pedido: ${orderId}`);
        
        try {
            const orderRef = doc(db, 'orders', orderId);

            return onSnapshot(orderRef,
                (snapshot) => {
                    if (snapshot.exists()) {
                        console.log(`📦 [onOrderById] Pedido atualizado: ${orderId}`);
                        callback({
                            id: snapshot.id,
                            ...snapshot.data() as Omit<Order, 'id'>,
                        });
                    } else {
                        console.log(`⚠️ [onOrderById] Pedido não encontrado: ${orderId}`);
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
            return () => {};
        }
    },

    /**
     * 🔥 BUSCAR COMISSÕES DE UM PEDIDO
     */
    async getOrderCommissions(orderId: string): Promise<any[]> {
        console.log(`💰 [getOrderCommissions] Buscando comissões do pedido: ${orderId}`);
        
        try {
            const orderDoc = await getDoc(doc(db, 'orders', orderId));
            if (orderDoc.exists()) {
                const data = orderDoc.data();
                const commissions = data.partnerCommissions || [];
                console.log(`💰 [getOrderCommissions] ${commissions.length} comissões encontradas`);
                return commissions;
            }
            console.log(`⚠️ [getOrderCommissions] Pedido não encontrado`);
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
        console.log(`💰 [payPartnerCommission] Pagando comissão ${commissionId} para parceiro ${partnerId}`);
        
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

            console.log(`✅ [payPartnerCommission] Comissão ${commissionId} paga com sucesso`);
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
        console.log(`💰 [getPartnerCommissions] Buscando comissões do parceiro: ${partnerId}`);
        
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
            console.log(`💰 [getPartnerCommissions] ${commissions.length} comissões encontradas`);
            return commissions;
        } catch (error) {
            console.error('❌ [getPartnerCommissions] Erro:', error);
            return [];
        }
    }
};

export default cartService;