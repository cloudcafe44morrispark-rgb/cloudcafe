import { MapPin, ShoppingCart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useOrderNotifications } from '../context/OrderNotificationContext';
import logo from '../../assets/6b0beed8e6be51f5a6110633cc5a166d3fbb7d3a.png';

export function Navigation() {
  const location = useLocation();
  const { cartCount } = useCart();
  const { user, logout } = useAuth();
  const { unreadCount } = useOrderNotifications();

  // Check if user is admin
  const adminEmails = ['demouser2026@test.com', 'admin@cloudcafe.com'];
  const isAdmin = user && adminEmails.includes(user.email || '');

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
            <div className="hidden md:flex items-center gap-6">
              <Link
                to="/menu"
                className={`text-sm font-bold tracking-wider transition-colors uppercase ${location.pathname === '/menu' ? 'text-[#B88A68]' : 'hover:text-[#B88A68]'
                  }`}
              >
                Menu
              </Link>
              <Link
                to="/rewards"
                className={`text-sm font-bold tracking-wider transition-colors uppercase ${location.pathname === '/rewards' ? 'text-[#B88A68]' : 'hover:text-[#B88A68]'
                  }`}
              >
                Rewards
              </Link>
            </div>
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

            {/* Mobile Menu & Rewards Links */}
            <div className="flex md:hidden items-center gap-3">
              <Link
                to="/menu"
                className={`text-sm font-bold tracking-wider transition-colors uppercase ${location.pathname === '/menu' ? 'text-[#B88A68]' : 'hover:text-[#B88A68]'
                  }`}
              >
                Menu
              </Link>
              <Link
                to="/rewards"
                className={`text-sm font-bold tracking-wider transition-colors uppercase ${location.pathname === '/rewards' ? 'text-[#B88A68]' : 'hover:text-[#B88A68]'
                  }`}
              >
                Rewards
              </Link>
            </div>

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

            {/* Cart Icon */}
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

            {/* Auth buttons */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Link
                    to="/orders"
                    className="hidden sm:block text-sm font-semibold text-gray-700 hover:text-[#B88A68] transition-colors"
                  >
                    My Orders
                  </Link>
                  <button
                    onClick={() => logout()}
                    className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold border border-black rounded-full hover:bg-gray-50 transition-colors"
                  >
                    Sign out
                  </button>
                </>
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
    </nav>
  );
}