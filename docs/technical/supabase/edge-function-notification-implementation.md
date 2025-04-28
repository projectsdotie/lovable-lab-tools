# Implementing Notification Edge Functions in Supabase

This document details the implementation of notification services using Supabase Edge Functions for the Lovable Lab Tools application.

## Overview

Notifications are crucial for enhancing user engagement and providing timely updates about various activities within the application. Using Supabase Edge Functions allows us to perform these operations serverlessly, ensuring scalability and maintainability.

## Prerequisites

- Supabase project set up with a valid API key
- Supabase CLI installed (`npm install -g supabase`)
- Edge Functions enabled in your Supabase project
- Email service provider account (e.g., SendGrid, Mailgun)

## Edge Function Structure

Our notification Edge Functions follow this general structure:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get request payload
    const { type, data } = await req.json()

    // Process notification based on type
    const result = await processNotification(type, data, supabaseClient)

    // Return successful response
    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    // Return error response
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function processNotification(type, data, supabaseClient) {
  // Implement different notification logic based on type
  switch (type) {
    case 'project_shared':
      return await handleProjectSharedNotification(data, supabaseClient)
    case 'comment_added':
      return await handleCommentAddedNotification(data, supabaseClient)
    case 'team_invitation':
      return await handleTeamInvitationNotification(data, supabaseClient)
    default:
      throw new Error(`Unknown notification type: ${type}`)
  }
}
```

## Notification Types

The following notification types are implemented:

### 1. Project Shared Notification

Sent when a project is shared with a user.

```typescript
async function handleProjectSharedNotification(data, supabaseClient) {
  const { projectId, recipientUserId, senderUserId, accessLevel } = data
  
  // Get project and user details
  const { data: project } = await supabaseClient
    .from('projects')
    .select('name')
    .eq('id', projectId)
    .single()
  
  const { data: sender } = await supabaseClient
    .from('profiles')
    .select('username')
    .eq('id', senderUserId)
    .single()
  
  const { data: recipient } = await supabaseClient
    .from('profiles')
    .select('email')
    .eq('id', recipientUserId)
    .single()
  
  // Create notification record
  const { data: notification, error } = await supabaseClient
    .from('notifications')
    .insert({
      user_id: recipientUserId,
      type: 'project_shared',
      content: `${sender.username} has shared "${project.name}" with you with ${accessLevel} access.`,
      metadata: {
        project_id: projectId,
        sender_id: senderUserId,
        access_level: accessLevel
      },
      read: false
    })
    .select()
    .single()
  
  if (error) throw error
  
  // Send email notification
  await sendEmailNotification(
    recipient.email,
    `${sender.username} shared a project with you`,
    `${sender.username} has shared the project "${project.name}" with you with ${accessLevel} access. Log in to view it.`
  )
  
  return notification
}
```

### 2. Comment Added Notification

Sent when a comment is added to a project.

```typescript
async function handleCommentAddedNotification(data, supabaseClient) {
  const { projectId, commentId, commentorUserId } = data
  
  // Get project, comment, and user details
  const { data: project } = await supabaseClient
    .from('projects')
    .select('name, user_id')
    .eq('id', projectId)
    .single()
  
  const { data: comment } = await supabaseClient
    .from('comments')
    .select('content')
    .eq('id', commentId)
    .single()
  
  const { data: commentor } = await supabaseClient
    .from('profiles')
    .select('username')
    .eq('id', commentorUserId)
    .single()
  
  // Get all users with access to this project
  const { data: projectAccess } = await supabaseClient
    .from('project_access')
    .select('user_id')
    .eq('project_id', projectId)
  
  // Combine project owner and those with access
  const notifyUserIds = [
    project.user_id,
    ...projectAccess.map(access => access.user_id)
  ].filter(id => id !== commentorUserId) // Don't notify the commentor
  
  // Create notification for each user
  const notificationPromises = notifyUserIds.map(userId => {
    return supabaseClient
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'comment_added',
        content: `${commentor.username} commented on "${project.name}": "${comment.content.substring(0, 50)}${comment.content.length > 50 ? '...' : ''}"`,
        metadata: {
          project_id: projectId,
          comment_id: commentId,
          commentor_id: commentorUserId
        },
        read: false
      })
  })
  
  await Promise.all(notificationPromises)
  
  // Get emails for notification
  const { data: users } = await supabaseClient
    .from('profiles')
    .select('id, email')
    .in('id', notifyUserIds)
  
  // Send email notifications
  const emailPromises = users.map(user => {
    return sendEmailNotification(
      user.email,
      `New comment on project "${project.name}"`,
      `${commentor.username} commented on the project "${project.name}": "${comment.content}". Log in to view and respond.`
    )
  })
  
  await Promise.all(emailPromises)
  
  return { success: true, notified: notifyUserIds.length }
}
```

### 3. Team Invitation Notification

Sent when a user is invited to join a team.

```typescript
async function handleTeamInvitationNotification(data, supabaseClient) {
  const { teamId, inviteeUserId, inviterUserId } = data
  
  // Get team and user details
  const { data: team } = await supabaseClient
    .from('teams')
    .select('name')
    .eq('id', teamId)
    .single()
  
  const { data: inviter } = await supabaseClient
    .from('profiles')
    .select('username')
    .eq('id', inviterUserId)
    .single()
  
  const { data: invitee } = await supabaseClient
    .from('profiles')
    .select('email')
    .eq('id', inviteeUserId)
    .single()
  
  // Create notification record
  const { data: notification, error } = await supabaseClient
    .from('notifications')
    .insert({
      user_id: inviteeUserId,
      type: 'team_invitation',
      content: `${inviter.username} has invited you to join the "${team.name}" team.`,
      metadata: {
        team_id: teamId,
        inviter_id: inviterUserId
      },
      read: false
    })
    .select()
    .single()
  
  if (error) throw error
  
  // Send email notification
  await sendEmailNotification(
    invitee.email,
    `Invitation to join ${team.name}`,
    `${inviter.username} has invited you to join the "${team.name}" team. Log in to accept or decline this invitation.`
  )
  
  return notification
}
```

## Email Notification Helper

A helper function to send email notifications:

```typescript
async function sendEmailNotification(to, subject, body) {
  // Replace with your email service provider
  const emailApiKey = Deno.env.get('EMAIL_API_KEY')
  const emailFrom = Deno.env.get('EMAIL_FROM')
  
  // Example using SendGrid
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${emailApiKey}`
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: to }]
        }
      ],
      from: { email: emailFrom },
      subject: subject,
      content: [
        {
          type: 'text/plain',
          value: body
        }
      ]
    })
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to send email: ${errorText}`)
  }
  
  return true
}
```

## Environment Variables

The following environment variables need to be set in your Supabase project:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `EMAIL_API_KEY`: API key for your email service provider
- `EMAIL_FROM`: Sender email address

## Deployment

To deploy the notification Edge Function:

1. Create a new folder in your project for the Edge Function:

```bash
mkdir -p supabase/functions/notify
```

2. Create the function file:

```bash
touch supabase/functions/notify/index.ts
```

3. Add the code for the notification function to `index.ts`.

4. Deploy the function using the Supabase CLI:

```bash
supabase functions deploy notify
```

## Testing

Test your notification function using curl or Postman:

```bash
curl -X POST 'https://[YOUR-PROJECT-ID].functions.supabase.co/notify' \
  -H 'Authorization: Bearer [YOUR-ANON-KEY]' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "project_shared",
    "data": {
      "projectId": "50000000-0000-0000-0000-000000000001",
      "recipientUserId": "00000000-0000-0000-0000-000000000002",
      "senderUserId": "00000000-0000-0000-0000-000000000001",
      "accessLevel": "view"
    }
  }'
```

## Frontend Integration

Call the notification function from your frontend application:

```javascript
// Using Supabase client
const { data, error } = await supabase.functions.invoke('notify', {
  body: {
    type: 'project_shared',
    data: {
      projectId: '50000000-0000-0000-0000-000000000001',
      recipientUserId: '00000000-0000-0000-0000-000000000002',
      senderUserId: '00000000-0000-0000-0000-000000000001',
      accessLevel: 'view'
    }
  }
})

if (error) {
  console.error('Error sending notification:', error)
} else {
  console.log('Notification sent successfully:', data)
}
```

## Database Schema

The notifications are stored in a `notifications` table with the following schema:

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries by user
CREATE INDEX notifications_user_id_idx ON notifications(user_id);

-- Add Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their notifications
CREATE POLICY "Users can view their own notifications" 
  ON notifications FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy to allow users to mark their notifications as read
CREATE POLICY "Users can update their own notifications" 
  ON notifications FOR UPDATE 
  USING (auth.uid() = user_id);
```

## Conclusion

This implementation allows for a comprehensive notification system within the Lovable Lab Tools application. The Edge Functions handle various notification types, send emails, and store notifications in the database for display in the UI.

By leveraging Supabase Edge Functions, we've created a serverless, scalable solution that can be easily extended with new notification types as needed. 