import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Home } from './components/Home';
import { MenuPage } from './components/MenuPage';
import { RewardsPage } from './components/RewardsPage';
import { SignInPage } from './components/SignInPage';
import { RegisterPage } from './components/RegisterPage';
import { CartPage } from './components/CartPage';
import { VerifiedPage } from './components/VerifiedPage';
import { StaffScanPage } from './components/StaffScanPage';
import { OrderHistoryPage } from './components/OrderHistoryPage';
import { AdminOrdersPage } from './components/AdminOrdersPage';
import { AdminScanPage } from './components/AdminScanPage';
import { FloatingCartButton } from './components/FloatingCartButton';
import { AccountSettingsPage } from './components/AccountSettingsPage';
import { GalleryPage } from './components/GalleryPage';
import { Footer } from './components/Footer';
import {
  PaymentSuccessPage,
  PaymentFailurePage,
  PaymentCancelPage,
  PaymentPendingPage,
  PaymentErrorPage
} from './components/PaymentResultPage';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { OrderNotificationProvider } from './context/OrderNotificationContext';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <OrderNotificationProvider>
          <Router>
            <div className="min-h-screen bg-white">
              <Navigation />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/menu" element={<MenuPage />} />
                <Route path="/rewards" element={<RewardsPage />} />
                <Route path="/signin" element={<SignInPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/verified" element={<VerifiedPage />} />
                <Route path="/staff" element={<StaffScanPage />} />
                <Route path="/orders" element={<OrderHistoryPage />} />
                <Route path="/account" element={<AccountSettingsPage />} />
                <Route path="/gallery" element={<GalleryPage />} />
                <Route path="/admin/orders" element={<AdminOrdersPage />} />
                <Route path="/admin/scan" element={<AdminScanPage />} />
                {/* Payment Result Pages */}
                <Route path="/payment/success" element={<PaymentSuccessPage />} />
                <Route path="/payment/failure" element={<PaymentFailurePage />} />
                <Route path="/payment/cancel" element={<PaymentCancelPage />} />
                <Route path="/payment/pending" element={<PaymentPendingPage />} />
                <Route path="/payment/error" element={<PaymentErrorPage />} />
              </Routes>
              <FloatingCartButton />
              <Footer />
            </div>
          </Router>
          <Toaster position="top-right" richColors closeButton />
        </OrderNotificationProvider>
      </CartProvider>
    </AuthProvider>
  );
}