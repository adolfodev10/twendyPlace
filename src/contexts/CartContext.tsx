import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { CartItem, Product } from '../types';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

/* ============================================================
 *  TIPOS
 * ============================================================ */

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const MAX_QTY = 99;
const GUEST_CART_KEY = 'guestCart';

/* ============================================================
 *  CONTEXTO
 * ============================================================ */

const defaultContextValue: CartContextType = {
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalPrice: 0,
};

const CartContext = createContext<CartContextType>(defaultContextValue);

export const useCart = () => {
  const ctx = useContext(CartContext);

  if (import.meta.env.NODE_ENV === 'development' && !ctx) {
    console.warn('[Cart] useCart foi usado fora do CartProvider');
  }

  return ctx;
};

/* ============================================================
 *  HELPERS
 * ============================================================ */

/** Lê o carrinho do localStorage com tratamento de erro silencioso. */
const readGuestCart = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/** Escreve o carrinho no localStorage com try/catch. */
const writeGuestCart = (items: CartItem[]) => {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('[Cart] Erro ao salvar no localStorage:', error);
  }
};

/** Remove a chave do localStorage com segurança. */
const clearGuestCart = () => {
  try {
    localStorage.removeItem(GUEST_CART_KEY);
  } catch {
    /* noop */
  }
};

/* ============================================================
 *  PROVIDER
 * ============================================================ */

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /* ------------------------------------------------------------
   *  Carregar carrinho (Firestore OU localStorage)
   * ---------------------------------------------------------- */
  useEffect(() => {
    setIsInitialized(false);

    const loadCart = async () => {
      try {
        if (user) {
          const cartRef = doc(db, 'carts', user.uid);
          const cartDoc = await getDoc(cartRef);

          if (!isMountedRef.current) return;

          if (cartDoc.exists()) {
            const cartData = cartDoc.data();
            setItems(
              Array.isArray(cartData?.items) ? cartData.items : []
            );
          } else {
            // Migrar carrinho convidado para o Firestore
            const guestItems = readGuestCart();

            if (guestItems.length > 0) {
              setItems(guestItems);
              await setDoc(cartRef, {
                items: guestItems,
                updatedAt: serverTimestamp(),
                userId: user.uid,
              });
              clearGuestCart();
            } else {
              setItems([]);
            }
          }
        } else {
          // Usuário convidado: carregar do localStorage
          setItems(readGuestCart());
        }
      } catch (error) {
        console.error('[Cart] Erro ao carregar carrinho:', error);
        // Fallback: nunca deixar o usuário sem carrinho
        if (isMountedRef.current) setItems(readGuestCart());
      } finally {
        if (isMountedRef.current) setIsInitialized(true);
      }
    };

    loadCart();
  }, [user?.uid]);

  /* ------------------------------------------------------------
   *  Salvar carrinho (debounced implicitamente pelo React)
   * ---------------------------------------------------------- */
  useEffect(() => {
    if (!isInitialized) return;

    const saveCart = async () => {
      try {
        if (user) {
          const cartRef = doc(db, 'carts', user.uid);
          await setDoc(
            cartRef,
            {
              items,
              updatedAt: serverTimestamp(),
              userId: user.uid,
            },
            { merge: true }
          );
          clearGuestCart();
        } else {
          writeGuestCart(items);
        }
      } catch (error) {
        console.error('[Cart] Erro ao salvar carrinho:', error);
        // Fallback local em caso de falha do Firestore
        writeGuestCart(items);
      }
    };

    saveCart();
  }, [items, user?.uid, isInitialized]);

  /* ------------------------------------------------------------
   *  Ações
   * ---------------------------------------------------------- */
  const addItem = useCallback((product: Product) => {
    setItems((current) => {
      const existing = current.find((item) => item.id === product.id);

      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, qty: Math.min(item.qty + 1, MAX_QTY) }
            : item
        );
      }

      return [...current, { ...product, qty: 1 }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((current) => current.filter((item) => item.id !== productId));
  }, []);

  const updateQuantity = useCallback(
    (productId: string, qty: number) => {
      if (qty <= 0) {
        removeItem(productId);
        return;
      }

      const safeQty = Math.min(qty, MAX_QTY);

      setItems((current) =>
        current.map((item) =>
          item.id === productId ? { ...item, qty: safeQty } : item
        )
      );
    },
    [removeItem]
  );

  const clearCart = useCallback(() => {
    setItems([]);
    clearGuestCart();
  }, []);

  /* ------------------------------------------------------------
   *  Derivados (memoizados)
   * ---------------------------------------------------------- */
  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.qty, 0),
    [items]
  );

  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.qty, 0),
    [items]
  );

  /* ------------------------------------------------------------
   *  Value memoizado
   * ---------------------------------------------------------- */
  const value = useMemo<CartContextType>(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
    }),
    [items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};