import { 
  handleCORS, 
  verifyUserToken, 
  sendResponse, 
  logAPIRequest, 
  validateRequiredFields 
} from '../_lib/supabase.js';

// User profile management API
export default async function handler(req, res) {
  // Handle CORS
  if (handleCORS(req, res)) return;

  const clientIP = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';

  try {
    // Verify user token for all operations
    const authResult = await verifyUserToken(req.headers.authorization);
    if (authResult.error) {
      return sendResponse(res, authResult.status, { error: authResult.error });
    }

    const { user, supabase } = authResult;
    logAPIRequest(req, 'profile_access', { userId: user.id, method: req.method, ip: clientIP });

    switch (req.method) {
      case 'GET':
        return handleGetProfile(req, res, user, supabase);
      case 'PUT':
        return handleUpdateProfile(req, res, user, supabase);
      case 'DELETE':
        return handleDeleteProfile(req, res, user, supabase);
      default:
        return sendResponse(res, 405, { error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('[Profile API] Error:', error);
    logAPIRequest(req, 'profile_error', { error: error.message, ip: clientIP });
    return sendResponse(res, 500, { error: 'Internal server error' });
  }
}

// Get user profile
async function handleGetProfile(req, res, user, supabase) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        first_name,
        last_name,
        email,
        phone,
        branch,
        year,
        role,
        avatar_url,
        bio,
        linkedin_url,
        github_url,
        website_url,
        created_at,
        updated_at
      `)
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('[Profile API] Get profile error:', error);
      return sendResponse(res, 404, { error: 'Profile not found' });
    }

    return sendResponse(res, 200, { 
      profile,
      message: 'Profile retrieved successfully' 
    });
  } catch (error) {
    console.error('[Profile API] Get profile error:', error);
    return sendResponse(res, 500, { error: 'Failed to retrieve profile' });
  }
}

// Update user profile
async function handleUpdateProfile(req, res, user, supabase) {
  try {
    const allowedFields = [
      'full_name', 'first_name', 'last_name', 'phone', 'branch', 'year',
      'bio', 'linkedin_url', 'github_url', 'website_url'
    ];

    // Filter only allowed fields from request body
    const updateData = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key) && req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return sendResponse(res, 400, { error: 'No valid fields to update' });
    }

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();

    // Update profile
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('[Profile API] Update profile error:', error);
      return sendResponse(res, 400, { error: 'Failed to update profile' });
    }

    logAPIRequest(req, 'profile_updated', { 
      userId: user.id, 
      updatedFields: Object.keys(updateData) 
    });

    return sendResponse(res, 200, { 
      profile: updatedProfile,
      message: 'Profile updated successfully' 
    });
  } catch (error) {
    console.error('[Profile API] Update profile error:', error);
    return sendResponse(res, 500, { error: 'Failed to update profile' });
  }
}

// Delete user profile (soft delete)
async function handleDeleteProfile(req, res, user, supabase) {
  try {
    // Soft delete by updating a deleted_at timestamp
    const { error } = await supabase
      .from('profiles')
      .update({ 
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) {
      console.error('[Profile API] Delete profile error:', error);
      return sendResponse(res, 400, { error: 'Failed to delete profile' });
    }

    // Also delete the auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
    
    if (authError) {
      console.error('[Profile API] Delete auth user error:', authError);
      // Don't fail the request if auth deletion fails
    }

    logAPIRequest(req, 'profile_deleted', { userId: user.id });

    return sendResponse(res, 200, { 
      message: 'Profile deleted successfully' 
    });
  } catch (error) {
    console.error('[Profile API] Delete profile error:', error);
    return sendResponse(res, 500, { error: 'Failed to delete profile' });
  }
}
