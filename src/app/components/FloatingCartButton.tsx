import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export function FloatingCartButton() {
    const { cartCount } = useCart();

    return (
        <Link
            to="/cart"
            className="fixed bottom-8 right-6 z-[100] bg-[#B88A68] hover:bg-[#A67958] text-white rounded-full p-4 shadow-2xl transition-all hover:scale-110 group flex items-center justify-center"
            aria-label={`Shopping cart with ${cartCount} items`}
        >
            <ShoppingCart className="w-6 h-6" />
            {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                    {cartCount > 99 ? '99+' : cartCount}
                </span>
            )}
        </Link>
    );
}
