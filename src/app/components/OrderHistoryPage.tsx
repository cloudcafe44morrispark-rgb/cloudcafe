import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Order } from '../../types/database';
import { Calendar, Package, Receipt, ArrowLeft, Loader2, Info, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useBusyMode } from '../context/BusyModeContext';

interface OrderWithItems extends Order {
    order_items: {
        id: string;
        product_name: string;
        quantity: number;
        price: number;
    }[];
}

export function OrderHistoryPage() {
    const { collectionMinutes } = useBusyMode();
    const [orders, setOrders] = useState<OrderWithItems[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items (
                        id,
                        product_name,
                        quantity,
                        price
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (err: any) {
            console.error('Error fetching orders:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800 border-green-200';
            case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-[#B88A68]" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
                    Error loading orders: {error}
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="text-[#B88A68] hover:underline"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-xl font-bold text-gray-900">My Orders</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="mb-6 flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-[#B88A68]" />
                    <span>Estimated collection time: <strong>{collectionMinutes} minutes</strong></span>
                </div>
                {orders.length === 0 ? (
                    <div className="text-center py-20">
                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
                        <p className="text-gray-500 mb-6">Start exploring our menu to place your first order.</p>
                        <Link
                            to="/menu"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#B88A68] text-white font-semibold rounded-full hover:bg-[#A67958] transition-colors"
                        >
                            View Menu
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                {/* Order Header */}
                                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-sm text-gray-500">#{order.id.slice(0, 8)}</span>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)} uppercase tracking-wide`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Calendar className="w-4 h-4" />
                                            {format(new Date(order.created_at), 'PPP p')}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-gray-900">£{Number(order.total).toFixed(2)}</div>
                                        <div className="text-xs text-gray-500">Total Amount</div>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="p-6">
                                    <div className="space-y-4 mb-6">
                                        {order.order_items.map((item) => (
                                            <div key={item.id} className="flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-3">
                                                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded font-medium min-w-[2rem] text-center">
                                                        {item.quantity}x
                                                    </span>
                                                    <span className="font-medium text-gray-900">{item.product_name}</span>
                                                </div>
                                                <span className="text-gray-600">£{Number(item.price).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Order Notes */}
                                    <div className="bg-yellow-50/50 rounded-lg p-4 border border-yellow-100">
                                        <div className="flex items-start gap-3">
                                            <Info className="w-4 h-4 text-yellow-600 mt-0.5" />
                                            <div className="space-y-1">
                                                <h4 className="text-xs font-semibold uppercase tracking-wider text-yellow-800">Special Instructions</h4>
                                                <p className="text-sm text-gray-700 italic">
                                                    {order.notes || "No special instructions"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
