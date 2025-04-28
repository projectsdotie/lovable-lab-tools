# Lovable Lab Tools - Supabase Edge Functions

This document outlines the Edge Functions implemented for the Lovable Lab Tools application. Edge Functions are serverless functions that run on Supabase's global edge network.

## Overview

Edge Functions help extend the functionality of the application beyond what can be achieved with standard Supabase features like database and authentication. They're particularly useful for integrating with third-party services, performing complex calculations, or implementing custom business logic.

## Functions List

### 1. `user-onboarding`

**Purpose:** Handles new user registration processes, including creating a profile and sending welcome emails.

**Trigger:** Automatically triggered when a new user signs up.

**Implementation:**

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
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )
    
    // Get the user from the request
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      throw new Error('Unauthorized')
    }
    
    // Create a profile for the new user
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .insert({
        id: user.id,
        username: user.email?.split('@')[0] || `user_${Math.floor(Math.random() * 1000)}`,
      })
    
    if (profileError) {
      throw profileError
    }
    
    // Add any additional onboarding logic here
    // For example, sending welcome emails via a third-party service
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
```

### 2. `project-share-notification`

**Purpose:** Sends notifications when a project is shared with a user.

**Trigger:** Called when a user shares a project with another user.

**Implementation:**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    // Parse the request body
    const { projectId, userId, accessLevel } = await req.json()
    
    if (!projectId || !userId || !accessLevel) {
      throw new Error('Missing required fields')
    }
    
    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )
    
    // Get the user who is the recipient of the shared project
    const { data: recipientData, error: recipientError } = await supabaseClient
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single()
    
    if (recipientError || !recipientData) {
      throw new Error('Recipient user not found')
    }
    
    // Get the project details
    const { data: projectData, error: projectError } = await supabaseClient
      .from('projects')
      .select('name, user_id')
      .eq('id', projectId)
      .single()
    
    if (projectError || !projectData) {
      throw new Error('Project not found')
    }
    
    // Get the user who owns the project
    const { data: ownerData, error: ownerError } = await supabaseClient
      .from('profiles')
      .select('username')
      .eq('id', projectData.user_id)
      .single()
    
    if (ownerError || !ownerData) {
      throw new Error('Project owner not found')
    }
    
    // In a real implementation, you would integrate with an email service or
    // push notification service to send the actual notification
    console.log(`Project ${projectData.name} has been shared with ${recipientData.username} by ${ownerData.username} with ${accessLevel} access`)
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
```

### 3. `tool-usage-analytics`

**Purpose:** Tracks and records tool usage for analytics purposes.

**Trigger:** Called when a user interacts with a tool in the application.

**Implementation:**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    // Parse the request body
    const { toolId, projectId, action } = await req.json()
    
    if (!toolId || !action) {
      throw new Error('Missing required fields')
    }
    
    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )
    
    // Get the user from the request
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      throw new Error('Unauthorized')
    }
    
    // In a production environment, you would insert this data into an analytics table
    // For this example, we'll just log it
    console.log(`User ${user.id} used tool ${toolId} with action ${action} in project ${projectId || 'N/A'}`)
    
    // If you had an analytics table, you would insert into it like this:
    /*
    const { error: analyticsError } = await supabaseClient
      .from('tool_usage_analytics')
      .insert({
        user_id: user.id,
        tool_id: toolId,
        project_id: projectId,
        action: action,
        timestamp: new Date().toISOString(),
      })
    
    if (analyticsError) {
      throw analyticsError
    }
    */
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
```

## Deploying Edge Functions

To deploy an Edge Function to your Supabase project:

1. Install the Supabase CLI
2. Initialize functions in your project
3. Create a function using `supabase functions new function-name`
4. Implement the function in the generated file
5. Deploy using `supabase functions deploy function-name`

## Security Considerations

- Edge Functions run with the security context of the authenticated user
- Use Row Level Security (RLS) policies to control data access
- Never expose sensitive credentials in function code
- Validate all input parameters
- Implement proper error handling and logging

## Testing Edge Functions

You can test Edge Functions locally before deploying:

```bash
supabase start
supabase functions serve user-onboarding --env-file .env.local
```

Then use a tool like curl or Postman to make requests to `http://localhost:54321/functions/v1/user-onboarding`.

## Monitoring and Debugging

- View function logs in the Supabase dashboard
- Monitor function execution times and error rates
- Set up alerts for function failures

This documentation provides a foundation for implementing serverless functionality in the Lovable Lab Tools application. Adapt and extend these functions based on specific application requirements. 