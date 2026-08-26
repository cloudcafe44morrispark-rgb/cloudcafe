export function getUserPhone(
    user: { phone?: string | null; user_metadata?: Record<string, unknown> } | null | undefined,
): string {
    const meta = user?.user_metadata || {};
    const raw = (typeof meta.phone === 'string' ? meta.phone : '') || user?.phone || '';
    return raw.trim();
}

export function isValidPhone(value: string): boolean {
    const digits = value.replace(/\D/g, '');
    return digits.length >= 7 && digits.length <= 15;
}
