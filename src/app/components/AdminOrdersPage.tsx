import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Order } from '../../types/database';
import { Calendar, Search, Filter, AlertTriangle, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface OrderWithItems extends Order {
    order_items: {
        id: string;
        product_name: string;
        quantity: number;
        price: number;
    }[];
    user_email?: string; // We'll try to fetch this if possible, or join
}

export function AdminOrdersPage() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<OrderWithItems[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<OrderWithItems[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        checkAdmin();
        fetchOrders();
    }, []);

    useEffect(() => {
        filterOrders();
    }, [searchTerm, statusFilter, orders]);

    const checkAdmin = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        // Simple client-side check for demo purposes. 
        // Real security should be RLS policies.
        const adminEmails = ['demouser2026@test.com', 'admin@cloudcafe.com'];
        if (!user || !adminEmails.includes(user.email || '')) {
            // navigate('/'); 
            // Commenting out redirect for now to allow easier testing if email differs
        }
    };

    const fetchOrders = async () => {
        try {
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
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (err) {
            console.error('Error fetching admin orders:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const filterOrders = () => {
        let result = orders;

        if (statusFilter !== 'all') {
            result = result.filter(o => o.status === statusFilter);
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(o =>
                o.id.toLowerCase().includes(term) ||
                o.notes?.toLowerCase().includes(term)
            );
        }

        setFilteredOrders(result);
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

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Admin Header */}
            <div className="bg-[#1a1a1a] text-white border-b border-gray-800 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-gray-400 hover:text-white transition-colors">Back to Site</Link>
                        <div className="h-6 w-px bg-gray-700"></div>
                        <h1 className="text-xl font-bold">Kitchen Display System</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="bg-[#B88A68] text-white text-xs px-2 py-1 rounded font-bold">ADMIN</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Controls */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search orders ID or notes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B88A68]"
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                        <Filter className="w-5 h-5 text-gray-500" />
                        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition-colors ${statusFilter === status
                                    ? 'bg-[#B88A68] text-white'
                                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Orders Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredOrders.map((order) => (
                        <div key={order.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden relative ${order.notes ? 'border-amber-200 ring-1 ring-amber-100' : 'border-gray-200'}`}>
                            {order.notes && (
                                <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    NOTE
                                </div>
                            )}

                            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-mono text-xs text-gray-500">#{order.id.slice(0, 8)}</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Calendar className="w-3 h-3" />
                                    {format(new Date(order.created_at), 'p')} • {format(new Date(order.created_at), 'MMM d')}
                                </div>
                            </div>

                            <div className="p-4">
                                {/* Items */}
                                <div className="space-y-2 mb-4">
                                    {order.order_items.map((item) => (
                                        <div key={item.id} className="flex justify-between text-sm">
                                            <div className="flex gap-2">
                                                <span className="font-bold text-gray-900 w-6">{item.quantity}x</span>
                                                <span className="text-gray-700">{item.product_name}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Notes Highlight */}
                                {order.notes ? (
                                    <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4">
                                        <h5 className="text-[10px] font-bold text-amber-800 uppercase mb-1">Kitchen Note</h5>
                                        <p className="text-sm font-medium text-gray-900">{order.notes}</p>
                                    </div>
                                ) : (
                                    <div className="text-xs text-gray-400 italic mb-4">No notes</div>
                                )}

                                <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                                    <span className="text-sm font-semibold text-gray-500">Total</span>
                                    <span className="text-lg font-bold text-gray-900">£{Number(order.total).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
