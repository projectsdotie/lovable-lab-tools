# Lovable Lab Tools - Application Rebuild Prompt

## Application Overview

Create a modern web application for development tool management called "Lovable Lab Tools." This application will allow developers to organize, access, and share various development tools in a collaborative environment.

## Technical Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context API and TanStack Query
- **Routing**: React Router v6
- **Database & Auth**: Supabase
- **Form Handling**: React Hook Form with Zod validation

## Core Features

### 1. Authentication System

- Email/password authentication
- OAuth integration (Google, GitHub)
- Protected routes
- User profile management
- Password recovery flow

### 2. Project Management

- Create, read, update, delete (CRUD) operations for projects
- Project details view with description, tools, and team members
- Project sharing with configurable access levels (view/edit)
- Project categorization with tags

### 3. Tool Integration

- Tool categorization by type (Generator Tools, Time Tools, Notes Tools)
- Tool configuration interface
- Tool usage tracking
- Tool search and filtering

### 4. Team Collaboration

- User invitation system
- Permission-based access control
- Activity logs for project changes
- Comments and feedback system

### 5. User Interface

- Responsive design for mobile and desktop
- Dark/light theme support
- Toast notifications for user actions
- Loading states for asynchronous operations
- Accessible components following WCAG guidelines

## Database Schema

### Tables

1. **profiles** - User profiles (extends Supabase Auth)
   - id (UUID, PK)
   - username (String)
   - avatar_url (String)
   - created_at (Timestamp)
   - updated_at (Timestamp)

2. **projects** - User projects
   - id (UUID, PK)
   - name (String)
   - description (Text)
   - url (String, nullable)
   - user_id (UUID, FK to auth.users)
   - tools (Array of Strings)
   - created_at (Timestamp)
   - updated_at (Timestamp)

3. **project_access** - Project sharing permissions
   - id (UUID, PK)
   - project_id (UUID, FK to projects)
   - user_id (UUID, FK to auth.users)
   - access_level (String - "view" or "edit")
   - created_at (Timestamp)
   - updated_at (Timestamp)

4. **tools** - Available tools in the system
   - id (UUID, PK)
   - name (String)
   - type (String)
   - created_at (Timestamp)
   - updated_at (Timestamp)

## Key Components

### Pages

1. **Index.tsx** - Home/dashboard page
2. **Auth.tsx** - Authentication page with login/signup forms
3. **Profile.tsx** - User profile management
4. **Projects.tsx** - Project listing and management
5. **Teams.tsx** - Team management interface
6. **NotFound.tsx** - 404 page

### Components

1. **Header.tsx** - Application header with navigation
2. **Sidebar.tsx** - Navigation sidebar
3. **UserMenu.tsx** - User profile dropdown
4. **ProjectPreview.tsx** - Project card display
5. **Tool components** - Individual tool components by category

### Contexts

1. **AuthContext.tsx** - Authentication state management

### Services

1. **projectService.ts** - API calls for project management
2. **Supabase client configuration**

## Implementation Requirements

1. **Authentication Flow**:
   - Implement secure authentication using Supabase Auth
   - Handle session persistence
   - Implement protected routes
   - Create profile creation on signup

2. **Project Management**:
   - Create forms for project creation/editing
   - Implement project listing with filters
   - Enable project sharing with different access levels
   - Add tool association to projects

3. **UI Components**:
   - Build reusable UI components using shadcn/ui
   - Ensure mobile responsiveness
   - Implement dark/light theme
   - Create consistent loading states

4. **API Integration**:
   - Set up Supabase client
   - Create service layer for all API calls
   - Implement proper error handling
   - Add optimistic updates for better UX

5. **Performance Considerations**:
   - Implement code splitting
   - Optimize bundle size
   - Add proper data fetching strategies
   - Cache appropriate data

## Best Practices to Follow

1. **Code Organization**:
   - Follow feature-based folder structure
   - Keep components small and focused
   - Use TypeScript properly with clear interfaces
   - Document complex logic

2. **State Management**:
   - Use context for global state
   - Rely on TanStack Query for server state
   - Implement proper loading/error states
   - Use local state for component-specific state

3. **Security**:
   - Implement proper auth checks
   - Validate all user inputs
   - Use environment variables for sensitive information
   - Follow Supabase security best practices

4. **Accessibility**:
   - Ensure ARIA attributes are properly used
   - Support keyboard navigation
   - Maintain proper contrast ratios
   - Test with screen readers

## Development Workflow

1. Set up the project with Vite + React + TypeScript
2. Configure Tailwind CSS and shadcn/ui
3. Set up Supabase client and authentication
4. Implement core pages and navigation
5. Create project management functionality
6. Add tool integration
7. Implement collaboration features
8. Polish UI/UX and ensure responsiveness
9. Perform testing and bug fixes
10. Deploy the application

This comprehensive rebuild prompt provides all the necessary information to recreate the Lovable Lab Tools application with modern best practices and a clear architectural approach. 