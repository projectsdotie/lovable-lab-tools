# Authentication in Lovable Lab Tools

This document outlines the authentication system used in the Lovable Lab Tools application, which leverages Supabase Auth.

## Overview

Lovable Lab Tools uses Supabase Auth for user authentication. Supabase Auth is a full-featured authentication system that supports:

- Email and password authentication
- Social provider login (Google, GitHub, etc.)
- Magic link authentication
- Phone authentication
- Multi-factor authentication (MFA)
- Session management
- Row-level security (RLS) integration

## Authentication Flow

1. **Sign Up**: Users create an account using email/password or a social provider
2. **Sign In**: Users authenticate to access the application
3. **Session Management**: JWT tokens handle user sessions
4. **Access Control**: RLS policies restrict data access based on user identity

## Configuration

### Supabase Client Setup

The application initializes Supabase with authentication configuration:

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Auth Provider Component

An AuthProvider wraps the application to manage the authentication state:

```tsx
// components/AuthProvider.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

## Authentication Methods

### Email and Password Sign Up

```tsx
// components/SignUpForm.tsx
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      setMessage('Check your email for the confirmation link!');
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignUp}>
      {/* Form fields */}
    </form>
  );
}
```

### Email and Password Sign In

```tsx
// components/SignInForm.tsx
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignIn}>
      {/* Form fields */}
    </form>
  );
}
```

### Social Authentication

```tsx
// components/SocialAuth.tsx
import { supabase } from '@/lib/supabase';

export default function SocialAuth() {
  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleGitHubSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div>
      <button onClick={handleGoogleSignIn}>Sign in with Google</button>
      <button onClick={handleGitHubSignIn}>Sign in with GitHub</button>
    </div>
  );
}
```

### Magic Link Authentication

```tsx
// components/MagicLinkForm.tsx
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function MagicLinkForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      setMessage('Check your email for the login link!');
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleMagicLink}>
      {/* Form fields */}
    </form>
  );
}
```

### Sign Out

```tsx
// components/SignOutButton.tsx
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/router';

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return <button onClick={handleSignOut}>Sign Out</button>;
}
```

## Protected Routes

To ensure only authenticated users can access certain routes, a Higher-Order Component (HOC) is used:

```tsx
// components/withAuth.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/components/AuthProvider';

export default function withAuth<P>(
  WrappedComponent: React.ComponentType<P>
) {
  const WithAuth = (props: P) => {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !user) {
        router.push('/login');
      }
    }, [isLoading, user, router]);

    if (isLoading) {
      return <div>Loading...</div>;
    }

    if (!user) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };

  return WithAuth;
}
```

Usage:

```tsx
// pages/dashboard.tsx
import withAuth from '@/components/withAuth';

function Dashboard() {
  return <div>Protected Dashboard Page</div>;
}

export default withAuth(Dashboard);
```

## Auth Callback Handler

For OAuth and magic link redirects, an auth callback page is needed:

```tsx
// pages/auth/callback.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const { hash, search } = window.location;
    
    if (hash || search) {
      // Handle the OAuth callback
      supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN') {
          router.push('/dashboard');
        }
      });
    }
  }, [router]);

  return <div>Processing authentication...</div>;
}
```

## User Profiles

When a user registers, a corresponding entry is created in the `profiles` table via a database trigger:

```sql
-- SQL Trigger for new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## Security Considerations

1. **JWT Expiry**: Configure appropriate token expiry times in Supabase Auth settings
2. **PKCE Flow**: Use PKCE for OAuth authorization for enhanced security
3. **Secure Headers**: Implement appropriate security headers
4. **Email Verification**: Enforce email verification for new accounts
5. **Password Policy**: Enforce strong password requirements
6. **Rate Limiting**: Enable rate limiting for auth endpoints to prevent abuse

## Supabase Auth Settings

The following settings can be configured in the Supabase Dashboard:

1. **Email Auth**: Enable/disable email authentication
2. **External Providers**: Configure OAuth providers
3. **Email Templates**: Customize email templates for auth flows
4. **Hooks**: Set up webhooks for auth events
5. **Session Settings**: Configure session timeouts and refresh tokens
6. **Advanced Settings**: Configure SMTP settings, reCAPTCHA, etc.

## Testing Authentication

For testing authentication flows, you can:

1. Create test users through the Supabase dashboard
2. Use end-to-end testing frameworks like Cypress
3. Mock Supabase Auth in unit tests

## Troubleshooting

Common authentication issues:

1. **JWT Token Expiry**: If users are unexpectedly logged out, check token expiry settings
2. **CORS Issues**: Ensure Supabase URL settings allow your application domain
3. **Redirect Issues**: Check that redirect URLs are correctly configured for OAuth providers
4. **Email Delivery**: Test email delivery for password resets and magic links

## Best Practices

1. **Use Typed Client**: Use typed Supabase client for better type safety
2. **Separate Auth Logic**: Keep authentication logic in dedicated hooks or context
3. **Use Server-Side Auth**: For server components, use server-side authentication
4. **Protect API Routes**: Add authentication checks to API routes

```typescript
// Example: Typed Supabase Client
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

## References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js with Supabase Auth](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [JWT Security Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/) 