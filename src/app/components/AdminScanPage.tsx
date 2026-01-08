import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, UserCheck, TrendingUp, Gift, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface ScannedUser {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    stamps: number;
    pending_reward: boolean;
    lastVisit?: string;
}

export function AdminScanPage() {
    const navigate = useNavigate();
    const { user, isAdmin, isAuthenticated, isLoading } = useAuth();
    const [scannedUser, setScannedUser] = useState<ScannedUser | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [scannerInitialized, setScannerInitialized] = useState(false);

    // Check admin permission - wait for auth to finish loading
    useEffect(() => {
        if (isLoading) return; // Wait for auth to load
        if (!isAdmin) {
            toast.error('Admin access only');
            navigate('/');
        }
    }, [isAdmin, isLoading, navigate]);

    // Initialize QR scanner - wait for auth and admin check
    useEffect(() => {
        if (isLoading || !isAdmin || !isAuthenticated || scannerInitialized) return;

        // Small delay to ensure DOM is ready
        const timeout = setTimeout(() => {
            const scanner = new Html5QrcodeScanner(
                'qr-reader',
                {
                    fps: 10,
                    qrbox: { width: 280, height: 280 },
                    aspectRatio: 1.0,
                    rememberLastUsedCamera: true,
                    showTorchButtonIfSupported: true,
                    // Prefer back camera on mobile devices
                    videoConstraints: {
                        facingMode: { ideal: "environment" }
                    }
                },
                false
            );

            scanner.render(onScanSuccess, onScanError);
            setScannerInitialized(true);
        }, 100);

        return () => {
            clearTimeout(timeout);
        };
    }, [isAuthenticated, isAdmin, isLoading, scannerInitialized]);

    const onScanSuccess = async (decodedText: string) => {
        console.log('Scanned:', decodedText);
        await handleScan(decodedText);
    };

    const onScanError = (error: any) => {
        // Ignore scan errors (very common during scanning)
        if (!error.includes('NotFoundException')) {
            console.warn(error);
        }
    };

    const handleScan = async (userId: string) => {
        if (isProcessing) return;
        setIsProcessing(true);

        try {
            // Fetch user details
            const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

            if (userError) throw new Error('User not found');

            // Fetch or create user rewards
            let { data: rewardsData, error: rewardsError } = await supabase
                .from('user_rewards')
                .select('stamps, pending_reward, updated_at')
                .eq('user_id', userId)
                .single();

            if (rewardsError && rewardsError.code === 'PGRST116') {
                // Create new rewards record
                const { data: newRewards } = await supabase
                    .from('user_rewards')
                    .insert({ user_id: userId, stamps: 0, pending_reward: false })
                    .select()
                    .single();
                rewardsData = newRewards;
            }

            if (rewardsData) {
                setScannedUser({
                    id: userId,
                    email: userData.user.email || '',
                    firstName: userData.user.user_metadata?.first_name,
                    lastName: userData.user.user_metadata?.last_name,
                    stamps: rewardsData.stamps,
                    pending_reward: rewardsData.pending_reward,
                    lastVisit: rewardsData.updated_at
                });
                toast.success('User found!');
            }
        } catch (err: any) {
            console.error('Scan error:', err);
            toast.error(err.message || 'Failed to scan QR code');
        } finally {
            setIsProcessing(false);
        }
    };

    const redeemReward = async () => {
        if (!scannedUser || !user) return;

        setIsProcessing(true);
        try {
            // Update user rewards: Reset pending_reward to false
            const { error: updateError } = await supabase
                .from('user_rewards')
                .update({
                    pending_reward: false,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', scannedUser.id);

            if (updateError) throw updateError;

            // Log transaction
            await supabase.from('reward_transactions').insert({
                user_id: scannedUser.id,
                type: 'reward_redeemed',
                amount: 1,
                admin_id: user.id
            });

            // Update local state
            setScannedUser({
                ...scannedUser,
                pending_reward: false
            });

            toast.success('🎁 Reward redeemed successfully!');
        } catch (err: any) {
            console.error('Redeem error:', err);
            toast.error('Failed to redeem reward');
        } finally {
            setIsProcessing(false);
        }
    };

    const addStamp = async () => {
        if (!scannedUser || !user) return;

        // Check if user has unredeemed rewards
        if (scannedUser.pending_reward) {
            toast.error('User must redeem their reward before earning more stamps');
            return;
        }

        setIsProcessing(true);

        try {
            const newStamps = scannedUser.stamps + 1;
            const willConvert = newStamps >= 10;

            // Update user rewards
            const { error: updateError } = await supabase
                .from('user_rewards')
                .update({
                    stamps: willConvert ? 0 : newStamps,
                    pending_reward: willConvert ? true : scannedUser.pending_reward,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', scannedUser.id);

            if (updateError) throw updateError;

            // Create transaction record
            await supabase.from('reward_transactions').insert({
                user_id: scannedUser.id,
                type: 'stamp_scan',
                amount: 1,
                admin_id: user.id,
            });

            // If converted to reward, create reward transaction
            if (willConvert) {
                await supabase.from('reward_transactions').insert({
                    user_id: scannedUser.id,
                    type: 'reward_earned',
                    amount: 1,
                });
            }

            // Update local state
            setScannedUser({
                ...scannedUser,
                stamps: willConvert ? 0 : newStamps,
                pending_reward: willConvert ? true : scannedUser.pending_reward,
            });

            if (willConvert) {
                toast.success('🎉 Stamp added and converted to reward!');
            } else {
                toast.success('✓ Stamp added successfully!');
            }
        } catch (err: any) {
            console.error('Add point error:', err);
            toast.error('Failed to add point');
        } finally {
            setIsProcessing(false);
        }
    };

    const resetScan = () => {
        setScannedUser(null);
        setScannerInitialized(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-[#1a1a1a] text-white border-b border-gray-800 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/admin/orders')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                    </button>
                    <h1 className="text-xl font-bold">QR Scanner</h1>
                    <span className="bg-[#B88A68] text-white text-xs px-2 py-1 rounded font-bold">ADMIN</span>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-6 py-8">
                {!scannedUser ? (
                    /* Scanner View */
                    <>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Camera className="w-6 h-6 text-[#B88A68]" />
                                <h2 className="text-2xl font-bold text-gray-900">Scan Customer QR Code</h2>
                            </div>
                            <p className="text-gray-600 mb-6">
                                Ask the customer to show their rewards QR code, then scan it to add points.
                            </p>

                            <div id="qr-reader" className="rounded-xl overflow-hidden"></div>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                            <p className="text-sm text-blue-800">
                                <strong>Note:</strong> Make sure the customer's QR code is clearly visible in the camera frame.
                            </p>
                        </div>
                    </>
                ) : (
                    /* User Details View */
                    <>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                            <div className="flex items-center gap-3 mb-6">
                                <UserCheck className="w-6 h-6 text-green-600" />
                                <h2 className="text-2xl font-bold text-gray-900">Customer Found</h2>
                            </div>

                            {/* User Info */}
                            <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                <p className="text-sm text-gray-600 mb-1">Name</p>
                                <p className="font-semibold text-gray-900">
                                    {scannedUser.firstName || scannedUser.lastName
                                        ? `${scannedUser.firstName || ''} ${scannedUser.lastName || ''}`.trim()
                                        : 'N/A'}
                                </p>
                                <p className="text-sm text-gray-600 mt-3 mb-1">Email</p>
                                <p className="font-semibold text-gray-900">{scannedUser.email}</p>
                                {scannedUser.lastVisit && (
                                    <>
                                        <p className="text-sm text-gray-600 mt-3 mb-1">Last Visit</p>
                                        <p className="font-semibold text-gray-900">
                                            {new Date(scannedUser.lastVisit).toLocaleDateString()} at {new Date(scannedUser.lastVisit).toLocaleTimeString()}
                                        </p>
                                    </>
                                )}
                            </div>

                            {/* Stamps & Rewards */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                                    <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                                    <p className="text-3xl font-bold text-blue-600">{scannedUser.stamps}</p>
                                    <p className="text-sm text-blue-800 font-medium">Stamps</p>
                                </div>
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                                    <Gift className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                                    <p className="text-3xl font-bold text-amber-600">{scannedUser.pending_reward ? '1' : '0'}</p>
                                    <p className="text-sm text-amber-800 font-medium">Pending Reward</p>
                                </div>
                            </div>

                            {/* Warnings */}
                            {/* Warnings */}
                            {scannedUser.pending_reward && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                                    <Gift className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5 animate-bounce" />
                                    <div>
                                        <p className="font-bold text-amber-900 text-lg">Reward Available!</p>
                                        <p className="text-amber-800">
                                            User has a pending reward. Redeem it now?
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            {/* Actions */}
                            <div className="flex flex-col gap-3">
                                {scannedUser.pending_reward ? (
                                    <button
                                        onClick={redeemReward}
                                        disabled={isProcessing}
                                        className="w-full px-6 py-4 bg-amber-600 text-white text-lg font-bold rounded-xl hover:bg-amber-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Gift className="w-6 h-6" />
                                                Redeem Reward
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <button
                                        onClick={addStamp}
                                        disabled={isProcessing}
                                        className="w-full px-6 py-4 bg-[#B88A68] text-white text-lg font-bold rounded-xl hover:bg-[#A67958] transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-6 h-6" />
                                                Add 1 Stamp
                                            </>
                                        )}
                                    </button>
                                )}

                                <button
                                    onClick={resetScan}
                                    className="w-full px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Scan Next Customer
                                </button>
                            </div>
                        </div>

                        {/* Success Message */}
                        {scannedUser.stamps === 0 && scannedUser.pending_reward && (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                                <p className="text-green-800 font-medium">
                                    Customer earned a reward! Stamps have been converted.
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
