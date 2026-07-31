import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartItem, Product } from '../types';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalPrice: 0,
});

export const useCart = () => useContext(CartContext);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Carregar carrinho quando o usuário mudar
  useEffect(() => {
    const loadCart = async () => {
      try {
        if (user) {
          // Usuário autenticado - carregar do Firestore
          const cartRef = doc(db, 'carts', user.uid);
          const cartDoc = await getDoc(cartRef);
          
          if (cartDoc.exists()) {
            const cartData = cartDoc.data();
            if (cartData.items && Array.isArray(cartData.items)) {
              setItems(cartData.items);
            } else {
              setItems([]);
            }
          } else {
            // Se não existe carrinho no Firestore, verificar localStorage
            const savedCart = localStorage.getItem('guestCart');
            if (savedCart) {
              try {
                const parsedCart = JSON.parse(savedCart);
                if (Array.isArray(parsedCart) && parsedCart.length > 0) {
                  // Migrar carrinho do localStorage para o Firestore
                  setItems(parsedCart);
                  await setDoc(cartRef, {
                    items: parsedCart,
                    updatedAt: serverTimestamp(),
                  });
                  localStorage.removeItem('guestCart'); // Limpar localStorage
                } else {
                  setItems([]);
                }
              } catch {
                setItems([]);
              }
            } else {
              setItems([]);
            }
          }
        } else {
          // Usuário não autenticado - carregar do localStorage
          const savedCart = localStorage.getItem('guestCart');
          if (savedCart) {
            try {
              const parsedCart = JSON.parse(savedCart);
              if (Array.isArray(parsedCart)) {
                setItems(parsedCart);
              } else {
                setItems([]);
              }
            } catch {
              setItems([]);
            }
          } else {
            setItems([]);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar carrinho:', error);
        // Fallback para localStorage em caso de erro
        const savedCart = localStorage.getItem('guestCart');
        if (savedCart) {
          try {
            setItems(JSON.parse(savedCart));
          } catch {
            setItems([]);
          }
        } else {
          setItems([]);
        }
      } finally {
        setIsInitialized(true);
      }
    };

    loadCart();
  }, [user?.uid]); // Dependência apenas no UID do usuário

  // Salvar carrinho quando items mudar
  useEffect(() => {
    // Não salvar durante a inicialização
    if (!isInitialized) return;

    const saveCart = async () => {
      try {
        if (user) {
          // Salvar no Firestore
          const cartRef = doc(db, 'carts', user.uid);
          await setDoc(cartRef, {
            items,
            updatedAt: serverTimestamp(),
            userId: user.uid,
          }, { merge: true });
          
          // Limpar localStorage do guest
          localStorage.removeItem('guestCart');
        } else {
          // Salvar no localStorage para usuários não autenticados
          localStorage.setItem('guestCart', JSON.stringify(items));
        }
      } catch (error) {
        console.error('Erro ao salvar carrinho:', error);
        // Fallback para localStorage em caso de erro
        localStorage.setItem('guestCart', JSON.stringify(items));
      }
    };

    // Sempre salvar, mesmo com carrinho vazio (para limpar)
    saveCart();
  }, [items, user?.uid, isInitialized]);

  const addItem = useCallback((product: Product) => {
    setItems(current => {
      const existing = current.find(item => item.id === product.id);
      if (existing) {
        return current.map(item =>
          item.id === product.id 
            ? { ...item, qty: Math.min(item.qty + 1, 99) } // Limite máximo de 99
            : item
        );
      }
      return [...current, { ...product, qty: 1 }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(current => current.filter(item => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      removeItem(productId);
      return;
    }
    
    // Limitar quantidade máxima
    const safeQty = Math.min(qty, 99);
    
    setItems(current =>
      current.map(item =>
        item.id === productId ? { ...item, qty: safeQty } : item
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.qty), 0);

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
    }}>
      {children}
    </CartContext.Provider>
  );
};