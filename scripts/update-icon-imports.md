# Icon Import Update Guide

## Files Updated So Far:
- ✅ src/components/Navigation.tsx
- ✅ src/pages/Home.tsx

## Files to Update (High Priority - Used on Initial Load):
- src/pages/Auth.tsx
- src/pages/Dashboard.tsx
- src/pages/EventsRedesigned.tsx
- src/components/Gallery.tsx

## Files to Update (Medium Priority - Lazy Loaded):
- src/pages/Admin.tsx
- src/pages/Profile.tsx
- src/pages/Settings.tsx
- src/pages/Blogs.tsx
- src/pages/BlogView.tsx
- src/pages/WriteBlog.tsx
- src/pages/CoreTeam.tsx
- src/pages/Attendance.tsx
- src/pages/Register.tsx
- src/pages/ForgotPassword.tsx
- src/pages/ForgotPasswordNew.tsx
- src/pages/ResetPassword.tsx
- src/pages/PrivacyPolicy.tsx
- src/pages/TermsOfUse.tsx
- src/pages/SessionExpired.tsx
- src/pages/AuthCallback.tsx

## Files to Update (Low Priority - Components):
- src/components/QRScanner.tsx
- src/components/BackendStatus.tsx
- src/components/ProductionDebug.tsx
- src/components/attendance/AttendanceSuccessAnimation.tsx
- src/components/attendance/LocationPermissionDialog.tsx
- src/components/ui/upload-progress-dialog.tsx
- src/hooks/useUserSessions.ts

## Pattern to Follow:
```typescript
// OLD:
import { Icon1, Icon2, Icon3 } from 'lucide-react';

// NEW:
import { Icon1, Icon2, Icon3 } from '@/components/icons';
// If icon not in centralized list:
import { RareIcon } from 'lucide-react';
```

## Note:
The centralized icon file uses tree-shakeable exports, so only icons actually used
will be included in the final bundle. This dramatically reduces the icon bundle size
from ~200KB to ~20-30KB.
