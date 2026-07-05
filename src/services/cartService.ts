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
    Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { CartItem, Order } from '../types';

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
     * Criar pedido COM ATUALIZAÇÃO DE ESTOQUE (igual ao original)
     */
    async createOrder(
        userId: string,
        cartItems: CartItem[],
        totalAmount: number,
        customerData: any,
        paymentMethod: string = "multicaixa"
    ): Promise<{ success: boolean; orderId?: string; orderNumber?: string; error?: string }> {
        try {
            const orderNumber = "ORD-" + Date.now().toString().slice(-8);

            // 1. Criar pedido no Firestore
            const orderData = {
                userId: userId,
                orderNumber: orderNumber,
                items: cartItems.map((item) => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    image: item.image,
                    qty: item.qty,
                    category: item.category || "",
                    brand: item.brand || "",
                })),
                total: totalAmount,
                status: "awaiting_payment",
                paymentMethod: paymentMethod,
                customer: customerData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            // Usar Batch Write para garantir atomicidade entre pedido e estoque
            const batch = writeBatch(db);

            // Adicionar o pedido ao batch
            const orderRef = doc(collection(db, 'orders'));
            batch.set(orderRef, orderData);

            // 2. ATUALIZAR ESTOQUE DOS PRODUTOS
            for (const item of cartItems) {
                if (item.id && item.qty) {
                    const productRef = doc(db, 'products', item.id);
                    // Usar increment para operação atômica e segura
                    batch.update(productRef, {
                        stock: increment(-item.qty),
                    });
                }
            }

            // 3. LIMPAR CARRINHO DO USUÁRIO
            const userDocRef = doc(db, 'users', userId);
            batch.update(userDocRef, {
                cart: [],
                cartUpdatedAt: new Date().toISOString(),
            });

            // 4. EXECUTAR TODAS AS OPERAÇÕES EM LOTE
            await batch.commit();

            // 5. Retornar sucesso
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
            // Usar apenas where, sem orderBy para evitar índice
            const q = query(
                collection(db, 'orders'),
                where('userId', '==', userId)
            );
            const snapshot = await getDocs(q);

            let orders = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
                id: doc.id,
                ...doc.data() as Omit<Order, 'id'>,
            }));

            // Ordenar no cliente (mais recentes primeiro)
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

            // Ordenar no cliente (mais recentes primeiro)
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
     * Atualizar status do pedido
     */
    async updateOrderStatus(orderId: string, newStatus: string): Promise<{ success: boolean; error?: string }> {
        try {
            const orderRef = doc(db, 'orders', orderId);

            await updateDoc(orderRef, {
                status: newStatus,
                updatedAt: serverTimestamp(),
            });

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
     * 🔥 LISTENER EM TEMPO REAL - Buscar pedidos do usuário com atualizações automáticas
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

                    // Ordenar no cliente (mais recentes primeiro)
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

                    // Ordenar no cliente (mais recentes primeiro)
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
            return () => {};
        }
    }
};

export default cartService;