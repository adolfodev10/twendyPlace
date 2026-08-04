import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
    const previousOrdersRef = useRef<Set<string>>(new Set());

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        if (!isAdmin) return;

        const ordersQuery = query(
            collection(db, 'orders'),
            where('status', '==', 'awaiting_payment')
        );

        const unsubscribe = onSnapshot(ordersQuery,
            (snapshot) => {
                const currentIds = new Set<string>();

                snapshot.forEach((doc) => {
                    currentIds.add(doc.id);
                });

                setPendingOrdersCount(snapshot.size);

                if (previousOrdersRef.current.size > 0) {
                    const newIds = [...currentIds].filter(id => !previousOrdersRef.current.has(id));
                    if (newIds.length > 0) {
                    }
                }

                previousOrdersRef.current = currentIds;
            },
            (error) => {
                console.error('Erro no listener de pedidos:', error);
            }
        );

        return () => unsubscribe();
    }, [isAdmin]);

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