# Design Specification: MVP Account Foundation

**Feature**: MVP Account Foundation (002-mvp-account-foundation)
**Created**: 2025-01-21
**Status**: Approved
**Design System**: Centrid Design System (Coral Theme)

## Overview

Complete authentication and account management UI for MVP, designed with mobile-first principles using the centralized Centrid design system. All screens follow established patterns from `packages/ui` for consistency and maintainability.

## Design Principles Applied

1. **Mobile-First**: Designed for 375px mobile viewport first, scales up to desktop (1440px)
2. **44px Touch Targets**: All interactive elements meet minimum mobile tap size
3. **Accessibility**: WCAG 2.1 AA compliant with proper focus states and contrast ratios
4. **Consistent Components**: All screens use components from `@centrid/ui/components`
5. **Clear Visual Hierarchy**: Primary actions use coral brand color (#ff4d4d)
6. **Immediate Feedback**: Loading, error, and success states for all operations
7. **Error Prevention**: Validation error messages, confirmation dialogs for destructive actions

## Design System Structure

### File Organization

```
apps/design-system/
├── components/
│   └── AccountFoundation.tsx       # All 7 screen components
├── pages/
│   └── account-foundation/
│       ├── index.tsx               # Feature index/overview
│       ├── signup.tsx              # Individual screen pages
│       ├── login.tsx
│       ├── forgot-password.tsx
│       ├── reset-password.tsx
│       ├── dashboard.tsx
│       ├── profile.tsx
│       └── delete-account.tsx
└── public/
    └── screenshots/
        └── account-foundation/     # Desktop & mobile screenshots
            ├── 01-signup-desktop-default.png
            ├── 01-signup-mobile.png
            └── ... (14 total screenshots)
```

### Navigation

**Feature Index**: http://localhost:3001/account-foundation
- Overview page with clickable cards linking to all 7 screens
- Each screen has its own dedicated route
- Easy navigation between screens for design review
- Back navigation links on every screen

**Individual Screen Routes**:
- `/account-foundation/signup` - Signup page
- `/account-foundation/login` - Login page
- `/account-foundation/forgot-password` - Forgot password page
- `/account-foundation/reset-password` - Reset password page
- `/account-foundation/dashboard` - Dashboard (protected)
- `/account-foundation/profile` - Profile settings (protected)
- `/account-foundation/delete-account` - Account deletion (protected)

### Workflow for Feature Design

1. **Create Components**: All screen components in `components/AccountFoundation.tsx`
   - Export each screen as a separate component
   - Include state controls for design review (toggle loading, error, success states)

2. **Create Feature Directory**: `pages/account-foundation/`
   - Create `index.tsx` with overview cards linking to all screens
   - Create individual page files for each screen (e.g., `signup.tsx`)
   - Each page imports and renders its corresponding component
   - Include back navigation link to feature index

3. **Update Main Index**: Add link card to feature in `pages/index.tsx`
   - Card shows feature name and description
   - Links to feature index page

4. **Screenshots**: Capture with Playwright MCP
   - Desktop: 1440×900 viewport
   - Mobile: 375×812 viewport
   - Save to `public/screenshots/[feature-name]/`
   - Naming: `[NN]-[screen-name]-[viewport].png`

5. **Documentation**: Update feature `design.md`
   - Document routes (design system + production)
   - Screen layouts, components, states
   - Design tokens used
   - Accessibility features

## Reusable Components

### AppHeader Component

**Purpose**: Consistent navigation header for all protected screens (Dashboard, Profile, Account Deletion)

**Location**: `apps/design-system/components/AccountFoundation.tsx` (AppHeader function)
**Production**: Will be moved to `packages/ui/src/components/app-header.tsx` for reuse

**Design Pattern**: Navigation-based header with active state indication

**Key Features**:
- **Logo**: "Centrid" text (clickable, returns to dashboard)
- **Desktop Navigation** (hidden on mobile):
  - Dashboard link
  - Profile link
  - Active state shown in coral (#ff4d4d)
  - Inactive links in gray (#6b7280) with hover state
- **Mobile Navigation** (hamburger menu):
  - Hamburger icon button (visible on small screens)
  - Dropdown menu with:
    - Dashboard (with active state highlight)
    - Profile (with active state highlight)
    - Log Out button (full width)
- **Log Out Button**: Outline variant, positioned right (desktop only)

**Layout**:
- Full-width header with bottom border
- Max-width container (max-w-7xl) for content
- Responsive: Desktop nav shows inline, mobile uses hamburger menu
- Height: py-4 (16px top/bottom padding)

**States**:
- **Dashboard Active**: "Dashboard" link highlighted in coral
- **Profile Active**: "Profile" link highlighted in coral
- **Mobile Menu Open**: Shows dropdown with all navigation options
- **Mobile Menu Closed**: Shows only hamburger icon

**Accessibility**:
- Proper semantic HTML (`<header>`, `<nav>`, `<button>`)
- Keyboard navigable
- Touch targets meet 44px minimum on mobile
- Active state clearly indicated

**Implementation Note**:
This component should be extracted to `@centrid/ui/components` during implementation for reuse across the app. It demonstrates the navigation pattern that will be used throughout the application.

## Screens Designed

### 1. Signup Page

**Route**: `/account-foundation/signup`
**Production Route**: `/signup`

**Purpose**: New user account creation with optional name fields
**Layout**: Centered card on gray background (max-w-md)
**Components Used**: Card, Input, Label, Button, Alert

**Key Elements**:
- Title: "Create Account" (text-2xl)
- Subtitle: "Start using Centrid for free" (text-sm text-gray-600)
- Email input (required, h-11)
- Password input (required, h-11, min 6 chars)
- First Name input (optional, h-11)
- Last Name input (optional, h-11)
- Primary CTA: "Create Account" button (w-full h-11 bg-primary-600)
- Footer: "Already have an account? Log in" link

**States**:
- **Default**: Clean form, empty inputs
- **Loading**: Button shows "Creating account...", inputs disabled
- **Validation Error**: Alert with specific error message (e.g., "Invalid email address format")
- **Service Error**: Alert with retry button ("Service temporarily unavailable")

**Screenshots**:
- Desktop: `screenshots/account-foundation/01-signup-desktop-default.png`
- Mobile: `screenshots/account-foundation/01-signup-mobile.png`

---

### 2. Login Page

**Route**: `/account-foundation/login`
**Production Route**: `/login`

**Purpose**: Existing user authentication
**Layout**: Centered card on gray background (max-w-md)
**Components Used**: Card, Input, Label, Button, Alert

**Key Elements**:
- Title: "Welcome Back" (text-2xl)
- Subtitle: "Log in to your Centrid account" (text-sm text-gray-600)
- Email input (required, h-11)
- Password input (required, h-11)
- "Forgot password?" link (text-sm text-primary-600, positioned top-right of password label)
- Primary CTA: "Log In" button (w-full h-11 bg-primary-600)
- Footer: "Don't have an account? Sign up" link

**States**:
- **Default**: Clean form
- **Loading**: Button shows "Logging in...", inputs disabled
- **Error**: Alert with generic error "Invalid email or password" (security: no user enumeration)

**Screenshots**:
- Desktop: `screenshots/account-foundation/02-login-desktop.png`
- Mobile: `screenshots/account-foundation/02-login-mobile.png`

---

### 3. Forgot Password Page

**Route**: `/account-foundation/forgot-password`
**Production Route**: `/forgot-password`

**Purpose**: Password reset request
**Layout**: Centered card on gray background (max-w-md)
**Components Used**: Card, Input, Label, Button, Alert

**Key Elements**:
- Title: "Reset Password" (text-2xl)
- Subtitle: "Enter your email to receive a password reset link" (text-sm text-gray-600)
- Email input (required, h-11)
- Primary CTA: "Send Reset Link" button (w-full h-11 bg-primary-600)
- Footer: "Back to login" link

**States**:
- **Default**: Email input only
- **Loading**: Button shows "Sending...", input disabled
- **Success**: Green alert with confirmation message "Check your email. We've sent a password reset link to your email address. The link will expire in 1 hour."

**Screenshots**:
- Desktop: `screenshots/account-foundation/03-forgot-password-desktop.png`
- Mobile: `screenshots/account-foundation/03-forgot-password-mobile.png`

---

### 4. Reset Password Page

**Route**: `/account-foundation/reset-password`
**Production Route**: `/reset-password`

**Purpose**: Set new password from reset link
**Layout**: Centered card on gray background (max-w-md)
**Components Used**: Card, Input, Label, Button, Alert

**Key Elements**:
- Title: "Set New Password" (text-2xl)
- Subtitle: "Choose a new password for your account" (text-sm text-gray-600)
- New Password input (required, h-11, min 6 chars)
- Confirm Password input (required, h-11)
- Primary CTA: "Reset Password" button (w-full h-11 bg-primary-600)

**States**:
- **Default**: Two password inputs
- **Loading**: Button shows "Resetting...", inputs disabled
- **Validation Error**: Alert "Passwords must match and be at least 6 characters"
- **Expired Link**: Alert "This reset link has expired. Please request a new one." + "Request New Link" button

**Screenshots**:
- Desktop: `screenshots/account-foundation/04-reset-password-desktop.png`
- Mobile: `screenshots/account-foundation/04-reset-password-mobile.png`

---

### 5. Dashboard Page (Protected)

**Route**: `/account-foundation/dashboard`
**Production Route**: `/dashboard`

**Purpose**: Post-login landing page showing account overview
**Layout**: Full-page with header + main content area
**Components Used**: AppHeader (reusable), Card, Button

**Key Elements**:

**Header** (using AppHeader component with `currentPath="dashboard"`):
- Logo: "Centrid"
- Navigation: Dashboard (active/coral), Profile (gray)
- Log Out button (desktop)
- Hamburger menu (mobile)

**Main Content** (max-w-7xl mx-auto px-4 py-8):
- Welcome card with:
  - Title: "Welcome!" (text-2xl)
  - User email: "You're logged in as user@example.com" (text-sm text-gray-600)
  - Plan status banner: "Your account is active with a Free Plan" (bg-blue-50 border-blue-200)
  - Usage stats grid (2 columns on desktop):
    - Usage this month: "0 / 100" (text-2xl font-semibold)
    - Documents uploaded: "0" (text-2xl font-semibold)

**Screenshots**:
- Desktop: `screenshots/account-foundation/05-dashboard-desktop.png`
- Mobile: `screenshots/account-foundation/05-dashboard-mobile.png`
- Mobile (menu open): `screenshots/account-foundation/05-dashboard-mobile-menu-open.png`

---

### 6. Profile Settings Page (Protected)

**Route**: `/account-foundation/profile`
**Production Route**: `/settings/profile`

**Purpose**: Edit user profile (firstName, lastName)
**Layout**: Full-page with header + centered form (max-w-3xl)
**Components Used**: AppHeader (reusable), Card, Input, Label, Button, Alert, Separator

**Key Elements**:

**Header** (using AppHeader component with `currentPath="profile"`):
- Logo: "Centrid"
- Navigation: Dashboard (gray), Profile (active/coral)
- Log Out button (desktop)
- Hamburger menu (mobile)

**Main Content**:
- Card with title "Profile Settings" (text-2xl)
- Subtitle: "Manage your account information" (text-sm text-gray-600)

**Form Fields**:
- Email field (disabled, bg-gray-50, with note "Email cannot be changed")
- First Name input (h-11)
- Last Name input (h-11)

**Additional Sections** (separated by borders):
- Account Plan: "Free Plan - 100 requests per month" (text-sm text-gray-600)
- Danger Zone: "Delete Account" link (text-sm text-red-600)

**Actions**:
- "Save Changes" button (bg-primary-600)
- "Cancel" button (variant="outline")

**States**:
- **Default**: Form with existing data
- **Saving**: Button shows "Saving...", inputs disabled
- **Success**: Green alert "Profile updated successfully!"
- **Validation Error**: Red alert with specific error (e.g., "Name contains invalid characters")

**Screenshots**:
- Desktop: `screenshots/account-foundation/06-profile-settings-desktop.png`
- Mobile: `screenshots/account-foundation/06-profile-settings-mobile.png`

---

### 7. Account Deletion Page (Protected)

**Route**: `/account-foundation/delete-account`
**Production Route**: `/settings/delete-account`

**Purpose**: Permanent account deletion with confirmation
**Layout**: Full-page with header + centered form (max-w-2xl)
**Components Used**: AppHeader (reusable), Card, Input, Label, Button, Alert

**Key Elements**:

**Header** (using AppHeader component with `currentPath="profile"`):
- Logo: "Centrid"
- Navigation: Dashboard (gray), Profile (active/coral)
- Log Out button (desktop)
- Hamburger menu (mobile)

**Main Content**:
- Card with red border (border-red-200)
- Title: "Delete Account" (text-2xl text-red-600)
- Subtitle: "This action cannot be undone" (text-sm text-gray-600)

**Warning Section**:
- Large red/pink alert (bg-red-50 border-red-200):
  - Warning icon: "⚠️ Warning: Permanent Data Loss"
  - Bulleted list of what will be deleted:
    - Your account and profile
    - All uploaded documents
    - All chat conversations and agent sessions
    - All usage history
  - Final warning: "This action is irreversible!" (font-medium)

**Confirmation Flow** (two-step):

**Step 1 - Warning State**:
- "I Understand, Continue" button (variant="destructive" bg-red-600)
- "Cancel" button (variant="outline")

**Step 2 - Confirming State**:
- Text input: "Type DELETE to confirm" (h-11)
- "Delete My Account" button (disabled until user types "DELETE" exactly)
- "Cancel" button

**States**:
- **Warning**: Initial view with warning alert
- **Confirming**: Shows confirmation input after clicking "I Understand, Continue"
- **Processing**: Button shows "Deleting Account...", input disabled
- **Error**: Red alert "Confirmation phrase must be 'DELETE'" if input doesn't match

**Screenshots**:
- Desktop: `screenshots/account-foundation/07-account-deletion-desktop.png`
- Mobile: `screenshots/account-foundation/07-account-deletion-mobile.png`

---

## Design Tokens Used

### Colors
- **Primary (Coral)**: `bg-primary-600` (#ff4d4d) - Primary buttons, links
- **Gray**: `text-gray-600`, `bg-gray-50`, `border-gray-200` - Text, backgrounds, borders
- **Error**: `text-error-600`, `bg-error-50`, `border-error-500` (#dc2626) - Error states, destructive actions
- **Success**: `bg-success-50`, `text-success-800` (#34c759) - Success states
- **Warning**: `bg-blue-50`, `text-blue-900`, `border-blue-200` - Informational alerts

### Typography
- **Headings**: `text-2xl` (24px) for page titles
- **Body**: `text-base` (16px) for form labels
- **Small**: `text-sm` (14px) for helper text, links
- **Extra Small**: `text-xs` (12px) for notes

### Spacing
- **Card padding**: `p-6` (24px)
- **Form gaps**: `gap-4` (16px) between form fields
- **Section margins**: `mb-8` (32px) between major sections
- **Input height**: `h-11` (44px) - Minimum mobile touch target

### Components
- **Button**: From `@centrid/ui/components/button`
  - Variants: `default`, `outline`, `destructive`
  - Sizes: `sm`, `default` (h-11)
- **Input**: From `@centrid/ui/components/input`
  - Base class includes focus states, border styles
  - Height: `h-11` for all inputs (44px touch target)
- **Card**: From `@centrid/ui/components/card`
  - Parts: CardHeader, CardTitle, CardContent, CardFooter
- **Alert**: From `@centrid/ui/components/alert`
  - Variants: `default`, `destructive`, custom (green for success)

### Responsive Breakpoints
- **Mobile**: 375px - 639px (base styles, mobile-first)
- **Tablet**: 640px - 1023px (md: breakpoint)
- **Desktop**: 1024px+ (lg: breakpoint, max-w-7xl for content)

---

## Accessibility Features

1. **Keyboard Navigation**: All forms fully navigable with Tab key, Enter submits
2. **Focus States**: Visible focus rings on all interactive elements (from design system)
3. **ARIA Labels**: Form inputs have proper labels, error messages announced
4. **Color Contrast**: Text meets WCAG AA (4.5:1 for body text, 3:1 for large text)
5. **Touch Targets**: All buttons and inputs 44px minimum height on mobile
6. **Screen Reader**: Semantic HTML (form, label, button, alert)

---

## Interactive States Summary

### Buttons
- **Default**: Solid color, cursor pointer
- **Hover**: Slightly darker shade
- **Focus**: Ring outline (focus-visible:ring-2)
- **Disabled**: Reduced opacity, cursor not-allowed, no hover

### Inputs
- **Default**: Border gray-200
- **Focus**: Ring primary-600, border primary-600
- **Error**: Border error-500, ring error-500
- **Disabled**: Background gray-50, cursor not-allowed

### Alerts
- **Error**: Red background (bg-red-50), red border, red text
- **Success**: Green background (bg-green-50), green border, green text
- **Info**: Blue background (bg-blue-50), blue border, blue text

---

## Implementation Notes

1. **Component Source**: All components imported from `@centrid/ui/components`
2. **No Custom Components**: Design uses only centralized UI library components
3. **State Management**: React useState for local form state (no global state needed)
4. **Form Validation**: Client-side validation with Zod schemas (from `packages/shared`)
5. **Responsive Strategy**: Mobile-first with Tailwind breakpoints (sm:, md:, lg:)
6. **Loading States**: Inline button text changes (no separate spinner component)
7. **Error Display**: Alert component positioned at top of form content area

---

## Design Checklist

See `design-checklist.md` for implementation verification checklist.

---

## Screenshots Reference

All screenshots saved in `/apps/design-system/public/screenshots/account-foundation/`:

**Desktop (1440×900)**:
- `01-signup-desktop-default.png`
- `02-login-desktop.png`
- `03-forgot-password-desktop.png`
- `04-reset-password-desktop.png`
- `05-dashboard-desktop.png`
- `06-profile-settings-desktop.png`
- `07-account-deletion-desktop.png`

**Mobile (375×812)**:
- `01-signup-mobile.png`
- `02-login-mobile.png`
- `03-forgot-password-mobile.png`
- `04-reset-password-mobile.png`
- `05-dashboard-mobile.png`
- `06-profile-settings-mobile.png`
- `07-account-deletion-mobile.png`

---

## Design System Compliance

✅ Uses centralized components from `packages/ui`
✅ Follows Coral theme color palette
✅ Consistent spacing (4px, 8px, 16px, 24px, 32px)
✅ Mobile-first responsive design
✅ 44px minimum touch targets
✅ WCAG 2.1 AA compliant
✅ Consistent typography scale
✅ Proper visual hierarchy

**Approved for implementation**: All designs follow established patterns and are ready for development in `apps/web`.
