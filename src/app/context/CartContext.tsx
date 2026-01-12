import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export interface CartItem {
    id: string;
    name: string;
    price: string;
    quantity: number;
    category?: string; // Track category for reward eligibility
    rewardApplied?: boolean; // Track if reward was applied to this item
}

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (name: string, price: string, category?: string) => void;
    removeFromCart: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    cartCount: number;
    cartTotal: number;
    orderNotes: string;
    setOrderNotes: (notes: string) => void;
    submitOrder: (paymentMethod?: string) => Promise<{ success: boolean; error?: string }>;
    isSubmitting: boolean;
    isVIP: boolean;
    checkVIPStatus: () => Promise<boolean>;
    userStamps: number;
    pendingReward: boolean;
    applyReward: () => void;
    rewardApplied: boolean;
    fetchUserRewards: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [orderNotes, setOrderNotes] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isVIP, setIsVIP] = useState(false);
    const [userStamps, setUserStamps] = useState(0);
    const [pendingReward, setPendingReward] = useState(false);
    const [rewardApplied, setRewardApplied] = useState(false);

    // Load notes from localStorage on mount
    useEffect(() => {
        const savedNotes = localStorage.getItem('cart_notes');
        if (savedNotes) {
            setOrderNotes(savedNotes);
        }
    }, []);

    // Save notes to localStorage whenever specific notes change
    useEffect(() => {
        localStorage.setItem('cart_notes', orderNotes);
    }, [orderNotes]);

    const addToCart = (name: string, price: string, category?: string) => {
        setCartItems((prev) => {
            // Check if item already exists
            const existingItem = prev.find((item) => item.name === name && item.price === price);
            if (existingItem) {
                // Increase quantity
                return prev.map((item) =>
                    item.id === existingItem.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            // Add new item
            const newItem: CartItem = {
                id: `${name}-${price}-${Date.now()}`,
                name,
                price,
                quantity: 1,
                category,
            };
            return [...prev, newItem];
        });
    };

    const removeFromCart = (id: string) => {
        setCartItems((prev) => prev.filter((item) => item.id !== id));
    };

    const updateQuantity = (id: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(id);
            return;
        }
        setCartItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, quantity } : item))
        );
    };

    const clearCart = () => {
        setCartItems([]);
        setOrderNotes('');
        localStorage.removeItem('cart_notes');
    };

    // Calculate total count
    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    // Parse price and calculate total
    const parsePrice = (priceStr: string): number => {
        // Extract the first price number from strings like "£3.5 / £4.2" or "£11.95"
        const match = priceStr.match(/£([\d.]+)/);
        return match ? parseFloat(match[1]) : 0;
    };

    const cartTotal = cartItems.reduce(
        (sum, item) => sum + parsePrice(item.price) * item.quantity,
        0
    );

    // Check if user is VIP
    const checkVIPStatus = async (): Promise<boolean> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;

            const shopName = user.user_metadata?.shop_name;
            if (!shopName) return false;

            // Use ilike for case-insensitive matching
            const { data, error } = await supabase
                .from('vip_shops')
                .select('shop_name')
                .ilike('shop_name', shopName)
                .single();

            return !error && !!data;
        } catch {
            return false;
        }
    };

    // Fetch user rewards
    const fetchUserRewards = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let { data, error } = await supabase
                .from('user_rewards')
                .select('stamps, pending_reward')
                .eq('user_id', user.id)
                .single();

            if (error && error.code === 'PGRST116') {
                // Create new rewards record
                const { data: newRecord } = await supabase
                    .from('user_rewards')
                    .insert({ user_id: user.id, stamps: 0, pending_reward: false })
                    .select()
                    .single();
                data = newRecord;
            }

            if (data) {
                setUserStamps(data.stamps);
                setPendingReward(data.pending_reward);
            }
        } catch (err) {
            console.error('Error fetching rewards:', err);
        }
    };

    // Check VIP status and fetch rewards on mount
    useEffect(() => {
        checkVIPStatus().then(setIsVIP);
        fetchUserRewards();
    }, []);

    // Auto-apply reward when user has pending reward and cart has eligible items
    useEffect(() => {
        if (pendingReward && !rewardApplied && cartItems.length > 0) {
            // Check if there's at least one eligible item
            const eligibleCategories = ['Coffee', 'Tea', 'Hot Drink', 'Iced'];
            const hasEligibleItem = cartItems.some(item =>
                item.category && eligibleCategories.includes(item.category)
            );

            if (hasEligibleItem) {
                applyReward();
            }
        }
    }, [pendingReward, rewardApplied, cartItems]);

    // Apply reward to cart (sets first eligible item price to 0)
    const applyReward = () => {
        if (!pendingReward || cartItems.length === 0) return;

        // Only apply to eligible categories (Coffee, Tea, Hot Drink, Iced)
        const eligibleCategories = ['Coffee', 'Tea', 'Hot Drink', 'Iced'];

        setCartItems(prev => {
            const updated = [...prev];
            // Find first eligible item
            const eligibleIndex = updated.findIndex(item =>
                item.category && eligibleCategories.includes(item.category)
            );

            if (eligibleIndex !== -1) {
                updated[eligibleIndex] = {
                    ...updated[eligibleIndex],
                    price: '£0.00',
                    rewardApplied: true
                };
            }
            return updated;
        });
        setRewardApplied(true);
    };

    const submitOrder = async (paymentMethod: string = 'online'): Promise<{ success: boolean; error?: string }> => {
        if (cartItems.length === 0) {
            return { success: false, error: 'Cart is empty' };
        }

        if (orderNotes.length > 500) {
            return { success: false, error: 'Notes exceed 500 characters' };
        }

        setIsSubmitting(true);

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                return { success: false, error: 'You must be logged in to place an order' };
            }

            // Create Order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: user.id,
                    status: 'pending',
                    total: cartTotal,
                    notes: orderNotes || null,
                    payment_method: paymentMethod, // Add payment method
                })
                .select()
                .single();

            if (orderError) throw orderError;
            if (!order) throw new Error('Failed to create order');

            // Create Order Items
            const itemsToInsert = cartItems.map((item) => ({
                order_id: order.id,
                product_name: item.name,
                quantity: item.quantity,
                price: parsePrice(item.price),
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(itemsToInsert);

            if (itemsError) throw itemsError;

            // Handle rewards: either redeem or earn stamps
            if (rewardApplied && pendingReward) {
                // Redeem reward - reset stamps and pending_reward
                await supabase
                    .from('user_rewards')
                    .update({ stamps: 0, pending_reward: false, updated_at: new Date().toISOString() })
                    .eq('user_id', user.id);

                // Log transaction
                await supabase.from('reward_transactions').insert({
                    user_id: user.id,
                    type: 'reward_redeemed',
                    amount: 1,
                    order_id: order.id,
                });
            } else if (!pendingReward) {
                // Earn stamps for drinks in eligible categories only
                // Eligible categories: Coffee Classics, Tea & Non-Coffee, Iced Drinks
                const eligibleCategories = ['Coffee', 'Tea', 'Hot Drink', 'Iced'];

                const drinksCount = cartItems.filter(item =>
                    item.category && eligibleCategories.includes(item.category)
                ).reduce((sum, item) => sum + item.quantity, 0);

                if (drinksCount > 0) {
                    // Get current stamps
                    const { data: currentRewards } = await supabase
                        .from('user_rewards')
                        .select('stamps')
                        .eq('user_id', user.id)
                        .single();

                    const currentStamps = currentRewards?.stamps || 0;
                    const newStamps = currentStamps + drinksCount;
                    const willConvert = newStamps >= 10;

                    // Update stamps
                    await supabase
                        .from('user_rewards')
                        .update({
                            stamps: willConvert ? 0 : newStamps,
                            pending_reward: willConvert,
                            updated_at: new Date().toISOString(),
                        })
                        .eq('user_id', user.id);

                    // Log transaction
                    await supabase.from('reward_transactions').insert({
                        user_id: user.id,
                        type: 'stamp_earned',
                        amount: drinksCount,
                        order_id: order.id,
                    });

                    if (willConvert) {
                        await supabase.from('reward_transactions').insert({
                            user_id: user.id,
                            type: 'reward_earned',
                            amount: 1,
                        });
                    }
                }
            }

            // Success
            clearCart();
            setRewardApplied(false);
            await fetchUserRewards(); // Refresh rewards
            return { success: true };

        } catch (error: any) {
            console.error('Order submission error:', error);
            return { success: false, error: error.message || 'Failed to place order' };
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                cartCount,
                cartTotal,
                orderNotes,
                setOrderNotes,
                submitOrder,
                isSubmitting,
                isVIP,
                checkVIPStatus,
                userStamps,
                pendingReward,
                applyReward,
                rewardApplied,
                fetchUserRewards,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
