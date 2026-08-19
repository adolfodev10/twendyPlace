import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
    collection,
    query,
    where,
    onSnapshot,
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
    const isFirstLoadRef = useRef(true);

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

                if (isFirstLoadRef.current) {
                    previousOrdersRef.current = currentIds;
                    isFirstLoadRef.current = false;
                    return;
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
        if (!isAdmin) {
            setNotifications([]);
            return;
        }

        const unsubscribe = notificationService.onAdminNotifications((newNotifications) => {
            setNotifications(newNotifications);
        });

        return () => unsubscribe();
    }, [isAdmin]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = useCallback(async (notificationId: string) => {
        await notificationService.markAsRead(notificationId);

        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
    }, []);

    const markAllAsRead = useCallback(async () => {
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        if (unreadIds.length > 0) {
            await notificationService.markAllAsRead(unreadIds);
            setNotifications(prev =>
                prev.map(n => ({ ...n, read: true }))
            );
        }
    }, [notifications]);

    const clearNotifications = useCallback(async () => {
        const allIds = notifications.map(n => n.id);
        if (allIds.length > 0) {
            await notificationService.clearAll(allIds);
             setNotifications([]);
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