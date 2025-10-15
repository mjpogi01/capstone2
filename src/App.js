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
import AdminDashboard from './pages/admin/AdminDashboard';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import Inventory from './pages/admin/Inventory';
import Accounts from './pages/admin/Accounts';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRedirect from './components/RoleRedirect';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ModalProvider } from './contexts/ModalContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';

const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isOwnerRoute = location.pathname.startsWith('/owner');
  const isInventoryRoute = location.pathname.startsWith('/inventory');

  return (
    <>
      <RoleRedirect />
      {!isAdminRoute && !isOwnerRoute && !isInventoryRoute && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/highlights" element={<Highlights />} />
        <Route path="/branches" element={<Branches />} />
        <Route path="/faqs" element={<FAQs />} />
        <Route path="/contacts" element={<Contacts />} />
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
      </Routes>
      {!isAdminRoute && !isOwnerRoute && !isInventoryRoute && <Footer />}
    </>
  );
};

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <ModalProvider>
          <CartProvider>
            <WishlistProvider>
              <Router>
                <AppContent />
              </Router>
            </WishlistProvider>
          </CartProvider>
        </ModalProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
