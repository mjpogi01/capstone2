import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faRotateRight, faTrash, faUsers, faUserShield } from '@fortawesome/free-solid-svg-icons';
import Sidebar from '../../components/admin/Sidebar';
import '../admin/AdminDashboard.css';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import './Accounts.css';
import './admin-shared.css';

const Accounts = () => {
  const { user } = useAuth();
  const [adminAccounts, setAdminAccounts] = useState([]);
  const [customerAccounts, setCustomerAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [forceUpdate, setForceUpdate] = useState(0);

  const isOwner = user?.user_metadata?.role === 'owner';

  // Fetch all accounts
  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No active session');
        setLoading(false);
        return;
      }

      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      };

      // Fetch admin accounts (only if owner)
      if (isOwner) {
        const adminResponse = await fetch(`http://localhost:4000/api/admin/users?t=${Date.now()}`, {
          headers: {
            ...headers,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (adminResponse.ok) {
          const adminData = await adminResponse.json();
          console.log('📋 FETCHED ADMIN ACCOUNTS:', adminData.map(acc => ({ id: acc.id, email: acc.email, name: acc.name })));
          setAdminAccounts(adminData);
        }
      }

      // Fetch customer accounts
      const customerResponse = await fetch(`http://localhost:4000/api/admin/customers?t=${Date.now()}`, {
        headers: {
          ...headers,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (customerResponse.ok) {
        const customerData = await customerResponse.json();
        console.log('📋 FETCHED CUSTOMER ACCOUNTS:', customerData.map(acc => ({ id: acc.id, email: acc.email, name: acc.name })));
        setCustomerAccounts(customerData);
      }

    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  }, [isOwner]);

  // Delete admin account
  const handleDeleteAdmin = async (adminId) => {
    // Find the account being deleted for logging
    const accountToDelete = adminAccounts.find(acc => acc.id === adminId);
    console.log('🗑️ DELETING ADMIN ACCOUNT:', {
      id: adminId,
      name: accountToDelete?.name,
      email: accountToDelete?.email,
      role: accountToDelete?.role
    });
    
    if (window.confirm('Are you sure you want to delete this admin account?')) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          alert('No active session. Please log in again.');
          return;
        }

        console.log('📤 Sending delete request for admin ID:', adminId);
        const response = await fetch(`http://localhost:4000/api/delete/user/${adminId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📥 Delete response status:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ Delete successful:', result);
          alert('Admin account deleted successfully!');
          
          console.log('🔄 BEFORE REFRESH - Current admin accounts:', adminAccounts.map(acc => ({ id: acc.id, email: acc.email, name: acc.name })));
          
          // Wait longer for Supabase to propagate changes
          console.log('⏳ Waiting for Supabase propagation (5 seconds)...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Simple refresh - just fetch again
          await fetchAccounts();
          
          // Force React to re-render the table
          setForceUpdate(prev => prev + 1);
          
          console.log('🔄 AFTER REFRESH - New admin accounts:', adminAccounts.map(acc => ({ id: acc.id, email: acc.email, name: acc.name })));
        } else {
          const errorData = await response.json();
          console.log('❌ Delete failed:', errorData);
          alert(`Error: ${errorData.error || 'Failed to delete admin account'}`);
        }
      } catch (error) {
        console.error('❌ Error deleting admin:', error);
        alert(`Error deleting admin account: ${error.message}`);
      }
    }
  };

  // Delete customer account
  const handleDeleteCustomer = async (customerId) => {
    // Find the account being deleted for logging
    const accountToDelete = customerAccounts.find(acc => acc.id === customerId);
    console.log('🗑️ DELETING CUSTOMER ACCOUNT:', {
      id: customerId,
      name: accountToDelete?.name,
      email: accountToDelete?.email
    });
    
    if (window.confirm('Are you sure you want to delete this customer account?')) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          alert('No active session. Please log in again.');
          return;
        }

        console.log('📤 Sending delete request for customer ID:', customerId);
        const response = await fetch(`http://localhost:4000/api/delete/user/${customerId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📥 Delete response status:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ Delete successful:', result);
          alert('Customer account deleted successfully!');
          
          console.log('🔄 BEFORE REFRESH - Current customer accounts:', customerAccounts.map(acc => ({ id: acc.id, email: acc.email, name: acc.name })));
          
          // Wait longer for Supabase to propagate changes
          console.log('⏳ Waiting for Supabase propagation (5 seconds)...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Simple refresh - just fetch again
          await fetchAccounts();
          
          // Force React to re-render the table
          setForceUpdate(prev => prev + 1);
          
          console.log('🔄 AFTER REFRESH - New customer accounts:', customerAccounts.map(acc => ({ id: acc.id, email: acc.email, name: acc.name })));
        } else {
          const errorData = await response.json();
          console.log('❌ Delete failed:', errorData);
          alert(`Error: ${errorData.error || 'Failed to delete customer account'}`);
        }
      } catch (error) {
        console.error('❌ Error deleting customer:', error);
        alert(`Error deleting customer account: ${error.message}`);
      }
    }
  };

  // Manual refresh button
  const handleRefresh = () => {
    fetchAccounts();
  };

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Filter accounts based on search terms
  const filteredAdminAccounts = adminAccounts.filter(admin =>
    admin.name?.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
    admin.email?.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
    admin.role?.toLowerCase().includes(adminSearchTerm.toLowerCase())
  );

  const filteredCustomerAccounts = customerAccounts.filter(customer =>
    customer.name?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="admin-dashboard">
        <Sidebar 
          activePage={'accounts'} 
          setActivePage={() => {}} 
        />
        <div className="admin-main-content">
          <div className="accounts-container">
            <div className="loading">Loading accounts...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <Sidebar 
        activePage={'accounts'} 
        setActivePage={() => {}} 
      />
      <div className="admin-main-content">
    <div className="accounts-container">
      <div className="accounts-header">
        <h1>Account Management</h1>
        <button onClick={handleRefresh} className="refresh-btn">
          <FontAwesomeIcon icon={faRotateRight} />
          Refresh
        </button>
      </div>

      {/* Admin Accounts Section - Only for Owners */}
      {isOwner && (
        <div className="accounts-section">
          <div className="section-header">
            <h2>
              <FontAwesomeIcon icon={faUserShield} />
              Admin Accounts ({filteredAdminAccounts.length})
            </h2>
            <div className="accounts-search-container">
              <input
                type="text"
                placeholder="Search admin accounts..."
                value={adminSearchTerm}
                onChange={(e) => setAdminSearchTerm(e.target.value)}
                className="accounts-search-input"
              />
              <FontAwesomeIcon icon={faSearch} className="accounts-search-icon" />
            </div>
          </div>

          <div className="accounts-table-container">
            <table className="accounts-table admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email Address</th>
                  <th>Role</th>
                  <th>Branch</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdminAccounts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="no-data">
                      {adminSearchTerm ? 'No admin accounts match your search.' : 'No admin accounts found.'}
                    </td>
                  </tr>
                ) : (
                  filteredAdminAccounts.map((admin) => (
                    <tr key={`admin-${admin.id}-${forceUpdate}`}>
                      <td>{admin.name || 'N/A'}</td>
                      <td>{admin.email || 'N/A'}</td>
                      <td>
                        <span className={`role-badge ${admin.role}`}>
                          {admin.role || 'customer'}
                        </span>
                      </td>
                      <td>{admin.branch_name || 'N/A'}</td>
                      <td>
                        <button
                          onClick={() => handleDeleteAdmin(admin.id)}
                          className="delete-btn"
                          title="Delete Admin Account"
                          aria-label="Delete Admin Account"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Accounts Section */}
      <div className="accounts-section">
        <div className="section-header">
          <h2>
            <FontAwesomeIcon icon={faUsers} />
            Customer Accounts ({filteredCustomerAccounts.length})
          </h2>
          <div className="accounts-search-container">
            <input
              type="text"
              placeholder="Search customer accounts..."
              value={customerSearchTerm}
              onChange={(e) => setCustomerSearchTerm(e.target.value)}
              className="accounts-search-input"
            />
            <FontAwesomeIcon icon={faSearch} className="accounts-search-icon" />
          </div>
        </div>

        <div className="accounts-table-container">
          <table className="accounts-table customer-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Contact Number</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomerAccounts.length === 0 ? (
                <tr>
                  <td colSpan="4" className="no-data">
                    {customerSearchTerm ? 'No customer accounts match your search.' : 'No customer accounts found.'}
                  </td>
                </tr>
              ) : (
                filteredCustomerAccounts.map((customer) => (
                  <tr key={`customer-${customer.id}-${forceUpdate}`}>
                    <td>{customer.name || 'N/A'}</td>
                    <td>{customer.email || 'N/A'}</td>
                    <td>{customer.contact_number || 'N/A'}</td>
                    <td>
                      <button
                        onClick={() => handleDeleteCustomer(customer.id)}
                        className="delete-btn"
                        title="Delete Customer Account"
                        aria-label="Delete Customer Account"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                        Delete
                      </button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Accounts;