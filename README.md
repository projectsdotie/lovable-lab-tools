# Lovable Lab Tools

A comprehensive toolset for AI Builders to enhance development productivity, manage projects, and collaborate with team members.

## Project Info

**URL**: https://lovable.dev/projects/7d300eb1-b8b3-4ff9-a3cb-4d68a8ca186a

## Overview

Lovable Lab Tools is a React-based web application designed to provide AI Builders with a suite of tools for managing development projects. It offers authentication, project management, team collaboration features, and integrates with various development tools.

## Features

- **User Authentication**: Secure user authentication and authorization
- **Project Management**: Create, edit, and manage development projects
- **Team Collaboration**: Share projects and collaborate with team members
- **Tool Integration**: Access and utilize various development tools
- **Notifications System**: Real-time notifications for project activities
- **Profile Management**: Update and customize user profiles

## Technology Stack

- **Frontend**:
  - React 18 with TypeScript
  - Vite for build tooling
  - React Router for navigation
  - TanStack Query for data fetching
  - shadcn/ui components with Tailwind CSS

- **Backend**:
  - Supabase for authentication, database, and storage
  - Supabase Edge Functions for server-side processing
  - PostgreSQL for data storage

## Getting Started

### Prerequisites

- Node.js (v16+) and npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- Git
- Supabase account (for backend services)

### Installation

1. Clone the repository:
   ```sh
   git clone <YOUR_GIT_URL>
   ```

2. Navigate to the project directory:
   ```sh
   cd lovable-lab-tools
   ```

3. Install dependencies:
   ```sh
   npm install
   ```

4. Create a `.env` file in the project root with the following variables (based on `.env_example`):
   ```
   # Supabase Configuration
   VITE_SUPABASE_URL="your-supabase-project-url"
   VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
   ```

5. Start the development server:
   ```sh
   npm run dev
   ```

6. Open your browser to view the app at: http://localhost:5173/

## Development Options

### Use Lovable

Visit the [Lovable Project](https://lovable.dev/projects/7d300eb1-b8b3-4ff9-a3cb-4d68a8ca186a) and start prompting.
Changes made via Lovable will be committed automatically to this repo.

### Use your preferred IDE

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

### Edit a file directly in GitHub

- Navigate to the desired file(s)
- Click the "Edit" button (pencil icon) at the top right of the file view
- Make your changes and commit the changes

### Use GitHub Codespaces

- Navigate to the main page of your repository
- Click on the "Code" button (green button) near the top right
- Select the "Codespaces" tab
- Click on "New codespace" to launch a new Codespace environment
- Edit files directly within the Codespace and commit and push your changes once you're done

## Deployment

1. Build the production version:
   ```sh
   npm run build
   ```

2. To deploy via Lovable:
   - Open [Lovable](https://lovable.dev/projects/7d300eb1-b8b3-4ff9-a3cb-4d68a8ca186a)
   - Click on Share -> Publish

3. For custom domains, we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)

## Environment Variables

```
# Supabase Configuration
VITE_SUPABASE_URL="your-supabase-project-url"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Email Service (for notifications via Edge Functions)
EMAIL_API_KEY="your-email-service-api-key"
EMAIL_FROM="notifications@yourdomain.com"

# OAuth Providers (Optional - Add if using social logins)
# GOOGLE_CLIENT_ID="your-google-client-id"
# GOOGLE_CLIENT_SECRET="your-google-client-secret"
# GITHUB_CLIENT_ID="your-github-client-id"
# GITHUB_CLIENT_SECRET="your-github-client-secret"
```

## Contributing

We welcome contributions to improve Lovable Lab Tools! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and commit them: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
