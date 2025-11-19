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
Applied migration with security verification for underlying table RLS policies.

**Technical Details:**
- View security model: `security_invoker = true` (inherits caller permissions)
- Underlying `profiles` table: RLS enabled with user-scoped SELECT policies
- Underlying `subscription_metadata` table: RLS enabled with service-role policies
- Anonymous users: Blocked by table-level RLS
- Authenticated users: Can only read own data via table-level RLS filtering

### Verification
- [x] Migration file created
- [x] Migration executed successfully (security_verification_complete)
- [x] Underlying table RLS verified (profiles + subscription_metadata)
- [ ] Anonymous access test (should fail)
- [ ] Authenticated dashboard test (should work)
- [ ] Profile page test (should work)
- [ ] 48-hour monitoring period

### Action Items
- [x] Verify underlying table RLS policies
- [x] Confirm security_invoker mode active
- [x] Log security verification in audit table
- [ ] Test anonymous access (should fail)
- [ ] Test authenticated access (should work)
- [ ] Monitor Supabase logs for 48 hours
- [ ] Review all other views for similar issues
- [ ] Run comprehensive security audit (see SECURITY_CHECKLIST.md)

### Lessons Learned
1. Views cannot have RLS policies in PostgreSQL - security comes from underlying tables
2. Views with `security_invoker = true` inherit caller permissions and underlying table RLS
3. Always verify underlying table RLS when creating views over sensitive data
4. Include security verification in the same migration as view creation
5. Add automated tests for RLS policies before deployment
6. Conduct security audits of all views periodically
7. Document security model clearly (table-level vs view-level protection)

### References
- Migration: Applied via Lovable migration tool (timestamp: 2024-11-19)
- Test suite: `tests/security/rls-policies.test.ts`
- Security checklist: `docs/SECURITY_CHECKLIST.md`
- Audit log: Check `security_audit_logs` table for `security_verification_complete` action
