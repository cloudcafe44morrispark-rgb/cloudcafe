import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export interface CartItem {
    id: string;
    name: string;
    price: string;
    quantity: number;
}

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (name: string, price: string) => void;
    removeFromCart: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    cartCount: number;
    cartTotal: number;
    orderNotes: string;
    setOrderNotes: (notes: string) => void;
    submitOrder: () => Promise<{ success: boolean; error?: string }>;
    isSubmitting: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [orderNotes, setOrderNotes] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const addToCart = (name: string, price: string) => {
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

    const submitOrder = async (): Promise<{ success: boolean; error?: string }> => {
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

            // Success
            clearCart();
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
