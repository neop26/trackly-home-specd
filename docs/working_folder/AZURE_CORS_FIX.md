# Azure CORS Issue #15 - Fix Documentation

## Problem

Azure Static Web Apps (both dev and prod) are blocked by CORS when calling Supabase Edge Functions (`create-household`, `create-invite`).

**Error Message:**
```
Access to fetch at 'https://[supabase-url]/functions/v1/create-invite' from origin 
'https://witty-bay-0b4318700.1.azurestaticapps.net' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: It does not have HTTP ok status.
```

## Root Cause

Supabase Edge Functions use the `buildCors()` function in `supabase/functions/_shared/cors.ts` which requires the requesting origin to be in the allowed list:

```typescript
// Allowed origins are built from:
1. SITE_URL environment variable
2. CORS_ORIGINS environment variable (CSV list)
3. DEFAULT_DEV_ORIGINS (localhost only)
```

The Azure Static Web Apps URLs are **NOT** configured in Supabase Edge Function secrets.

## Solution

Add the Azure SWA URLs to the Supabase Edge Function environment variables for both dev and prod projects.

### Step 1: Identify Azure SWA URLs

From GitHub issue #15:
- **Dev Azure SWA**: `https://ashy-moss-09645d800.2.azurestaticapps.net`
- **Prod Azure SWA**: `https://witty-bay-0b4318700.1.azurestaticapps.net`

### Step 2: Update Supabase Edge Function Secrets

#### For DEV Supabase Project:

```bash
# 1. Link to dev Supabase project
supabase link --project-ref <DEV_PROJECT_REF>

# 2. Set SITE_URL to dev Azure SWA
supabase secrets set SB_SITE_URL=https://ashy-moss-09645d800.2.azurestaticapps.net

# 3. (Optional) If you need multiple origins, use CORS_ORIGINS
supabase secrets set SB_CORS_ORIGINS=https://ashy-moss-09645d800.2.azurestaticapps.net,http://localhost:5173

# 4. Verify secrets are set
supabase secrets list
```

#### For PROD Supabase Project:

```bash
# 1. Link to prod Supabase project
supabase link --project-ref <PROD_PROJECT_REF>

# 2. Set SITE_URL to prod Azure SWA
supabase secrets set SB_SITE_URL=https://witty-bay-0b4318700.1.azurestaticapps.net

# 3. (Optional) If you need multiple origins, use CORS_ORIGINS
supabase secrets set SB_CORS_ORIGINS=https://witty-bay-0b4318700.1.azurestaticapps.net

# 4. Verify secrets are set
supabase secrets list
```

### Step 3: Redeploy Edge Functions

After setting secrets, redeploy all Edge Functions:

```bash
# Deploy all functions
supabase functions deploy

# Or deploy individually
supabase functions deploy create-household
supabase functions deploy create-invite
supabase functions deploy accept-invite
supabase functions deploy manage-roles
```

### Step 4: Update GitHub Secrets (for CI/CD)

Update GitHub environment secrets to match:

**Environment: dev**
- `SB_SITE_URL` = `https://ashy-moss-09645d800.2.azurestaticapps.net`
- `SB_CORS_ORIGINS` = `https://ashy-moss-09645d800.2.azurestaticapps.net,http://localhost:5173`

**Environment: prod**
- `SB_SITE_URL` = `https://witty-bay-0b4318700.1.azurestaticapps.net`
- `SB_CORS_ORIGINS` = `https://witty-bay-0b4318700.1.azurestaticapps.net`

Update via:
- GitHub UI: Settings → Environments → [dev/prod] → Environment secrets
- Or use `scripts/github/setup-github-secrets.sh`

### Step 5: Test

1. **Dev Environment Test:**
   ```bash
   # From browser console on https://ashy-moss-09645d800.2.azurestaticapps.net
   # Try creating a household or invite
   # Should no longer see CORS errors
   ```

2. **Prod Environment Test:**
   ```bash
   # From browser console on https://witty-bay-0b4318700.1.azurestaticapps.net
   # Try creating a household or invite
   # Should no longer see CORS errors
   ```

## Alternative: Use Wildcard for Subdomains (NOT RECOMMENDED for prod)

If Azure SWA URLs change frequently:

```bash
# DEV ONLY - allows all azurestaticapps.net subdomains
supabase secrets set SB_CORS_ORIGINS=*.azurestaticapps.net
```

⚠️ **Security Warning**: This is less secure as it allows ANY Azure Static Web App to call your functions.

## How CORS Works in Our Edge Functions

```typescript
// supabase/functions/_shared/cors.ts
export function buildCors(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const e = getEnv();

  const allowed = new Set<string>();

  // 1. Add SITE_URL (primary allowed origin)
  if (e.siteUrl) allowed.add(e.siteUrl);

  // 2. Add CORS_ORIGINS (optional CSV list)
  if (e.corsOrigins) {
    for (const o of parseCsv(e.corsOrigins)) allowed.add(o);
  }

  // 3. Add localhost for local dev
  for (const o of DEFAULT_DEV_ORIGINS) allowed.add(o);

  // 4. Check if request origin is in allowed list
  const originAllowed = !!origin && allowed.has(origin);

  // 5. Set CORS headers only if origin is allowed
  if (originAllowed) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return { origin, originAllowed, headers };
}
```

## Verification Checklist

- [ ] Azure dev SWA URL added to dev Supabase `SB_SITE_URL`
- [ ] Azure prod SWA URL added to prod Supabase `SB_SITE_URL`
- [ ] Edge Functions redeployed after setting secrets
- [ ] GitHub secrets updated to match (for CI/CD)
- [ ] Tested create-household from Azure dev SWA (no CORS error)
- [ ] Tested create-invite from Azure dev SWA (no CORS error)
- [ ] Tested create-household from Azure prod SWA (no CORS error)
- [ ] Tested create-invite from Azure prod SWA (no CORS error)

## Related Files

- `supabase/functions/_shared/cors.ts` - CORS configuration logic
- `supabase/functions/_shared/supabase.ts` - Environment variable reading
- `supabase/functions/create-household/index.ts` - Uses buildCors()
- `supabase/functions/create-invite/index.ts` - Uses buildCors()
- `supabase/functions/accept-invite/index.ts` - Uses buildCors()
- `supabase/functions/manage-roles/index.ts` - Uses buildCors()

## References

- GitHub Issue: https://github.com/neop26/trackly-home-specd/issues/15
- Supabase Edge Functions Docs: https://supabase.com/docs/guides/functions
- Supabase Secrets: https://supabase.com/docs/guides/functions/secrets
