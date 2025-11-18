import { supabase } from '../lib/supabase';

class UserService {
  async saveUserAddress(addressData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // First, unset any existing default addresses
      await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Insert new address as default
      const { data, error } = await supabase
        .from('user_addresses')
        .insert({
          user_id: user.id,
          full_name: addressData.fullName,
          phone: addressData.phone,
          street_address: addressData.streetAddress,
          barangay: addressData.barangay,
          barangay_code: addressData.barangay_code || null, // Include barangay code for coordinate lookup
          city: addressData.city,
          province: addressData.province,
          postal_code: addressData.postalCode,
          address: addressData.address,
          is_default: true
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save address: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(error.message || 'Network error occurred');
    }
  }

  async getUserAddress() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw new Error(`Failed to get address: ${error.message}`);
      }

      return data || null;
    } catch (error) {
      throw new Error(error.message || 'Network error occurred');
    }
  }

  async getUserAddresses() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get addresses: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw new Error(error.message || 'Network error occurred');
    }
  }

  async updateUserAddress(addressId, addressData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // First, verify the address exists and belongs to the user
      const { data: existingAddress, error: checkError } = await supabase
        .from('user_addresses')
        .select('id')
        .eq('id', addressId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) {
        throw new Error(`Failed to verify address: ${checkError.message}`);
      }

      if (!existingAddress) {
        throw new Error('Address not found or does not belong to user');
      }

      // Update the address - first update without select to avoid coercion issues
      const { error: updateError } = await supabase
        .from('user_addresses')
        .update({
          full_name: addressData.fullName,
          phone: addressData.phone,
          street_address: addressData.streetAddress,
          barangay: addressData.barangay,
          barangay_code: addressData.barangay_code || null, // Include barangay code for coordinate lookup
          city: addressData.city,
          province: addressData.province,
          postal_code: addressData.postalCode,
          address: addressData.address,
          updated_at: new Date().toISOString()
        })
        .eq('id', addressId)
        .eq('user_id', user.id);

      if (updateError) {
        throw new Error(`Failed to update address: ${updateError.message}`);
      }

      // Fetch the updated address separately to avoid coercion issues
      const { data, error: fetchError } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('id', addressId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch updated address: ${fetchError.message}`);
      }

      if (!data) {
        throw new Error('Address update completed but address not found');
      }

      return data;
    } catch (error) {
      throw new Error(error.message || 'Network error occurred');
    }
  }

  async deleteUserAddress(addressId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('user_addresses')
        .delete()
        .eq('id', addressId)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(`Failed to delete address: ${error.message}`);
      }

      return { success: true };
    } catch (error) {
      throw new Error(error.message || 'Network error occurred');
    }
  }

  async clearAllUserAddresses() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('user_addresses')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        throw new Error(`Failed to clear addresses: ${error.message}`);
      }

      return { success: true };
    } catch (error) {
      throw new Error(error.message || 'Network error occurred');
    }
  }

  async setDefaultAddress(addressId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // First, unset all default addresses for this user
      await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Set the selected address as default
      const { data, error } = await supabase
        .from('user_addresses')
        .update({ is_default: true })
        .eq('id', addressId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to set default address: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(error.message || 'Network error occurred');
    }
  }
}

export default new UserService();
