import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { Loader2, Printer } from 'lucide-react';

interface OrderItemRow {
    id: string;
    product_name: string;
    quantity: number;
    price: number;
}

interface OrderWithItems {
    id: string;
    status: string;
    total: number;
    notes?: string | null;
    customer_name?: string | null;
    customer_phone?: string | null;
    created_at: string;
    order_items: OrderItemRow[];
}

export function OrderPrintPage() {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const { isAdmin, isLoading: isAuthLoading } = useAuth();
    const [order, setOrder] = useState<OrderWithItems | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [printed, setPrinted] = useState(false);

    useEffect(() => {
        if (isAuthLoading) return;
        if (!isAdmin) {
            navigate('/');
            return;
        }
        if (!orderId) {
            setError('Missing order ID');
            return;
        }

        const fetchOrder = async () => {
            const { data, error: err } = await supabase
                .from('orders')
                .select(`
                    id,
                    status,
                    total,
                    notes,
                    customer_name,
                    customer_phone,
                    created_at,
                    order_items ( id, product_name, quantity, price )
                `)
                .eq('id', orderId)
                .single();

            if (err || !data) {
                setError('Order not found');
                return;
            }
            setOrder(data as OrderWithItems);
        };

        fetchOrder();
    }, [orderId, isAdmin, isAuthLoading, navigate]);

    // Auto-trigger print when order is loaded (once)
    useEffect(() => {
        if (!order || printed) return;
        setPrinted(true);
        // Small delay so the slip is painted before print dialog
        const t = setTimeout(() => {
            window.print();
        }, 300);
        return () => clearTimeout(t);
    }, [order, printed]);

    const handlePrint = () => {
        window.print();
    };

    if (isAuthLoading || (!order && !error)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 print:hidden">
                <Loader2 className="w-8 h-8 animate-spin text-[#B88A68]" />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4 print:hidden">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                    type="button"
                    onClick={() => navigate('/admin/orders')}
                    className="text-[#B88A68] underline"
                >
                    Back to Orders
                </button>
            </div>
        );
    }

    return (
        <>
            {/* Screen-only: back + manual print */}
            <div className="fixed top-4 left-4 right-4 flex justify-between items-center print:hidden z-10">
                <button
                    type="button"
                    onClick={() => navigate('/admin/orders')}
                    className="text-sm text-gray-600 hover:text-gray-900"
                >
                    ← Back
                </button>
                <button
                    type="button"
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-[#B88A68] text-white rounded-lg text-sm font-medium"
                >
                    <Printer className="w-4 h-4" />
                    Print
                </button>
            </div>

            {/* Slip content - visible on screen and in print */}
            <div className="order-slip max-w-sm mx-auto pt-16 pb-8 px-6 print:pt-6 print:pb-4 print:max-w-none">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 print:shadow-none print:border-black">
                    <div className="text-center border-b border-gray-200 pb-3 mb-4">
                        <h1 className="text-lg font-bold text-gray-900">Cloud Cafe</h1>
                        <p className="text-xs text-gray-500">Order Receipt</p>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mb-4">
                        <span>#{order.id.slice(0, 8)}</span>
                        <span>{format(new Date(order.created_at), 'yyyy-MM-dd HH:mm')}</span>
                    </div>
                    {(order.customer_name || order.customer_phone) && (
                        <div className="mb-4 text-sm text-gray-900">
                            {order.customer_name && <p className="font-semibold">{order.customer_name}</p>}
                            {order.customer_phone && <p>Tel: {order.customer_phone}</p>}
                        </div>
                    )}
                    <div className="space-y-2 mb-4">
                        {order.order_items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                                <span className="font-medium text-gray-900">
                                    {item.quantity}x {item.product_name}
                                </span>
                                <span className="text-gray-700">£{(item.quantity * item.price).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    {order.notes ? (
                        <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4">
                            <p className="text-[10px] font-bold text-amber-800 uppercase mb-1">Note</p>
                            <p className="text-sm text-gray-900">{order.notes}</p>
                        </div>
                    ) : null}
                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                        <span className="font-semibold text-gray-700">Total</span>
                        <span className="text-lg font-bold text-gray-900">£{Number(order.total).toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .order-slip,
                    .order-slip * { visibility: visible; }
                    .order-slip { position: absolute; left: 0; top: 0; width: 100%; max-width: none; }
                }
            `}</style>
        </>
    );
}
