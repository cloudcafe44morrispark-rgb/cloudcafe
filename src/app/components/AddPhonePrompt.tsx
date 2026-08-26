import { useState } from 'react';
import { Loader2, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { isValidPhone } from '../lib/phone';
import { triggerPrint } from '../lib/printReceipt';

interface AddPhonePromptProps {
    orderId?: string | null;
    onDone: () => void;
}

export function AddPhonePrompt({ orderId, onDone }: AddPhonePromptProps) {
    const [phone, setPhone] = useState('');
    const [saving, setSaving] = useState(false);
    const [skipping, setSkipping] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = phone.trim();
        if (!isValidPhone(trimmed)) {
            toast.error('Please enter a valid phone number');
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: { phone: trimmed },
            });
            if (error) throw error;

            if (orderId) {
                await supabase
                    .from('orders')
                    .update({ customer_phone: trimmed })
                    .eq('id', orderId);
                try {
                    await triggerPrint(orderId);
                } catch (printErr) {
                    console.error('Print after phone save failed:', printErr);
                }
            }

            toast.success('Phone number saved — receipt printing');
            onDone();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to save phone number';
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200 text-left">
            <div className="flex items-start gap-3 mb-3">
                <Phone className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
                <div>
                    <p className="font-semibold text-gray-900">Add your phone number</p>
                    <p className="text-sm text-gray-600">
                        We use this to contact you about your order. The kitchen ticket prints after you save.
                    </p>
                </div>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
                <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+44 7XXX XXXXXX"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B88A68]"
                    autoComplete="tel"
                />
                <div className="flex flex-col sm:flex-row gap-2">
                    <button
                        type="submit"
                        disabled={saving || skipping}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#B88A68] text-white font-semibold rounded-lg hover:bg-[#A67958] disabled:opacity-50"
                    >
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        Save number
                    </button>
                    <button
                        type="button"
                        onClick={async () => {
                            setSkipping(true);
                            try {
                                if (orderId) {
                                    await triggerPrint(orderId);
                                }
                            } catch (printErr) {
                                console.error('Print after skip failed:', printErr);
                            } finally {
                                onDone();
                            }
                        }}
                        disabled={saving || skipping}
                        className="px-4 py-2 text-gray-600 font-medium hover:text-gray-900"
                    >
                        Skip for now
                    </button>
                </div>
            </form>
        </div>
    );
}
