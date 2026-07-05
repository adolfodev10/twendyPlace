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
  serverTimestamp,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { Product } from '../types';

export const productService = {
  /**
   * Buscar todos os produtos disponíveis (stock > 0)
   */
  async getAllProducts(): Promise<Product[]> {
    try {
      // Buscar todos os produtos ordenados por nome
      const q = query(
        collection(db, 'products'),
        orderBy('name', 'asc')
      );
      const snapshot = await getDocs(q);

      // Mapear todos os produtos
      const allProducts = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...doc.data() as Omit<Product, 'id'>,
      }));

      // 🔥 FILTRAR APENAS PRODUTOS COM STOCK > 0
      const availableProducts = allProducts.filter(product => product.stock > 0);

      // 🔥 REMOVER DUPLICATAS (mesmo nome)
      const uniqueProducts = availableProducts.filter((product, index, self) =>
        index === self.findIndex(p => p.name === product.name)
      );

      return uniqueProducts;
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
        const product = {
          id: snapshot.id,
          ...snapshot.data() as Omit<Product, 'id'>,
        };
        // Verificar se está disponível
        if (product.stock <= 0) {
          return null;
        }
        return product;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      return null;
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
   * Buscar produtos por categoria
   */
  async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      const q = query(
        collection(db, 'products'),
        orderBy('name', 'asc')
      );
      const snapshot = await getDocs(q);
      const products = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...doc.data() as Omit<Product, 'id'>,
      }));
      // Filtrar por categoria e disponibilidade
      return products
        .filter(p => p.category === category && p.stock > 0)
        .filter((product, index, self) =>
          index === self.findIndex(p => p.name === product.name)
        );
    } catch (error) {
      console.error('Erro ao buscar produtos por categoria:', error);
      return [];
    }
  }
};

export default productService;