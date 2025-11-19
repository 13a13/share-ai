# Security Review Checklist

## Database Views RLS Audit

When creating or modifying views:

- [ ] View has `security_invoker = true` (uses caller permissions)
- [ ] View is defined over tables that have RLS enabled
- [ ] Underlying tables have RLS policies defined
- [ ] Policies require authentication (or justify public access)
- [ ] Policies filter to owner (`auth.uid() = user_id`)
- [ ] Anonymous access blocked (test with curl)
- [ ] Cross-user access blocked (test with SQL)
- [ ] Application code still works (manual test)
- [ ] Monitoring enabled (Supabase logs)

## Existing Views to Audit

Run this query to find all views and their RLS policy coverage:

```sql
SELECT 
  c.relname AS view_name,
  COUNT(p.policyname) AS policy_count,
  string_agg(p.policyname, ', ') AS policies
FROM pg_class c
LEFT JOIN pg_policies p ON c.relname = p.tablename
WHERE c.relkind = 'v'  -- Views only
  AND c.relnamespace = 'public'::regnamespace
GROUP BY c.relname
ORDER BY policy_count ASC, c.relname;
```

**⚠️ CRITICAL:** Views with `policy_count = 0` need immediate review!

## RLS Policy Testing

### Test 1: Anonymous Access (Should FAIL)
```bash
curl "https://blrzoqsszyuvskbuidzk.supabase.co/rest/v1/VIEW_NAME?select=*&limit=1" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```
**Expected:** Error or empty array

### Test 2: Authenticated Access (Should WORK)
```bash
curl "https://blrzoqsszyuvskbuidzk.supabase.co/rest/v1/VIEW_NAME?select=*&limit=1" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer USER_JWT_TOKEN"
```
**Expected:** User's own data only

### Test 3: Cross-User Access (Should FAIL)
```sql
-- Set session to test user A
SET request.jwt.claims = '{"sub":"user-a-uuid","role":"authenticated"}';

-- Try to read user B's data
SELECT * FROM VIEW_NAME WHERE id = 'user-b-uuid';

-- Expected: 0 rows (RLS blocks access)
```

## Table RLS Audit

Run this query to check all tables:

```sql
SELECT 
  schemaname,
  tablename,
  COUNT(*) AS policy_count,
  string_agg(policyname, ', ') AS policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY policy_count ASC, tablename;
```

**⚠️ CRITICAL:** Tables with sensitive data and `policy_count = 0` are exposed!

## Security Validation Query

Run this after any RLS changes:

```sql
-- ============================================================================
-- COMPREHENSIVE SECURITY VALIDATION
-- ============================================================================
-- All checks should return 'PASS'
-- ============================================================================

WITH security_checks AS (
  -- Check 1: All views have RLS policies
  SELECT 
    c.relname AS resource,
    CASE 
      WHEN COUNT(p.policyname) > 0 THEN 'PASS'
      ELSE 'FAIL: No RLS policy found for view ' || c.relname
    END AS status
  FROM pg_class c
  LEFT JOIN pg_policies p ON c.relname = p.tablename
  WHERE c.relkind = 'v'
    AND c.relnamespace = 'public'::regnamespace
  GROUP BY c.relname

  UNION ALL

  -- Check 2: All tables with user_id have RLS
  SELECT 
    t.tablename AS resource,
    CASE 
      WHEN COUNT(p.policyname) > 0 THEN 'PASS'
      ELSE 'FAIL: No RLS policy found for table ' || t.tablename
    END AS status
  FROM information_schema.tables t
  LEFT JOIN pg_policies p ON t.table_name = p.tablename
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_name = t.table_name
        AND c.column_name IN ('user_id', 'owner_id')
    )
  GROUP BY t.tablename
)
SELECT * FROM security_checks
WHERE status LIKE 'FAIL%'
ORDER BY status;

-- If no rows returned, all checks passed!
-- If rows returned, investigate each FAIL immediately
```

## Pre-Deployment Security Checklist

Before deploying any migration:

- [ ] Review all SQL changes for security implications
- [ ] Ensure new tables have RLS policies
- [ ] Ensure new views have RLS policies
- [ ] Test anonymous access is blocked
- [ ] Test authenticated access works
- [ ] Test cross-user access is blocked
- [ ] Document any security changes
- [ ] Update this checklist if needed

## Post-Deployment Monitoring

After deploying RLS changes:

- [ ] Monitor Supabase logs for RLS violations (24-48 hours)
- [ ] Check application error rates (should be unchanged)
- [ ] Verify no user-reported access issues
- [ ] Run security validation query (above)
- [ ] Document results in `SECURITY_INCIDENTS.md`

## Monthly Security Audit

Run these checks monthly:

1. Execute "Existing Views to Audit" query
2. Execute "Table RLS Audit" query
3. Execute "Security Validation Query"
4. Review `security_audit_logs` table for anomalies
5. Review and update this checklist

## Emergency Contacts & Resources

### If Security Issues Arise:
1. **Check Logs:** Supabase Dashboard → Database → Logs
2. **Apply Rollback:** Use rollback migration if critical
3. **Document:** Log in `SECURITY_INCIDENTS.md`
4. **Review:** Conduct root cause analysis

### Key Resources:
- **Supabase RLS Docs:** https://supabase.com/docs/guides/auth/row-level-security
- **PostgreSQL Security:** https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- **View Security:** https://www.postgresql.org/docs/current/sql-createview.html#SQL-CREATEVIEW-SECURITY
- **Project Dashboard:** https://supabase.com/dashboard/project/blrzoqsszyuvskbuidzk
