import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    DocumentData,
    QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { CartItem, Order } from '../types';

export const cartService = {
    /**
     * Salvar carrinho do usuário
     */
    async saveCart(userId: string, items: CartItem[]): Promise<{ success: boolean; error?: string }> {
        try {
            await setDoc(doc(db, 'carts', userId), {
                items,
                updatedAt: serverTimestamp(),
            }, { merge: true });
            return { success: true };
        } catch (error: any) {
            console.error('Erro ao salvar carrinho:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Carregar carrinho do usuário
     */
    async loadCart(userId: string): Promise<CartItem[]> {
        try {
            const cartDoc = await getDoc(doc(db, 'carts', userId));
            if (cartDoc.exists()) {
                const data = cartDoc.data();
                return data.items || [];
            }
            return [];
        } catch (error) {
            console.error('Erro ao carregar carrinho:', error);
            return [];
        }
    },

    /**
     * Criar pedido
     */
    async createOrder(
        userId: string,
        items: CartItem[],
        total: number,
        customerData: any
    ): Promise<{ success: boolean; orderId?: string; orderNumber?: string; error?: string }> {
        try {
            const orderNumber = 'ORD-' + Date.now().toString().slice(-8);

            const orderData = {
                userId,
                orderNumber,
                items: items.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    image: item.image,
                    qty: item.qty,
                    category: item.category || '',
                    brand: item.brand || '',
                })),
                total,
                status: 'awaiting_payment',
                paymentMethod: 'multicaixa',
                customer: customerData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            const docRef = await addDoc(collection(db, 'orders'), orderData);

            // Limpar carrinho após pedido
            await setDoc(doc(db, 'carts', userId), {
                items: [],
                updatedAt: serverTimestamp(),
            }, { merge: true });

            return {
                success: true,
                orderId: docRef.id,
                orderNumber,
            };
        } catch (error: any) {
            console.error('Erro ao criar pedido:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Buscar pedidos do usuário
     */
    async getOrders(userId: string): Promise<Order[]> {
        try {
            const q = query(
                collection(db, 'orders'),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
                id: doc.id,
                ...doc.data() as Omit<Order, 'id'>,
            }));
        } catch (error) {
            console.error('Erro ao buscar pedidos:', error);
            return [];
        }
    },

    /**
     * Buscar todos os pedidos (Admin)
     */
    async getAllOrders(statusFilter?: string): Promise<Order[]> {
        try {
            const constraints = [];

            if (statusFilter && statusFilter !== 'all') {
                constraints.push(where('status', '==', statusFilter));
            }

            constraints.push(orderBy('createdAt', 'desc'));

            const q = query(collection(db, 'orders'), ...constraints);
            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
                id: doc.id,
                ...doc.data() as Omit<Order, 'id'>,
            }));
        } catch (error) {
            console.error('Erro ao buscar todos os pedidos:', error);
            return [];
        }
    },

    /**
     * Atualizar status do pedido
     */
    async updateOrderStatus(orderId: string, newStatus: string): Promise<{ success: boolean; error?: string }> {
        try {
            await updateDoc(doc(db, 'orders', orderId), {
                status: newStatus,
                updatedAt: serverTimestamp(),
            });
            return { success: true };
        } catch (error: any) {
            console.error('Erro ao atualizar status:', error);
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
    }
};

export default cartService;