export type OrderStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Order {
    id: string;
    user_id: string;
    status: OrderStatus;
    total: number;
    notes?: string | null;
    created_at: string;
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_name: string;
    quantity: number;
    price: number;
    created_at: string;
}
