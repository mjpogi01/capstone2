import { supabase } from '../lib/supabase';

class OrderTrackingService {
  // Get order tracking history
  async getOrderTracking(orderId) {
    try {
      const { data, error } = await supabase
        .from('order_tracking')
        .select('*')
        .eq('order_id', orderId)
        .order('timestamp', { ascending: true });

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching order tracking:', error);
      throw error;
    }
  }

  // Add tracking update
  async addTrackingUpdate(orderId, status, location, description, metadata = {}) {
    try {
      const { data, error } = await supabase
        .from('order_tracking')
        .insert([{
          order_id: orderId,
          status,
          location,
          description,
          metadata
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error adding tracking update:', error);
      throw error;
    }
  }

  // Get order review
  async getOrderReview(orderId) {
    try {
      const { data, error } = await supabase
        .from('order_reviews')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw new Error(`Supabase error: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error fetching order review:', error);
      throw error;
    }
  }

  // Add order review
  async addOrderReview(orderId, userId, rating, comment) {
    try {
      const { data, error } = await supabase
        .from('order_reviews')
        .insert([{
          order_id: orderId,
          user_id: userId,
          rating,
          comment
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error adding order review:', error);
      throw error;
    }
  }

  // Get delivery proof
  async getDeliveryProof(orderId) {
    try {
      const { data, error } = await supabase
        .from('delivery_proof')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw new Error(`Supabase error: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error fetching delivery proof:', error);
      throw error;
    }
  }

  // Add delivery proof
  async addDeliveryProof(orderId, deliveryPersonName, deliveryPersonContact, proofImages, deliveryNotes) {
    try {
      const { data, error } = await supabase
        .from('delivery_proof')
        .insert([{
          order_id: orderId,
          delivery_person_name: deliveryPersonName,
          delivery_person_contact: deliveryPersonContact,
          proof_images: proofImages,
          delivery_notes: deliveryNotes
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error adding delivery proof:', error);
      throw error;
    }
  }

  // Verify delivery proof (admin function)
  async verifyDeliveryProof(proofId, verifiedBy) {
    try {
      const { data, error } = await supabase
        .from('delivery_proof')
        .update({
          verified_by: verifiedBy,
          verified_at: new Date().toISOString()
        })
        .eq('id', proofId)
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error verifying delivery proof:', error);
      throw error;
    }
  }
}

const orderTrackingService = new OrderTrackingService();
export default orderTrackingService;
