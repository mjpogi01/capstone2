import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faRotateRight, faTrash, faUsers, faUserShield, faPalette, faEdit, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
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
  const [artistAccounts, setArtistAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [artistSearchTerm, setArtistSearchTerm] = useState('');
  const [forceUpdate, setForceUpdate] = useState(0);
  const [editingArtist, setEditingArtist] = useState(null);
  const [editFormData, setEditFormData] = useState({
    artist_name: '',
    email: ''
  });

  const isOwner = user?.user_metadata?.role === 'owner';
  const [activeTab, setActiveTab] = useState(isOwner ? 'admin' : 'artist');

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

      // Fetch artist accounts
      const artistResponse = await fetch(`http://localhost:4000/api/admin/artists?t=${Date.now()}`, {
        headers: {
          ...headers,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (artistResponse.ok) {
        const artistData = await artistResponse.json();
        console.log('📋 FETCHED ARTIST ACCOUNTS:', artistData.map(acc => ({ id: acc.id, email: acc.email, artist_name: acc.artist_name })));
        setArtistAccounts(artistData);
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

  // Delete artist account
  const handleDeleteArtist = async (artistId) => {
    // Find the account being deleted for logging
    const accountToDelete = artistAccounts.find(acc => acc.id === artistId);
    console.log('🗑️ DELETING ARTIST ACCOUNT:', {
      id: artistId,
      artist_name: accountToDelete?.artist_name,
      email: accountToDelete?.email
    });
    
    if (window.confirm('Are you sure you want to delete this artist account?')) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          alert('No active session. Please log in again.');
          return;
        }

        console.log('📤 Sending delete request for artist ID:', artistId);
        const response = await fetch(`http://localhost:4000/api/admin/artists/${artistId}`, {
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
          alert('Artist account deleted successfully!');
          
          console.log('🔄 BEFORE REFRESH - Current artist accounts:', artistAccounts.map(acc => ({ id: acc.id, email: acc.email, artist_name: acc.artist_name })));
          
          // Wait longer for Supabase to propagate changes
          console.log('⏳ Waiting for Supabase propagation (5 seconds)...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Simple refresh - just fetch again
          await fetchAccounts();
          
          // Force React to re-render the table
          setForceUpdate(prev => prev + 1);
          
          console.log('🔄 AFTER REFRESH - New artist accounts:', artistAccounts.map(acc => ({ id: acc.id, email: acc.email, artist_name: acc.artist_name })));
        } else {
          const errorData = await response.json();
          console.log('❌ Delete failed:', errorData);
          alert(`Error: ${errorData.error || 'Failed to delete artist account'}`);
        }
      } catch (error) {
        console.error('❌ Error deleting artist:', error);
        alert(`Error deleting artist account: ${error.message}`);
      }
    }
  };

  // Handle artist edit
  const handleEditArtist = (artist) => {
    setEditingArtist(artist);
    setEditFormData({
      artist_name: artist.artist_name || '',
      email: artist.email || ''
    });
  };

  // Handle edit form changes
  const handleEditFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save artist edits
  const handleSaveArtist = async () => {
    if (!editingArtist) return;

    try {
      console.log('🔄 Starting artist update process...');
      console.log('👤 Current user role:', user?.user_metadata?.role);
      console.log('🎯 Is owner:', isOwner);
      console.log('📝 Edit form data:', editFormData);
      console.log('🎨 Editing artist:', editingArtist);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('No active session. Please log in again.');
        return;
      }

      console.log('🔑 Session found, access token length:', session.access_token?.length);

      const response = await fetch(`http://localhost:4000/api/admin/artists/${editingArtist.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editFormData)
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Update successful:', result);
        alert('Artist information updated successfully!');
        setEditingArtist(null);
        setEditFormData({ artist_name: '', email: '' });
        await fetchAccounts();
        setForceUpdate(prev => prev + 1);
      } else {
        const errorText = await response.text();
        console.error('❌ Update failed:', response.status, errorText);
        try {
          const errorData = JSON.parse(errorText);
          alert(`Error: ${errorData.error || 'Failed to update artist information'}`);
        } catch (parseError) {
          alert(`Error: ${response.status} - ${errorText}`);
        }
      }
    } catch (error) {
      console.error('❌ Error updating artist:', error);
      alert(`Error updating artist: ${error.message}`);
    }
  };

  // Cancel artist edit
  const handleCancelEdit = () => {
    setEditingArtist(null);
    setEditFormData({ artist_name: '', email: '' });
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

  const filteredArtistAccounts = artistAccounts.filter(artist =>
    artist.artist_name?.toLowerCase().includes(artistSearchTerm.toLowerCase()) ||
    artist.email?.toLowerCase().includes(artistSearchTerm.toLowerCase()) ||
    artist.full_name?.toLowerCase().includes(artistSearchTerm.toLowerCase())
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
        <button onClick={handleRefresh} className="refresh-btn" title="Refresh" aria-label="Refresh">
          <FontAwesomeIcon icon={faRotateRight} />
        </button>
      </div>

      {/* Accounts Tabs */}
      <div className="accounts-tabs">
        {isOwner && (
          <button
            className={`accounts-tab ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            <FontAwesomeIcon icon={faUserShield} className="tab-icon" />
            Admin Accounts
          </button>
        )}
        <button
          className={`accounts-tab ${activeTab === 'artist' ? 'active' : ''}`}
          onClick={() => setActiveTab('artist')}
        >
          <FontAwesomeIcon icon={faPalette} className="tab-icon" />
          Artist Accounts
        </button>
        <button
          className={`accounts-tab ${activeTab === 'customer' ? 'active' : ''}`}
          onClick={() => setActiveTab('customer')}
        >
          <FontAwesomeIcon icon={faUsers} className="tab-icon" />
          Customer Accounts
        </button>
      </div>

      {/* Admin Accounts Section - Only for Owners */}
      {isOwner && activeTab === 'admin' && (
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

      {/* Artist Accounts Section */}
      {activeTab === 'artist' && (
        <div className="accounts-section">
        <div className="section-header">
          <h2>
            <FontAwesomeIcon icon={faPalette} />
            Artist Accounts ({filteredArtistAccounts.length})
            {isOwner && (
              <span className="owner-badge">Owner Only: Can Edit</span>
            )}
          </h2>
          <div className="accounts-search-container">
            <input
              type="text"
              placeholder="Search artist accounts..."
              value={artistSearchTerm}
              onChange={(e) => setArtistSearchTerm(e.target.value)}
              className="accounts-search-input"
            />
            <FontAwesomeIcon icon={faSearch} className="accounts-search-icon" />
          </div>
        </div>

        <div className="accounts-table-container">
          <table className="accounts-table artist-table">
            <thead>
              <tr>
                <th>Artist Name</th>
                <th>Email</th>
                <th>Tasks Completed</th>
                <th>Status</th>
                <th>Verified</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredArtistAccounts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-data">
                    {artistSearchTerm ? 'No artist accounts match your search.' : 'No artist accounts found.'}
                  </td>
                </tr>
              ) : (
                filteredArtistAccounts.map((artist) => (
                  <tr key={`artist-${artist.id}-${forceUpdate}`}>
                    <td>
                      {editingArtist?.id === artist.id ? (
                        <input
                          type="text"
                          value={editFormData.artist_name}
                          onChange={(e) => handleEditFormChange('artist_name', e.target.value)}
                          className="edit-input"
                          placeholder="Artist Name"
                        />
                      ) : (
                        artist.artist_name || 'N/A'
                      )}
                    </td>
                    <td>
                      {editingArtist?.id === artist.id ? (
                        <input
                          type="email"
                          value={editFormData.email}
                          onChange={(e) => handleEditFormChange('email', e.target.value)}
                          className="edit-input"
                          placeholder="Email Address"
                        />
                      ) : (
                        artist.email || 'N/A'
                      )}
                    </td>
                    <td>{artist.total_tasks_completed || 0}</td>
                    <td>
                      <span className={`status-badge ${artist.is_active ? 'active' : 'inactive'}`}>
                        {artist.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <span className={`verification-badge ${artist.is_verified ? 'verified' : 'unverified'}`}>
                        {artist.is_verified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {editingArtist?.id === artist.id ? (
                          <>
                            <button
                              onClick={handleSaveArtist}
                              className="save-btn"
                              title="Save Changes"
                              aria-label="Save Changes"
                            >
                              <FontAwesomeIcon icon={faSave} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="cancel-btn"
                              title="Cancel Edit"
                              aria-label="Cancel Edit"
                            >
                              <FontAwesomeIcon icon={faTimes} />
                            </button>
                          </>
                        ) : (
                          <>
                            {isOwner && (
                              <button
                                onClick={() => handleEditArtist(artist)}
                                className="edit-btn"
                                title="Edit Artist Information"
                                aria-label="Edit Artist Information"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteArtist(artist.id)}
                              className="delete-btn"
                              title="Delete Artist Account"
                              aria-label="Delete Artist Account"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </>
                        )}
                      </div>
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
      {activeTab === 'customer' && (
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
      </div>
      </div>
    </div>
  );
};

export default Accounts;