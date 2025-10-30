const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const router = express.Router();

// Middleware to authenticate artist
const authenticateArtist = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const userRole = user.user_metadata?.role || 'customer';
    
    if (userRole !== 'artist') {
      return res.status(403).json({ error: 'Access denied. Artist role required.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Get artist profile
router.get('/profile', authenticateArtist, async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('artist_profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error) {
      console.error('Error fetching artist profile:', error);
      return res.status(500).json({ error: 'Failed to fetch artist profile' });
    }

    if (!profile) {
      return res.status(404).json({ error: 'Artist profile not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Error fetching artist profile:', error);
    res.status(500).json({ error: 'Failed to fetch artist profile' });
  }
});

// Update artist profile
router.put('/profile', authenticateArtist, async (req, res) => {
  try {
    const { artist_name, bio, specialties, commission_rate } = req.body;
    
    const { data, error } = await supabase
      .from('artist_profiles')
      .update({
        artist_name,
        bio,
        specialties,
        commission_rate,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating artist profile:', error);
      return res.status(500).json({ error: 'Failed to update artist profile' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating artist profile:', error);
    res.status(500).json({ error: 'Failed to update artist profile' });
  }
});

// Get artist metrics (dashboard cards)
router.get('/metrics', authenticateArtist, async (req, res) => {
  try {
    // Get artist profile first
    const { data: profile, error: profileError } = await supabase
      .from('artist_profiles')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Artist profile not found' });
    }

    // Get total tasks
    const { count: totalTasks, error: totalError } = await supabase
      .from('artist_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('artist_id', profile.id);

    if (totalError) {
      console.error('Error fetching total tasks:', totalError);
    }

    // Get pending tasks
    const { count: pendingTasks, error: pendingError } = await supabase
      .from('artist_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('artist_id', profile.id)
      .eq('status', 'pending');

    if (pendingError) {
      console.error('Error fetching pending tasks:', pendingError);
    }

    // Get completed tasks
    const { count: completedTasks, error: completedError } = await supabase
      .from('artist_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('artist_id', profile.id)
      .eq('status', 'completed');

    if (completedError) {
      console.error('Error fetching completed tasks:', completedError);
    }

    // Calculate completion rate
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const metrics = {
      totalTasks: totalTasks || 0,
      pendingTasks: pendingTasks || 0,
      completedTasks: completedTasks || 0,
      completionRate
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching artist metrics:', error);
    res.status(500).json({ error: 'Failed to fetch artist metrics' });
  }
});

// Get artist workload data (for charts)
router.get('/workload', authenticateArtist, async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    // Get artist profile first
    const { data: profile, error: profileError } = await supabase
      .from('artist_profiles')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Artist profile not found' });
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get tasks grouped by date and status
    const { data: tasks, error: tasksError } = await supabase
      .from('artist_tasks')
      .select('created_at, status')
      .eq('artist_id', profile.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (tasksError) {
      console.error('Error fetching workload data:', tasksError);
      return res.status(500).json({ error: 'Failed to fetch workload data' });
    }

    // Group tasks by date
    const workloadData = {};
    tasks.forEach(task => {
      const date = task.created_at.split('T')[0];
      if (!workloadData[date]) {
        workloadData[date] = { pending: 0, in_progress: 0, completed: 0 };
      }
      workloadData[date][task.status]++;
    });

    // Convert to array format
    const result = Object.entries(workloadData).map(([date, counts]) => ({
      date,
      ...counts
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching workload data:', error);
    res.status(500).json({ error: 'Failed to fetch workload data' });
  }
});

// Get artist tasks
router.get('/tasks', authenticateArtist, async (req, res) => {
  try {
    const { limit, status } = req.query;
    
    // Get artist profile first
    const { data: profile, error: profileError } = await supabase
      .from('artist_profiles')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Artist profile not found' });
    }

    let query = supabase
      .from('artist_tasks')
      .select(`
        *,
        orders (
          order_number,
          total_amount,
          order_items
        ),
        products (
          id,
          name,
          main_image,
          additional_images,
          category,
          price
        )
      `)
      .eq('artist_id', profile.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data: tasks, error: tasksError } = await query;

    if (tasksError) {
      console.error('Error fetching artist tasks:', tasksError);
      return res.status(500).json({ error: 'Failed to fetch artist tasks' });
    }

    res.json(tasks || []);
  } catch (error) {
    console.error('Error fetching artist tasks:', error);
    res.status(500).json({ error: 'Failed to fetch artist tasks' });
  }
});

// Update task status
router.patch('/tasks/:taskId/status', authenticateArtist, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    // Verify task belongs to this artist
    const { data: task, error: taskError } = await supabase
      .from('artist_tasks')
      .select('artist_id')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Get artist profile to verify ownership
    const { data: profile, error: profileError } = await supabase
      .from('artist_profiles')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (profileError || !profile || task.artist_id !== profile.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update task status
    const { data, error } = await supabase
      .from('artist_tasks')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      console.error('Error updating task status:', error);
      return res.status(500).json({ error: 'Failed to update task status' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

module.exports = router;
