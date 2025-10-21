import React from 'react';
import './App.css';
import Header from './components/customer/Header';
import Footer from './components/customer/Footer';
import Branches from './components/customer/Branches';
import Home from './pages/customer/Home';
import About from './pages/customer/About';
import Highlights from './pages/customer/Highlights';
import FAQs from './pages/customer/FAQs';
import Contacts from './pages/customer/Contacts';
import Profile from './pages/customer/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import Inventory from './pages/admin/Inventory';
import Accounts from './pages/admin/Accounts';
import Orders from './pages/admin/Orders';
import WalkInOrders from './pages/admin/WalkInOrders';
import Analytics from './pages/admin/Analytics';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRedirect from './components/RoleRedirect';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ModalProvider } from './contexts/ModalContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { NotificationProvider } from './contexts/NotificationContext';
import NotificationContainer from './components/NotificationContainer';

const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/inventory');
  const isOwnerRoute = location.pathname.startsWith('/owner');

  return (
    <>
      <RoleRedirect />
      {!isAdminRoute && !isOwnerRoute && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/highlights" element={<Highlights />} />
        <Route path="/branches" element={<Branches />} />
        <Route path="/faqs" element={<FAQs />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/owner" 
          element={
            <ProtectedRoute requireOwner={true}>
              <OwnerDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/inventory" 
          element={
            <ProtectedRoute requireAdmin={true}>
              <Inventory />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/accounts" 
          element={
            <ProtectedRoute requireAdmin={true}>
              <Accounts />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/owner/accounts" 
          element={
            <ProtectedRoute requireOwner={true}>
              <Accounts />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/orders"
          element={
            <ProtectedRoute requireAdmin={true}>
              <Orders />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/walk-in-orders"
          element={
            <ProtectedRoute requireAdmin={true}>
              <WalkInOrders />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/owner/orders" 
          element={
            <ProtectedRoute requireOwner={true}>
              <Orders />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/owner/walk-in-orders"
          element={
            <ProtectedRoute requireOwner={true}>
              <WalkInOrders />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/analytics"
          element={
            <ProtectedRoute requireAdmin={true}>
              <Analytics />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/owner/analytics" 
          element={
            <ProtectedRoute requireOwner={true}>
              <Analytics />
            </ProtectedRoute>
          } 
        />
      </Routes>
      {!isAdminRoute && !isOwnerRoute && <Footer />}
    </>
  );
};

function App() {
  return (
    <div className="App">
      <NotificationProvider>
        <AuthProvider>
          <ModalProvider>
            <CartProvider>
              <WishlistProvider>
                <Router>
                  <AppContent />
                  <NotificationContainer />
                </Router>
              </WishlistProvider>
            </CartProvider>
          </ModalProvider>
        </AuthProvider>
      </NotificationProvider>
    </div>
  );
}

export default App;
