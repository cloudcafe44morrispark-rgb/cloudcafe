import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, UserCheck, TrendingUp, Gift, ArrowLeft, CheckCircle, AlertCircle, Play, Square } from 'lucide-react';
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
    const [isScanning, setIsScanning] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);

    // Check admin permission - wait for auth to finish loading
    useEffect(() => {
        if (isLoading) return;
        if (!isAdmin) {
            toast.error('Admin access only');
            navigate('/');
        }
    }, [isAdmin, isLoading, navigate]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (scannerRef.current && isScanning) {
                scannerRef.current.stop().catch(console.error);
            }
        };
    }, [isScanning]);

    const startScanning = async () => {
        setCameraError(null);

        try {
            if (!scannerRef.current) {
                scannerRef.current = new Html5Qrcode('qr-reader');
            }

            await scannerRef.current.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 280, height: 280 },
                },
                onScanSuccess,
                (errorMessage) => {
                    // Ignore common scan errors
                }
            );

            setIsScanning(true);
            toast.success('Camera started');
        } catch (err: any) {
            console.error('Camera error:', err);
            setCameraError(err.message || 'Failed to start camera');
            toast.error('Could not access camera');
        }
    };

    const stopScanning = async () => {
        if (scannerRef.current && isScanning) {
            try {
                await scannerRef.current.stop();
                setIsScanning(false);
            } catch (err) {
                console.error('Error stopping scanner:', err);
            }
        }
    };

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

    const handleScan = async (scannedValue: string) => {
        if (isProcessing) return;
        setIsProcessing(true);

        // Stop scanning after successful read
        await stopScanning();

        try {
            // Parse QR code format: "cloudcafe:userId"
            let userId = scannedValue;
            if (scannedValue.startsWith('cloudcafe:')) {
                userId = scannedValue.replace('cloudcafe:', '');
            }

            console.log('Parsed userId:', userId);

            // Validate userId format (should be a UUID)
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(userId)) {
                throw new Error('Invalid QR code format');
            }

            // Fetch or create user rewards
            let { data: rewardsData, error: rewardsError } = await supabase
                .from('user_rewards')
                .select('stamps, pending_reward, updated_at')
                .eq('user_id', userId)
                .single();

            if (rewardsError && rewardsError.code === 'PGRST116') {
                // Create new rewards record for this user
                const { data: newRewards, error: createError } = await supabase
                    .from('user_rewards')
                    .insert({ user_id: userId, stamps: 0, pending_reward: false })
                    .select()
                    .single();

                if (createError) throw new Error('Failed to create rewards record');
                rewardsData = newRewards;
            } else if (rewardsError) {
                throw new Error('Failed to fetch user rewards');
            }

            if (rewardsData) {
                setScannedUser({
                    id: userId,
                    email: `User ID: ${userId.slice(0, 8)}...`,
                    firstName: 'Customer',
                    lastName: '',
                    stamps: rewardsData.stamps,
                    pending_reward: rewardsData.pending_reward,
                    lastVisit: rewardsData.updated_at
                });
                toast.success('Customer found!');
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
            console.error('Add stamp error:', err);
            toast.error('Failed to add stamp');
        } finally {
            setIsProcessing(false);
        }
    };

    const resetScan = async () => {
        setScannedUser(null);
        await stopScanning();
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

                            {/* Camera Error */}
                            {cameraError && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-red-800">Camera Error</p>
                                        <p className="text-sm text-red-600">{cameraError}</p>
                                    </div>
                                </div>
                            )}

                            {/* Start/Stop Camera Buttons */}
                            {!isScanning ? (
                                <button
                                    onClick={startScanning}
                                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#B88A68] text-white font-bold text-lg rounded-xl hover:bg-[#A67958] transition-colors mb-4"
                                >
                                    <Play className="w-6 h-6" />
                                    Start Camera
                                </button>
                            ) : (
                                <button
                                    onClick={stopScanning}
                                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-red-500 text-white font-bold text-lg rounded-xl hover:bg-red-600 transition-colors mb-4"
                                >
                                    <Square className="w-6 h-6" />
                                    Stop Camera
                                </button>
                            )}

                            {/* QR Reader Container */}
                            <div id="qr-reader" className="rounded-xl overflow-hidden bg-gray-100 min-h-[300px]"></div>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                            <p className="text-sm text-blue-800">
                                <strong>Tip:</strong> Hold the camera steady and ensure good lighting. The QR code should be clearly visible within the frame.
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
