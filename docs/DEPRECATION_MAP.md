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
