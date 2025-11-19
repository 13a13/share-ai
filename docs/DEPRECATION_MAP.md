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

### 2024-11-19: Fixed `profiles_with_subscription` RLS vulnerability

**Issue:** View had `security_invoker = true` but no RLS policies, exposing all subscription data to anonymous users.

**Fix Applied:**
- Migration: `supabase/migrations/20251119000000_fix_profiles_with_subscription_rls.sql`
- Added RLS policy: "Users can view own subscription data"
- Restricts to: `authenticated` role + `auth.uid() = id`

**Impact:** 
- ✅ Anonymous access now blocked
- ✅ Users can only view their own subscription data
- ✅ No code changes required (defense-in-depth)

**Testing:**
- [ ] Anonymous curl test (blocked)
- [ ] Authenticated dashboard (works)
- [ ] Profile page (works)
- [ ] Property limit check (works)

**References:**
- Security incident: `docs/SECURITY_INCIDENTS.md#incident-001`
- Test suite: `tests/security/rls-policies.test.ts`
- Security checklist: `docs/SECURITY_CHECKLIST.md`
- Rollback migration: `supabase/migrations/20251119000001_rollback_subscription_view_rls.sql`
