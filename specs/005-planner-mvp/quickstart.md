# Quickstart Guide: Planner MVP Implementation

**Feature**: Task Management (Phase 5)  
**Created**: 2026-01-25  
**Audience**: Developers implementing this feature

---

## Overview

This feature implements a basic task management system with Chakra UI migration as prerequisite. Development happens in phases:

- **Phase 0**: Migrate existing UI from Tailwind CSS to Chakra UI
- **Phase 1**: Database (tasks table + RLS policies)
- **Phase 2**: Task viewing (TaskList component)
- **Phase 3**: Task creation (AddTask component)
- **Phase 4**: Task completion (status toggle)
- **Phase 5**: Optional enhancements (assignment, due dates)

---

## Prerequisites

Ensure you have:
- [ ] Supabase CLI installed (`npx supabase --version`)
- [ ] Local Supabase instance running (`npx supabase start`)
- [ ] Node.js 18+ and npm
- [ ] Git branch `005-planner-mvp` checked out

---

## Phase 0: Chakra UI Migration

### 1. Install Dependencies

```bash
cd apps/web

# Install Chakra UI
npm install @chakra-ui/react@^2.8.2 @emotion/react@^11.11.3 @emotion/styled@^11.11.0 framer-motion@^10.18.0

# Remove Tailwind CSS
npm uninstall @tailwindcss/vite tailwindcss
```

### 2. Create Theme Configuration

Create `apps/web/src/theme.ts`:

```typescript
import { extendTheme } from '@chakra-ui/react';

export const theme = extendTheme({
  colors: {
    brand: {
      50: '#e3f2fd',
      100: '#bbdefb',
      200: '#90caf9',
      300: '#64b5f6',
      400: '#42a5f5',
      500: '#2196f3',
      600: '#1e88e5',
      700: '#1976d2',
      800: '#1565c0',
      900: '#0d47a1',
    },
  },
  fonts: {
    heading: "'Inter', sans-serif",
    body: "'Inter', sans-serif",
  },
});
```

### 3. Update App.tsx

Wrap app with ChakraProvider:

```typescript
import { ChakraProvider } from '@chakra-ui/react';
import { theme } from './theme';

function App() {
  return (
    <ChakraProvider theme={theme}>
      {/* existing router code */}
    </ChakraProvider>
  );
}
```

### 4. Remove Tailwind Files

```bash
# Delete Tailwind CSS imports
rm apps/web/src/index.css

# Remove Tailwind imports from main.tsx
# (Remove: import './index.css')
```

### 5. Migrate Components

**Migration guide (example: LoginPage)**:

```typescript
// Before (Tailwind)
<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
  <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
    <h1 className="text-2xl font-bold text-gray-900 mb-6">Sign In</h1>
    <input
      type="email"
      className="w-full px-4 py-2 border border-gray-300 rounded-md"
      placeholder="Enter your email"
    />
    <button className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">
      Send Magic Link
    </button>
  </div>
</div>

// After (Chakra UI)
<Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center" p={4}>
  <Box maxW="md" w="full" bg="white" borderRadius="lg" boxShadow="md" p={8}>
    <Heading as="h1" size="xl" color="gray.900" mb={6}>Sign In</Heading>
    <Input
      type="email"
      placeholder="Enter your email"
      mb={4}
    />
    <Button colorScheme="blue" w="full">
      Send Magic Link
    </Button>
  </Box>
</Box>
```

**Component migration order**:
1. AppHeader (simple, no forms)
2. ProtectedRoute (minimal styling)
3. LoginPage, SetupPage, JoinPage (forms)
4. InvitePartnerCard, ManageRolesCard (complex forms)
5. AppShell (integrates all components)

### 6. Test Migration

```bash
npm run build  # Should succeed
npm run lint   # Should pass
npm run dev    # Visual comparison

# Check no Tailwind classes remain
grep -r "className=\".*\\(bg-\\|text-\\|p-\\|m-\\|flex\\|grid\\)" apps/web/src/
# Should return no matches
```

---

## Phase 1: Database Setup

### 1. Create Migration

```bash
cd supabase
npx supabase migration new tasks_table
```

### 2. Copy SQL

Open `supabase/migrations/[timestamp]_tasks_table.sql` and paste:

```sql
-- Enable RLS
alter table if exists public.tasks enable row level security;

-- Create tasks table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null check (char_length(title) > 0 and char_length(title) <= 500),
  status text not null default 'incomplete' check (status in ('incomplete', 'complete')),
  assigned_to uuid references public.profiles(user_id) on delete set null,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists tasks_household_id_idx on public.tasks(household_id);
create index if not exists tasks_assigned_to_idx on public.tasks(assigned_to);

-- Updated timestamp trigger
create trigger set_tasks_updated_at
  before update on public.tasks
  for each row
  execute function extensions.moddatetime(updated_at);

-- RLS Policies
create policy tasks_select_members on public.tasks
  for select to authenticated
  using (
    exists (
      select 1 from public.household_members hm
      where hm.household_id = tasks.household_id
        and hm.user_id = auth.uid()
    )
  );

create policy tasks_insert_members on public.tasks
  for insert to authenticated
  with check (
    exists (
      select 1 from public.household_members hm
      where hm.household_id = tasks.household_id
        and hm.user_id = auth.uid()
    )
  );

create policy tasks_update_members on public.tasks
  for update to authenticated
  using (
    exists (
      select 1 from public.household_members hm
      where hm.household_id = tasks.household_id
        and hm.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.household_members hm
      where hm.household_id = tasks.household_id
        and hm.user_id = auth.uid()
    )
  );

create policy tasks_delete_members on public.tasks
  for delete to authenticated
  using (
    exists (
      select 1 from public.household_members hm
      where hm.household_id = tasks.household_id
        and hm.user_id = auth.uid()
    )
  );
```

### 3. Apply Migration

```bash
# Reset local database
npx supabase db reset

# Or apply incrementally
npx supabase migration up
```

### 4. Verify RLS

Run these SQL queries in Supabase Studio (or `psql`):

```sql
-- Test 1: Cross-household blocked
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO 'user-a-uuid';
SELECT * FROM tasks WHERE household_id = 'household-b-uuid';
-- Expected: 0 rows

-- Test 2: Same household allowed
SELECT * FROM tasks WHERE household_id = 'household-a-uuid';
-- Expected: Returns tasks (if any exist)

-- Test 3: INSERT blocked for wrong household
INSERT INTO tasks (household_id, title, status)
VALUES ('household-b-uuid', 'Test', 'incomplete');
-- Expected: Permission denied

-- Test 4: INSERT allowed for own household
INSERT INTO tasks (household_id, title, status)
VALUES ('household-a-uuid', 'Test', 'incomplete');
-- Expected: Success
```

---

## Phase 2-4: Frontend Implementation

### 1. Create Task Service

Create `apps/web/src/services/tasks.ts`:

```typescript
import { supabase } from '../lib/supabaseClient';

export interface Task {
  id: string;
  household_id: string;
  title: string;
  status: 'incomplete' | 'complete';
  assigned_to?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export const getTasks = async (householdId: string): Promise<Task[]> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createTask = async (
  householdId: string,
  title: string,
  assignedTo?: string,
  dueDate?: string
): Promise<Task> => {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      household_id: householdId,
      title,
      status: 'incomplete',
      assigned_to: assignedTo,
      due_date: dueDate,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const toggleTaskStatus = async (
  taskId: string,
  currentStatus: 'incomplete' | 'complete'
): Promise<void> => {
  const newStatus = currentStatus === 'incomplete' ? 'complete' : 'incomplete';
  const { error } = await supabase
    .from('tasks')
    .update({ status: newStatus })
    .eq('id', taskId);

  if (error) throw error;
};
```

### 2. Create TaskItem Component

Create `apps/web/src/components/TaskItem.tsx`:

```typescript
import { Flex, Checkbox, Text, Box } from '@chakra-ui/react';
import type { Task } from '../services/tasks';

interface TaskItemProps {
  task: Task;
  onToggle: (taskId: string, currentStatus: Task['status']) => void;
}

export const TaskItem = ({ task, onToggle }: TaskItemProps) => {
  return (
    <Flex
      p={4}
      borderWidth={1}
      borderRadius="md"
      alignItems="center"
      gap={3}
      _hover={{ bg: 'gray.50' }}
    >
      <Checkbox
        isChecked={task.status === 'complete'}
        onChange={() => onToggle(task.id, task.status)}
      />
      <Box flex={1}>
        <Text
          textDecoration={task.status === 'complete' ? 'line-through' : 'none'}
          color={task.status === 'complete' ? 'gray.500' : 'gray.900'}
        >
          {task.title}
        </Text>
        {task.due_date && (
          <Text fontSize="sm" color="gray.600">
            Due: {new Date(task.due_date).toLocaleDateString()}
          </Text>
        )}
      </Box>
    </Flex>
  );
};
```

### 3. Create TaskList Component

Create `apps/web/src/components/TaskList.tsx`:

```typescript
import { VStack, Text, Box } from '@chakra-ui/react';
import { TaskItem } from './TaskItem';
import type { Task } from '../services/tasks';

interface TaskListProps {
  tasks: Task[];
  onToggle: (taskId: string, currentStatus: Task['status']) => void;
}

export const TaskList = ({ tasks, onToggle }: TaskListProps) => {
  if (tasks.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Text fontSize="lg" color="gray.500">
          No tasks yet. Create your first task to get started!
        </Text>
      </Box>
    );
  }

  return (
    <VStack spacing={2} align="stretch">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} onToggle={onToggle} />
      ))}
    </VStack>
  );
};
```

### 4. Create AddTask Component

Create `apps/web/src/components/AddTask.tsx`:

```typescript
import { useState } from 'react';
import { Box, Input, Button, HStack, useToast } from '@chakra-ui/react';

interface AddTaskProps {
  onAddTask: (title: string) => Promise<void>;
}

export const AddTask = ({ onAddTask }: AddTaskProps) => {
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a task title',
        status: 'error',
      });
      return;
    }

    setIsLoading(true);
    try {
      await onAddTask(title);
      setTitle('');
      toast({
        title: 'Task created',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Error creating task',
        description: 'Please try again later',
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit} mb={6}>
      <HStack>
        <Input
          placeholder="Add a new task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={500}
        />
        <Button type="submit" colorScheme="blue" isLoading={isLoading}>
          Add
        </Button>
      </HStack>
    </Box>
  );
};
```

### 5. Create TasksScreen

Create `apps/web/src/screens/TasksScreen.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { Box, Heading, useToast } from '@chakra-ui/react';
import { AddTask } from '../components/AddTask';
import { TaskList } from '../components/TaskList';
import { getTasks, createTask, toggleTaskStatus, type Task } from '../services/tasks';

interface TasksScreenProps {
  householdId: string;
}

export const TasksScreen = ({ householdId }: TasksScreenProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    loadTasks();
  }, [householdId]);

  const loadTasks = async () => {
    try {
      const data = await getTasks(householdId);
      setTasks(data);
    } catch (error) {
      toast({
        title: 'Error loading tasks',
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async (title: string) => {
    const newTask = await createTask(householdId, title);
    setTasks([newTask, ...tasks]);
  };

  const handleToggle = async (taskId: string, currentStatus: Task['status']) => {
    await toggleTaskStatus(taskId, currentStatus);
    setTasks(tasks.map(t =>
      t.id === taskId
        ? { ...t, status: currentStatus === 'incomplete' ? 'complete' : 'incomplete' }
        : t
    ));
  };

  return (
    <Box maxW="2xl" mx="auto" p={6}>
      <Heading mb={6}>Tasks</Heading>
      <AddTask onAddTask={handleAddTask} />
      <TaskList tasks={tasks} onToggle={handleToggle} />
    </Box>
  );
};
```

### 6. Integrate into AppShell

Update `apps/web/src/screens/AppShell.tsx`:

```typescript
import { TasksScreen } from './TasksScreen';
// ... other imports

// Replace placeholder content with:
<TasksScreen householdId={household.id} />
```

---

## Testing Checklist

### Manual Testing

- [ ] **Phase 0 Migration**
  - [ ] Build succeeds (`npm run build`)
  - [ ] Lint passes (`npm run lint`)
  - [ ] All existing pages render correctly
  - [ ] No Tailwind classes remain in codebase
- [ ] **Phase 1 Database**
  - [ ] Migration applies without errors
  - [ ] All 6 RLS tests pass (see Phase 1 section above)
- [ ] **Phase 2-4 Frontend**
  - [ ] Empty state shows when no tasks
  - [ ] Can create task (appears in list immediately)
  - [ ] Can mark task complete (strikethrough applied)
  - [ ] Can toggle task back to incomplete
  - [ ] Task list persists after page reload
  - [ ] Cross-household isolation (test with 2 households)

---

## Common Issues & Solutions

### Issue: Chakra components not styled

**Solution**: Ensure `<ChakraProvider>` wraps entire app in `App.tsx`

### Issue: RLS blocks all queries

**Solution**: Verify user is authenticated and member of household. Check `auth.uid()` matches user_id in household_members.

### Issue: Tasks from other households visible

**Solution**: RLS policies not applied correctly. Run `ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;`

### Issue: Build fails after migration

**Solution**: Remove all Tailwind imports. Check for `import './index.css'` and remove.

---

## Next Steps After MVP

**Future enhancements** (defer until user demand):
- Task priority field (low/medium/high)
- Recurring tasks (daily/weekly/monthly)
- Task tags/categories
- Pagination (when > 100 tasks)
- Task history/audit trail
- Task comments/notes
- File attachments

---

## Resources

- [Chakra UI Docs](https://chakra-ui.com/docs/getting-started)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Feature Spec](./spec.md)
- [Implementation Plan](./plan.md)
- [Data Model](./data-model.md)
