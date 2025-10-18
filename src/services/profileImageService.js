import { supabase } from '../lib/supabase';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

class ProfileImageService {
  // Upload profile image
  async uploadProfileImage(file) {
    try {
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      console.log('📸 Profile image upload: User authenticated, token available:', !!session.access_token);
      console.log('📸 Profile image upload: File:', file.name, file.size, file.type);

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_BASE_URL}/api/upload/profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload profile image');
      }

      const result = await response.json();
      console.log('📸 Profile image upload success:', result.imageUrl);
      
      return result;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      throw error;
    }
  }

  // Update user profile with new image URL
  async updateUserProfileImage(imageUrl) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      console.log('👤 Updating user profile with image URL:', imageUrl);

      const { data, error } = await supabase.auth.updateUser({
        data: {
          avatar_url: imageUrl
        }
      });

      if (error) {
        throw error;
      }

      console.log('👤 Profile image updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Delete profile image from Cloudinary
  async deleteProfileImage(publicId) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/api/upload/${publicId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete profile image');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting profile image:', error);
      throw error;
    }
  }

  // Helper method to validate image file
  validateImageFile(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
    }

    if (file.size > maxSize) {
      throw new Error('Image size must be less than 5MB');
    }

    return true;
  }

  // Helper method to get file size in human readable format
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

const profileImageService = new ProfileImageService();
export default profileImageService;
