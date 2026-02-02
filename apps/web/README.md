# Trackly Home Frontend

This is the React frontend for Trackly Home, a household coordination MVP built with modern web technologies.

## Technology Stack

- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **UI Library:** Chakra UI (migrated from Tailwind CSS)
- **Routing:** React Router v6
- **Backend:** Supabase (Auth, Database, Realtime)
- **State Management:** React Query for server state
- **Styling:** Chakra UI theme system

## Project Structure

```
apps/web/src/
├── components/          # Reusable UI components
│   ├── AddTask.tsx      # Task creation form
│   ├── AppHeader.tsx    # Top navigation bar
│   ├── BulkActionsBar.tsx # Multi-select task operations
│   ├── DeleteTaskDialog.tsx # Soft delete confirmation
│   ├── EditTaskModal.tsx # Task editing form
│   ├── InvitePartnerCard.tsx # Household invitation UI
│   ├── ManageRolesCard.tsx # Role management for admins
│   ├── TaskFilters.tsx  # Filter and sort controls
│   ├── TaskItem.tsx     # Individual task display
│   ├── TaskList.tsx     # Task list container
│   └── ...
├── hooks/               # Custom React hooks
│   ├── useTaskBulkActions.ts # Multi-select state
│   ├── useTaskFilters.ts # Filter/sort state
│   └── ...
├── lib/                 # Utilities and configuration
├── router/              # React Router setup
├── screens/             # Page-level components
│   ├── AppShell.tsx     # Main app layout
│   ├── AuthCallback.tsx # OAuth callback handling
│   ├── JoinPage.tsx     # Accept household invite
│   ├── LoginPage.tsx    # Magic link authentication
│   ├── SetupPage.tsx    # Household creation
│   ├── TasksScreen.tsx  # Task management interface
│   └── ...
├── services/            # Supabase API calls
│   ├── members.ts       # Household member operations
│   ├── supabase.ts      # Supabase client setup
│   └── tasks.ts         # Task CRUD operations
├── types/               # TypeScript interfaces
│   └── task.ts          # Task-related types
└── theme.ts             # Chakra UI theme configuration
```

## Key Features

### Authentication
- Email magic link sign-in
- Session persistence
- Protected routes with role-based access

### Household Management
- Create and join households
- Role-based permissions (Owner/Admin/Member)
- Secure invite system

### Task Management
- Create, view, edit, and complete tasks
- Assign tasks to household members
- Due dates with overdue indicators
- Task notes and descriptions
- Soft delete with restore capability
- Bulk operations (complete, delete, assign)
- Advanced filtering and sorting

### UI/UX
- Responsive design with Chakra UI
- Loading states and error handling
- Toast notifications
- Optimistic updates
- Mobile-friendly interface

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
```

### Environment Variables

Create `.env.local` with:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Architecture Decisions

### Chakra UI Migration
- **Why:** Better component consistency and theming
- **When:** Phase 0 of Planner MVP (18 components migrated)
- **Impact:** Improved maintainability and design system

### Service Layer Pattern
- **Why:** Centralized API calls with error handling
- **Structure:** One service file per domain (tasks, members)
- **Benefits:** Reusable, testable, consistent error handling

### Custom Hooks for State
- **Why:** Complex state logic (filters, bulk actions)
- **Pattern:** `useTaskFilters`, `useTaskBulkActions`
- **Benefits:** Reusable, testable, separation of concerns

### Optimistic Updates
- **Why:** Better UX for task completion
- **Implementation:** Update local state immediately, rollback on error
- **Fallback:** Server state via React Query

## Component Patterns

### Task Components
- `TaskItem`: Individual task display with actions
- `TaskList`: Container with filtering and sorting
- `AddTask`: Creation form
- `EditTaskModal`: Editing interface
- `TaskFilters`: Filter and sort controls

### Layout Components
- `AppShell`: Main app layout with navigation
- `AppHeader`: Top bar with user info and actions

### Dialog/Modal Components
- `DeleteTaskDialog`: Confirmation dialogs
- `EditTaskModal`: Form modals

## State Management

### Server State (React Query)
- Task lists and individual tasks
- Household member data
- Authentication state

### Client State (Custom Hooks)
- UI filters and sorting preferences
- Bulk selection state
- Form state (handled by components)

### Global State (Context)
- User authentication
- Household context
- Theme preferences

## Testing

Currently manual testing via checklists. Future: automated tests with Vitest and React Testing Library.

## Deployment

Deployed via Azure Static Web Apps with GitHub Actions CI/CD.

## Contributing

1. Follow the spec-driven development workflow
2. Use conventional commits
3. Update documentation with code changes
4. Test manually before committing
5. Ensure builds pass and linting succeeds
