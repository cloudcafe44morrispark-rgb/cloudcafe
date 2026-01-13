import { MapPin, ShoppingCart, Award, Menu, X, User as UserIcon, Package, LogOut, Settings, Camera } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useOrderNotifications } from '../context/OrderNotificationContext';
import logo from '../../assets/6b0beed8e6be51f5a6110633cc5a166d3fbb7d3a.png';

export function Navigation() {
  const location = useLocation();
  const { cartCount, userStamps, pendingReward } = useCart();
  const { user, logout, isAdmin } = useAuth();
  const { unreadCount } = useOrderNotifications();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const isAdminRoute = location.pathname.startsWith('/admin');

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
    navigate('/');
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