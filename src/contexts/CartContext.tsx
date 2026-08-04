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

  useEffect(() => {
    const loadCart = async () => {
      try {
        if (user) {
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
            const savedCart = localStorage.getItem('guestCart');
            if (savedCart) {
              try {
                const parsedCart = JSON.parse(savedCart);
                if (Array.isArray(parsedCart) && parsedCart.length > 0) {
                  setItems(parsedCart);
                  await setDoc(cartRef, {
                    items: parsedCart,
                    updatedAt: serverTimestamp(),
                  });
                  localStorage.removeItem('guestCart'); 
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
  }, [user?.uid]); 

  useEffect(() => {
    if (!isInitialized) return;

    const saveCart = async () => {
      try {
        if (user) {
          const cartRef = doc(db, 'carts', user.uid);
          await setDoc(cartRef, {
            items,
            updatedAt: serverTimestamp(),
            userId: user.uid,
          }, { merge: true });
          
          localStorage.removeItem('guestCart');
        } else {
          localStorage.setItem('guestCart', JSON.stringify(items));
        }
      } catch (error) {
        console.error('Erro ao salvar carrinho:', error);
        localStorage.setItem('guestCart', JSON.stringify(items));
      }
    };

    saveCart();
  }, [items, user?.uid, isInitialized]);

  const addItem = useCallback((product: Product) => {
    setItems(current => {
      const existing = current.find(item => item.id === product.id);
      if (existing) {
        return current.map(item =>
          item.id === product.id 
            ? { ...item, qty: Math.min(item.qty + 1, 99) } 
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