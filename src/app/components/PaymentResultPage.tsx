import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, AlertTriangle, ArrowLeft, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';

type PaymentStatus = 'success' | 'failure' | 'cancel' | 'pending' | 'error';

interface StatusConfig {
    icon: React.ReactNode;
    title: string;
    message: string;
    bgColor: string;
    iconColor: string;
}

const statusConfigs: Record<PaymentStatus, StatusConfig> = {
    success: {
        icon: <CheckCircle className="w-20 h-20" />,
        title: 'Payment Successful!',
        message: 'Your order has been placed and is being prepared.',
        bgColor: 'bg-green-500',
        iconColor: 'text-green-500'
    },
    failure: {
        icon: <XCircle className="w-20 h-20" />,
        title: 'Payment Failed',
        message: 'Your payment was declined. Please try again with a different payment method.',
        bgColor: 'bg-red-500',
        iconColor: 'text-red-500'
    },
    cancel: {
        icon: <XCircle className="w-20 h-20" />,
        title: 'Payment Cancelled',
        message: 'You cancelled the payment. Your cart items are still saved.',
        bgColor: 'bg-gray-500',
        iconColor: 'text-gray-500'
    },
    pending: {
        icon: <Clock className="w-20 h-20" />,
        title: 'Payment Pending',
        message: 'Your payment is being processed. We will notify you once it is confirmed.',
        bgColor: 'bg-yellow-500',
        iconColor: 'text-yellow-500'
    },
    error: {
        icon: <AlertTriangle className="w-20 h-20" />,
        title: 'Payment Error',
        message: 'An error occurred during payment. Please try again or contact support.',
        bgColor: 'bg-orange-500',
        iconColor: 'text-orange-500'
    }
};

export function PaymentResultPage({ status }: { status: PaymentStatus }) {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(5);
    const { clearCart, cartItems, pendingReward, rewardApplied, fetchUserRewards } = useCart();
    const processedRef = useRef(false);

    const orderId = searchParams.get('order');
    const config = statusConfigs[status];

    // Handle successful payment - clear cart and process rewards
    useEffect(() => {
        if (status === 'success' && orderId && !processedRef.current) {
            processedRef.current = true;

            const handlePaymentSuccess = async () => {
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;

                    // Double check order status from DB to ensure it's actually authorized
                    // This is extra safe since the callback function already updates it
                    const { data: order, error: orderError } = await supabase
                        .from('orders')
                        .select('payment_status, status')
                        .eq('id', orderId)
                        .single();

                    if (orderError || !order) {
                        console.error('Error verifying order status:', orderError);
                        return;
                    }

                    // Only process rewards if the order is actually paid/authorized
                    if (order.payment_status === 'authorized' || order.status === 'pending') {
                        // Process rewards
                        if (rewardApplied && pendingReward) {
                            // Redeem reward - reset stamps and pending_reward
                            await supabase
                                .from('user_rewards')
                                .update({ stamps: 0, pending_reward: false, updated_at: new Date().toISOString() })
                                .eq('user_id', user.id);

                            await supabase.from('reward_transactions').insert({
                                user_id: user.id,
                                type: 'reward_redeemed',
                                amount: 1,
                                order_id: orderId,
                            });
                        } else if (!pendingReward) {
                            // Earn stamps for drinks
                            const eligibleCategories = ['Coffee', 'Tea', 'Hot Drink', 'Iced'];
                            const drinksCount = cartItems.filter(item =>
                                item.category && eligibleCategories.includes(item.category)
                            ).reduce((sum, item) => sum + item.quantity, 0);

                            if (drinksCount > 0) {
                                // Re-fetch rewards record to be safe
                                const { data: currentRewards } = await supabase
                                    .from('user_rewards')
                                    .select('stamps')
                                    .eq('user_id', user.id)
                                    .single();

                                const currentStamps = currentRewards?.stamps || 0;
                                const newStamps = currentStamps + drinksCount;
                                const willConvert = newStamps >= 10;

                                await supabase
                                    .from('user_rewards')
                                    .update({
                                        stamps: willConvert ? 0 : newStamps,
                                        pending_reward: willConvert,
                                        updated_at: new Date().toISOString(),
                                    })
                                    .eq('user_id', user.id);

                                await supabase.from('reward_transactions').insert({
                                    user_id: user.id,
                                    type: 'stamp_earned',
                                    amount: drinksCount,
                                    order_id: orderId,
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

                        // Clear cart and refresh rewards
                        clearCart();
                        await fetchUserRewards();
                    } else {
                        console.warn('Order status not authorized yet:', order.payment_status);
                    }
                } catch (error) {
                    console.error('Error processing payment success:', error);
                }
            };

            handlePaymentSuccess();
        }
    }, [status, orderId, cartItems, rewardApplied, pendingReward, clearCart, fetchUserRewards]);

    // Auto-redirect for success
    useEffect(() => {
        if (status === 'success' && countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
        if (status === 'success' && countdown === 0) {
            navigate('/orders');
        }
    }, [status, countdown, navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Hero Header */}
            <div className={`relative ${config.bgColor} text-white py-20`}>
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative max-w-6xl mx-auto px-6 text-center">
                    <div className="flex justify-center mb-6">
                        {config.icon}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">{config.title}</h1>
                    <p className="text-xl text-white/90">{config.message}</p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-2xl mx-auto px-6 py-12">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                    {orderId && (
                        <div className="mb-6">
                            <p className="text-sm text-gray-500 mb-1">Order Reference</p>
                            <p className="font-mono text-lg font-semibold text-gray-900">
                                {orderId.substring(0, 8).toUpperCase()}
                            </p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="mb-6">
                            <p className="text-gray-600">
                                Redirecting to your orders in {countdown} seconds...
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        {status === 'success' ? (
                            <Link
                                to="/orders"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#B88A68] text-white font-semibold rounded-full hover:bg-[#A67958] transition-colors"
                            >
                                <Package className="w-5 h-5" />
                                View My Orders
                            </Link>
                        ) : (
                            <>
                                <Link
                                    to="/cart"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#B88A68] text-white font-semibold rounded-full hover:bg-[#A67958] transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    Back to Cart
                                </Link>
                                <Link
                                    to="/menu"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-[#B88A68] text-[#B88A68] font-semibold rounded-full hover:bg-[#B88A68]/10 transition-colors"
                                >
                                    Continue Shopping
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Help Section */}
                {(status === 'failure' || status === 'error') && (
                    <div className="mt-8 bg-gray-50 rounded-xl p-6">
                        <h3 className="font-semibold text-gray-900 mb-3">Need Help?</h3>
                        <ul className="text-sm text-gray-600 space-y-2">
                            <li>- Check that your card details are correct</li>
                            <li>- Ensure you have sufficient funds</li>
                            <li>- Try a different payment method</li>
                            <li>- Contact your bank if the problem persists</li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

// Export individual page components for routing
export function PaymentSuccessPage() {
    return <PaymentResultPage status="success" />;
}

export function PaymentFailurePage() {
    return <PaymentResultPage status="failure" />;
}

export function PaymentCancelPage() {
    return <PaymentResultPage status="cancel" />;
}

export function PaymentPendingPage() {
    return <PaymentResultPage status="pending" />;
}

export function PaymentErrorPage() {
    return <PaymentResultPage status="error" />;
}
