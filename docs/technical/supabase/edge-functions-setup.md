# Supabase Edge Functions Setup for Lovable Lab Tools

This document outlines how to set up and deploy Edge Functions for the Lovable Lab Tools application using Supabase.

## Prerequisites

- Supabase CLI installed
- Node.js v16+ installed
- Supabase project set up
- TypeScript knowledge

## Edge Functions Overview

Edge Functions in Supabase are serverless functions that run on Supabase's edge network. They allow you to execute server-side code without managing servers. For the Lovable Lab Tools application, we use Edge Functions for:

1. **Notification Processing** - Handle various notification types
2. **Data Processing** - Process data before/after database operations
3. **Third-party Integrations** - Connect with external services

## Setting Up the Supabase CLI

To work with Edge Functions, you need the Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Initialize Supabase in your project (if not already initialized)
supabase init
```

## Creating Your First Edge Function

### 1. Generate the Function

```bash
supabase functions new process-notification
```

This creates a new directory in `supabase/functions/process-notification` with a basic TypeScript template.

### 2. Implement the Function

Replace the contents of `supabase/functions/process-notification/index.ts` with the following code:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Define notification types
type NotificationType = 'project_shared' | 'comment_added' | 'team_invitation';

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

// Process project shared notification
async function processProjectSharedNotification(
  supabase: any,
  userId: string,
  data: { projectId: string; sharedById: string }
) {
  const { projectId, sharedById } = data;

  // Fetch project details
  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .select('name')
    .eq('id', projectId)
    .single();

  if (projectError) {
    console.error('Error fetching project:', projectError);
    return { success: false, error: 'Error fetching project' };
  }

  // Fetch sharer details
  const { data: sharerData, error: sharerError } = await supabase
    .from('profiles')
    .select('username, full_name')
    .eq('id', sharedById)
    .single();

  if (sharerError) {
    console.error('Error fetching sharer profile:', sharerError);
    return { success: false, error: 'Error fetching sharer profile' };
  }

  // Create notification record
  const notificationContent = `${sharerData.full_name || sharerData.username} shared project "${projectData.name}" with you`;
  
  const { data: notification, error: notificationError } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type: 'project_shared',
      content: notificationContent,
      metadata: {
        project_id: projectId,
        shared_by: sharedById,
        project_name: projectData.name
      }
    })
    .select()
    .single();

  if (notificationError) {
    console.error('Error creating notification:', notificationError);
    return { success: false, error: 'Error creating notification' };
  }

  // Send email notification (if needed)
  try {
    await sendEmailNotification(
      userId, 
      'Project Shared', 
      notificationContent,
      {
        action_url: `/projects/${projectId}`,
        action_text: 'View Project'
      }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    // Continue even if email fails
  }

  return { success: true, notification };
}

// Process comment added notification
async function processCommentAddedNotification(
  supabase: any,
  userId: string,
  data: { projectId: string; commentId: string; commenterId: string }
) {
  const { projectId, commentId, commenterId } = data;

  // Fetch project details
  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .select('name, user_id')
    .eq('id', projectId)
    .single();

  if (projectError) {
    console.error('Error fetching project:', projectError);
    return { success: false, error: 'Error fetching project' };
  }

  // Fetch commenter details
  const { data: commenterData, error: commenterError } = await supabase
    .from('profiles')
    .select('username, full_name')
    .eq('id', commenterId)
    .single();

  if (commenterError) {
    console.error('Error fetching commenter profile:', commenterError);
    return { success: false, error: 'Error fetching commenter profile' };
  }

  // Fetch comment details
  const { data: commentData, error: commentError } = await supabase
    .from('comments')
    .select('content')
    .eq('id', commentId)
    .single();

  if (commentError) {
    console.error('Error fetching comment:', commentError);
    return { success: false, error: 'Error fetching comment' };
  }

  // Create notification content
  const notificationContent = `${commenterData.full_name || commenterData.username} commented on project "${projectData.name}"`;
  
  // Create notification record
  const { data: notification, error: notificationError } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type: 'comment_added',
      content: notificationContent,
      metadata: {
        project_id: projectId,
        comment_id: commentId,
        commenter_id: commenterId,
        project_name: projectData.name,
        comment_preview: commentData.content.substring(0, 100) + (commentData.content.length > 100 ? '...' : '')
      }
    })
    .select()
    .single();

  if (notificationError) {
    console.error('Error creating notification:', notificationError);
    return { success: false, error: 'Error creating notification' };
  }

  // Send email notification (if needed)
  try {
    await sendEmailNotification(
      userId, 
      'New Comment on Your Project', 
      notificationContent,
      {
        action_url: `/projects/${projectId}#comment-${commentId}`,
        action_text: 'View Comment',
        preview_text: commentData.content.substring(0, 200) + (commentData.content.length > 200 ? '...' : '')
      }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    // Continue even if email fails
  }

  return { success: true, notification };
}

// Process team invitation notification
async function processTeamInvitationNotification(
  supabase: any,
  userId: string,
  data: { teamId: string; inviterId: string }
) {
  const { teamId, inviterId } = data;

  // Fetch team details
  const { data: teamData, error: teamError } = await supabase
    .from('teams')
    .select('name')
    .eq('id', teamId)
    .single();

  if (teamError) {
    console.error('Error fetching team:', teamError);
    return { success: false, error: 'Error fetching team' };
  }

  // Fetch inviter details
  const { data: inviterData, error: inviterError } = await supabase
    .from('profiles')
    .select('username, full_name')
    .eq('id', inviterId)
    .single();

  if (inviterError) {
    console.error('Error fetching inviter profile:', inviterError);
    return { success: false, error: 'Error fetching inviter profile' };
  }

  // Create notification content
  const notificationContent = `${inviterData.full_name || inviterData.username} invited you to join team "${teamData.name}"`;
  
  // Create notification record
  const { data: notification, error: notificationError } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type: 'team_invitation',
      content: notificationContent,
      metadata: {
        team_id: teamId,
        inviter_id: inviterId,
        team_name: teamData.name
      }
    })
    .select()
    .single();

  if (notificationError) {
    console.error('Error creating notification:', notificationError);
    return { success: false, error: 'Error creating notification' };
  }

  // Send email notification
  try {
    await sendEmailNotification(
      userId, 
      'Team Invitation', 
      notificationContent,
      {
        action_url: `/teams/${teamId}`,
        action_text: 'View Team'
      }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    // Continue even if email fails
  }

  return { success: true, notification };
}

// Helper function to send email notifications
async function sendEmailNotification(
  userId: string,
  subject: string,
  message: string,
  actionData?: {
    action_url?: string;
    action_text?: string;
    preview_text?: string;
  }
) {
  // You would implement this with your email service provider
  // Example using a hypothetical email service:
  
  /*
  const emailApiKey = Deno.env.get('EMAIL_API_KEY');
  const emailFrom = Deno.env.get('EMAIL_FROM');
  
  if (!emailApiKey || !emailFrom) {
    throw new Error('Email configuration missing');
  }
  
  // Get user's email
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single();
    
  if (userError || !userData) {
    throw new Error('Could not fetch user email');
  }
  
  // Send email using a service like SendGrid, Mailgun, etc.
  const response = await fetch('https://api.emailservice.com/v1/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${emailApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: emailFrom,
      to: userData.email,
      subject: subject,
      text: message,
      html: `<p>${message}</p>${actionData?.action_url ? `<p><a href="${actionData.action_url}">${actionData.action_text || 'View'}</a></p>` : ''}${actionData?.preview_text ? `<p>${actionData.preview_text}</p>` : ''}`,
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to send email');
  }
  
  return true;
  */
  
  // For now, just log the notification
  console.log(`Would send email to ${userId}: ${subject} - ${message}`);
  return true;
}

// Main process notification function
async function processNotification(req: Request) {
  try {
    const corsResponse = handleCorsOptions(req);
    if (corsResponse) return corsResponse;

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get request body
    const { type, userId, data } = await req.json() as NotificationPayload;

    // Validate required fields
    if (!type || !userId || !data) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Process notification based on type
    let result;
    
    switch (type) {
      case 'project_shared':
        result = await processProjectSharedNotification(supabase, userId, data as any);
        break;
      case 'comment_added':
        result = await processCommentAddedNotification(supabase, userId, data as any);
        break;
      case 'team_invitation':
        result = await processTeamInvitationNotification(supabase, userId, data as any);
        break;
      default:
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Unknown notification type: ${type}` 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error processing notification:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

// Main Edge Function handler
serve(processNotification);
```

### 3. Set Up Environment Variables

Create a `.env` file in the root of your project with the following variables:

```
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
EMAIL_API_KEY=your-email-service-api-key
EMAIL_FROM=notifications@lovablelabtools.com
```

## Deploying Edge Functions

### 1. Test Locally (Optional)

```bash
supabase functions serve process-notification
```

This will start a local server for testing.

### 2. Deploy to Supabase

```bash
supabase functions deploy process-notification --project-ref your-project-ref
```

Replace `your-project-ref` with your actual Supabase project reference. You can find this in the Supabase dashboard under Project Settings.

### 3. Set Environment Variables in Supabase

In the Supabase dashboard:
1. Go to Project Settings
2. Select "API" from the sidebar
3. Scroll down to "Environment Variables"
4. Add the variables listed above

## Testing the Edge Function

### Using curl

```bash
curl -X POST 'https://your-project-ref.supabase.co/functions/v1/process-notification' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer your-anon-key' \
  -d '{"type":"project_shared","userId":"user-uuid","data":{"projectId":"project-uuid","sharedById":"sharer-uuid"}}'
```

### From Frontend Application

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://your-project-ref.supabase.co',
  'your-anon-key'
)

const { data, error } = await supabase.functions.invoke('process-notification', {
  body: {
    type: 'project_shared',
    userId: 'user-uuid',
    data: {
      projectId: 'project-uuid',
      sharedById: 'sharer-uuid'
    }
  }
})

if (error) {
  console.error('Error invoking function:', error)
} else {
  console.log('Notification processed:', data)
}
```

## Adding More Edge Functions

To add more functions, follow the same pattern:

1. Create the function: `supabase functions new function-name`
2. Implement the function logic
3. Deploy the function: `supabase functions deploy function-name`

## Best Practices

1. **Error Handling**: Always include comprehensive error handling
2. **Logging**: Log important events for debugging
3. **Security**: Validate input and use proper authentication
4. **Environment Variables**: Use environment variables for sensitive information
5. **Rate Limiting**: Implement rate limiting for functions that could be abused
6. **Testing**: Test edge functions thoroughly before deploying

## Edge Function Examples

Here are additional Edge Function examples for the Lovable Lab Tools application:

### Project Analytics Tracker

```typescript
// supabase/functions/track-project-analytics/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { projectId, event, userId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Record analytics event
    const { data, error } = await supabase
      .from('project_analytics')
      .insert({
        project_id: projectId,
        event_type: event,
        user_id: userId,
        timestamp: new Date().toISOString()
      });
      
    if (error) throw error;
    
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
```

### External API Integration

```typescript
// supabase/functions/integrate-external-tool/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  try {
    const { toolId, data } = await req.json();
    
    // Example integration with external API
    const apiKey = Deno.env.get('EXTERNAL_TOOL_API_KEY');
    
    const response = await fetch('https://api.externaltool.com/v1/process', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data })
    });
    
    const result = await response.json();
    
    return new Response(JSON.stringify({ success: true, result }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
```

## Conclusion

Edge Functions provide a powerful way to extend your Supabase application with serverless functionality. For the Lovable Lab Tools application, they enable features like notifications, data processing, and third-party integrations without managing server infrastructure.

By following this guide, you can implement and deploy Edge Functions that enhance your application's capabilities while maintaining a serverless architecture. 