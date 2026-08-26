export type OrderStatus = 'awaiting_payment' | 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'authorized' | 'settled' | 'refused' | 'cancelled' | 'error' | 'expired' | 'in_store';

export interface Order {
    id: string;
    user_id: string;
    status: OrderStatus;
    total: number;
    notes?: string | null;
    customer_name?: string | null;
    customer_phone?: string | null;
    payment_status?: PaymentStatus | string | null;
    created_at: string;
    /** Set by print bridge after successful print; null until printed. */
    printed_at?: string | null;
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_name: string;
    quantity: number;
    price: number;
    created_at: string;
}
