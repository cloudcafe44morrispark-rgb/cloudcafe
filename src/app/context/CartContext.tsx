import { createContext, useContext, useState, ReactNode } from 'react';

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
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

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
