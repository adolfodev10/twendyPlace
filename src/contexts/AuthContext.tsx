import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { User } from '../types';
import cartService from '../services/cartService';
import notificationService from '../services/notificationService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

// ✅ Função auxiliar para buscar usuário por uid (Firebase Auth)
const findUserByUid = async (uid: string): Promise<User | null> => {
  // Tentativa 1: Buscar documento com ID = uid
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();

    return {
      uid: uid,
      id: docSnap.id,
      name: data.name || data.displayName || '',
      email: data.email || auth.currentUser?.email || '',
      role: data.role || 'customer',
      avatar: data.avatar || '',
      user_status: data.user_status || 'ACTIVO',
      phone: data.phone || '',
      city: data.city || '',
      address: data.address || '',
      postalCode: data.postalCode || '',
      createdAt: data.createdAt || null,
      updatedAt: data.updatedAt || null,
    };
  }

  // Tentativa 2: Buscar por campo 'uid'
  const q = query(collection(db, 'users'), where('uid', '==', uid));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const docData = snapshot.docs[0];
    const data = docData.data();


    return {
      uid: uid,
      id: docData.id,
      name: data.name || data.displayName || 'Sem nome',
      email: data.email || auth.currentUser?.email || '',
      role: data.role || 'customer',
      avatar: data.avatar || '',
      user_status: data.user_status || 'ACTIVO',
      phone: data.phone || '',
      city: data.city || '',
      address: data.address || '',
      postalCode: data.postalCode || '',
      createdAt: data.createdAt || null,
      updatedAt: data.updatedAt || null,
    };
  }

  // Tentativa 3: Buscar por email
  if (auth.currentUser?.email) {
    const emailQuery = query(collection(db, 'users'), where('email', '==', auth.currentUser?.email));
    const emailSnapshot = await getDocs(emailQuery);

    if (!emailSnapshot.empty) {
      const docData = emailSnapshot.docs[0];
      const data = docData.data();


      return {
        uid: uid,
        id: docData.id,
        name: data.name || data.displayName || 'Sem nome',
        email: data.email || auth.currentUser.email || '',
        role: data.role || 'customer',
        avatar: data.avatar || '',
        user_status: data.user_status || 'ACTIVO',
        phone: data.phone || '',
        city: data.city || '',
        address: data.address || '',
        postalCode: data.postalCode || '',
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null,
      };
    }
  }

  if (auth.currentUser) {
    return {
      uid: uid,
      id: uid,
      name: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Usuário',
      email: auth.currentUser.email || '',
      role: 'customer',
      avatar: auth.currentUser.photoURL || '',
    };
  }

  return null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [previousOrders, setPreviousOrders] = useState<any[]>([]);

  const getStatusChanges = (prev: any[] = [], curr: any[] = []) => {
    const changes: { orderNumber: string | number; newStatus: any; oldStatus: any; orderId: string }[] = [];
    const prevMap = new Map(prev.map(o => [o.id, o]));

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
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // ✅ Usar a função de busca melhorada
          const userData = await findUserByUid(firebaseUser.uid);

          if (userData) {
            setUser(userData);
          } else {
            // Criar usuário básico se não encontrado
            setUser({
              uid: firebaseUser.uid,
              id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
              email: firebaseUser.email || '',
              role: 'customer',
              avatar: '',
            });
          }
        } catch (error) {
          console.error('Erro ao buscar dados do usuário:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Listener de notificações para clientes
  useEffect(() => {
    if (!user || user.role === 'admin') return;

    const unsubscribeOrders = cartService.onUserOrders(
      user.uid,
      (orders) => {
        const statusChanges = getStatusChanges(previousOrders, orders);

        if (statusChanges.length > 0) {
          statusChanges.forEach(change => {
            const statusLabels: Record<string, string> = {
              awaiting_payment: 'Aguardando Pagamento',
              paid: 'Pago ✅',
              processing: 'Processando 🔄',
              shipped: 'Enviado 🚚',
              delivered: 'Entregue 📦',
              cancelled: 'Cancelado ❌',
            };

            const label = statusLabels[change.newStatus] || change.newStatus;

            notificationService.showNotification(
              `📦 Pedido #${change.orderNumber}: ${label}`,
              {
                type: change.newStatus === 'cancelled' ? 'error' :
                  change.newStatus === 'delivered' ? 'success' : 'info',
                duration: 8000,
                icon: '🔔',
                sound: true,
                onClick: () => {
                  window.location.href = `/order-confirmation/${change.orderId}`;
                }
              }
            );
          });
        }

        setPreviousOrders(orders);
      },
      (error) => {
        console.error('Erro no listener global:', error);
      }
    );

    return () => {
      unsubscribeOrders();
    };
  }, [user]);

  const logout = async () => {
    await auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};