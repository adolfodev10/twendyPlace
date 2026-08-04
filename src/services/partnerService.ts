import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    Query,
    where,
    orderBy,
    serverTimestamp,
    DocumentData,
    QueryDocumentSnapshot,
    increment,
    onSnapshot,
    Unsubscribe,
    arrayUnion
} from 'firebase/firestore';
import { db } from './firebase';
import { Partner, PartnerProduct } from '../types';

export const partnerService = {
    /**
     * 🔥 CRIAR PARCEIRO
     */
    async createPartner(data: Omit<Partner, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; id?: string; error?: string }> {
        try {
            const partnerData = {
                ...data,
                totalSales: 0,
                totalCommission: 0,
                totalProducts: 0,
                products: [],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            const docRef = await addDoc(collection(db, 'partners'), partnerData);
            return { success: true, id: docRef.id };
        } catch (error: any) {
            console.error('Erro ao criar parceiro:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * 🔥 BUSCAR TODOS OS PARCEIROS (COM FALLBACK PARA ÍNDICE EM CONSTRUÇÃO)
     */
    async getAllPartners(status?: 'active' | 'inactive' | 'pending'): Promise<Partner[]> {
        try {
            const collectionRef = collection(db, 'partners');
            const constraints: any[] = [];

            if (status) {
                constraints.push(where('status', '==', status));
            }
            constraints.push(orderBy('name', 'asc'));

            const q = query(collectionRef, ...constraints);
            const snapshot = await getDocs(q);

            return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
                id: doc.id,
                ...doc.data() as Omit<Partner, 'id'>,
            }));
        } catch (error: any) {
            if (error.message?.includes('index is currently building')) {

                try {
                    const collectionRef = collection(db, 'partners');
                    let q: Query<DocumentData> = query(collectionRef);

                    if (status) {
                        q = query(q, where('status', '==', status));
                    }

                    const snapshot = await getDocs(q);
                    let partners = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data() as Omit<Partner, 'id'>,
                    }));

                    partners.sort((a, b) => a.name.localeCompare(b.name));

                    return partners;
                } catch (fallbackError) {
                    console.error('Erro no fallback:', fallbackError);
                    return [];
                }
            }

            console.error('Erro ao buscar parceiros:', error);
            return [];
        }
    },


    async getPartnerById(id: string): Promise<Partner | null> {
        try {
            const docRef = doc(db, 'partners', id);
            const snapshot = await getDoc(docRef);
            if (snapshot.exists()) {
                return {
                    id: snapshot.id,
                    ...snapshot.data() as Omit<Partner, 'id'>,
                };
            }
            return null;
        } catch (error) {
            console.error('Erro ao buscar parceiro:', error);
            return null;
        }
    },


    async updatePartner(id: string, data: Partial<Omit<Partner, 'id'>>): Promise<{ success: boolean; error?: string }> {
        try {
            await updateDoc(doc(db, 'partners', id), {
                ...data,
                updatedAt: serverTimestamp(),
            });
            return { success: true };
        } catch (error: any) {
            console.error('Erro ao atualizar parceiro:', error);
            return { success: false, error: error.message };
        }
    },

    async deletePartner(id: string): Promise<{ success: boolean; error?: string }> {
        try {
            await deleteDoc(doc(db, 'partners', id));
            return { success: true };
        } catch (error: any) {
            console.error('Erro ao deletar parceiro:', error);
            return { success: false, error: error.message };
        }
    },

    async addProductToPartner(
        partnerId: string,
        productId: string,
        partnerPrice: number,
        commissionRate: number
    ): Promise<{ success: boolean; id?: string; error?: string }> {
        try {
            const productDoc = await getDoc(doc(db, 'products', productId));
            if (!productDoc.exists()) {
                return { success: false, error: 'Produto não encontrado' };
            }

            const productData = productDoc.data();

            const partnerDoc = await getDoc(doc(db, 'partners', partnerId));
            if (!partnerDoc.exists()) {
                return { success: false, error: 'Parceiro não encontrado' };
            }

            const commission = (partnerPrice * commissionRate) / 100;

            const partnerProductData = {
                partnerId,
                productId,
                productName: productData.name,
                productPrice: productData.price,
                productImage: productData.image,
                partnerPrice,
                commission,
                commissionRate,
                status: 'active',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            const docRef = await addDoc(collection(db, 'partners', partnerId, 'products'), partnerProductData);

            await updateDoc(doc(db, 'partners', partnerId), {
                totalProducts: increment(1),
                products: arrayUnion(productId),
                updatedAt: serverTimestamp(),
            });

            return { success: true, id: docRef.id };
        } catch (error: any) {
            console.error('Erro ao adicionar produto ao parceiro:', error);
            return { success: false, error: error.message };
        }
    },

 
    async getPartnerProducts(partnerId: string): Promise<PartnerProduct[]> {
        try {
            const q = query(
                collection(db, 'partners', partnerId, 'products'),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
                id: doc.id,
                ...doc.data() as Omit<PartnerProduct, 'id'>,
            }));
        } catch (error) {
            console.error('Erro ao buscar produtos do parceiro:', error);
            return [];
        }
    },

   
    async removeProductFromPartner(partnerId: string, productId: string): Promise<{ success: boolean; error?: string }> {
        try {
            await deleteDoc(doc(db, 'partners', partnerId, 'products', productId));

            await updateDoc(doc(db, 'partners', partnerId), {
                totalProducts: increment(-1),
                updatedAt: serverTimestamp(),
            });

            const partnerDoc = await getDoc(doc(db, 'partners', partnerId));
            if (partnerDoc.exists()) {
                const data = partnerDoc.data();
                const products = data.products || [];
                const updatedProducts = products.filter((id: string) => id !== productId);
                await updateDoc(doc(db, 'partners', partnerId), {
                    products: updatedProducts,
                });
            }

            return { success: true };
        } catch (error: any) {
            console.error('Erro ao remover produto do parceiro:', error);
            return { success: false, error: error.message };
        }
    },

    
    async registerCommission(
        partnerId: string,
        orderId: string,
        productId: string,
        productName: string,
        quantity: number,
        salePrice: number,
        commissionRate: number
    ): Promise<{ success: boolean; id?: string; error?: string }> {
        try {
            const commissionValue = (salePrice * commissionRate) / 100;

            const commissionData = {
                partnerId,
                orderId,
                productId,
                productName,
                quantity,
                salePrice,
                commissionRate,
                commissionValue,
                totalCommission: commissionValue * quantity,
                status: 'pending',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            const docRef = await addDoc(collection(db, 'partnerCommissions'), commissionData);

            await updateDoc(doc(db, 'partners', partnerId), {
                totalSales: increment(salePrice * quantity),
                totalCommission: increment(commissionValue * quantity),
                updatedAt: serverTimestamp(),
            });

            return { success: true, id: docRef.id };
        } catch (error: any) {
            console.error('Erro ao registrar comissão:', error);
            return { success: false, error: error.message };
        }
    },

    
    async createPartnerProduct(
        partnerId: string,
        productData: {
            name: string;
            price: number;
            category: string;
            brand: string;
            rating: number;
            image: string;
            description: string;
            stock: number;
            partnerPrice?: number;
            commissionRate?: number;
        }
    ): Promise<{ success: boolean; productId?: string; error?: string }> {
        try {
            const { productService } = await import('./productService');

            const newProduct = {
                name: productData.name,
                price: productData.partnerPrice || productData.price,
                stock: productData.stock || 0,
                category: productData.category,
                brand: productData.brand,
                rating: productData.rating || 5,
                image: productData.image,
                description: productData.description || '',
                partnerId: partnerId,
                isPartnerProduct: true,
                partnerPrice: productData.partnerPrice || productData.price,
                originalPrice: productData.price,
                commissionRate: productData.commissionRate || 15,
            };

            const result = await productService.addProduct(newProduct);

            if (!result.success || !result.id) {
                return { success: false, error: result.error || 'Erro ao criar produto' };
            }

            await this.addProductToPartner(
                partnerId,
                result.id,
                productData.partnerPrice || productData.price,
                productData.commissionRate || 15
            );

            return { success: true, productId: result.id };
        } catch (error: any) {
            console.error('Erro ao criar produto do parceiro:', error);
            return { success: false, error: error.message };
        }
    },
    /**
     * 🔥 BUSCAR PRODUTOS DE PARCEIROS PARA A LOJA
     */
    async getPartnerProductsForStore(): Promise<any[]> {
        try {
            const q = query(
                collection(db, 'products'),
                where('isPartnerProduct', '==', true)
            );
            const snapshot = await getDocs(q);

            let products = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name || data.productName || 'Produto sem nome',
                    price: data.partnerPrice || data.price || 0,
                    stock: data.stock || 0,
                    category: data.category || '',
                    brand: data.brand || '',
                    rating: data.rating || 0,
                    image: data.image || '',
                    description: data.description || '',
                    isPartnerProduct: true,
                    partnerId: data.partnerId,
                    partnerPrice: data.partnerPrice,
                    originalPrice: data.originalPrice || data.price,
                    commissionRate: data.commissionRate || 15,
                };
            });

            products = products.filter((p: any) => (p.stock ?? 0) > 0);

            products.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

            return products;
        } catch (error) {
            console.error('Erro ao buscar produtos de parceiros:', error);
            return [];
        }
    },

    async calculatePartnerCommission(
        productId: string,
        salePrice: number,
        quantity: number
    ): Promise<{ partnerId: string | null; commission: number; rate: number }> {
        try {
            const productDoc = await getDoc(doc(db, 'products', productId));
            if (!productDoc.exists()) {
                return { partnerId: null, commission: 0, rate: 0 };
            }

            const product = productDoc.data();
            if (!product.isPartnerProduct || !product.partnerId) {
                return { partnerId: null, commission: 0, rate: 0 };
            }

            const rate = product.commissionRate || 15;
            const commission = (salePrice * rate) / 100;

            return {
                partnerId: product.partnerId,
                commission: commission * quantity,
                rate: rate,
            };
        } catch (error) {
            console.error('Erro ao calcular comissão:', error);
            return { partnerId: null, commission: 0, rate: 0 };
        }
    },

    /**
     * 🔥 LISTENER EM TEMPO REAL - Parceiros (COM FALLBACK)
     */
    onPartners(
        callback: (partners: Partner[]) => void,
        status?: 'active' | 'inactive' | 'pending',
        onError?: (error: Error) => void
    ): Unsubscribe {
        try {
            const constraints: any[] = [];
            if (status) {
                constraints.push(where('status', '==', status));
            }
            constraints.push(orderBy('name', 'asc'));
            const q = query(collection(db, 'partners'), ...constraints);

            return onSnapshot(q,
                (snapshot) => {
                    const partners = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
                        id: doc.id,
                        ...doc.data() as Omit<Partner, 'id'>,
                    }));
                    callback(partners);
                },
                (error) => {
                    if (error.message?.includes('index is currently building')) {

                        try {
                            const q2 = status
                                ? query(collection(db, 'partners'), where('status', '==', status))
                                : collection(db, 'partners');

                            return onSnapshot(q2,
                                (snapshot) => {
                                    let partners = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
                                        id: doc.id,
                                        ...doc.data() as Omit<Partner, 'id'>,
                                    }));
                                    partners.sort((a, b) => a.name.localeCompare(b.name));
                                    callback(partners);
                                },
                                (err) => {
                                    console.error('Erro no fallback do listener:', err);
                                    if (onError) onError(err);
                                }
                            );
                        } catch (fallbackError) {
                            console.error('Erro ao criar fallback do listener:', fallbackError);
                            if (onError) onError(fallbackError as Error);
                            return () => { };
                        }
                    }

                    console.error('Erro no listener de parceiros:', error);
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
     * 🔥 BUSCAR COMISSÕES DE UM PARCEIRO
     */
    async getPartnerCommissions(partnerId: string): Promise<any[]> {
        try {
            const q = query(
                collection(db, 'partnerCommissions'),
                where('partnerId', '==', partnerId),
                orderBy('createdAt', 'desc')
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
    },

    /**
     * 🔥 PAGAR COMISSÃO DE PARCEIRO
     */
    async payPartnerCommission(
        commissionId: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const commissionRef = doc(db, 'partnerCommissions', commissionId);
            await updateDoc(commissionRef, {
                status: 'paid',
                paidAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            return { success: true };
        } catch (error: any) {
            console.error('Erro ao pagar comissão:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * 🔥 ESTATÍSTICAS DOS PARCEIROS
     */
    async getPartnerStats(): Promise<{
        total: number;
        active: number;
        pending: number;
        inactive: number;
        totalSales: number;
        totalCommission: number;
    }> {
        try {
            const snapshot = await getDocs(collection(db, 'partners'));
            const partners = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
                ...doc.data() as Partner,
            }));

            return {
                total: partners.length,
                active: partners.filter(p => p.status === 'active').length,
                pending: partners.filter(p => p.status === 'pending').length,
                inactive: partners.filter(p => p.status === 'inactive').length,
                totalSales: partners.reduce((sum, p) => sum + (p.totalSales || 0), 0),
                totalCommission: partners.reduce((sum, p) => sum + (p.totalCommission || 0), 0),
            };
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            return {
                total: 0,
                active: 0,
                pending: 0,
                inactive: 0,
                totalSales: 0,
                totalCommission: 0,
            };
        }
    }
};

export default partnerService;