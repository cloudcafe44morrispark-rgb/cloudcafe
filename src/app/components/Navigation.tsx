import { MapPin, ShoppingCart, Award, Menu, X, User as UserIcon, Package, LogOut, Settings, Camera, Crown, Trophy, Medal } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useOrderNotifications } from '../context/OrderNotificationContext';
import { getTop5ThisWeek, getUserRank, LeaderboardEntry, UserRank } from '../lib/rewards';
import logo from '../../assets/6b0beed8e6be51f5a6110633cc5a166d3fbb7d3a.png';

export function Navigation() {
  const location = useLocation();
  const { cartCount, userStamps, pendingReward } = useCart();
  const { user, logout, isAdmin } = useAuth();
  const { unreadCount } = useOrderNotifications();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [topUsers, setTopUsers] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<UserRank>({ rank: null, points: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const leaderboardRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const isAdminRoute = location.pathname.startsWith('/admin');

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (leaderboardRef.current && !leaderboardRef.current.contains(event.target as Node)) {
        setIsLeaderboardOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch leaderboard data
  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const [top5Data, userRankData] = await Promise.all([
          getTop5ThisWeek(),
          user ? getUserRank(user.id) : Promise.resolve({ rank: null, points: 0 })
        ]);
        setTopUsers(top5Data);
        if (user) {
          setUserRank(userRankData);
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      }
    }
    fetchLeaderboard();
    // Refresh every 30 seconds
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
    navigate('/');
  };

  // Get rank icon for leaderboard
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 2:
        return <Trophy className="w-4 h-4 text-gray-400" />;
      case 3:
        return <Medal className="w-4 h-4 text-amber-600" />;
      default:
        return <span className="w-4 h-4 flex items-center justify-center text-xs font-bold text-gray-500">#{rank}</span>;
    }
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Left: Logo and Menu Items */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <img src={logo} alt="Cloud Cafe" className="w-14 h-14 object-contain" />
            </Link>

            {/* Desktop Menu Items */}
            {!isAdminRoute && (
              <div className="hidden md:flex items-center gap-6">
                <Link
                  to="/menu"
                  className={`text-sm font-bold tracking-wider transition-colors uppercase ${location.pathname === '/menu' ? 'text-[#B88A68]' : 'hover:text-[#B88A68]'
                    }`}
                >
                  Menu
                </Link>
                <Link
                  to="/gallery"
                  className={`text-sm font-bold tracking-wider transition-colors uppercase ${location.pathname === '/gallery' ? 'text-[#B88A68]' : 'hover:text-[#B88A68]'
                    }`}
                >
                  Gallery
                </Link>
              </div>
            )}
          </div>

          {/* Right: Find Us, Sign in, Join now */}
          <div className="flex items-center gap-4">
            {/* Desktop Find Us Button */}
            <a
              href="https://maps.app.goo.gl/aq1tUzUN4q4EaTH69"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-2 hover:text-[#B88A68] transition-colors"
            >
              <MapPin className="w-5 h-5" />
              <span className="text-sm font-semibold">Find Us</span>
            </a>

            {/* Mobile Menu Link */}
            {!isAdminRoute && (
              <div className="flex md:hidden items-center gap-3">
                <Link
                  to="/menu"
                  className={`text-xs font-bold tracking-wider transition-colors uppercase ${location.pathname === '/menu' ? 'text-[#B88A68]' : 'hover:text-[#B88A68]'
                    }`}
                >
                  Menu
                </Link>
                <Link
                  to="/gallery"
                  className={`text-xs font-bold tracking-wider transition-colors uppercase ${location.pathname === '/gallery' ? 'text-[#B88A68]' : 'hover:text-[#B88A68]'
                    }`}
                >
                  Gallery
                </Link>
              </div>
            )}

            {/* Admin Notification Badge */}
            {isAdmin && unreadCount > 0 && (
              <Link
                to="/admin/orders"
                className="relative p-2 hover:text-[#B88A68] transition-colors animate-pulse"
                title={`${unreadCount} unread order${unreadCount > 1 ? 's' : ''}`}
              >
                <div className="relative">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                </div>
              </Link>
            )}

            {/* Admin QR Scanner Button */}
            {isAdmin && (
              <Link
                to="/admin/scan"
                className="p-2 hover:text-[#B88A68] transition-colors bg-gray-100 rounded-full hover:bg-gray-200"
                title="Scan Customer QR"
              >
                <Camera className="w-6 h-6" />
              </Link>
            )}

            {/* Rewards Badge - always visible, redirect to register if not logged in */}
            {!isAdminRoute && (
              <Link
                to={user ? "/rewards" : "/register"}
                className="relative p-2 hover:text-[#B88A68] transition-colors"
                title={!user ? "Join to collect stamps!" : pendingReward ? "You have a free drink!" : `${userStamps} stamp${userStamps > 1 ? 's' : ''}`}
              >
                <Award className="w-6 h-6" />
                {user && pendingReward ? (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    1
                  </span>
                ) : user && userStamps > 0 ? (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {userStamps}
                  </span>
                ) : !user && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gray-400 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    0
                  </span>
                )}
              </Link>
            )}

            {/* Leaderboard Crown - King of Coffee */}
            {!isAdminRoute && (
              <div className="relative" ref={leaderboardRef}>
                <button
                  onClick={() => setIsLeaderboardOpen(!isLeaderboardOpen)}
                  className="relative p-2 hover:text-[#B88A68] transition-colors"
                  title={user && userRank.rank ? `Your rank: #${userRank.rank}` : "King of Coffee Leaderboard"}
                >
                  <Crown className="w-6 h-6" />
                  {user && userRank.rank && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {userRank.rank > 99 ? '99+' : userRank.rank}
                    </span>
                  )}
                  {!user && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gray-400 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      ?
                    </span>
                  )}
                </button>

                {/* Leaderboard Dropdown */}
                {isLeaderboardOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 py-3 animate-in fade-in slide-in-from-top-2 z-50">
                    {/* Header */}
                    <div className="px-4 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Crown className="w-5 h-5 text-yellow-500" />
                        <h3 className="text-lg font-bold text-gray-900">King of Coffee</h3>
                      </div>
                      <p className="text-xs text-gray-500">Weekly Leaderboard</p>
                    </div>

                    {/* User's Rank (if logged in) */}
                    {user && userRank.rank && (
                      <div className="px-4 py-3 bg-gradient-to-r from-[#B88A68]/10 to-transparent border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#B88A68] rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-bold">#{userRank.rank}</span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">Your Rank</p>
                              <p className="text-xs text-gray-500">{userRank.points} points</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Top 5 List */}
                    <div className="py-2">
                      {topUsers.length === 0 ? (
                        <div className="px-4 py-6 text-center">
                          <Crown className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No rankings yet</p>
                          <p className="text-xs text-gray-400">Be the first!</p>
                        </div>
                      ) : (
                        topUsers.map((entry, index) => {
                          const isCurrentUser = user?.id === entry.user_id;
                          return (
                            <div
                              key={entry.user_id}
                              className={`px-4 py-2.5 hover:bg-gray-50 transition-colors ${
                                isCurrentUser ? 'bg-[#B88A68]/5' : ''
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                                  {getRankIcon(entry.rank)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                      {entry.first_name} {entry.last_name}
                                    </p>
                                    {isCurrentUser && (
                                      <span className="px-1.5 py-0.5 bg-[#B88A68] text-white text-xs font-semibold rounded">
                                        You
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500">{entry.points} points</p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-2">
                        Earn points by collecting stamps and redeeming rewards
                      </p>
                      {!user ? (
                        <Link
                          to="/signin"
                          className="block w-full px-3 py-2 bg-[#B88A68] text-white text-sm text-center rounded-lg font-semibold hover:bg-[#A67958] transition-colors"
                          onClick={() => setIsLeaderboardOpen(false)}
                        >
                          Join Competition
                        </Link>
                      ) : (
                        <Link
                          to="/rewards"
                          className="block w-full px-3 py-2 bg-[#B88A68] text-white text-sm text-center rounded-lg font-semibold hover:bg-[#A67958] transition-colors"
                          onClick={() => setIsLeaderboardOpen(false)}
                        >
                          View My Rewards
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cart Icon */}
            {!isAdminRoute && (
              <Link
                to="/cart"
                className="relative p-2 hover:text-[#B88A68] transition-colors"
              >
                <ShoppingCart className="w-6 h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Auth buttons */}
            <div className="flex items-center gap-3">
              {user ? (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <Menu className="w-6 h-6 text-gray-700" />
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2 z-50">
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {user.user_metadata?.first_name
                            ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`
                            : 'User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <Link
                          to="/account"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Settings className="w-4 h-4" />
                          Account Settings
                        </Link>
                        <Link
                          to="/orders"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Package className="w-4 h-4" />
                          My Orders
                        </Link>
                        {isAdmin && (
                          <Link
                            to="/admin/orders"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <UserIcon className="w-4 h-4" />
                            Admin Dashboard
                          </Link>
                        )}
                      </div>

                      {/* Sign Out */}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/signin"
                  className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold border border-black rounded-full hover:bg-gray-50 transition-colors"
                >
                  Sign in
                </Link>
              )}
              {!user && (
                <Link
                  to="/register"
                  className="hidden sm:block px-4 py-1.5 text-sm font-semibold bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
                >
                  Join now
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav >
  );
}