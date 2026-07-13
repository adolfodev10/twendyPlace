import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [previousOrders, setPreviousOrders] = useState<any[]>([]);

  // Compara pedidos anteriores e atuais e retorna mudanças de status
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
    if (!auth.onAuthStateChanged) {
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setLoading(true);

      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<User, 'uid'>;
            setUser({
              uid: firebaseUser.uid,
              ...userData,
            });
          } else {
            setUser(null);
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

  // 🔥 LISTENER GLOBAL DE NOTIFICAÇÕES - APENAS PARA CLIENTES
  useEffect(() => {
    // Só ativar para clientes (não admins)
    if (!user || user.role === 'admin') return;


    const unsubscribeOrders = cartService.onUserOrders(
      user.uid,
      (orders) => {
        // Verificar mudanças de status
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

            // 🔔 NOTIFICAÇÃO COM SOM ATIVADO!
            notificationService.showNotification(
              `📦 Pedido #${change.orderNumber}: ${label}`,
              {
                type: change.newStatus === 'cancelled' ? 'error' :
                  change.newStatus === 'delivered' ? 'success' : 'info',
                duration: 8000,
                icon: '🔔',
                sound: true, // 🔥 SOM ATIVADO!
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
    if (auth.signOut) {
      await auth.signOut();
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};