# Supabase Production Credentials

**Created**: [DATE]  
**Project Name**: trackly-home-prod  
**Region**: Singapore (ap-southeast-1)

---

## Project Information

**Reference ID**: `___________________________`

**Project URL**: `https://_________________________.supabase.co`

---

## API Keys

### Anon (Public) Key
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.___________________________________________
_________________________________________________________________________________
_________________________________________________________________________________
```

### Service Role Key ⚠️ SECRET - DO NOT SHARE
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.___________________________________________
_________________________________________________________________________________
_________________________________________________________________________________
```

---

## Database

**Database Password**: `___________________________`

**Connection String** (Pooler):
```
postgresql://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
```

**Direct Connection String**:
```
postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
```

---

## Where to Find These Values

1. **Project Settings → API**:
   - Project URL
   - Anon key
   - Service Role key

2. **Project Settings → General**:
   - Reference ID (under "Project Reference ID")

3. **Database Password**:
   - The password you set during project creation
   - Cannot be retrieved later (only reset)

4. **Connection Strings**:
   - Project Settings → Database → Connection String

---

## Next Steps After Filling

1. **Store securely**: Add to password manager (DO NOT commit to git)

2. **Set GitHub Secrets**:
   ```bash
   ./scripts/setup-github-secrets.sh
   # Choose option 2 (prod) and enter these values
   ```

3. **Test Connection**:
   - Go to SQL Editor in Supabase dashboard
   - Run: `SELECT current_database(), version();`
   - Should see: `postgres | PostgreSQL 15.x...`

4. **Link Local CLI** (if needed):
   ```bash
   supabase link --project-ref [reference-id]
   # Enter database password when prompted
   ```

---

## GitHub Secrets to Configure

These will be set by `setup-github-secrets.sh`:

**Environment: prod**
- `VITE_SUPABASE_URL` → Project URL
- `VITE_SUPABASE_ANON_KEY` → Anon key
- `SUPABASE_PROJECT_REF` → Reference ID
- `SUPABASE_DB_PASSWORD` → Database password
- `SB_SUPABASE_URL` → Project URL (for Edge Functions)
- `SB_SUPABASE_ANON_KEY` → Anon key
- `SB_SUPABASE_SERVICE_ROLE_KEY` → Service Role key ⚠️
