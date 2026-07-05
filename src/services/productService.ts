import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  DocumentData,
  QueryDocumentSnapshot,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { Product } from '../types';

export const productService = {
  /**
   * Buscar todos os produtos
   */
  async getAllProducts(): Promise<Product[]> {
    try {
      const q = query(collection(db, 'products'), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...doc.data() as Omit<Product, 'id'>,
      }));
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      return [];
    }
  },

  /**
   * Buscar produto por ID
   */
  async getProductById(id: string): Promise<Product | null> {
    try {
      const docRef = doc(db, 'products', id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return {
          id: snapshot.id,
          ...snapshot.data() as Omit<Product, 'id'>,
        };
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      return null;
    }
  },

  /**
   * Buscar produtos por categoria
   */
  async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      const q = query(
        collection(db, 'products'), 
        where('category', '==', category),
        orderBy('name', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...doc.data() as Omit<Product, 'id'>,
      }));
    } catch (error) {
      console.error('Erro ao buscar produtos por categoria:', error);
      return [];
    }
  },

  /**
   * Adicionar novo produto
   */
  async addProduct(data: Omit<Product, 'id'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const docRef = await addDoc(collection(db, 'products'), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { success: true, id: docRef.id };
    } catch (error: any) {
      console.error('Erro ao adicionar produto:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Atualizar produto
   */
  async updateProduct(id: string, data: Partial<Omit<Product, 'id'>>): Promise<{ success: boolean; error?: string }> {
    try {
      await updateDoc(doc(db, 'products', id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao atualizar produto:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Deletar produto
   */
  async deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await deleteDoc(doc(db, 'products', id));
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao deletar produto:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Buscar produtos em tempo real (com listener)
   */
  onProductsSnapshot(callback: (products: Product[]) => void): () => void {
    const q = query(collection(db, 'products'), orderBy('name', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const products = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...doc.data() as Omit<Product, 'id'>,
      }));
      callback(products);
    });
  },

  /**
   * Buscar produtos com filtros
   */
  async getProductsWithFilters(filters: {
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    brand?: string;
    minRating?: number;
  }): Promise<Product[]> {
    try {
      const constraints = [];
      
      // Aplicar filtros
      if (filters.category && filters.category !== 'all') {
        constraints.push(where('category', '==', filters.category));
      }
      
      if (filters.brand) {
        constraints.push(where('brand', '==', filters.brand));
      }

      // Ordenar por nome
      constraints.push(orderBy('name', 'asc'));
      
      const q = query(collection(db, 'products'), ...constraints);
      
      const snapshot = await getDocs(q);
      let products = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...doc.data() as Omit<Product, 'id'>,
      }));

      // Filtrar por preço (client-side)
      if (filters.minPrice !== undefined) {
        products = products.filter(p => p.price >= filters.minPrice!);
      }
      if (filters.maxPrice !== undefined) {
        products = products.filter(p => p.price <= filters.maxPrice!);
      }

      // Filtrar por avaliação (client-side)
      if (filters.minRating !== undefined && filters.minRating > 0) {
        products = products.filter(p => p.rating >= filters.minRating!);
      }

      // Filtrar por busca (client-side)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        products = products.filter(p => 
          p.name.toLowerCase().includes(searchLower) ||
          p.brand.toLowerCase().includes(searchLower) ||
          p.category.toLowerCase().includes(searchLower)
        );
      }

      return products;
    } catch (error) {
      console.error('Erro ao buscar produtos com filtros:', error);
      return [];
    }
  }
};

export default productService;