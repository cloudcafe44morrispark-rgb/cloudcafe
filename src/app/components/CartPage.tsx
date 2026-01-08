import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export function CartPage() {
    const navigate = useNavigate();
    const {
        cartItems,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        orderNotes,
        setOrderNotes,
        submitOrder,
        isSubmitting
    } = useCart();
    const { isAuthenticated, setPendingCheckout } = useAuth();

    const handleCheckout = async () => {
        if (!isAuthenticated) {
            // Set pending checkout flag and redirect to signin
            setPendingCheckout(true);
            navigate('/signin');
            return;
        }

        // Proceed to submit order
        const result = await submitOrder();

        if (result.success) {
            toast.success('Order placed successfully!');
            navigate('/orders');
        } else {
            toast.error(result.error || 'Failed to place order');
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
                {/* Hero Header */}
                <div className="relative bg-[#B88A68] text-white py-20">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative max-w-6xl mx-auto px-6 text-center">
                        <h1 className="text-5xl md:text-6xl font-bold mb-4">Your Cart</h1>
                        <p className="text-xl text-white/90">Review your order</p>
                    </div>
                </div>

                {/* Empty Cart */}
                <div className="max-w-4xl mx-auto px-6 py-20 text-center">
                    <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
                    <p className="text-gray-600 mb-8">Looks like you haven't added any items yet.</p>
                    <Link
                        to="/menu"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#B88A68] text-white font-semibold rounded-full hover:bg-[#A67958] transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Continue Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Hero Header */}
            <div className="relative bg-[#B88A68] text-white py-20">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative max-w-6xl mx-auto px-6 text-center">
                    <h1 className="text-5xl md:text-6xl font-bold mb-4">Your Cart</h1>
                    <p className="text-xl text-white/90">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-12">
                {/* Cart Items */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                    <div className="divide-y divide-gray-100">
                        {cartItems.map((item) => (
                            <div key={item.id} className="p-6 flex items-center gap-6">
                                {/* Item Info */}
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg text-gray-900">{item.name}</h3>
                                    <p className="text-[#B88A68] font-bold">{item.price}</p>
                                </div>

                                {/* Quantity Controls */}
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Remove Button */}
                                <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Order Notes Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                    <h3 className="font-semibold text-lg text-gray-900 mb-4">Special Instructions</h3>
                    <div className="relative">
                        <textarea
                            value={orderNotes}
                            onChange={(e) => setOrderNotes(e.target.value)}
                            maxLength={500}
                            disabled={isSubmitting}
                            placeholder="Add special instructions (e.g., no ice, extra hot, allergies)..."
                            className="w-full min-h-[100px] p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B88A68] focus:border-transparent resize-y text-gray-700 disabled:bg-gray-50 disabled:text-gray-400"
                        />
                        <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded">
                            {orderNotes.length}/500
                        </div>
                    </div>
                </div>

                {/* Cart Summary */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                    <div className="flex justify-between items-center text-xl font-bold">
                        <span>Total</span>
                        <span className="text-[#B88A68]">£{cartTotal.toFixed(2)}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                        to="/menu"
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-[#B88A68] text-[#B88A68] font-semibold rounded-full hover:bg-[#B88A68]/10 transition-colors ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Continue Shopping
                    </Link>
                    <button
                        onClick={clearCart}
                        disabled={isSubmitting}
                        className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-full hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Clear Cart
                    </button>
                    <button
                        onClick={handleCheckout}
                        disabled={isSubmitting}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#B88A68] text-white font-semibold rounded-full hover:bg-[#A67958] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                        {isSubmitting ? 'Placing Order...' : 'Place Order'}
                    </button>
                </div>
            </div>
        </div>
    );
}
