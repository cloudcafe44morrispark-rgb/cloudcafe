import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, Loader2, CreditCard, Store as StoreIcon, Gift, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useOpeningHours } from '../context/OpeningHoursContext';
import { toast } from 'sonner';

export function CartPage() {
    const navigate = useNavigate();
    const [paymentMethod, setPaymentMethod] = useState('online');
    const {
        cartItems,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        serviceFee,
        orderTotal,
        orderNotes,
        setOrderNotes,
        submitOrder,
        isSubmitting,
        isVIP,
        pendingReward,
        applyReward,
        rewardApplied,
    } = useCart();
    const { isAuthenticated, setPendingCheckout } = useAuth();
    const { isOpen, nextOpenInfo } = useOpeningHours();

    const handleCheckout = async () => {
        if (!isAuthenticated) {
            // Set pending checkout flag and redirect to signin
            setPendingCheckout(true);
            navigate('/signin');
            return;
        }

        // All orders use online payment
        const result = await submitOrder('online');

        if (result.success) {
            // Check if we need to redirect to payment page (online payment)
            if (result.paymentUrl) {
                // Redirect to Worldpay payment page - use replace for Android compatibility
                window.location.replace(result.paymentUrl);
            } else {
                // In-store payment - order placed directly
                toast.success('Order placed successfully!');
                navigate('/orders');
            }
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
                            value={orderNotes || ''}
                            onChange={(e) => setOrderNotes(e.target.value)}
                            maxLength={500}
                            disabled={isSubmitting}
                            placeholder="Add special instructions (e.g., no ice, extra hot, allergies)..."
                            className="w-full min-h-[100px] p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B88A68] focus:border-transparent resize-y text-gray-700 disabled:bg-gray-50 disabled:text-gray-400"
                        />
                        <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded pointer-events-none">
                            {(orderNotes || '').length}/500
                        </div>
                    </div>
                </div>

                {/* Reward Redemption Section */}
                {pendingReward && !rewardApplied && (
                    <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-2xl border-2 border-amber-300 p-6 mb-8">
                        <div className="flex items-center gap-3">
                            <Gift className="w-8 h-8 text-amber-600" />
                            <div>
                                <h3 className="font-bold text-amber-900 text-lg">✨ Reward Will Be Applied!</h3>
                                <p className="text-amber-700 text-sm">Your free drink reward will automatically apply to your first eligible drink at checkout</p>
                            </div>
                        </div>
                    </div>
                )}

                {rewardApplied && (
                    <div className="bg-green-50 rounded-2xl border-2 border-green-300 p-4 mb-8 flex items-center gap-3">
                        <Gift className="w-6 h-6 text-green-600" />
                        <p className="text-green-800 font-medium">🎉 Reward applied! First eligible drink is free.</p>
                    </div>
                )}

                {pendingReward && (
                    <div className="bg-yellow-50 rounded-2xl border border-yellow-200 p-4 mb-8">
                        <p className="text-yellow-800 text-sm">
                            ⚠️ You won't earn stamps on this order while you have a pending reward.
                        </p>
                    </div>
                )}

                {/* Cart Summary */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                    <div className="flex justify-between items-center text-gray-600 mb-2">
                        <span>Subtotal</span>
                        <span>£{cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-600 mb-4">
                        <span>Service fee</span>
                        <span>£{serviceFee.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-100 pt-4 flex justify-between items-center text-xl font-bold">
                        <span>Total</span>
                        <span className="text-[#B88A68]">£{orderTotal.toFixed(2)}</span>
                    </div>
                </div>


                {/* Closed banner */}
                {!isOpen && (
                    <div className="bg-gray-900 text-white rounded-2xl p-4 mb-6 flex items-center gap-3">
                        <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                        <div>
                            <p className="font-semibold">We're currently closed</p>
                            <p className="text-sm text-gray-300">{nextOpenInfo}</p>
                        </div>
                    </div>
                )}

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
                        disabled={isSubmitting || !isOpen}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#B88A68] text-white font-semibold rounded-full hover:bg-[#A67958] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                        {!isOpen
                            ? 'Orders Closed'
                            : isSubmitting
                            ? 'Processing...'
                            : (isVIP && paymentMethod === 'in-store')
                                ? 'Place Order'
                                : 'Pay Now'}
                    </button>
                </div>
            </div>
        </div>
    );
}
