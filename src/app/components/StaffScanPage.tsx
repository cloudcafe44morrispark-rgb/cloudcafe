import { useState } from 'react';
import { QrCode, Plus, Gift, AlertCircle, CheckCircle, Coffee } from 'lucide-react';
import { getUserRewards, addStamp, redeemReward, UserRewards } from '../lib/rewards';

export function StaffScanPage() {
    const [userId, setUserId] = useState('');
    const [rewards, setRewards] = useState<UserRewards | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Parse QR code value (format: cloudcafe:userId)
    const parseQRValue = (value: string): string => {
        if (value.startsWith('cloudcafe:')) {
            return value.replace('cloudcafe:', '');
        }
        return value;
    };

    const handleLookup = async () => {
        if (!userId.trim()) {
            setMessage({ type: 'error', text: 'Please enter a user ID or scan QR code' });
            return;
        }

        setLoading(true);
        setMessage(null);

        const parsedId = parseQRValue(userId.trim());

        try {
            const data = await getUserRewards(parsedId);
            if (data) {
                setRewards(data);
                setUserId(parsedId);
            } else {
                setMessage({ type: 'error', text: 'User not found' });
                setRewards(null);
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to lookup user' });
            setRewards(null);
        } finally {
            setLoading(false);
        }
    };

    const handleAddStamp = async () => {
        if (!rewards) return;

        setLoading(true);
        setMessage(null);

        try {
            const result = await addStamp(rewards.user_id);
            setMessage({ type: result.success ? 'success' : 'error', text: result.message });

            if (result.success) {
                // Refresh rewards data
                const data = await getUserRewards(rewards.user_id);
                setRewards(data);
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to add stamp' });
        } finally {
            setLoading(false);
        }
    };

    const handleRedeemReward = async () => {
        if (!rewards) return;

        setLoading(true);
        setMessage(null);

        try {
            const result = await redeemReward(rewards.user_id);
            setMessage({ type: result.success ? 'success' : 'error', text: result.message });

            if (result.success) {
                // Refresh rewards data
                const data = await getUserRewards(rewards.user_id);
                setRewards(data);
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to redeem reward' });
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setUserId('');
        setRewards(null);
        setMessage(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16">
            <div className="max-w-lg mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[#B88A68] rounded-full mb-4">
                        <Coffee className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Portal</h1>
                    <p className="text-gray-600">Scan customer QR code to manage stamps</p>
                </div>

                {/* User ID Input */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Customer ID (from QR Code)
                    </label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                placeholder="Enter or paste customer ID..."
                                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B88A68] focus:border-transparent outline-none"
                            />
                        </div>
                        <button
                            onClick={handleLookup}
                            disabled={loading}
                            className="px-6 py-3 bg-[#B88A68] text-white font-semibold rounded-lg hover:bg-[#A67958] transition-colors disabled:opacity-50"
                        >
                            Lookup
                        </button>
                    </div>
                </div>

                {/* Message */}
                {message && (
                    <div className={`flex items-center gap-2 p-4 rounded-lg mb-6 ${message.type === 'success'
                            ? 'bg-green-50 border border-green-200 text-green-700'
                            : 'bg-red-50 border border-red-200 text-red-700'
                        }`}>
                        {message.type === 'success'
                            ? <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            : <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        }
                        <span>{message.text}</span>
                    </div>
                )}

                {/* Customer Info */}
                {rewards && (
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Customer Rewards</h2>
                            <button
                                onClick={handleClear}
                                className="text-sm text-gray-500 hover:text-gray-700"
                            >
                                Clear
                            </button>
                        </div>

                        {/* Stamps Display */}
                        <div className="bg-gradient-to-br from-[#B88A68] to-[#A67958] rounded-xl p-6 mb-6">
                            <div className="flex justify-between items-center text-white mb-4">
                                <span className="font-semibold">Stamps</span>
                                <span className="text-2xl font-bold">{rewards.stamps} / 10</span>
                            </div>

                            {/* Visual Stamps */}
                            <div className="grid grid-cols-10 gap-1">
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`aspect-square rounded-full flex items-center justify-center text-sm ${i < rewards.stamps
                                                ? 'bg-white/30'
                                                : 'bg-white/10 border border-white/20 border-dashed'
                                            }`}
                                    >
                                        {i < rewards.stamps && '☕'}
                                    </div>
                                ))}
                            </div>

                            {/* Status */}
                            {rewards.pending_reward && (
                                <div className="mt-4 text-center text-yellow-300 font-bold animate-pulse">
                                    🎁 Reward Ready!
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={handleAddStamp}
                                disabled={loading || rewards.pending_reward}
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus className="w-5 h-5" />
                                Add Stamp
                            </button>
                            <button
                                onClick={handleRedeemReward}
                                disabled={loading || !rewards.pending_reward}
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Gift className="w-5 h-5" />
                                Redeem
                            </button>
                        </div>

                        {rewards.pending_reward && (
                            <p className="mt-4 text-center text-sm text-amber-600">
                                ⚠️ Customer has pending reward - must redeem before adding stamps
                            </p>
                        )}
                    </div>
                )}

                {/* Instructions */}
                <div className="mt-8 text-center text-sm text-gray-500">
                    <p className="mb-2">How to use:</p>
                    <ol className="text-left max-w-xs mx-auto space-y-1">
                        <li>1. Ask customer to show their QR code</li>
                        <li>2. Scan or enter the ID shown below the QR</li>
                        <li>3. Click "Add Stamp" after purchase</li>
                        <li>4. Click "Redeem" when they claim free drink</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
