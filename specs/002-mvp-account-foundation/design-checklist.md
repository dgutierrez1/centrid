# Design Implementation Checklist: MVP Account Foundation

**Feature**: MVP Account Foundation (002-mvp-account-foundation)
**Design Reference**: `design.md`
**Component Source**: `apps/design-system/components/AccountFoundation.tsx`

Use this checklist to verify design implementation quality before marking the feature as complete.

---

## Pre-Implementation Setup

- [ ] Verify all components available in `@centrid/ui/components`:
  - [ ] Button (variants: default, outline, destructive)
  - [ ] Input (with focus states)
  - [ ] Label
  - [ ] Card (with Header, Title, Content, Footer)
  - [ ] Alert (with variants)
- [ ] Confirm design tokens available in Tailwind config:
  - [ ] Primary colors (bg-primary-600, text-primary-600)
  - [ ] Gray scale (gray-50 through gray-900)
  - [ ] Error colors (error-500, error-600)
  - [ ] Success colors (success-500, success-800)
- [ ] Review design screenshots in `apps/design-system/public/screenshots/account-foundation/`

---

## 1. Signup Page (`/signup`)

### Layout & Structure
- [ ] Centered card on gray background (min-h-screen flex items-center justify-center bg-gray-50)
- [ ] Card max-width: `max-w-md`
- [ ] Card has proper padding: `p-6` or using CardHeader/CardContent/CardFooter

### Form Elements
- [ ] Email input:
  - [ ] Type: `email`
  - [ ] Placeholder: "you@example.com"
  - [ ] Height: `h-11` (44px)
  - [ ] Label: "Email"
- [ ] Password input:
  - [ ] Type: `password`
  - [ ] Placeholder: "Minimum 6 characters"
  - [ ] Height: `h-11`
  - [ ] Label: "Password"
- [ ] First Name input:
  - [ ] Type: `text`
  - [ ] Placeholder: "John"
  - [ ] Height: `h-11`
  - [ ] Label: "First Name (Optional)"
- [ ] Last Name input:
  - [ ] Type: `text`
  - [ ] Placeholder: "Doe"
  - [ ] Height: `h-11`
  - [ ] Label: "Last Name (Optional)"

### Visual Design
- [ ] Title: "Create Account" (text-2xl text-center)
- [ ] Subtitle: "Start using Centrid for free" (text-sm text-gray-600 text-center)
- [ ] Primary button:
  - [ ] Text: "Create Account"
  - [ ] Full width: `w-full`
  - [ ] Height: `h-11`
  - [ ] Color: `bg-primary-600 hover:bg-primary-700`
- [ ] Footer text: "Already have an account? Log in" (text-sm text-center)
- [ ] Link color: `text-primary-600 hover:underline`

### States
- [ ] **Loading state**: Button text changes to "Creating account...", inputs disabled
- [ ] **Validation error state**: Red alert appears above form with specific error message
- [ ] **Service error state**: Red alert with retry button
- [ ] **Focus states**: Visible focus ring on all inputs

### Responsive
- [ ] Works on mobile (375px): Stacks properly, no horizontal scroll
- [ ] Works on desktop (1440px): Centered card, appropriate max-width

---

## 2. Login Page (`/login`)

### Layout & Structure
- [ ] Centered card on gray background (same as Signup)
- [ ] Card max-width: `max-w-md`

### Form Elements
- [ ] Email input (same specs as Signup)
- [ ] Password input (same specs as Signup)
- [ ] "Forgot password?" link positioned top-right of Password label

### Visual Design
- [ ] Title: "Welcome Back" (text-2xl text-center)
- [ ] Subtitle: "Log in to your Centrid account" (text-sm text-gray-600 text-center)
- [ ] Primary button: "Log In" (same specs as Signup)
- [ ] Footer: "Don't have an account? Sign up"
- [ ] Forgot password link: `text-sm text-primary-600 hover:underline`

### States
- [ ] **Loading state**: "Logging in..." button text
- [ ] **Error state**: Generic error message (no user enumeration)

### Responsive
- [ ] Mobile: Forgot password link wraps properly
- [ ] Desktop: Proper spacing and alignment

---

## 3. Forgot Password Page (`/forgot-password`)

### Layout & Structure
- [ ] Centered card (max-w-md)

### Form Elements
- [ ] Email input only (same specs as other pages)

### Visual Design
- [ ] Title: "Reset Password" (text-2xl text-center)
- [ ] Subtitle: "Enter your email to receive a password reset link"
- [ ] Primary button: "Send Reset Link"
- [ ] Footer: "Back to login" link

### States
- [ ] **Loading state**: "Sending..." button text
- [ ] **Success state**: Green alert with:
  - [ ] Message: "Check your email"
  - [ ] Details: "We've sent a password reset link to your email address. The link will expire in 1 hour."
  - [ ] Background: `bg-green-50 border-green-200`
  - [ ] Text: `text-green-800`

### Responsive
- [ ] Success alert displays properly on mobile
- [ ] Text wraps appropriately

---

## 4. Reset Password Page (`/reset-password`)

### Layout & Structure
- [ ] Centered card (max-w-md)

### Form Elements
- [ ] New Password input:
  - [ ] Type: `password`
  - [ ] Placeholder: "Minimum 6 characters"
  - [ ] Label: "New Password"
- [ ] Confirm Password input:
  - [ ] Type: `password`
  - [ ] Placeholder: "Re-enter your password"
  - [ ] Label: "Confirm Password"

### Visual Design
- [ ] Title: "Set New Password" (text-2xl text-center)
- [ ] Subtitle: "Choose a new password for your account"
- [ ] Primary button: "Reset Password"

### States
- [ ] **Loading state**: "Resetting..." button text
- [ ] **Validation error**: Alert "Passwords must match and be at least 6 characters"
- [ ] **Expired link state**:
  - [ ] Alert: "This reset link has expired. Please request a new one."
  - [ ] "Request New Link" button appears

### Responsive
- [ ] Error messages display properly
- [ ] Both password inputs stack correctly on mobile

---

## 5. Dashboard Page (`/dashboard`)

### Header
- [ ] Full-width header with white background and bottom border
- [ ] Logo/brand: "Centrid" (text-xl font-semibold)
- [ ] Navigation items aligned right:
  - [ ] "Profile" button (text-sm text-gray-600 hover:text-gray-900)
  - [ ] "Log Out" button (variant="outline" size="sm")
- [ ] Header padding: `px-4 py-4`

### Main Content
- [ ] Container: `max-w-7xl mx-auto px-4 py-8`
- [ ] Welcome card with:
  - [ ] Title: "Welcome!" (text-2xl)
  - [ ] User email display: "You're logged in as user@example.com" (text-sm text-gray-600)
  - [ ] Plan status banner:
    - [ ] Background: `bg-blue-50`
    - [ ] Border: `border-blue-200`
    - [ ] Text: "Your account is active with a Free Plan" (text-blue-900)
  - [ ] Usage stats grid:
    - [ ] 2 columns on desktop (`md:grid-cols-2`)
    - [ ] 1 column on mobile
    - [ ] Each stat card has:
      - [ ] Label (text-sm text-gray-600)
      - [ ] Value (text-2xl font-semibold)
      - [ ] Border: `border border-gray-200`
      - [ ] Padding: `p-4`

### Responsive
- [ ] Header collapses properly on mobile
- [ ] Stats grid stacks to 1 column on mobile
- [ ] Logo and buttons have adequate spacing on mobile

---

## 6. Profile Settings Page (`/settings/profile`)

### Header
- [ ] Same as Dashboard
- [ ] "Back to Dashboard" link replaces "Profile" (text-primary-600)

### Main Content
- [ ] Container: `max-w-3xl mx-auto px-4 py-8`
- [ ] Card with proper sections

### Form Fields
- [ ] Email field:
  - [ ] Disabled state (bg-gray-50)
  - [ ] Value: "user@example.com"
  - [ ] Helper text: "Email cannot be changed" (text-xs text-gray-500)
- [ ] First Name input (editable, h-11)
- [ ] Last Name input (editable, h-11)

### Additional Sections
- [ ] Account Plan section:
  - [ ] Border-top separator
  - [ ] Heading: "Account Plan" (text-sm font-medium)
  - [ ] Text: "Free Plan - 100 requests per month"
- [ ] Danger Zone section:
  - [ ] Border-top separator
  - [ ] Heading: "Danger Zone" (text-sm font-medium text-red-600)
  - [ ] "Delete Account" link (text-sm text-red-600 hover:underline)

### Actions
- [ ] "Save Changes" button (bg-primary-600)
- [ ] "Cancel" button (variant="outline")
- [ ] Buttons side-by-side on desktop, stacked on mobile

### States
- [ ] **Saving state**: "Saving..." button text, inputs disabled
- [ ] **Success state**: Green alert "Profile updated successfully!"
- [ ] **Error state**: Red alert with validation error message

### Responsive
- [ ] Form sections stack properly on mobile
- [ ] Buttons stack on mobile with adequate spacing

---

## 7. Account Deletion Page (`/settings/delete-account`)

### Header
- [ ] Same as Dashboard
- [ ] "Back to Profile" link (text-primary-600)

### Main Content
- [ ] Container: `max-w-2xl mx-auto px-4 py-8`
- [ ] Card with red border (`border-red-200`)

### Visual Design
- [ ] Title: "Delete Account" (text-2xl text-red-600)
- [ ] Subtitle: "This action cannot be undone"

### Warning Alert
- [ ] Background: `bg-red-50`
- [ ] Border: `border-red-200`
- [ ] Title: "⚠️ Warning: Permanent Data Loss" (font-medium)
- [ ] Bulleted list with:
  - [ ] "Your account and profile"
  - [ ] "All uploaded documents"
  - [ ] "All chat conversations and agent sessions"
  - [ ] "All usage history"
- [ ] Final warning: "This action is irreversible!" (font-medium)

### Confirmation Flow
- [ ] **Warning state (Step 1)**:
  - [ ] "I Understand, Continue" button (variant="destructive" bg-red-600)
  - [ ] "Cancel" button (variant="outline")
- [ ] **Confirming state (Step 2)**:
  - [ ] Text input with label "Type DELETE to confirm"
  - [ ] Input height: `h-11`
  - [ ] Placeholder: "Type DELETE"
  - [ ] "Delete My Account" button:
    - [ ] Disabled until user types "DELETE" exactly
    - [ ] Color: `bg-red-600 hover:bg-red-700`
  - [ ] "Cancel" button

### States
- [ ] **Warning state**: Shows initial warning
- [ ] **Confirming state**: Shows after clicking "I Understand, Continue"
- [ ] **Processing state**: "Deleting Account..." button text
- [ ] **Error state**: Alert if confirmation text doesn't match

### Responsive
- [ ] Warning alert readable on mobile
- [ ] Buttons stack on mobile
- [ ] Proper padding and spacing

---

## Cross-Screen Verification

### Visual Consistency
- [ ] All cards use same background color (white)
- [ ] All cards use same shadow (default Card shadow)
- [ ] All cards use same border radius (default Card radius)
- [ ] All primary buttons use coral (#ff4d4d)
- [ ] All text links use coral with hover underline
- [ ] All page backgrounds use `bg-gray-50`

### Typography Consistency
- [ ] All page titles: `text-2xl`
- [ ] All subtitles: `text-sm text-gray-600`
- [ ] All labels: `text-base` or inherit from Label component
- [ ] All helper text: `text-xs text-gray-500`

### Spacing Consistency
- [ ] Card content padding: `p-6` or using CardContent
- [ ] Form field gaps: `gap-4` (16px)
- [ ] Section margins: `mb-8` (32px)
- [ ] Page padding: `px-4 py-8`

### Component Consistency
- [ ] All inputs use same height: `h-11` (44px)
- [ ] All buttons full-width on mobile: `w-full` on card actions
- [ ] All alerts positioned at top of card content
- [ ] All form labels use Label component

---

## Accessibility Verification

### Keyboard Navigation
- [ ] Tab order logical on all pages
- [ ] Enter key submits forms
- [ ] Escape key closes alerts (if dismissible)
- [ ] Focus visible on all interactive elements

### Screen Reader
- [ ] All inputs have associated labels
- [ ] Error messages announced when they appear
- [ ] Buttons have descriptive text (no icon-only buttons)
- [ ] Alert role on error/success messages

### Color Contrast
- [ ] Primary button text on coral background: passes AA
- [ ] Body text on white background: passes AA
- [ ] Error text: passes AA
- [ ] Link text: passes AA
- [ ] Disabled text: acceptable (can fail contrast for disabled state)

### Touch Targets
- [ ] All buttons minimum 44px height
- [ ] All inputs minimum 44px height
- [ ] Links have adequate spacing (not too close together)
- [ ] No interactive elements overlap

---

## Responsive Verification

### Mobile (375px)
- [ ] No horizontal scroll on any page
- [ ] All content readable without zooming
- [ ] Touch targets meet 44px minimum
- [ ] Text doesn't overflow containers
- [ ] Images/cards don't exceed viewport width

### Tablet (768px)
- [ ] Layout adapts smoothly from mobile
- [ ] Cards use appropriate max-width
- [ ] Multi-column layouts appear where designed

### Desktop (1440px)
- [ ] Centered layouts work correctly
- [ ] Max-width constraints applied (max-w-7xl, max-w-3xl, max-w-md)
- [ ] No excessive whitespace
- [ ] Content readable and well-proportioned

---

## Browser Compatibility

- [ ] Chrome/Edge: All features work
- [ ] Firefox: All features work
- [ ] Safari: All features work
- [ ] Mobile Safari (iOS): Touch interactions work
- [ ] Chrome Mobile (Android): Touch interactions work

---

## Performance

- [ ] No layout shift on page load
- [ ] Forms render quickly (<100ms)
- [ ] Smooth transitions (no jank)
- [ ] Images optimized (if any)

---

## Final Approval

- [ ] Design matches all screenshots in `screenshots/account-foundation/`
- [ ] All functional requirements from `spec.md` addressed in UI
- [ ] All states (loading, error, success) implemented
- [ ] Mobile-first approach verified
- [ ] Accessibility checklist 100% complete
- [ ] Code review complete
- [ ] QA testing complete

**Approved by**: _________________
**Date**: _________________

---

## Post-Implementation Notes

Use this section to document any design deviations or improvements made during implementation:

-
-
-
