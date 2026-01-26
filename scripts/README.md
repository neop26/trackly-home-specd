# Scripts

Repository utility scripts organized by function.

## Directory Structure

| Directory | Purpose |
|-----------|---------|
| `azure/` | Azure deployment and infrastructure scripts |
| `github/` | GitHub Actions, secrets, OIDC setup scripts |
| `supabase/` | Supabase testing, data generation, utility scripts |

## Script Organization Rules

Per [Constitution v1.2.0](../.specify/memory/constitution.md#script-organization):

- **Migration scripts**: `supabase/migrations/` - Timestamped migration files only
- **Test scripts**: `scripts/supabase/` - RLS tests, performance tests, validation
- **Data generation**: `scripts/supabase/` - Seed data, dummy data, test fixtures
- **One-off utilities**: `scripts/supabase/` - Manual queries, cleanup, investigation
- **Azure operations**: `scripts/azure/` - Deployment, configuration, infrastructure
- **GitHub automation**: `scripts/github/` - Repository setup, secrets, OIDC

**Rationale**: Separating migrations from utility scripts keeps migration directories clean and makes it clear which files are automatically applied versus which require manual execution.

## Quick Reference

### GitHub Scripts

| Script | Purpose |
|--------|---------|
| `github/bootstrap-repo.sh` | Bootstrap local developer environment |
| `github/setup-azure-oidc.sh` | Configure Azure OIDC authentication for GitHub Actions |
| `github/setup-github-secrets-auto.sh` | Automated GitHub secrets configuration |
| `github/setup-github-secrets.sh` | Interactive GitHub secrets setup |

### Azure Scripts

See [azure/README.md](azure/README.md) for Azure deployment scripts and configurations.

### Supabase Scripts

See [supabase/README.md](supabase/README.md) for Supabase test scripts, data generation tools, and utility scripts.

## Usage Guidelines

1. **Always test locally first**: Run scripts on local environments before production
2. **Document parameters**: Use clear comments for required inputs (UUIDs, credentials, etc.)
3. **Include cleanup**: Provide cleanup/rollback instructions for destructive operations
4. **Version control**: All scripts should be committed to git
5. **Update documentation**: Keep READMEs current when adding new scripts
6. **Follow naming conventions**:
   - Test scripts: `test_*.sql` or `test_*.sh`
   - Seed scripts: `seed_*.sql`
   - Utility scripts: `util_*.sh` or descriptive names
   - Setup scripts: `setup-*.sh`

## Security Considerations

- **Never commit credentials**: No connection strings, passwords, or API keys
- **Use environment variables**: For sensitive configuration values
- **Review before production**: Double-check all operations before running in production
- **Audit logging**: Consider adding logging for high-risk operations
- **Least privilege**: Use minimal required permissions for script execution

## References

- Project constitution: [.specify/memory/constitution.md](../.specify/memory/constitution.md)
- Migration guide: [supabase/migrations/README.md](../supabase/migrations/README.md)
- Azure deployment guide: [azure/README.md](azure/README.md)
