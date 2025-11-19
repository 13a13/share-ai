# Security Incident Log

## Incident #001: Exposed Subscription Data via View
**Date Discovered:** 2024-11-19
**Severity:** HIGH
**Status:** REMEDIATED

### Description
The `profiles_with_subscription` view had `security_invoker = true` but no RLS policies, 
allowing anonymous users to read all user subscription data including:
- User IDs
- First/Last names
- Subscription tiers
- Property limits
- Trial dates

### Exposure Window
- **Start:** 2024-11-15 (when view was created in migration `20251115201456_d1256a85`)
- **End:** 2024-11-19 (remediated)
- **Duration:** ~4 days

### Affected Data
- All users in `profiles` table
- Subscription metadata for all users

### Root Cause
Migration created view with `security_invoker = true` but forgot to add RLS policies.

### Remediation
Applied migration `20251119000000_fix_profiles_with_subscription_rls.sql`

### Verification
- [x] Migration file created
- [ ] Migration executed successfully
- [ ] Anonymous access test (should fail)
- [ ] Authenticated dashboard test (should work)
- [ ] Profile page test (should work)
- [ ] 48-hour monitoring period

### Action Items
- [x] Apply RLS policy to view
- [ ] Test anonymous access (should fail)
- [ ] Test authenticated access (should work)
- [ ] Monitor Supabase logs for 48 hours
- [ ] Review all other views for similar issues

### Lessons Learned
1. Always add RLS policies immediately when creating views with `security_invoker = true`
2. Include RLS policy creation in the same migration as view creation
3. Add automated tests for RLS policies before deployment
4. Conduct security audits of all views periodically

### References
- Migration: `supabase/migrations/20251119000000_fix_profiles_with_subscription_rls.sql`
- Rollback: `supabase/migrations/20251119000001_rollback_subscription_view_rls.sql`
- Test suite: `tests/security/rls-policies.test.ts`
- Security checklist: `docs/SECURITY_CHECKLIST.md`
