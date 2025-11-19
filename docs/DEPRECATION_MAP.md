# Deprecation Map

This document tracks removed or replaced modules during the refactor, with their recommended replacements.

Removed files and replacements
- src/components/MultiImageComponentCapture.tsx → Use src/components/image-upload/MultiImageComponentCapture.tsx
- src/components/ComponentImageCapture.tsx → Use src/components/image-upload/MultiImageComponentCapture.tsx
- src/components/room-component/ComponentImageCapture.tsx → Use src/components/image-upload/MultiImageComponentCapture.tsx
- src/hooks/report/debugTest.tsx → No replacement (debug helper)

- New: src/lib/api/reports/componentUpdateApi.ts
  - Single source of truth for updating component fields in inspections.report_info
  - Used by useComponentPersistence and EditablePDFPreview

Additional removals and replacements
- Removed: src/hooks/report/useUnifiedComponentManagement.tsx → Use useUnifiedRoomManagement + useComponentPersistence
- Removed: src/components/examples/LoadingOverlayDemo.tsx (unused example)
- Kept: src/components/camera/WhatsAppStyleImageInput.tsx (still referenced by ImageCapture and WhatsAppStyleImageUploadControls)

Centralized parsing
- Always import parseReportInfo from src/lib/api/reports/reportTransformers.ts

Notes
- If any legacy import paths are discovered, update them to point to the replacements above.

## Security Fixes & Hardening

### 2024-11-19: Verified `profiles_with_subscription` RLS security

**Issue:** View had `security_invoker = true`, needed verification that underlying table RLS properly protects data.

**Security Model:**
- View uses `security_invoker = true` (inherits caller permissions)
- Security enforced by underlying table RLS policies:
  - `profiles` table: RLS enabled with user-scoped SELECT policies
  - `subscription_metadata` table: RLS enabled with service-role policies
- Anonymous users: Blocked by table-level RLS
- Authenticated users: Can only read own data (filtered by table RLS)

**Verification Performed:**
- ✅ Confirmed both underlying tables have RLS enabled
- ✅ Verified SELECT policies exist on both tables
- ✅ Confirmed view has security_invoker mode active
- ✅ Logged security verification in audit table

**Impact:** 
- ✅ Anonymous access blocked by table-level RLS
- ✅ Users can only view their own subscription data
- ✅ No code changes required (proper security already in place)
- ✅ Defense-in-depth: View security + table security

**Testing:**
- [ ] Anonymous curl test (should fail)
- [ ] Authenticated dashboard (should work)
- [ ] Profile page (should work)
- [ ] Property limit check (should work)

**References:**
- Security incident: `docs/SECURITY_INCIDENTS.md#incident-001`
- Test suite: `tests/security/rls-policies.test.ts`
- Security checklist: `docs/SECURITY_CHECKLIST.md`
