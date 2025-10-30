import React, { useState, useEffect, useCallback } from 'react';
import './ArtistChatList.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faComments, 
  faUser, 
  faCircle,
  faSearch
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import chatService from '../../services/chatService';
import { supabase } from '../../lib/supabase';
import ArtistChatModal from './ArtistChatModal';

const ArtistChatList = () => {
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('last_message');
  const { user } = useAuth();

  const fetchArtistChatRooms = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get artist profile first to get the artist_id
      const { data: artistProfile, error: profileError } = await supabase
        .from('artist_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !artistProfile) {
        console.error('Error fetching artist profile:', profileError);
        setChatRooms([]);
        return;
      }

      const rooms = await chatService.getArtistChatRooms(artistProfile.id);
      
      // Enhance rooms with order and customer information
      const enhancedRooms = await Promise.all(
        rooms.map(async (room) => {
          try {
            // Get order information
            const { data: order } = await supabase
              .from('orders')
              .select('order_number, status, total_amount, created_at')
              .eq('id', room.order_id)
              .single();

            // Get customer information
            const { data: customer } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', room.customer_id)
              .single();

            // Get unread message count
            const unreadCount = await chatService.getUnreadMessageCount(user.id);

            return {
              ...room,
              order: order || {},
              customer: customer || {},
              unreadCount: unreadCount || 0
            };
          } catch (error) {
            console.error('Error enhancing room data:', error);
            return room;
          }
        })
      );

      setChatRooms(enhancedRooms);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      setChatRooms([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      fetchArtistChatRooms();
    }
  }, [user, fetchArtistChatRooms]);

  const filteredRooms = chatRooms.filter(room => {
    const matchesSearch = 
      room.customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.order.order_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterStatus === 'all' || 
      (filterStatus === 'unread' && room.unreadCount > 0) ||
      (filterStatus === 'active' && room.status === 'active') ||
      (filterStatus === 'closed' && room.status === 'closed');

    return matchesSearch && matchesFilter;
  });

  const sortedRooms = filteredRooms.sort((a, b) => {
    switch (sortBy) {
      case 'last_message':
        return new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0);
      case 'order_date':
        return new Date(b.order.created_at || 0) - new Date(a.order.created_at || 0);
      case 'customer_name':
        return (a.customer.full_name || '').localeCompare(b.customer.full_name || '');
      case 'order_amount':
        return (b.order.total_amount || 0) - (a.order.total_amount || 0);
      default:
        return 0;
    }
  });

  const handleChatClick = (room) => {
    setSelectedChat(room);
    setShowChatModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No messages';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'closed': return '#6b7280';
      default: return '#f59e0b';
    }
  };

  if (loading) {
    return (
      <div className="artist-chat-list">
        <div className="chat-list-header">
          <h2>Customer Chats</h2>
        </div>
        <div className="chat-loading">
          <FontAwesomeIcon icon={faComments} spin />
          <p>Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="artist-chat-list">
      <div className="chat-list-header">
        <h2>Customer Chats</h2>
        <div className="chat-stats">
          <span className="total-chats">{chatRooms.length} Total</span>
          <span className="unread-chats">
            {chatRooms.filter(r => r.unreadCount > 0).length} Unread
          </span>
        </div>
      </div>

      <div className="chat-filters">
        <div className="search-box">
          <FontAwesomeIcon icon={faSearch} />
          <input
            type="text"
            placeholder="Search by customer or order number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-controls">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Chats</option>
            <option value="unread">Unread</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="last_message">Last Message</option>
            <option value="order_date">Order Date</option>
            <option value="customer_name">Customer Name</option>
            <option value="order_amount">Order Amount</option>
          </select>
        </div>
      </div>

      <div className="chat-rooms-list">
        {sortedRooms.length === 0 ? (
          <div className="no-chats">
            <FontAwesomeIcon icon={faComments} />
            <h3>No chats found</h3>
            <p>You don't have any customer chats yet.</p>
          </div>
        ) : (
          sortedRooms.map((room) => (
            <div
              key={room.id}
              className={`chat-room-item ${room.unreadCount > 0 ? 'unread' : ''}`}
              onClick={() => handleChatClick(room)}
            >
              <div className="room-avatar">
                <FontAwesomeIcon icon={faUser} />
                {room.unreadCount > 0 && (
                  <div className="unread-indicator">
                    <FontAwesomeIcon icon={faCircle} />
                  </div>
                )}
              </div>
              
              <div className="room-content">
                <div className="room-header">
                  <h4 className="customer-name">
                    {room.customer.full_name || 'Unknown Customer'}
                  </h4>
                  <span className="room-time">
                    {formatDate(room.last_message_at)}
                  </span>
                </div>
                
                <div className="room-details">
                  <p className="order-info">
                    Order #{room.order.order_number || 'N/A'} • 
                    ${room.order.total_amount?.toFixed(2) || '0.00'}
                  </p>
                  <div className="room-status">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(room.status) }}
                    >
                      {room.status || 'active'}
                    </span>
                    {room.unreadCount > 0 && (
                      <span className="unread-count">
                        {room.unreadCount} new
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showChatModal && selectedChat && (
        <ArtistChatModal
          room={selectedChat}
          isOpen={showChatModal}
          onClose={() => {
            setShowChatModal(false);
            setSelectedChat(null);
            fetchArtistChatRooms(); // Refresh the list
          }}
        />
      )}
    </div>
  );
};

export default ArtistChatList;
