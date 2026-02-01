---
name: task-management
description: Manage tasks in Trackly Home task tracking system. Use when working with tasks, due dates, assignments, or task lifecycle. Covers task CRUD operations, filtering, and task-related UI components.
metadata:
  author: trackly-home
  version: "1.0"
compatibility: Requires Supabase, React frontend
allowed-tools: Read Edit Bash(npm:*)
---

# Task Management Skill

Work with Trackly Home's task management system for household task coordination.

## When to Use

- Adding task features
- Modifying task behavior
- Fixing task-related bugs
- Extending task functionality

## Current Task Features (MVP)

| Feature | Status |
|---------|--------|
| Create tasks | ✅ |
| View tasks | ✅ |
| Complete tasks | ✅ |
| Assign to member | ✅ |
| Set due date | ✅ |
| Edit tasks | ⏳ V1 |
| Delete tasks | ⏳ V1 |
| Recurring tasks | ⏳ V1 |
| Categories | ⏳ V1 |
| Filtering | ⏳ V1 |

## Data Model

### tasks Table

```sql
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 500),
    status TEXT NOT NULL DEFAULT 'incomplete' CHECK (status IN ('incomplete', 'complete')),
    assigned_to UUID REFERENCES auth.users(id),
    due_date DATE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### RLS Policies

```sql
-- Members can CRUD tasks in their household
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage tasks"
    ON tasks FOR ALL
    USING (is_household_member(household_id))
    WITH CHECK (is_household_member(household_id));
```

### Indexes

```sql
CREATE INDEX idx_tasks_household_id ON tasks(household_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);
```

## Service Layer

### Location

`apps/web/src/services/tasksService.ts`

### Core Functions

```typescript
// List tasks for household
export async function getHouseholdTasks(householdId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      assigned_to_profile:profiles!tasks_assigned_to_fkey(display_name)
    `)
    .eq('household_id', householdId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Create task
export async function createTask(
  householdId: string,
  title: string,
  assignedTo?: string,
  dueDate?: string
): Promise<Task> {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      household_id: householdId,
      title: title.trim(),
      assigned_to: assignedTo || null,
      due_date: dueDate || null,
      created_by: user!.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Toggle task completion
export async function toggleTaskComplete(
  taskId: string,
  currentStatus: string
): Promise<Task> {
  const newStatus = currentStatus === 'complete' ? 'incomplete' : 'complete';
  
  const { data, error } = await supabase
    .from('tasks')
    .update({ 
      status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Update task
export async function updateTask(
  taskId: string,
  updates: Partial<Task>
): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Delete task
export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
}
```

## UI Components

### Component Hierarchy

```
TasksScreen
├── AddTask (form to create new task)
├── TaskList (container for task items)
│   └── TaskItem (individual task display)
└── TaskFilters (V1: filter controls)
```

### TasksScreen

`apps/web/src/screens/TasksScreen.tsx`

```typescript
export function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { householdId } = useHousehold();

  useEffect(() => {
    loadTasks();
  }, [householdId]);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const data = await getHouseholdTasks(householdId);
      setTasks(data);
    } catch (err) {
      setError('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async (title: string, assignedTo?: string, dueDate?: string) => {
    try {
      const newTask = await createTask(householdId, title, assignedTo, dueDate);
      setTasks([newTask, ...tasks]); // Optimistic update
    } catch (err) {
      toast({ title: 'Failed to create task', status: 'error' });
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      // Optimistic update
      setTasks(tasks.map(t => 
        t.id === task.id 
          ? { ...t, status: t.status === 'complete' ? 'incomplete' : 'complete' }
          : t
      ));
      await toggleTaskComplete(task.id, task.status);
    } catch (err) {
      loadTasks(); // Revert on error
      toast({ title: 'Failed to update task', status: 'error' });
    }
  };

  return (
    <Box p={4}>
      <Heading mb={4}>Tasks</Heading>
      <AddTask onSubmit={handleCreateTask} />
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <Alert status="error">{error}</Alert>
      ) : (
        <TaskList tasks={tasks} onToggleComplete={handleToggleComplete} />
      )}
    </Box>
  );
}
```

### AddTask Component

`apps/web/src/components/AddTask.tsx`

```typescript
interface AddTaskProps {
  onSubmit: (title: string, assignedTo?: string, dueDate?: string) => Promise<void>;
  members: Member[]; // For assignment dropdown
}

export function AddTask({ onSubmit, members }: AddTaskProps) {
  const [title, setTitle] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || title.length > 500) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(title, assignedTo || undefined, dueDate || undefined);
      setTitle('');
      setAssignedTo('');
      setDueDate('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormControl isRequired>
        <Input
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={500}
        />
      </FormControl>
      
      <Select
        placeholder="Assign to..."
        value={assignedTo}
        onChange={(e) => setAssignedTo(e.target.value)}
      >
        {members.map(m => (
          <option key={m.user_id} value={m.user_id}>{m.display_name}</option>
        ))}
      </Select>
      
      <Input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />
      
      <Button type="submit" isLoading={isSubmitting}>
        Add Task
      </Button>
    </form>
  );
}
```

### TaskItem Component

`apps/web/src/components/TaskItem.tsx`

```typescript
interface TaskItemProps {
  task: Task;
  onToggleComplete: (task: Task) => void;
}

export function TaskItem({ task, onToggleComplete }: TaskItemProps) {
  const isOverdue = task.due_date && 
    new Date(task.due_date) < new Date() && 
    task.status !== 'complete';

  return (
    <HStack
      p={3}
      borderWidth={1}
      borderRadius="md"
      opacity={task.status === 'complete' ? 0.6 : 1}
    >
      <Checkbox
        isChecked={task.status === 'complete'}
        onChange={() => onToggleComplete(task)}
      />
      
      <VStack align="start" flex={1}>
        <Text
          textDecoration={task.status === 'complete' ? 'line-through' : 'none'}
        >
          {task.title}
        </Text>
        
        <HStack fontSize="sm" color="gray.500">
          <Text>
            {task.assigned_to_profile?.display_name || 'Unassigned'}
          </Text>
          
          {task.due_date && (
            <Text color={isOverdue ? 'red.500' : undefined}>
              Due: {formatDate(task.due_date)}
              {isOverdue && ' (Overdue)'}
            </Text>
          )}
        </HStack>
      </VStack>
    </HStack>
  );
}
```

## V1 Planned Features

### Task Editing

```typescript
// Add to tasksService.ts
export async function updateTask(taskId: string, updates: {
  title?: string;
  assigned_to?: string | null;
  due_date?: string | null;
}): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### Task Deletion (Soft Delete)

```sql
-- Add archived column
ALTER TABLE tasks ADD COLUMN archived_at TIMESTAMPTZ;

-- Update RLS to hide archived
CREATE POLICY "Members view non-archived"
    ON tasks FOR SELECT
    USING (
        is_household_member(household_id) 
        AND archived_at IS NULL
    );
```

### Filtering

```typescript
// Filter by status
const incompleteTasks = tasks.filter(t => t.status === 'incomplete');

// Filter by assignee
const myTasks = tasks.filter(t => t.assigned_to === currentUserId);

// Filter by due date
const overdueTasks = tasks.filter(t => 
  t.due_date && new Date(t.due_date) < new Date() && t.status !== 'complete'
);

// Filter by date range
const thisWeekTasks = tasks.filter(t => {
  if (!t.due_date) return false;
  const due = new Date(t.due_date);
  const weekEnd = addDays(new Date(), 7);
  return due <= weekEnd;
});
```

### Recurring Tasks (V1)

```sql
-- New table for recurrence rules
CREATE TABLE recurring_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
    interval INTEGER NOT NULL DEFAULT 1,
    days_of_week INTEGER[], -- For weekly: [0,1,2,3,4,5,6]
    next_occurrence DATE NOT NULL,
    end_date DATE
);
```

## Testing Tasks

### Manual Tests

1. Create task with title only
2. Create task with assignment
3. Create task with due date
4. Create task with all fields
5. Mark task complete
6. Mark task incomplete
7. View overdue indicator
8. View "Unassigned" placeholder
9. View "No due date" placeholder

### RLS Tests

```sql
-- Test: User can only see household tasks
SET LOCAL request.jwt.claims.sub TO 'user-a-uuid';
SELECT * FROM tasks WHERE household_id = 'household-b-uuid';
-- Expected: 0 rows
```

## Performance Considerations

- Index on `household_id` for filtering
- Index on `assigned_to` for "My Tasks" filter
- Index on `due_date` for date sorting
- Limit query results for large households
- Use pagination for task lists > 100 items
