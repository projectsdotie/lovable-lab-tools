# Environment Setup for Lovable Lab Tools

This document outlines the different environment setups for the Lovable Lab Tools project, including development, testing, and production environments.

## Overview

Lovable Lab Tools uses environment variables to configure different aspects of the application, such as database connections, authentication, and third-party services. The project supports multiple environments:

1. **Development** - Local development environment
2. **Testing** - For automated tests and QA
3. **Staging** - Pre-production environment
4. **Production** - Live environment for end users

## Environment Variables

The application uses the following environment variables:

### Core Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (for Edge Functions) | Yes |
| `EMAIL_API_KEY` | API key for email service | Yes |
| `EMAIL_FROM` | Sender email address | Yes |

### OAuth Providers (Optional)

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | No |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | No |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret | No |

## Environment Files

The project uses different `.env` files for different environments:

- `.env.local` - Local development environment (not committed to Git)
- `.env.test` - Testing environment
- `.env.staging` - Staging environment
- `.env.production` - Production environment

Additionally, an `.env_example` file is provided as a template.

## Setting Up Development Environment

1. Copy the `.env_example` file to `.env.local`:

```bash
cp .env_example .env.local
```

2. Fill in the required environment variables in `.env.local`.

3. Start the development server:

```bash
npm run dev
```

## Setting Up Supabase Projects

### Local Development with Supabase CLI

For local development, you can use the Supabase CLI to start a local Supabase instance:

1. Install the Supabase CLI:

```bash
npm install -g supabase
```

2. Start the local Supabase instance:

```bash
supabase start
```

3. Generate types from your database schema:

```bash
supabase gen types typescript --local > src/types/supabase.ts
```

### Remote Supabase Projects

For different environments, create separate Supabase projects:

1. Create a Supabase project for each environment (dev, staging, prod)
2. Configure environment variables for each environment
3. Run migrations to set up database schema

## CI/CD Environment Configuration

For CI/CD pipelines (GitHub Actions, etc.), set up environment secrets:

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.PROD_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.PROD_SUPABASE_ANON_KEY }}
          
      # Add deployment steps here
```

## Environment-Specific Configuration for Edge Functions

Edge Functions may require different configuration based on the environment. Use the Supabase CLI to set up environment variables:

```bash
# For development
supabase secrets set --env-file .env.local --project-ref <dev-project-ref>

# For production
supabase secrets set --env-file .env.production --project-ref <prod-project-ref>
```

## Supabase Migration Between Environments

When promoting changes between environments, use Supabase migrations:

1. Generate a migration:

```bash
supabase db diff --use-migra -f migration_name
```

2. Apply the migration to the target environment:

```bash
supabase db push
```

## Local Environment Setup Tips

1. **Environment Switching**:

   Use a script to switch between environments:

   ```bash
   # switch-env.sh
   #!/bin/bash
   cp .env.$1 .env
   echo "Switched to $1 environment"
   ```

2. **Mocking Third-Party Services**:

   For development, consider mocking services like email:

   ```javascript
   // Mock email service in development
   if (import.meta.env.DEV) {
     // Log email instead of sending
     console.log('Email would be sent:', { to, subject, body });
     return { success: true };
   }
   ```

## Environment Variable Security

1. **Never commit sensitive environment variables to Git**.
2. **Use secrets management** for CI/CD pipelines.
3. **Limit access to production environment variables**.
4. **Rotate keys periodically**, especially for production environments.

## Environment Setup Checklist

Use this checklist when setting up a new environment:

- [ ] Create Supabase project
- [ ] Configure environment variables
- [ ] Run database migrations
- [ ] Deploy Edge Functions
- [ ] Set up authentication providers
- [ ] Configure email service
- [ ] Test the deployment

## Troubleshooting

### Common Issues

1. **"API rate limit exceeded"**:
   - Switch to a different Supabase project
   - Check for infinite loops in code

2. **"Invalid API key"**:
   - Verify environment variables are correctly set
   - Check if API keys are still valid

3. **"CORS error"**:
   - Add your domain to the allowed origins in Supabase

4. **"Function execution failed"**:
   - Check Edge Function logs in Supabase dashboard
   - Verify all required environment variables are set 