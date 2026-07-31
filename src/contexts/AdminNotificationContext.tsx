// src/contexts/AdminNotificationContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    collection,
    query,
    where,
    onSnapshot,
    orderBy,
    limit
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface AdminNotification {
    id: string;
    orderId: string;
    orderNumber: string;
    message: string;
    status: string;
    read: boolean;
    createdAt: any;
    type: 'new_order' | 'payment_proof' | 'status_change';
}

interface AdminNotificationContextType {
    notifications: AdminNotification[];
    unreadCount: number;
    pendingOrdersCount: number;
    markAsRead: (notificationId: string) => void;
    markAllAsRead: () => void;
    clearNotifications: () => void;
}

const AdminNotificationContext = createContext<AdminNotificationContextType>({
    notifications: [],
    unreadCount: 0,
    pendingOrdersCount: 0,
    markAsRead: () => { },
    markAllAsRead: () => { },
    clearNotifications: () => { },
});

export const useAdminNotifications = () => useContext(AdminNotificationContext);

export const AdminNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
    const [hasIndexError, setHasIndexError] = useState(false);

    const isAdmin = user?.role === 'admin';

    // Listener para pedidos pendentes
    useEffect(() => {
        if (!isAdmin) return;

        let ordersQuery;

        if (hasIndexError) {
            // Consulta sem orderBy
            ordersQuery = query(
                collection(db, 'orders'),
                where('status', '==', 'awaiting_payment')
            );
        } else {
            // Consulta com orderBy
            ordersQuery = query(
                collection(db, 'orders'),
                where('status', '==', 'awaiting_payment'),
                orderBy('createdAt', 'desc')
            );
        }

        const unsubscribe = onSnapshot(ordersQuery,
            (snapshot) => {
                setPendingOrdersCount(snapshot.size);
            },
            (error) => {
                console.error('Erro no listener de pedidos:', error);
                if (error.code === 'failed-precondition' || error.message?.includes('index')) {
                    setHasIndexError(true);
                    toast.error(
                        'Índice do Firestore necessário. Usando modo alternativo.',
                        { duration: 5000 }
                    );
                }
            }
        );

        return () => unsubscribe();
    }, [isAdmin, hasIndexError]);

    // Listener para notificações do admin
    useEffect(() => {
        if (!isAdmin) return;

        const notificationsQuery = query(
            collection(db, 'adminNotifications'),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(notificationsQuery,
            (snapshot) => {
                const notifs: AdminNotification[] = [];

                snapshot.forEach((doc) => {
                    const data = doc.data();
                    notifs.push({
                        id: doc.id,
                        orderId: data.orderId,
                        orderNumber: data.orderNumber,
                        message: data.message,
                        status: data.status,
                        read: data.read || false,
                        createdAt: data.createdAt,
                        type: data.type || 'new_order',
                    });
                });

                setNotifications(notifs);
            },
            (error) => {
                console.error('Erro no listener de notificações:', error);
            }
        );

        return () => unsubscribe();
    }, [isAdmin]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = useCallback(async (notificationId: string) => {
        await notificationService.markAsRead(notificationId);
    }, []);

    const markAllAsRead = useCallback(async () => {
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        if (unreadIds.length > 0) {
            await notificationService.markAllAsRead(unreadIds);
        }
    }, [notifications]);

    const clearNotifications = useCallback(async () => {
        const allIds = notifications.map(n => n.id);
        if (allIds.length > 0) {
            await notificationService.clearAll(allIds);
        }
    }, [notifications]);

    if (!isAdmin) {
        return <>{children}</>;
    }

    return (
        <AdminNotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                pendingOrdersCount,
                markAsRead,
                markAllAsRead,
                clearNotifications,
            }}
        >
            {children}
        </AdminNotificationContext.Provider>
    );
};