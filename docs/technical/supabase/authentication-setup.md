# Supabase Authentication Setup for Lovable Lab Tools

This document outlines how to set up and configure authentication in Supabase for the Lovable Lab Tools application.

## Prerequisites

- Supabase project created
- Basic understanding of authentication flows
- Next.js installed and configured with Supabase client

## Authentication Overview

Supabase provides a complete authentication system that supports:

- Email and password authentication
- Social logins (Google, GitHub, etc.)
- Magic links (passwordless email login)
- Phone authentication
- Custom authentication flows

For Lovable Lab Tools, we primarily use email/password authentication with the option to add social logins.

## Setting Up Authentication in Supabase Dashboard

### 1. Configure Authentication Providers

1. Log in to the [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to `Authentication` → `Providers`
4. Enable the providers you wish to use:
   - Email (enabled by default)
   - Google (requires Google OAuth credentials)
   - GitHub (requires GitHub OAuth credentials)
   - Other providers as needed

### 2. Configure Email Templates

1. Navigate to `Authentication` → `Email Templates`
2. Customize the following templates:
   - Confirmation
   - Invitation
   - Magic Link
   - Reset Password
   - Change Email

Use variables like `{{ .ConfirmationURL }}` in your templates to include relevant links.

### 3. Set Authentication Settings

1. Navigate to `Authentication` → `Settings`
2. Configure:
   - Site URL (set to your production or development URL)
   - Redirect URLs (allowed URLs for redirects after authentication)
   - User Sign-ups (enable/disable)
   - Confirm emails (recommended to enable)
   - Email rate limits

## Implementing Authentication in Your Application

### 1. Install Required Dependencies

```bash
npm install @supabase/auth-helpers-nextjs @supabase/auth-helpers-react @supabase/supabase-js
```

### 2. Set Up Environment Variables

Create or update your `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Create a Supabase Client

Create a file `lib/supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
```

### 4. Implement Sign-Up Functionality

Create a sign-up component:

```jsx
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      setMessage('Check your email for the confirmation link!')
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSignUp}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <div className="error">{error}</div>}
      {message && <div className="message">{message}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Loading...' : 'Sign Up'}
      </button>
    </form>
  )
}
```

### 5. Implement Sign-In Functionality

Create a sign-in component:

```jsx
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'

export default function SignIn() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Redirect to dashboard after successful login
      router.push('/dashboard')
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSignIn}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Loading...' : 'Sign In'}
      </button>
    </form>
  )
}
```

### 6. Implement Magic Link Authentication (Optional)

```jsx
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function MagicLink() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleMagicLink = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      setMessage('Check your email for the magic link!')
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleMagicLink}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      {error && <div className="error">{error}</div>}
      {message && <div className="message">{message}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Loading...' : 'Send Magic Link'}
      </button>
    </form>
  )
}
```

### 7. Create Auth Context for User State Management

Create a file `contexts/AuthContext.js`:

```jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active sessions and set the user
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)

      // Listen for changes to auth state
      const { data: { subscription } } = await supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUser(session?.user ?? null)
        }
      )

      return () => subscription.unsubscribe()
    }

    getSession()
  }, [])

  const value = {
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: () => supabase.auth.signOut(),
    user,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
```

Update your `_app.js` to use the AuthProvider:

```jsx
import { AuthProvider } from '../contexts/AuthContext'

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  )
}

export default MyApp
```

### 8. Create Protected Routes

Create an HOC to protect routes that require authentication:

```jsx
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'

export default function withAuth(Component) {
  return function AuthenticatedComponent(props) {
    const { user } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!user) {
        router.push('/auth/signin')
      }
    }, [user, router])

    // If user is not authenticated, don't render the protected component
    if (!user) {
      return null
    }

    return <Component {...props} />
  }
}
```

Use the HOC for protected pages:

```jsx
import withAuth from '../components/withAuth'

function Dashboard() {
  return <div>Protected Dashboard Content</div>
}

export default withAuth(Dashboard)
```

## Setting Up Social Logins

### Google Authentication

1. Create OAuth credentials in Google Cloud Console
2. Navigate to Supabase Authentication → Providers → Google
3. Enable Google auth
4. Add your Google Client ID and Secret
5. Set up redirect URLs in Google Console

### GitHub Authentication

1. Create an OAuth App in GitHub Developer Settings
2. Navigate to Supabase Authentication → Providers → GitHub
3. Enable GitHub auth
4. Add your GitHub Client ID and Secret
5. Set up redirect URLs in GitHub OAuth App settings

### Implementing Social Login Buttons

```jsx
import { supabase } from '../lib/supabase'
import { useState } from 'react'

export default function SocialLogin() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGitHubLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button 
        onClick={handleGoogleLogin} 
        disabled={loading}
      >
        Sign In with Google
      </button>
      
      <button 
        onClick={handleGitHubLogin} 
        disabled={loading}
      >
        Sign In with GitHub
      </button>
      
      {error && <div className="error">{error}</div>}
    </div>
  )
}
```

## Implementing the Callback Handler

Create a file `pages/auth/callback.js`:

```jsx
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          router.push('/dashboard')
        }
      }
    )

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [router])

  return <div>Loading...</div>
}
```

## User Profile Management

### Creating a User Profile on Sign-Up

To create a user profile in your database when a user signs up, you can use Supabase triggers and functions:

```sql
-- In your SQL migrations or via the Supabase SQL editor

-- Create a profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT UNIQUE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create a function to create a new profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function when a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Implementing a User Profile Page

```jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import withAuth from '../components/withAuth'

function UserProfile() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function getProfile() {
      try {
        setLoading(true)
        
        const { data, error } = await supabase
          .from('profiles')
          .select('username, full_name, avatar_url')
          .eq('id', user.id)
          .single()
          
        if (error) throw error

        if (data) {
          setUsername(data.username || '')
          setFullName(data.full_name || '')
          setAvatarUrl(data.avatar_url || '')
        }
      } catch (error) {
        console.error('Error loading user profile:', error)
        setError('Error loading user profile')
      } finally {
        setLoading(false)
      }
    }

    if (user) getProfile()
  }, [user])

  async function updateProfile() {
    try {
      setUpdating(true)
      setError('')
      setMessage('')
      
      const updates = {
        username,
        full_name: fullName,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error
      
      setMessage('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      setError('Error updating profile')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1>User Profile</h1>
      
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="text"
          value={user.email}
          disabled
        />
      </div>
      
      <div>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      
      <div>
        <label htmlFor="fullName">Full Name</label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>
      
      <div>
        <label htmlFor="avatarUrl">Avatar URL</label>
        <input
          id="avatarUrl"
          type="text"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
        />
      </div>
      
      {avatarUrl && (
        <div>
          <img 
            src={avatarUrl}
            alt="Avatar"
            style={{ width: '100px', height: '100px' }}
          />
        </div>
      )}
      
      {error && <div className="error">{error}</div>}
      {message && <div className="message">{message}</div>}
      
      <button
        onClick={updateProfile}
        disabled={updating}
      >
        {updating ? 'Updating...' : 'Update Profile'}
      </button>
    </div>
  )
}

export default withAuth(UserProfile)
```

## Password Reset Functionality

### Implementing a Password Reset Form

```jsx
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function PasswordReset() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleReset = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      })

      if (error) throw error

      setMessage('Password reset instructions sent to your email!')
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleReset}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      {error && <div className="error">{error}</div>}
      {message && <div className="message">{message}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Loading...' : 'Reset Password'}
      </button>
    </form>
  )
}
```

### Implementing an Update Password Page

Create a file `pages/update-password.js`:

```jsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function UpdatePassword() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    // Check if we have a session from the password reset email
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        // User has followed the password reset link
        console.log("Password recovery session detected")
      }
    })
  }, [])

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) throw error

      setMessage('Password updated successfully!')
      
      // Redirect to login after a delay
      setTimeout(() => {
        router.push('/auth/signin')
      }, 2000)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handlePasswordUpdate}>
      <div>
        <label htmlFor="password">New Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <div className="error">{error}</div>}
      {message && <div className="message">{message}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Updating...' : 'Update Password'}
      </button>
    </form>
  )
}
```

## Row Level Security (RLS) Policies

To secure your data based on user authentication, implement Row Level Security policies:

```sql
-- Enable RLS on your tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Project-specific policies
CREATE POLICY "Users can view their own projects"
  ON public.projects
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## Security Best Practices

1. **Always use HTTPS**: Ensure your application is served over HTTPS
2. **Validate user input**: Always validate and sanitize user input
3. **Use secure password policies**: Enforce strong passwords
4. **Rate limit authentication attempts**: Prevent brute-force attacks
5. **Set up JWT expiration**: Configure reasonable token lifetimes
6. **Use RLS policies**: Implement Row Level Security for database access
7. **Protect sensitive routes**: Use server-side authentication checks
8. **Keep service role key secure**: Never expose your service role key in client-side code
9. **Set up security headers**: Implement CSP, HSTS, etc.
10. **Regular security audits**: Perform regular security reviews

## Troubleshooting

### Common Issues and Solutions

1. **User Not Redirected After Login**:
   - Check your redirect URLs in the Supabase dashboard
   - Verify the callback handling in your application

2. **Email Verification Not Working**:
   - Check your Site URL in the Supabase dashboard
   - Verify your email templates

3. **Social Login Failing**:
   - Verify OAuth credentials
   - Check redirect URLs in both Supabase and the OAuth provider

4. **Database Access Denied**:
   - Review your RLS policies
   - Check if the user is authenticated

5. **Token Expiration Issues**:
   - Implement a token refresh strategy
   - Handle session expiration gracefully

## Conclusion

Supabase provides a comprehensive authentication system that can be easily integrated into your Next.js application. By following the steps outlined in this document, you can implement secure authentication for Lovable Lab Tools with features like email/password login, social logins, password reset, and user profile management.

Remember to follow security best practices and regularly review your authentication implementation as your application evolves.

For more information, refer to the [Supabase Auth documentation](https://supabase.com/docs/guides/auth). 