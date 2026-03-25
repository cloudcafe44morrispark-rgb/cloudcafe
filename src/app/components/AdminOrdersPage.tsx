import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Order } from '../../types/database';
import { Calendar, Search, Filter, AlertTriangle, Loader2, Clock, Printer, BarChart3 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBusyMode } from '../context/BusyModeContext';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface OrderWithItems extends Order {
    order_items: {
        id: string;
        product_name: string;
        quantity: number;
        price: number;
    }[];
}

export function AdminOrdersPage() {
    const navigate = useNavigate();
    const { isAdmin, isLoading: isAuthLoading } = useAuth();
    const { collectionMinutes } = useBusyMode();
    const [orders, setOrders] = useState<OrderWithItems[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<OrderWithItems[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [printingOrderId, setPrintingOrderId] = useState<string | null>(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    // Realtime subscription — refresh whenever orders table changes
    useEffect(() => {
        const channel = supabase
            .channel('admin-orders-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                fetchOrders();
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    useEffect(() => {
        filterOrders();
    }, [searchTerm, statusFilter, orders]);

    useEffect(() => {
        if (isAuthLoading) return;
        if (!isAdmin) navigate('/');
    }, [isAdmin, isAuthLoading, navigate]);

    const fetchOrders = async () => {
        try {
            // Only fetch today's orders (midnight to now)
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

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
                .gte('created_at', todayStart.toISOString())
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
                o.notes?.toLowerCase().includes(term) ||
                (o as any).customer_name?.toLowerCase().includes(term)
            );
        }
        setFilteredOrders(result);
    };

    // Daily summary — only count completed (paid) orders
    const paidOrders = orders.filter(o => o.status === 'completed');
    const dailyRevenue = paidOrders.reduce((s, o) => s + Number(o.total), 0);
    const dailyItems = paidOrders.reduce((s, o) =>
        s + o.order_items.reduce((ss, i) => ss + i.quantity, 0), 0);

    const handlePrint = async (orderId: string, force = false) => {
        setPrintingOrderId(orderId);
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            const response = await fetch(`${supabaseUrl}/functions/v1/print-receipt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': anonKey,
                    'Authorization': `Bearer ${anonKey}`,
                },
                body: JSON.stringify({ orderId, force }),
            });
            const result = await response.json();
            if (result.ok) {
                toast.success(result.skipped ? 'Already printed — use Reprint to force' : '✓ Printed!');
                if (!result.skipped) fetchOrders();
            } else {
                toast.error('Print failed: ' + (result.error || 'Unknown error'));
            }
        } catch {
            toast.error('Print failed — check printer connection');
        } finally {
            setPrintingOrderId(null);
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
                    <span className="bg-[#B88A68] text-white text-xs px-2 py-1 rounded font-bold">ADMIN</span>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Collection time */}
                <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>Collection time shown to customers: <strong>{collectionMinutes} min</strong></span>
                </div>

                {/* Daily Summary */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <BarChart3 className="w-4 h-4 text-[#B88A68]" />
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Today's Summary — {format(new Date(), 'EEEE d MMM')}
                        </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{paidOrders.length}</p>
                            <p className="text-xs text-gray-500 mt-0.5">Paid Orders</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#B88A68]">£{dailyRevenue.toFixed(2)}</p>
                            <p className="text-xs text-gray-500 mt-0.5">Revenue (Paid)</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{dailyItems}</p>
                            <p className="text-xs text-gray-500 mt-0.5">Items Sold</p>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by order ID, name or notes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B88A68]"
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                        <Filter className="w-5 h-5 text-gray-500 shrink-0" />
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
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <p className="text-lg font-medium">No orders yet today</p>
                        <p className="text-sm mt-1">Orders will appear here automatically</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredOrders.map((order) => {
                            const isPrinting = printingOrderId === order.id;
                            const alreadyPrinted = !!(order as any).printed_at;
                            return (
                                <div
                                    key={order.id}
                                    className={`bg-white rounded-xl shadow-sm border overflow-hidden relative ${order.notes ? 'border-amber-200 ring-1 ring-amber-100' : 'border-gray-200'}`}
                                >
                                    {order.notes && (
                                        <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" />
                                            NOTE
                                        </div>
                                    )}

                                    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <span className="font-mono text-xs text-gray-500">#{order.id.slice(0, 8)}</span>
                                                {(order as any).customer_name && (
                                                    <p className="text-sm font-semibold text-gray-800 mt-0.5">{(order as any).customer_name}</p>
                                                )}
                                            </div>
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

                                        {/* Notes */}
                                        {order.notes ? (
                                            <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4">
                                                <h5 className="text-[10px] font-bold text-amber-800 uppercase mb-1">Kitchen Note</h5>
                                                <p className="text-sm font-medium text-gray-900">{order.notes}</p>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-gray-400 italic mb-4">No notes</div>
                                        )}

                                        {/* Total + Print */}
                                        <div className="border-t border-gray-100 pt-3 flex items-center justify-between gap-2 flex-wrap">
                                            <div>
                                                <span className="text-sm text-gray-500">Total</span>
                                                <span className="ml-2 text-lg font-bold text-gray-900">£{Number(order.total).toFixed(2)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {alreadyPrinted && (
                                                    <button
                                                        onClick={() => handlePrint(order.id, true)}
                                                        disabled={isPrinting}
                                                        className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-gray-500 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
                                                    >
                                                        {isPrinting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Printer className="w-3 h-3" />}
                                                        Reprint
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handlePrint(order.id, false)}
                                                    disabled={isPrinting || alreadyPrinted}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 disabled:opacity-40"
                                                >
                                                    {isPrinting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Printer className="w-3 h-3" />}
                                                    {alreadyPrinted ? 'Printed ✓' : 'Print'}
                                                </button>
                                            </div>
                                        </div>
                                        {alreadyPrinted && (
                                            <p className="text-[10px] text-green-600 mt-1">
                                                Printed at {format(new Date((order as any).printed_at), 'p')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
