import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { LoyaltyCard } from './LoyaltyCard';
import { useAuth } from '../context/AuthContext';
import { getUserRewards, UserRewards } from '../lib/rewards';
import { Coffee, AlertCircle } from 'lucide-react';

export function RewardsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [rewards, setRewards] = useState<UserRewards | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRewards() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const data = await getUserRewards(user.id);
        setRewards(data);
      } catch (err) {
        setError('Failed to load rewards');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchRewards();
    }
  }, [user, authLoading]);

  // Generate QR code value (user ID for staff to scan)
  const qrValue = user ? `cloudcafe:${user.id}` : '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16">
      <div className="max-w-6xl mx-auto px-6">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Cloud Cafe Rewards
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Earn a free drink every 10 purchases. Track your progress and enjoy your rewards!
          </p>
        </div>

        {/* Auth Check */}
        {authLoading || loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#B88A68]"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : !isAuthenticated ? (
          /* Not Logged In */
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#B88A68] rounded-full mb-4">
              <Coffee className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign In to View Your Rewards</h2>
            <p className="text-gray-600 mb-6">
              Sign in to see your loyalty card, collect stamps, and earn free drinks!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signin"
                className="px-6 py-3 bg-[#B88A68] text-white font-semibold rounded-full hover:bg-[#A67958] transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-6 py-3 border-2 border-[#B88A68] text-[#B88A68] font-semibold rounded-full hover:bg-[#B88A68]/10 transition-colors"
              >
                Join Now
              </Link>
            </div>
          </div>
        ) : error ? (
          /* Error State */
          <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-2xl p-6 text-center mb-16">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-700">{error}</p>
          </div>
        ) : (
          /* Logged In - Show QR Code and Loyalty Card */
          <>
            {/* Pending Reward Alert */}
            {rewards?.pending_reward && (
              <div className="max-w-md mx-auto bg-yellow-50 border border-yellow-300 rounded-2xl p-6 text-center mb-8">
                <span className="text-4xl mb-2 block">🎉</span>
                <h3 className="text-xl font-bold text-yellow-800 mb-2">Free Drink Ready!</h3>
                <p className="text-yellow-700">
                  Show this to staff to redeem your free drink. You cannot earn more stamps until redeemed.
                </p>
              </div>
            )}

            {/* QR Code Section */}
            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 text-center mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Your Rewards QR Code</h2>
              <p className="text-gray-600 mb-6 text-sm">
                Show this to staff when making a purchase to earn stamps
              </p>
              <div className="bg-white p-4 rounded-xl inline-block shadow-inner border border-gray-100">
                <QRCodeSVG
                  value={qrValue}
                  size={180}
                  level="M"
                  includeMargin={true}
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
              <p className="mt-4 text-xs text-gray-400">
                {user?.email}
              </p>
            </div>

            {/* Loyalty Card */}
            <div className="mb-16">
              <LoyaltyCard
                currentStamps={rewards?.stamps ?? 0}
                target={10}
                pendingReward={rewards?.pending_reward ?? false}
              />
            </div>
          </>
        )}

        {/* How It Works Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-[#B88A68] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">☕</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">1. Buy Coffee</h3>
              <p className="text-gray-600">
                Purchase any drink at Cloud Cafe and show your QR code
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-[#B88A68] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📱</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">2. Collect Stamps</h3>
              <p className="text-gray-600">
                Staff will scan your code to add stamps to your card
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-[#B88A68] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🎁</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">3. Get Rewards</h3>
              <p className="text-gray-600">
                Redeem your free drink after collecting 10 stamps
              </p>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-16 grid md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-[#B88A68] to-[#A67958] text-white rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-4">Member Exclusive Offers</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-xl">✓</span>
                <span>Birthday rewards and special surprises</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-xl">✓</span>
                <span>Early access to new menu items</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-xl">✓</span>
                <span>Exclusive member-only events</span>
              </li>
            </ul>
          </div>

          {!isAuthenticated && (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border border-gray-200">
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Join Today</h3>
              <p className="text-gray-600 mb-6">
                Sign up now to start earning rewards and enjoy exclusive benefits at Cloud Cafe.
              </p>
              <Link
                to="/register"
                className="block w-full px-6 py-3 bg-[#B88A68] text-white text-center rounded-full font-semibold hover:bg-[#A67958] transition-colors"
              >
                Sign Up Now
              </Link>
            </div>
          )}

          {isAuthenticated && (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border border-gray-200">
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Your Progress</h3>
              <p className="text-gray-600 mb-4">
                You have <span className="font-bold text-[#B88A68]">{rewards?.stamps ?? 0}</span> stamps.
                {rewards?.pending_reward
                  ? " Redeem your free drink!"
                  : ` ${10 - (rewards?.stamps ?? 0)} more to go!`
                }
              </p>
              <Link
                to="/menu"
                className="block w-full px-6 py-3 bg-[#B88A68] text-white text-center rounded-full font-semibold hover:bg-[#A67958] transition-colors"
              >
                Order Now
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}