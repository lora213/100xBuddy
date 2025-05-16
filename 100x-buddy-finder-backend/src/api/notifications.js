// src/api/notifications.js

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Get user's notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get unread count
    const { count: unreadCount, error: countError } = await req.supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    
    if (countError) throw countError;
    
    // Get notifications with pagination
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    
    let query = req.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (req.query.unread === 'true') {
      query = query.eq('is_read', false);
    }
    
    const { data: notifications, error } = await query;
    
    if (error) throw error;
    
    res.json({
      notifications: notifications || [],
      unreadCount,
      pagination: {
        page,
        limit,
        total: notifications.length // Note: This isn't the total count, just the current page size
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
router.put('/:notificationId/read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.notificationId;
    
    // Make sure the notification belongs to this user
    const { data: notification, error: notificationError } = await req.supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('user_id', userId)
      .single();
    
    if (notificationError || !notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    // Update notification
    const { data: updatedNotification, error } = await req.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({
      message: 'Notification marked as read',
      notification: updatedNotification
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark all notifications as read
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Update all unread notifications
    const { data, error } = await req.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    
    if (error) throw error;
    
    res.json({
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
