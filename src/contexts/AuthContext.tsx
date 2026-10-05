import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { User } from '../types';
import cartService from '../services/cartService';
import notificationService from '../services/notificationService';

/* ============================================================
 *  TIPOS
 * ============================================================ */

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

interface OrderStatusChange {
  orderNumber: string | number;
  newStatus: string;
  oldStatus: string;
  orderId: string;
}

const STATUS_LABELS: Record<string, string> = {
  awaiting_payment: 'Aguardando Pagamento',
  paid: 'Pago ✅',
  processing: 'Processando 🔄',
  shipped: 'Enviado 🚚',
  delivered: 'Entregue 📦',
  cancelled: 'Cancelado ❌',
};

/* ============================================================
 *  CONTEXTO
 * ============================================================ */

const defaultContextValue: AuthContextType = {
  user: null,
  loading: true,
  logout: async () => {},
};

const AuthContext = createContext<AuthContextType>(defaultContextValue);

export const useAuth = () => {
  const ctx = useContext(AuthContext);

  if (import.meta.env.NODE_ENV === 'development' && !ctx) {
    console.warn('[Auth] useAuth foi usado fora do AuthProvider');
  }

  return ctx;
};

/* ============================================================
 *  HELPERS
 * ============================================================ */

/**
 * Normaliza os dados de um documento do Firestore para o tipo `User`.
 * Centraliza a lógica para evitar duplicação.
 */
const buildUser = (
  uid: string,
  docId: string,
  data: Record<string, any>,
  fallbackEmail?: string | null
): User => ({
  uid,
  id: docId,
  name: data.name || data.displayName || 'Sem nome',
  email: data.email || fallbackEmail || '',
  role: data.role || 'customer',
  avatar: data.avatar || '',
  user_status: data.user_status || 'ACTIVO',
  phone: data.phone || '',
  city: data.city || '',
  address: data.address || '',
  postalCode: data.postalCode || '',
  createdAt: data.createdAt || null,
  updatedAt: data.updatedAt || null,
});

/**
 * Busca um usuário no Firestore com múltiplas estratégias:
 * 1. Por `uid` como docId
 * 2. Por campo `uid` na coleção
 * 3. Por `email` na coleção
 * 4. Fallback para dados do Firebase Auth
 */
const findUserByUid = async (uid: string): Promise<User | null> => {
  const fallbackEmail = auth.currentUser?.email;

  try {
    // 1. Doc direto por uid
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return buildUser(uid, docSnap.id, docSnap.data(), fallbackEmail);
    }

    // 2. Por campo `uid`
    const uidQuery = query(collection(db, 'users'), where('uid', '==', uid));
    const uidSnapshot = await getDocs(uidQuery);
    if (!uidSnapshot.empty) {
      const docData = uidSnapshot.docs[0];
      return buildUser(uid, docData.id, docData.data(), fallbackEmail);
    }

    // 3. Por email
    if (fallbackEmail) {
      const emailQuery = query(
        collection(db, 'users'),
        where('email', '==', fallbackEmail)
      );
      const emailSnapshot = await getDocs(emailQuery);
      if (!emailSnapshot.empty) {
        const docData = emailSnapshot.docs[0];
        return buildUser(uid, docData.id, docData.data(), fallbackEmail);
      }
    }

    // 4. Fallback Firebase Auth
    if (auth.currentUser) {
      return {
        uid,
        id: uid,
        name:
          auth.currentUser.displayName ||
          auth.currentUser.email?.split('@')[0] ||
          'Usuário',
        email: auth.currentUser.email || '',
        role: 'customer',
        avatar: auth.currentUser.photoURL || '',
      };
    }

    return null;
  } catch (error) {
    console.error('[Auth] Erro ao buscar usuário:', error);
    return null;
  }
};

/* ============================================================
 *  PROVIDER
 * ============================================================ */

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [previousOrders, setPreviousOrders] = useState<any[]>([]);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /* ------------------------------------------------------------
   *  Comparação de status dos pedidos
   * ---------------------------------------------------------- */
  const getStatusChanges = useCallback(
    (prev: any[] = [], curr: any[] = []): OrderStatusChange[] => {
      const changes: OrderStatusChange[] = [];
      const prevMap = new Map(prev.map((o) => [o.id, o]));

      for (const order of curr) {
        const prevOrder = prevMap.get(order.id);
        if (prevOrder && prevOrder.status !== order.status) {
          changes.push({
            orderNumber: order.orderNumber || order.id.slice(-8),
            newStatus: order.status,
            oldStatus: prevOrder.status,
            orderId: order.id,
          });
        }
      }

      return changes;
    },
    []
  );

  /* ------------------------------------------------------------
   *  Listener de autenticação
   * ---------------------------------------------------------- */
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        if (!isMountedRef.current) return;

        if (firebaseUser) {
          try {
            const userData = await findUserByUid(firebaseUser.uid);

            if (!isMountedRef.current) return;

            if (userData) {
              setUser(userData);
            } else {
              // Fallback mesmo se `findUserByUid` retornar null
              setUser({
                uid: firebaseUser.uid,
                id: firebaseUser.uid,
                name:
                  firebaseUser.displayName ||
                  firebaseUser.email?.split('@')[0] ||
                  'Usuário',
                email: firebaseUser.email || '',
                role: 'customer',
                avatar: '',
              });
            }
          } catch (error) {
            console.error('[Auth] Erro ao buscar dados do usuário:', error);
            if (isMountedRef.current) setUser(null);
          }
        } else {
          setUser(null);
          setPreviousOrders([]);
        }

        if (isMountedRef.current) setLoading(false);
      }
    );

    return () => unsubscribeAuth();
  }, []);

  /* ------------------------------------------------------------
   *  Listener de pedidos do cliente (notificações em tempo real)
   * ---------------------------------------------------------- */
  useEffect(() => {
    if (!user || user.role === 'admin') return;

    const unsubscribeOrders = cartService.onUserOrders(
      user.uid,
      (orders) => {
        if (!isMountedRef.current) return;

        const statusChanges = getStatusChanges(previousOrders, orders);

        if (statusChanges.length > 0) {
          statusChanges.forEach((change) => {
            const label = STATUS_LABELS[change.newStatus] || change.newStatus;

            const notifType: 'success' | 'error' | 'info' =
              change.newStatus === 'cancelled'
                ? 'error'
                : change.newStatus === 'delivered'
                ? 'success'
                : 'info';

            notificationService.showNotification(
              `📦 Pedido #${change.orderNumber}: ${label}`,
              {
                type: notifType,
                duration: 8000,
                icon: '🔔',
                sound: true,
                onClick: () => {
                  window.location.href = `/order-confirmation/${change.orderId}`;
                },
              }
            );
          });
        }

        setPreviousOrders(orders);
      },
      (error) => {
        console.error('[Auth] Erro no listener global de pedidos:', error);
      }
    );

    return () => unsubscribeOrders();
  }, [user, previousOrders, getStatusChanges]);

  /* ------------------------------------------------------------
   *  Ações
   * ---------------------------------------------------------- */
  const logout = useCallback(async () => {
    try {
      await auth.signOut();
    } finally {
      if (isMountedRef.current) {
        setUser(null);
        setPreviousOrders([]);
      }
    }
  }, []);

  /* ------------------------------------------------------------
   *  Value memoizado
   * ---------------------------------------------------------- */
  const value = useMemo<AuthContextType>(
    () => ({ user, loading, logout }),
    [user, loading, logout]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};