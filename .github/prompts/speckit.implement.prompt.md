---
agent: speckit.implement
---

## Goal

Implement tasks from `tasks.md` following the Trackly Home development workflow. This command executes tasks systematically, respecting dependencies and parallelization opportunities.

## User Input

```text
$ARGUMENTS
```

You may consider the user input to determine which tasks to implement (e.g., specific task IDs, a phase, or a user story).

## Prerequisites

Run the prerequisite checker with tasks requirement:

```bash
cd /Users/neop26/repo/trackly-home-specd && .specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks
```

Requires:
- Being on a feature branch
- `spec.md`, `plan.md`, and `tasks.md` all exist

## Execution Steps

### 1. Load Implementation Context

Read from `specs/[BRANCH_NAME]/`:
- `tasks.md` - Task list with dependencies
- `plan.md` - Technical approach and structure
- `spec.md` - Requirements for validation
- `data-model.md` (if exists) - Database design
- `contracts/` (if exists) - API contracts

### 2. Select Tasks to Implement

Based on user input, determine scope:
- **Specific task**: `T005` - Implement that task
- **Phase**: `Phase 2` - Implement all tasks in that phase
- **User story**: `US1` - Implement all tasks for that story
- **No input**: Start with next incomplete task in dependency order

### 3. Respect Dependencies

Before implementing a task:
1. Check if prerequisite tasks are complete
2. Check if blocking phases are done
3. For parallel tasks `[P]`, can implement simultaneously

### 4. Implement Each Task

For each task:

**a. Understand the task**
- Read task description and file path
- Review related spec requirements
- Check any contracts or data models

**b. Write the code**
- Follow Trackly Home conventions (see below)
- Use existing patterns from similar files
- Include proper TypeScript types

**c. Verify locally**
- For frontend: `cd apps/web && npm run build`
- For migrations: `supabase db reset`
- For functions: `supabase functions serve`

**d. Mark task complete**
- Update `tasks.md`: `- [ ]` → `- [x]`
- Add completion note if relevant

### 5. Update Documentation

Per constitution principle "Document As You Go":
- Update `supabase/migrations/README.md` for DB changes
- Add JSDoc to exported functions
- Update `docs/PROJECT_TRACKER.md` if completing a phase task

### 6. Output

After implementing tasks:

```
✅ Implemented: T005, T006, T007

Changes:
  - Created apps/web/src/components/TaskList.tsx
  - Added apps/web/src/services/tasks.ts
  - Created supabase/migrations/[timestamp]_[num]_tasks.sql

Verification:
  - npm run build: ✅ passed
  - supabase db reset: ✅ passed

Next tasks: T008, T009 (can run in parallel)
```

## Trackly Home Code Conventions

### React Components

```tsx
// apps/web/src/components/ExampleComponent.tsx
import { useState } from 'react';

interface ExampleComponentProps {
  householdId: string;
  onComplete?: () => void;
}

export function ExampleComponent({ householdId, onComplete }: ExampleComponentProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Always handle loading and error states
  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* Tailwind CSS for styling */}
    </div>
  );
}
```

### Service Functions

```typescript
// apps/web/src/services/example.ts
import { supabase } from '../lib/supabaseClient';

export interface ExampleData {
  id: string;
  name: string;
  householdId: string;
}

export async function getExamples(householdId: string): Promise<ExampleData[]> {
  const { data, error } = await supabase
    .from('examples')
    .select('*')
    .eq('household_id', householdId);

  if (error) throw new Error(error.message);
  return data ?? [];
}
```

### Edge Functions

```typescript
// supabase/functions/example-function/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient, getAuthUser } from '../_shared/supabase.ts';

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCors();
  }

  try {
    const supabase = createSupabaseClient(req);
    const user = await getAuthUser(supabase);

    // Function logic here

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
```

### SQL Migrations

```sql
-- supabase/migrations/[timestamp]_[num]_description.sql

-- Create table
CREATE TABLE public.examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS (REQUIRED)
ALTER TABLE public.examples ENABLE ROW LEVEL SECURITY;

-- RLS Policies (household isolation)
CREATE POLICY "Members can view own household examples"
  ON public.examples FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members hm
      WHERE hm.household_id = examples.household_id
        AND hm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert to own household"
  ON public.examples FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.household_members hm
      WHERE hm.household_id = examples.household_id
        AND hm.user_id = auth.uid()
    )
  );
```

## Security Checklist (Per Implementation)

Before marking any task complete:
- [ ] No secrets in code
- [ ] RLS enabled on new tables
- [ ] Edge functions validate auth
- [ ] No PII in console.log statements
- [ ] Error messages don't leak internals

