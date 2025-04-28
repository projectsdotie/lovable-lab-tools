# Notification System Implementation

This document provides a comprehensive overview of the notification system implemented in Lovable Lab Tools using Supabase Edge Functions.

## Overview

The notification system allows users to receive real-time updates about various activities in the application, such as:
- Project sharing
- Comment additions
- Team invitations
- System announcements

Notifications are delivered through multiple channels:
1. In-app notifications (UI-based)
2. Email notifications (optional, based on user preferences)

## Architecture

The notification system follows a serverless architecture using Supabase Edge Functions:

```
[Database Trigger] -> [Edge Function] -> [Process Notification] -> [Store in DB/Send Email]
```

### Components

1. **Database Triggers**: Supabase PostgreSQL triggers that fire when specific events occur (e.g., a new row in project_access table)
2. **Edge Functions**: Serverless functions that process the notification logic
3. **Notification Storage**: Database table for storing notification data
4. **Email Service Integration**: External email service for sending email notifications
5. **Frontend Components**: UI components for displaying and managing notifications

## Database Schema

The notification system relies on the following database tables:

### Notifications Table

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Add index for faster queries
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
```

### User Notification Preferences Table

```sql
CREATE TABLE user_notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  in_app_notifications BOOLEAN DEFAULT true,
  project_sharing BOOLEAN DEFAULT true,
  comments BOOLEAN DEFAULT true,
  team_invitations BOOLEAN DEFAULT true,
  system_announcements BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## Edge Function Implementation

The Edge Function for notification processing is implemented as follows:

```typescript
// process-notification/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Define notification types
type NotificationType = 'project_shared' | 'comment_added' | 'team_invitation' | 'system_announcement';

// Define notification payload
interface NotificationPayload {
  type: NotificationType;
  userId: string;
  data: Record<string, any>;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Handle OPTIONS request for CORS
function handleCorsOptions(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
}

// Process notification function
async function processNotification(supabase, payload: NotificationPayload) {
  const { type, userId, data } = payload;

  // Check user notification preferences
  const { data: preferences, error: prefError } = await supabase
    .from('user_notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (prefError && prefError.code !== 'PGRST116') {
    console.error('Error fetching notification preferences:', prefError);
    return { success: false, error: 'Error fetching notification preferences' };
  }

  // Default preferences if not found
  const userPrefs = preferences || {
    email_notifications: true,
    in_app_notifications: true,
    project_sharing: true,
    comments: true,
    team_invitations: true,
    system_announcements: true
  };

  // Check if this type of notification is enabled
  if (!userPrefs[type.replace('_', '')]) {
    return { success: true, skipped: true, reason: 'Notification type disabled by user' };
  }

  // Process based on notification type
  switch (type) {
    case 'project_shared':
      return await processProjectSharedNotification(supabase, userId, data, userPrefs);
    case 'comment_added':
      return await processCommentAddedNotification(supabase, userId, data, userPrefs);
    case 'team_invitation':
      return await processTeamInvitationNotification(supabase, userId, data, userPrefs);
    case 'system_announcement':
      return await processSystemAnnouncementNotification(supabase, userId, data, userPrefs);
    default:
      return { success: false, error: 'Unknown notification type' };
  }
}

// Main handler function
serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCorsOptions(req);
  if (corsResponse) return corsResponse;

  try {
    // Parse request body
    const { type, userId, data } = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Process the notification
    const result = await processNotification(supabase, { type, userId, data });

    // Return response
    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    console.error('Error processing notification:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      }
    );
  }
});
```

## Email Notification Integration

Email notifications are sent using a third-party email service. The integration is implemented in the Edge Function:

```typescript
async function sendEmailNotification(
  userId: string,
  subject: string,
  content: string,
  actionData?: { action_url: string; action_text: string }
) {
  try {
    const emailApiKey = Deno.env.get('EMAIL_API_KEY');
    const emailFrom = Deno.env.get('EMAIL_FROM');
    
    if (!emailApiKey || !emailFrom) {
      throw new Error('Email configuration missing');
    }
    
    // Fetch user email
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();
      
    if (userError || !userData) {
      throw new Error('User not found');
    }
    
    // Prepare HTML template
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${subject}</h2>
        <p>${content}</p>
        ${actionData ? `<p><a href="${actionData.action_url}" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">${actionData.action_text}</a></p>` : ''}
        <hr>
        <p style="font-size: 12px; color: #666;">This is an automated message from Lovable Lab Tools.</p>
      </div>
    `;
    
    // Send email (implementation depends on email service)
    const response = await fetch('https://api.emailservice.example/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${emailApiKey}`
      },
      body: JSON.stringify({
        from: emailFrom,
        to: userData.email,
        subject: subject,
        html: htmlContent
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to send email');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}
```

## Database Triggers

Database triggers are set up to automatically call the Edge Function when certain events occur:

```sql
-- Trigger for project sharing notifications
CREATE OR REPLACE FUNCTION trigger_project_shared_notification()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM http_post(
    'https://<project-ref>.supabase.co/functions/v1/process-notification',
    json_build_object(
      'type', 'project_shared',
      'userId', NEW.user_id,
      'data', json_build_object(
        'projectId', NEW.project_id,
        'sharedById', NEW.created_by
      )
    ),
    'application/json'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_project_access_insert
AFTER INSERT ON project_access
FOR EACH ROW EXECUTE FUNCTION trigger_project_shared_notification();
```

## Frontend Integration

The frontend implements notification fetching, displaying, and marking as read:

```typescript
// Example React hook for notifications
const useNotifications = () => {
  const { user } = useAuth();
  const supabase = useSupabaseClient();
  
  const fetchNotifications = async () => {
    if (!user) return { data: null, error: new Error('User not authenticated') };
    
    return await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(20);
  };
  
  const markAsRead = async (notificationId) => {
    return await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
  };
  
  const markAllAsRead = async () => {
    if (!user) return { error: new Error('User not authenticated') };
    
    return await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .is('read', false);
  };
  
  const deleteNotification = async (notificationId) => {
    return await supabase
      .from('notifications')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', notificationId);
  };
  
  return {
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
};
```

## Deployment

The notification Edge Function is deployed using the Supabase CLI:

```bash
# Deploy the function
supabase functions deploy process-notification --project-ref <project-ref>

# Set environment variables
supabase secrets set --env-file ./supabase/.env --project-ref <project-ref>
```

## Testing

To test the notification system:

1. Trigger an event (e.g., share a project)
2. Verify the notification appears in the database
3. Check if the notification appears in the UI
4. Verify email delivery (if enabled)

## Future Enhancements

Planned improvements for the notification system:

1. **Real-time WebSockets**: Implement real-time notifications using Supabase Realtime
2. **Push Notifications**: Add browser push notifications support
3. **Mobile Notifications**: Implement mobile push notifications
4. **Notification Batching**: Group similar notifications to reduce noise
5. **Advanced Filtering**: Allow users to filter notifications by more criteria 