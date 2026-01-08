import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface OrderNotificationContextType {
    unreadCount: number;
    markAsRead: (orderId: string) => void;
    clearAll: () => void;
}

const OrderNotificationContext = createContext<OrderNotificationContextType | undefined>(undefined);

// Admin email whitelist
const ADMIN_EMAILS = ['demouser2026@test.com', 'admin@cloudcafe.com'];

export function OrderNotificationProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadOrders, setUnreadOrders] = useState<Set<string>>(new Set());
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

    // Check if user is admin
    const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');

    // Request notification permission
    useEffect(() => {
        if (isAdmin && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission().then(permission => {
                    setNotificationPermission(permission);
                });
            } else {
                setNotificationPermission(Notification.permission);
            }
        }
    }, [isAdmin]);

    // Play notification sound
    const playNotificationSound = () => {
        try {
            const audio = new Audio('/notification.mp3');
            audio.volume = 0.5;
            audio.play().catch(err => {
                console.log('Audio play failed:', err);
            });
        } catch (err) {
            console.log('Audio not available:', err);
        }
    };

    // Show browser notification
    const showBrowserNotification = (orderData: any) => {
        if (notificationPermission === 'granted') {
            const notification = new Notification('🔔 新订单！', {
                body: `Order #${orderData.id.slice(0, 8)} - £${Number(orderData.total).toFixed(2)}${orderData.notes ? '\n📝 ' + orderData.notes : ''}`,
                icon: '/logo.png',
                badge: '/logo.png',
                tag: orderData.id,
                requireInteraction: true,
            });

            notification.onclick = () => {
                window.focus();
                window.location.href = '/admin/orders';
                notification.close();
            };
        }
    };

    // Handle new order
    const handleNewOrder = (orderData: any) => {
        console.log('New order received:', orderData);

        // Add to unread set
        setUnreadOrders(prev => new Set([...prev, orderData.id]));
        setUnreadCount(prev => prev + 1);

        // Play sound
        playNotificationSound();

        // Show browser notification
        showBrowserNotification(orderData);

        // Show toast notification
        toast.success('🔔 新订单！', {
            description: `订单 #${orderData.id.slice(0, 8)} - £${Number(orderData.total).toFixed(2)}`,
            duration: 10000,
            action: {
                label: '查看',
                onClick: () => {
                    window.location.href = '/admin/orders';
                },
            },
        });
    };

    // Subscribe to realtime orders (only for admins)
    useEffect(() => {
        if (!isAdmin) return;

        console.log('Setting up realtime subscription for orders...');

        const channel = supabase
            .channel('orders-realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders',
                },
                (payload) => {
                    console.log('Realtime order insert:', payload);
                    handleNewOrder(payload.new);
                }
            )
            .subscribe((status) => {
                console.log('Subscription status:', status);
            });

        return () => {
            console.log('Cleaning up realtime subscription');
            supabase.removeChannel(channel);
        };
    }, [isAdmin, notificationPermission]);

    // Load initial unread count
    useEffect(() => {
        if (!isAdmin) return;

        const loadUnreadOrders = async () => {
            // Get orders from the last 24 hours that are still pending
            const oneDayAgo = new Date();
            oneDayAgo.setHours(oneDayAgo.getHours() - 24);

            const { data, error } = await supabase
                .from('orders')
                .select('id')
                .eq('status', 'pending')
                .gte('created_at', oneDayAgo.toISOString());

            if (!error && data) {
                const orderIds = new Set(data.map(o => o.id));
                setUnreadOrders(orderIds);
                setUnreadCount(orderIds.size);
            }
        };

        loadUnreadOrders();
    }, [isAdmin]);

    const markAsRead = (orderId: string) => {
        setUnreadOrders(prev => {
            const newSet = new Set(prev);
            newSet.delete(orderId);
            return newSet;
        });
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const clearAll = () => {
        setUnreadOrders(new Set());
        setUnreadCount(0);
    };

    // Don't provide context if not admin
    if (!isAdmin) {
        return <>{children}</>;
    }

    return (
        <OrderNotificationContext.Provider value={{ unreadCount, markAsRead, clearAll }}>
            {children}
        </OrderNotificationContext.Provider>
    );
}

export function useOrderNotifications() {
    const context = useContext(OrderNotificationContext);
    if (context === undefined) {
        // Return dummy values for non-admin users
        return { unreadCount: 0, markAsRead: () => { }, clearAll: () => { } };
    }
    return context;
}
