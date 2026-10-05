import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
    useMemo,
} from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

/* ============================================================
 *  TIPOS
 * ============================================================ */

export type NotificationType = 'new_order' | 'payment_proof' | 'status_change';

export interface AdminNotification {
    id: string;
    orderId: string;
    orderNumber: string;
    message: string;
    status: string;
    read: boolean;
    createdAt: any;
    type: NotificationType;
}

interface AdminNotificationContextType {
    /** Lista completa de notificações do admin */
    notifications: AdminNotification[];
    /** Quantidade de notificações não lidas */
    unreadCount: number;
    /** Quantidade de pedidos com status 'awaiting_payment' */
    pendingOrdersCount: number;
    /** Marca uma notificação como lida */
    markAsRead: (notificationId: string) => Promise<void>;
    /** Marca todas as notificações como lidas */
    markAllAsRead: () => Promise<void>;
    /** Remove todas as notificações */
    clearNotifications: () => Promise<void>;
    /** Se o contexto está conectado em tempo real */
    isConnected: boolean;
}

/* ============================================================
 *  CONTEXTO
 * ============================================================ */

const defaultContextValue: AdminNotificationContextType = {
    notifications: [],
    unreadCount: 0,
    pendingOrdersCount: 0,
    markAsRead: async () => { },
    markAllAsRead: async () => { },
    clearNotifications: async () => { },
    isConnected: false,
};

const AdminNotificationContext =
    createContext<AdminNotificationContextType>(defaultContextValue);

/* ============================================================
 *  HOOK
 * ============================================================ */

export const useAdminNotifications = () => {
    const context = useContext(AdminNotificationContext);

    // Em dev, alerta se usado fora do Provider
    if (import.meta.env.NODE_ENV === 'development' && !context) {
        console.warn(
            '[AdminNotification] useAdminNotifications foi usado fora do AdminNotificationProvider'
        );
    }

    return context;
};

/* ============================================================
 *  PROVIDER
 * ============================================================ */

interface AdminNotificationProviderProps {
    children: React.ReactNode;
}

export const AdminNotificationProvider: React.FC<
    AdminNotificationProviderProps
> = ({ children }) => {
    const { user } = useAuth();

    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);

    const previousOrdersRef = useRef<Set<string>>(new Set());
    const isFirstLoadRef = useRef(true);
    const isMountedRef = useRef(true);

    const isAdmin = user?.role === 'admin';

    /* ------------------------------------------------------------
     *  Cleanup de montagem
     * ---------------------------------------------------------- */
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    /* ------------------------------------------------------------
     *  Listener: pedidos pendentes
     * ---------------------------------------------------------- */
    useEffect(() => {
        if (!isAdmin) {
            setPendingOrdersCount(0);
            return;
        }

        const ordersQuery = query(
            collection(db, 'orders'),
            where('status', '==', 'awaiting_payment')
        );

        const unsubscribe = onSnapshot(
            ordersQuery,
            (snapshot) => {
                if (!isMountedRef.current) return;

                const currentIds = new Set<string>();
                snapshot.forEach((doc) => currentIds.add(doc.id));

                setPendingOrdersCount(snapshot.size);
                setIsConnected(true);

                previousOrdersRef.current = currentIds;

                if (isFirstLoadRef.current) {
                    isFirstLoadRef.current = false;
                }
            },
            (error) => {
                console.error('[AdminNotification] Erro no listener de pedidos:', error);
                setIsConnected(false);
                // Não spamma o usuário — só loga
            }
        );

        return () => unsubscribe();
    }, [isAdmin]);

    /* ------------------------------------------------------------
     *  Listener: notificações
     * ---------------------------------------------------------- */
    useEffect(() => {
        if (!isAdmin) {
            setNotifications([]);
            return;
        }

        const unsubscribe = notificationService.onAdminNotifications(
            (newNotifications) => {
                if (!isMountedRef.current) return;
                setNotifications(newNotifications as AdminNotification[]);
            }
        );

        return () => unsubscribe();
    }, [isAdmin]);

    /* ------------------------------------------------------------
     *  Derivados (memoizados)
     * ---------------------------------------------------------- */
    const unreadCount = useMemo(
        () => notifications.filter((n) => !n.read).length,
        [notifications]
    );

    /* ------------------------------------------------------------
     *  Ações
     * ---------------------------------------------------------- */
    const markAsRead = useCallback(
        async (notificationId: string) => {
            // Optimistic update
            setNotifications((prev) =>
                prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
            );

            try {
                await notificationService.markAsRead(notificationId);
            } catch (error) {
                console.error('[AdminNotification] Erro ao marcar como lida:', error);
                // Reverte em caso de falha
                setNotifications((prev) =>
                    prev.map((n) => (n.id === notificationId ? { ...n, read: false } : n))
                );
                toast.error('Erro ao marcar notificação como lida');
            }
        },
        []
    );

    const markAllAsRead = useCallback(async () => {
        const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
        if (unreadIds.length === 0) return;

        // Snapshot para rollback
        const previousState = notifications;

        // Optimistic update
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

        try {
            await notificationService.markAllAsRead(unreadIds);
        } catch (error) {
            console.error('[AdminNotification] Erro ao marcar todas como lidas:', error);
            setNotifications(previousState);
            toast.error('Erro ao marcar todas como lidas');
        }
    }, [notifications]);

    const clearNotifications = useCallback(async () => {
        const allIds = notifications.map((n) => n.id);
        if (allIds.length === 0) return;

        const previousState = notifications;

        // Optimistic update
        setNotifications([]);

        try {
            await notificationService.clearAll(allIds);
        } catch (error) {
            console.error('[AdminNotification] Erro ao limpar notificações:', error);
            setNotifications(previousState);
            toast.error('Erro ao limpar notificações');
        }
    }, [notifications]);

    /* ------------------------------------------------------------
     *  Value memoizado (evita re-renders desnecessários)
     * ---------------------------------------------------------- */
    const value = useMemo<AdminNotificationContextType>(
        () => ({
            notifications,
            unreadCount,
            pendingOrdersCount,
            markAsRead,
            markAllAsRead,
            clearNotifications,
            isConnected,
        }),
        [
            notifications,
            unreadCount,
            pendingOrdersCount,
            markAsRead,
            markAllAsRead,
            clearNotifications,
            isConnected,
        ]
    );

    /* ------------------------------------------------------------
     *  Se não é admin, apenas renderiza os children
     *  (economiza memória, não abre listeners no Firestore)
     * ---------------------------------------------------------- */
    if (!isAdmin) {
        return <>{children}</>;
    }

    return (
        <AdminNotificationContext.Provider value={value}>
            {children}
        </AdminNotificationContext.Provider>
    );
};

export default AdminNotificationProvider;