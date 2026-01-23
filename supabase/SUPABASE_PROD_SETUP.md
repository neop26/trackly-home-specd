# Supabase Production Project Setup

## Project Creation Steps

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard

2. **Create New Project**:
   - Organization: (your organization)
   - Project Name: `trackly-home-prod`
   - Database Password: **[SAVE THIS - YOU WON'T SEE IT AGAIN]**
   - Region: **Singapore (ap-southeast-1)** - closest to East Asia
   - Pricing Plan: Free (can upgrade later)

3. **Wait for Project Provisioning** (2-3 minutes)

## Credentials to Document

After the project is created, collect these values from the project settings:

### Project Settings → API

- **Project URL**: `https://[project-ref].supabase.co`
- **Anon (public) key**: `eyJhbGc...` (long JWT token)
- **Service Role key**: `eyJhbGc...` (long JWT token - **keep secret!**)

### Project Settings → General

- **Reference ID**: `[project-ref]` (unique identifier)

### Database Settings

- **Database Password**: (the one you set during creation)
- **Connection String**: Available in Database Settings → Connection Pooling

## After Documentation

Once you have all the credentials:

1. **Update this file** with the actual values (or store securely in password manager)
2. **Run**: `./scripts/setup-github-secrets.sh` (option 2 for prod)
3. **Run migrations**: Supabase will need schema setup via migrations
4. **Test connection**: Run a simple query in SQL Editor

## Production Credentials (Fill After Creation)

```bash
# Store these securely - DO NOT COMMIT TO GIT
SUPABASE_PROD_URL="https://[project-ref].supabase.co"
SUPABASE_PROD_ANON_KEY="eyJhbGc..."
SUPABASE_PROD_SERVICE_ROLE_KEY="eyJhbGc..."  # KEEP SECRET!
SUPABASE_PROD_PROJECT_REF="[project-ref]"
SUPABASE_PROD_DB_PASSWORD="[password]"
```

## Security Notes

⚠️ **IMPORTANT**:
- The service role key bypasses Row Level Security - protect it!
- Store all credentials in GitHub Secrets, not in code
- Use anon key for client-side code only
- Use service role key only in server-side/GitHub Actions

## Next Steps After Setup

1. Run database migrations to prod
2. Seed production data if needed
3. Test Edge Functions deployment
4. Configure production CORS if needed
