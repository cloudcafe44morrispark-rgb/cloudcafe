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
import { Footer } from './components/Footer';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
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
              <Route path="/admin/orders" element={<AdminOrdersPage />} />
            </Routes>
            <Footer />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}