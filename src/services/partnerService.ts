import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
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

    // Adicione estas funções ao partnerService.ts

/**
 * 🔥 CRIAR PRODUTO DIRETAMENTE PARA UM PARCEIRO
 */
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
        // 1. Criar o produto na coleção principal
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
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await productService.addProduct(newProduct);
        
        if (!result.success || !result.id) {
            return { success: false, error: result.error || 'Erro ao criar produto' };
        }

        // 2. Associar ao parceiro
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
            where('isPartnerProduct', '==', true),
            where('stock', '>', 0),
            orderBy('name', 'asc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        console.error('Erro ao buscar produtos de parceiros:', error);
        return [];
    }
},

/**
 * 🔥 CALCULAR COMISSÃO DE UMA VENDA DE PARCEIRO
 */
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
     * 🔥 BUSCAR TODOS OS PARCEIROS
     */
    async getAllPartners(status?: 'active' | 'inactive' | 'pending'): Promise<Partner[]> {
        try {
            const collectionRef = collection(db, 'partners');
            const constraints = status ? [where('status', '==', status), orderBy('name', 'asc')] : [orderBy('name', 'asc')];
            const q = query(collectionRef, ...constraints);

            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
                id: doc.id,
                ...doc.data() as Omit<Partner, 'id'>,
            }));
        } catch (error) {
            console.error('Erro ao buscar parceiros:', error);
            return [];
        }
    },

    /**
     * 🔥 BUSCAR PARCEIRO POR ID
     */
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

    /**
     * 🔥 ATUALIZAR PARCEIRO
     */
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

    /**
     * 🔥 DELETAR PARCEIRO
     */
    async deletePartner(id: string): Promise<{ success: boolean; error?: string }> {
        try {
            await deleteDoc(doc(db, 'partners', id));
            return { success: true };
        } catch (error: any) {
            console.error('Erro ao deletar parceiro:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * 🔥 ADICIONAR PRODUTO AO PARCEIRO
     */
    async addProductToPartner(
        partnerId: string,
        productId: string,
        partnerPrice: number,
        commissionRate: number
    ): Promise<{ success: boolean; id?: string; error?: string }> {
        try {
            // Buscar produto
            const productDoc = await getDoc(doc(db, 'products', productId));
            if (!productDoc.exists()) {
                return { success: false, error: 'Produto não encontrado' };
            }

            const productData = productDoc.data();

            // Verificar se parceiro existe
            const partnerDoc = await getDoc(doc(db, 'partners', partnerId));
            if (!partnerDoc.exists()) {
                return { success: false, error: 'Parceiro não encontrado' };
            }

            // Calcular comissão
            const commission = (partnerPrice * commissionRate) / 100;

            const partnerProductData = {
                partnerId,
                productId,
                productName: productData.name,
                productPrice: productData.price,
                productImage: productData.image,
                partnerPrice,
                commission,
                status: 'active',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            // Adicionar à subcoleção partnerProducts
            const docRef = await addDoc(collection(db, 'partners', partnerId, 'products'), partnerProductData);

            // Atualizar contagem de produtos do parceiro
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

    /**
     * 🔥 BUSCAR PRODUTOS DO PARCEIRO
     */
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

    /**
     * 🔥 REMOVER PRODUTO DO PARCEIRO
     */
    async removeProductFromPartner(partnerId: string, productId: string): Promise<{ success: boolean; error?: string }> {
        try {
            await deleteDoc(doc(db, 'partners', partnerId, 'products', productId));

            await updateDoc(doc(db, 'partners', partnerId), {
                totalProducts: increment(-1),
                products: arrayUnion(productId), // Vamos remover depois
                updatedAt: serverTimestamp(),
            });

            // TODO: Remover o productId do array products
            return { success: true };
        } catch (error: any) {
            console.error('Erro ao remover produto do parceiro:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * 🔥 REGISTRAR COMISSÃO DE VENDA
     */
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
                status: 'pending',
                createdAt: serverTimestamp(),
            };

            const docRef = await addDoc(collection(db, 'partnerCommissions'), commissionData);

            // Atualizar totais do parceiro
            await updateDoc(doc(db, 'partners', partnerId), {
                totalSales: increment(salePrice * quantity),
                totalCommission: increment(commissionValue),
                updatedAt: serverTimestamp(),
            });

            return { success: true, id: docRef.id };
        } catch (error: any) {
            console.error('Erro ao registrar comissão:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * 🔥 LISTENER EM TEMPO REAL - Parceiros
     */
    onPartners(
        callback: (partners: Partner[]) => void,
        status?: 'active' | 'inactive' | 'pending',
        onError?: (error: Error) => void
    ): Unsubscribe {
        try {
            const constraints = [];
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
                    console.error('Erro no listener de parceiros:', error);
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

export default partnerService;