# Centrid - Screen Inventory & State Documentation

**Version**: 3.0  
**Date**: 2025-01-15  
**Status**: Living Document  
**Purpose**: Complete inventory of all screens, UI layouts (desktop & mobile), states, features, and micro-interactions

---

## 📋 Table of Contents

1. [Global Navigation System](#global-navigation-system)
2. [Landing Page](#1-landing-page)
3. [Authentication Screen](#2-authentication-screen)
4. [Dashboard](#3-dashboard)
5. [Workspace (3-Panel Layout)](#4-workspace-3-panel-layout)
6. [Settings (Future)](#5-settings-future)
7. [Cross-Screen Features](#cross-screen-features)
8. [Design System Reference](#design-system-reference)

---

## Global Navigation System

The navigation bar is present on all screens **except** the Landing Page and Authentication Screen.

### Desktop Navigation Bar

```
┌────────────────────────────────────────────────────────────────────┐
│  [Logo] Centrid    [Dashboard] [Workspace]       [🔔] [Profile ▾]  │
└────────────────────────────────────────────────────────────────────┘
```

**Dimensions**:

- **Height**: 64px
- **Padding**: 16px horizontal
- **Layout**: Flexbox with space-between

**Components**:

- **Logo + Text** (Left): "C" icon + "Centrid" text
- **Navigation Items** (Center-Left): "Dashboard", "Workspace"
- **Actions** (Right): Notifications bell (future), Profile dropdown

**Styling**:

- **Background**:
  - Light: `#ffffff` with `border-bottom: 1px solid #e9ecef`
  - Dark: `#1c1c1e` with `border-bottom: 1px solid #2c2c2e`
- **Active Nav Item**: `color: #7c3aed`, `border-bottom: 2px solid #7c3aed`

**Profile Dropdown**:

```
┌──────────────────────┐
│  John Doe            │
│  john@email.com      │
│  ──────────────────  │
│  👤 Profile          │
│  ⚙️  Settings        │
│  ──────────────────  │
│  🚪 Logout           │
└──────────────────────┘
```

### Mobile Navigation Bar

```
┌──────────────────────────────────┐
│  [☰]    Centrid         [👤]     │
└──────────────────────────────────┘
```

**Dimensions**:

- **Height**: 56px
- **Position**: Fixed at top

**Components**:

- **Hamburger Menu** (Left): Opens side drawer
- **Logo Text** (Center): "Centrid"
- **Profile Icon** (Right): Opens profile sheet

### Mobile Side Drawer

```
┌──────────────────────────┐
│  [✕]                     │
│                          │
│  👤 John Doe             │
│  john@email.com          │
│  ──────────────────────  │
│  🏠 Dashboard            │
│  📝 Workspace            │
│  🔔 Notifications        │
│  ⚙️  Settings            │
│  ──────────────────────  │
│  🚪 Logout               │
└──────────────────────────┘
```

**Width**: 280px, slides in from left with backdrop overlay

### Global Navigation Micro-Interactions

1. **Logo Click**:

   - Click → Navigate to Dashboard
   - Hover → Subtle opacity change (0.8)
   - Transition: 150ms

2. **Nav Item Click**:

   - Click → Navigate to section
   - Active state → Purple underline appears with slide animation (200ms)
   - Hover (inactive) → Purple text color fade-in (150ms)

3. **Profile Dropdown**:

   - **Desktop**:
     - Click avatar/name → Dropdown opens with fade + slide down (200ms)
     - Click outside → Closes with fade out (150ms)
     - Hover dropdown item → Background color change (100ms)
     - Click item → Execute action + close dropdown
     - Keyboard: Tab to focus, Enter to open, Arrow keys to navigate items
   - **Mobile**:
     - Tap avatar → Bottom sheet slides up (300ms)
     - Swipe down or tap backdrop → Sheet slides down (250ms)

4. **Hamburger Menu (Mobile)**:

   - Tap → Drawer slides in from left (300ms) + backdrop fades in
   - Icon animates: 3 lines → X (300ms transform)
   - Tap backdrop → Drawer slides out (250ms)
   - Tap nav item → Navigate + drawer closes
   - Swipe left on drawer → Close with gesture

5. **Notification Bell** (Future):
   - Hover → Gentle scale (1.1) + rotation (5deg)
   - Click → Dropdown opens below
   - Badge pulse → When new notification arrives

---

## 1. Landing Page

### Overview

First impression screen that introduces Centrid and converts visitors to sign-ups. Focus on **knowledge work with persistent context** value proposition.  
**Note**: No global navigation bar on this screen. Single-page layout with sections.

---

### Desktop UI Layout

```
┌────────────────────────────────────────────────────────────────┐
│                         HERO SECTION                            │
│                  (Full viewport, gradient bg)                   │
│                                                                 │
│    AI For Knowledge Work With Persistent Context.              │
│    Stop Re-Explaining Context. Start Working Smarter.          │
│                                                                 │
│    Upload your documents once. Work across multiple chats.     │
│    Persistent document context—reducing re-explanation.         │
│                                                                 │
│              [Start Working Smarter] [Sign In]                 │
│                                                                 │
│    🔒 Your documents stay private • No credit card required    │
│                                                                 │
│                    [Demo Video/GIF - 15s]                      │
│                                                                 │
├────────────────────────────────────────────────────────────────┤
│                  PROBLEM AGITATION SECTION                      │
│                                                                 │
│           Context Fragmentation Is Killing Your Productivity   │
│                                                                 │
│  When working with AI, you constantly:                         │
│  ❌ Re-explain the same context in different conversations     │
│  ❌ Copy-paste documents repeatedly to maintain context        │
│  ❌ Lose your train of thought when exploring tangents         │
│  ❌ Manage disconnected threads about related work             │
│  ❌ Spend more time on context setup than knowledge work       │
│                                                                 │
│  12+ hours a week spent re-explaining, searching, and          │
│  reconstructing context. There's a better way to work with AI. │
│                                                                 │
├────────────────────────────────────────────────────────────────┤
│                      SOLUTION SECTION                           │
│                                                                 │
│              Persistent Context For Knowledge Work.             │
│                                                                 │
│  1️⃣  Upload Your Documents Once                                │
│      Drop in documents, notes, research—Centrid maintains      │
│      this context across all your work.                        │
│                                                                 │
│  2️⃣  Work Across Multiple Chats                                │
│      Start new conversations for different topics. Each chat   │
│      maintains access to your document context—automatically.  │
│                                                                 │
│  3️⃣  Focus on Knowledge Work, Not Context Management           │
│      Switch topics, branch conversations, explore tangents—    │
│      your AI maintains document context.                       │
│                                                                 │
│                   [Start Working Smarter]                      │
│                                                                 │
├────────────────────────────────────────────────────────────────┤
│                      USE CASES SECTION                          │
│                                                                 │
│         Built For How Knowledge Workers Actually Work          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  │ ✨ Create &  │  │ 🔍 Research &│  │ 📊 Analyze & │  │ 🌿 Branch &  │
│  │   Generate   │  │  Synthesize  │  │   Decide     │  │   Explore    │
│  │              │  │              │  │              │  │              │
│  │ Generate from│  │ Find info    │  │ Make informed│  │ Explore      │
│  │ your docs... │  │ across docs..│  │ decisions... │  │ tangents...  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
│                                                                 │
├────────────────────────────────────────────────────────────────┤
│                  SECURITY & PRIVACY SECTION                     │
│                                                                 │
│                    Your Data, Your Control                      │
│                                                                 │
│  🔒 Enterprise-grade encryption for all your documents         │
│  🚫 We never train AI models on your data                      │
│  👤 You own your content—completely and forever                │
│  ⚖️  GDPR compliant with full data portability                 │
│  🗑️  Delete everything anytime—no questions asked              │
│                                                                 │
│  Your documents stay private. Your work stays yours.           │
│                                                                 │
├────────────────────────────────────────────────────────────────┤
│                        FAQ SECTION                              │
│                                                                 │
│              Questions? We've Got Answers.                     │
│                                                                 │
│  ▼ Is my data secure?                                          │
│  ▼ How is this different from ChatGPT?                         │
│  ▼ What if I don't have many documents?                        │
│  ▼ Do I need to learn prompt engineering?                      │
│  ▼ What happens after my trial?                                │
│  ▼ Which AI model do you use?                                  │
│  ▼ Do my chats share context with each other?                  │
│                                                                 │
├────────────────────────────────────────────────────────────────┤
│                      FINAL CTA SECTION                          │
│                                                                 │
│         Ready For AI-Optimized Knowledge Work?                 │
│                                                                 │
│  Try Centrid free for 7 days. No credit card required.        │
│                                                                 │
│  Upload your documents once. Persistent context across chats.  │
│  Focus on knowledge work, not context management.              │
│                                                                 │
│                   [Get Started Now]                            │
│                                                                 │
│  ⚡ Setup in 60 seconds • 🔒 Your data stays private • ❌ Cancel anytime
│                                                                 │
│  Privacy Policy • Terms of Service • © 2025 Centrid            │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Dimensions**:

- **Container**: Full width, vertical scroll enabled
- **Hero Section**: Full viewport height (100vh)
- **Content Max Width**: 1200px, centered, 32px padding
- **Hero Title**: 48-72px font size, bold
- **Hero Subheadline**: 20-24px
- **CTA Buttons**: Minimum 48px height, generous padding
- **Use Case Cards**: 4 columns, equal width (1fr each), 28px gap
- **Section Spacing**: 80-120px vertical between sections

**Background**: Clean white with subtle gradient accents per section

---

### Mobile UI Layout

```
┌──────────────────────────┐
│    HERO SECTION          │
│  (Full screen height)    │
│                          │
│  AI For Knowledge Work   │
│  With Persistent Context │
│                          │
│  Stop Re-Explaining      │
│  Context. Start Working  │
│  Smarter.                │
│                          │
│  Upload documents once.  │
│  Work across multiple    │
│  chats. Persistent       │
│  context.                │
│                          │
│  [Start Working Smarter] │
│      [Sign In]           │
│                          │
│  🔒 Private • Free trial │
│                          │
│  [Demo Video]            │
│                          │
│ ─────── Scroll ─────────│
│                          │
│  PROBLEM SECTION         │
│                          │
│  Context Fragmentation   │
│  Is Killing Your         │
│  Productivity            │
│                          │
│  ❌ Re-explain context   │
│  ❌ Copy-paste docs      │
│  ❌ Lose train of thought│
│  ❌ Disconnected threads │
│  ❌ Wasted time setup    │
│                          │
│  12+ hrs/week wasted...  │
│                          │
│ ─────────────────────────│
│                          │
│  SOLUTION SECTION        │
│                          │
│  1️⃣ Upload Documents Once│
│     Centrid maintains... │
│                          │
│  2️⃣ Work Across Chats    │
│     Each chat has...     │
│                          │
│  3️⃣ Focus on Work        │
│     Switch topics...     │
│                          │
│  [Start Working Smarter] │
│                          │
│ ─────────────────────────│
│                          │
│  USE CASES               │
│                          │
│  ┌────────────────────┐  │
│  │ ✨ Create & Generate│  │
│  │ Generate from docs │  │
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │ 🔍 Research &      │  │
│  │    Synthesize      │  │
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │ 📊 Analyze & Decide│  │
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │ 🌿 Branch & Explore│  │
│  └────────────────────┘  │
│                          │
│ ─────────────────────────│
│                          │
│  SECURITY & PRIVACY      │
│  Your Data, Your Control │
│                          │
│  🔒 Enterprise encryption│
│  🚫 Never train on data  │
│  👤 You own your content │
│  ⚖️  GDPR compliant      │
│  🗑️  Delete anytime      │
│                          │
│  Your documents stay     │
│  private. Your work      │
│  stays yours.            │
│                          │
│ ─────────────────────────│
│                          │
│  FAQ SECTION             │
│  ▼ Questions...          │
│                          │
│ ─────────────────────────│
│                          │
│  FINAL CTA               │
│  [Get Started Now]       │
│  No credit card required │
│                          │
│  Footer links            │
│                          │
└──────────────────────────┘
```

**Dimensions**:

- **Padding**: 16-20px horizontal
- **Hero Title**: 32-40px font size, bold
- **Hero Subheadline**: 16-18px
- **CTA Buttons**: Full width, 48px height, stacked
- **Use Case Cards**: Single column, 100% width, 16px gap
- **Section Spacing**: 60-80px vertical between sections

**Mobile Notes**:

- Long vertical scroll (5-7 screens)
- Touch-optimized (minimum 44px tap targets)
- Reduced animations for performance
- Video auto-plays muted, reduced size
- Collapsible FAQ items to save space

---

### States

#### Default State

- All sections visible on scroll
- Hero section with main headline and CTA
- Problem, Solution, Use Cases, Security & Privacy, FAQ, Final CTA in order
- Demo video auto-plays muted in hero

#### Loading State

- Hero content appears first (fade-in 400ms)
- Title and CTA load immediately
- Other sections load progressively as user scrolls (lazy loading)
- Skeleton loaders for use case cards

#### Scroll States

- **Above Fold**: Hero section only
- **Scroll Progress**: Each section fades in + slides up as it enters viewport
- **Sticky CTA** (optional): CTA button follows scroll after hero exits view
- **Section Transitions**: Smooth fade-in animations (300-400ms)

#### Hover States (Desktop)

- **Primary CTA**: Elevation increases, scale(1.02), shadow grows
- **Secondary CTA**: Glassmorphic background intensifies, border glows
- **Use Case Cards**: Elevation, border glow, icon subtle scale
- **FAQ Items**: Background highlight, chevron rotates on expand

#### Expanded FAQ State

- FAQ item clicked: Content slides down (300ms), chevron rotates 180deg
- Other items remain collapsed
- Smooth height animation
- Can expand multiple items simultaneously

#### Form State (Email Capture - Optional)

- Email input field with inline validation
- Submit button disabled until valid email
- Success message after submission
- Error state for invalid emails

---

### Micro-Interactions

#### 1. Hero Section

- **Title Animation**:
  - On load: Fade in + slight slide up (400ms)
  - Split text effect: Lines appear sequentially (100ms stagger)
  - Optional: Gradient shimmer across text (subtle, 4s loop)
- **Subheadline**:
  - Fades in after title (200ms delay)
  - Slightly slower fade (400ms)
- **Trust Indicators**:
  - Icons fade in with bounce (300ms, staggered 50ms)
  - Hover: Slight scale (1.05), 150ms

#### 2. CTA Buttons

- **"Start Working Smarter" (Primary)**:
  - Hover: Background darkens slightly, elevation increases (shadow-md → shadow-lg), scale(1.02)
  - Active: Scale(0.98), shadow-sm
  - Transition: All 200ms cubic-bezier(0.4, 0, 0.2, 1)
  - Click: Ripple effect from click point (300ms), button briefly pulses
  - After click: Shows loading spinner → Navigate
- **"Sign In" (Secondary)**:
  - Hover: Border color intensifies, background tint appears
  - Active: Border thickens slightly, background darkens
  - Click: Ripple + navigate
- **Repeated CTAs**:
  - Same interactions throughout page
  - Pulse animation when scrolled into view (optional, 1 time only)

#### 3. Demo Video

- **Autoplay**: Muted, loops continuously
- **Hover** (Desktop): Subtle scale (1.02), border glow appears
- **Click**: Opens full-screen modal with sound (optional)
- **On Mobile**: Reduced size, tap to play with sound

#### 4. Problem Section Checkmarks (❌)

- **On Scroll Into View**:
  - Each item fades in + slides left (staggered 100ms)
  - Checkmark icon bounces on appear (300ms)
  - Text fades in slightly after icon (50ms delay)

#### 5. Solution Steps (1️⃣2️⃣3️⃣)

- **On Scroll Into View**:
  - Numbers appear with bounce (staggered 150ms)
  - Text content fades in + slides up (300ms)
  - Numbers pulse once on appear
- **Hover** (Desktop):
  - Slight background highlight (150ms)
  - Number scales (1.1)

#### 6. Use Case Cards

- **On Scroll Into View**:
  - Cards fade in + slide up (staggered 120ms)
  - Icons appear with rotate + scale (400ms)
  - Opacity 0 → 1, translateY: 40px → 0
- **Hover** (Desktop):
  - Elevation increases (translateY: -8px, 300ms)
  - Border glow intensifies (purple, blur 8px → 16px)
  - Icon subtle scale (1.1) + rotate (5deg)
  - Background gradient shifts
  - Transition: All 300ms ease
- **Click** (optional future):
  - Expands inline to show more details
  - Or opens modal with full use case description

#### 7. Security & Privacy Section

- **On Scroll Into View**:
  - Icons fade in + scale from 0.8 to 1 (staggered 80ms each)
  - Each benefit item appears with slide-in from left (staggered 100ms)
  - Subtle bounce effect on icons
- **Hover** (Desktop):
  - Icon subtle scale (1.05) + slight rotation (3deg), 150ms
  - Background highlight on benefit item (150ms)
  - Text slightly bolds
- **Icons Used**:
  - 🔒 Lock (encryption)
  - 🚫 Prohibition sign (no training)
  - 👤 User (ownership)
  - ⚖️ Scales (GDPR/legal)
  - 🗑️ Trash (delete option)

#### 8. FAQ Accordion

- **Item Click**:
  - Chevron rotates 180deg (200ms)
  - Content slides down with ease-out (300ms)
  - Content fades in simultaneously (300ms)
  - Other items stay in current state (multi-expand)
- **Hover**:
  - Background color changes (150ms)
  - Chevron subtle scale (1.05)
- **Collapse**:
  - Content slides up + fades out (250ms)
  - Chevron rotates back (200ms)

#### 9. Final CTA Section

- **On Scroll Into View**:
  - Headline scales in with bounce (400ms)
  - CTA button appears with pop effect (300ms delay)
  - Benefits/badges fade in (staggered 80ms each)
- **CTA Button**:
  - Continuous subtle pulse animation (2s loop, very subtle)
  - Same hover/click effects as hero CTA
- **Benefits Icons** (⚡ 🔒 ❌):
  - Fade in with bounce (300ms, staggered)
  - Slight hover scale (1.05) on desktop

#### 10. Scroll-Triggered Animations

- **Intersection Observer**: All sections animate as they enter viewport
- **Threshold**: 20% of section visible triggers animation
- **Once Only**: Animations play once, don't repeat on scroll up/down
- **Smooth Scrolling**: All anchor links scroll smoothly (600ms)

#### 11. Sticky Elements (Optional)

- **Sticky CTA Bar**:
  - Appears when hero CTA scrolls out of view
  - Slides down from top (300ms)
  - Compact CTA button always accessible
  - Hides when final CTA section enters viewport

#### 12. Scroll Progress Indicator (Optional)

- **Progress Bar**: Thin line at top of page
- **Color**: Purple gradient
- **Width**: Increases as user scrolls (0% to 100%)
- **Smooth**: Updates on scroll with requestAnimationFrame

#### 13. Keyboard Navigation

- Tab order: Primary CTA → Secondary CTA → Video → Problem items → Solution steps → Use case cards → FAQ items → Final CTA → Footer links
- Enter on focused button/link: Activates with same click animation
- Enter on FAQ: Toggles expand/collapse
- Space on page: Scrolls down
- Focus visible: Purple outline (2px solid, 4px offset)

#### 14. Touch Interactions (Mobile)

- **Tap CTA**: Ripple effect, slight scale down (0.96), haptic feedback (if available), then navigate
- **Tap Use Case Card**: Subtle press effect (scale 0.98), slight haptic
- **Tap FAQ**: Expands with same animation as click
- **Pull to Refresh** (optional): Pull down at top to reload page content
- **Smooth Scroll**: Touch-friendly momentum scrolling

#### 15. Video Controls

- **Play/Pause Overlay**: Appears on hover (desktop) or tap (mobile)
- **Mute Toggle**: Icon in corner, toggles with animation
- **Progress Bar**: Thin line showing video progress
- **Loop**: Seamless loop with fade transition at end

#### 16. Link Hover Effects

- **Footer Links**:
  - Underline slides in from left (200ms)
  - Color changes (150ms)
  - Slight scale (1.02)
- **Inline Links**:
  - Purple underline appears (150ms)
  - Color darkens
  - No scale (maintain text flow)

#### 17. Form Interactions (if email capture added)

- **Input Focus**: Border glows purple, placeholder fades
- **Input Typing**: Clear error state immediately
- **Submit Button**: Same as CTA buttons
- **Success State**: Green checkmark appears, success message fades in
- **Error State**: Red border, error message slides down

---

## 2. Authentication Screen

### Overview

User registration and sign-in interface with form validation.  
**Note**: No global navigation bar (users not logged in).

---

### Desktop UI Layout

```
┌────────────────────────────────────────────────────────────────┐
│                    Full Screen Background                       │
│                                                                 │
│                                                                 │
│            ┌─────────────────────────────────┐                 │
│            │                                 │                 │
│            │           [C Logo]              │                 │
│            │                                 │                 │
│            │     Create your account         │                 │
│            │  Start your AI-powered journey  │                 │
│            │                                 │                 │
│            │  ┌───────────────────────────┐ │                 │
│            │  │ Email                     │ │                 │
│            │  └───────────────────────────┘ │                 │
│            │                                 │                 │
│            │  ┌───────────────────────────┐ │                 │
│            │  │ Password                  │ │                 │
│            │  └───────────────────────────┘ │                 │
│            │                                 │                 │
│            │  ┌───────────────────────────┐ │                 │
│            │  │ Confirm Password          │ │                 │
│            │  └───────────────────────────┘ │                 │
│            │                                 │                 │
│            │      [Create Account]           │                 │
│            │                                 │                 │
│            │  Already have an account?       │                 │
│            │         Sign in                 │                 │
│            └─────────────────────────────────┘                 │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Dimensions**:

- **Auth Card**: 480px × auto, centered
- **Card Padding**: 48px
- **Input Fields**: 100% width, 48px height
- **Button**: 100% width, 48px height

---

### Mobile UI Layout

```
┌──────────────────────────┐
│  Full Screen Background  │
│                          │
│  ┌────────────────────┐  │
│  │                    │  │
│  │     [C Logo]       │  │
│  │                    │  │
│  │  Create your       │  │
│  │  account           │  │
│  │                    │  │
│  │  Start your AI-    │  │
│  │  powered journey   │  │
│  │                    │  │
│  │ ┌────────────────┐ │  │
│  │ │ Email          │ │  │
│  │ └────────────────┘ │  │
│  │                    │  │
│  │ ┌────────────────┐ │  │
│  │ │ Password       │ │  │
│  │ └────────────────┘ │  │
│  │                    │  │
│  │ ┌────────────────┐ │  │
│  │ │ Confirm Pass   │ │  │
│  │ └────────────────┘ │  │
│  │                    │  │
│  │ [Create Account]   │  │
│  │                    │  │
│  │ Already have an    │  │
│  │ account? Sign in   │  │
│  └────────────────────┘  │
│                          │
└──────────────────────────┘
```

**Dimensions**:

- **Auth Card**: 92% viewport width (max 400px)
- **Padding**: 32px
- **Inputs**: Full width, 44px height (touch-friendly)

**Mobile Notes**:

- Email input uses email keyboard type
- Auto-scroll to focused input when keyboard opens

---

### States

#### Sign Up State (Default)

- Email, Password, Confirm Password fields
- Button: "Create Account"
- Footer: "Already have an account? Sign in"

#### Sign In State

- Email, Password fields only
- Button: "Sign In"
- Footer: "Don't have an account? Sign up"

#### Loading State

- Button spinner, text: "Creating account..."
- Inputs disabled (opacity: 0.6)

#### Error State

- Red border on invalid input
- Error message below field
- Form-level error banner (if needed)

#### Success State

- Green checkmark animation
- "Account created! Redirecting..."
- Redirect to Dashboard (< 1s)

#### Dark Mode

- Card: `rgba(28, 28, 30, 0.8)` with backdrop blur
- Inputs: `#1c1c1e` background
- Purple focus states

---

### Micro-Interactions

#### 1. Card Entry Animation

- On load: Card scales from 0.95 to 1 + fades in (400ms)
- Backdrop blur gradually intensifies

#### 2. Logo

- Subtle rotation on hover (5deg, 300ms)
- Pulse glow effect (2s loop)

#### 3. Form Inputs

- **Focus State**:
  - Border color changes gray → purple (200ms)
  - Glow appears: `box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1)` (200ms)
  - Label moves up and shrinks (if using floating labels)
  - Placeholder fades out (150ms)
- **Blur (Lose Focus)**:
  - If empty: Label moves back down
  - If filled: Label stays up
  - Purple border fades to gray (200ms)
  - Glow fades out (150ms)
- **Typing**:
  - Clear error state immediately on first keystroke
  - Error border fades out (200ms)
  - Error message slides up and fades (200ms)
- **Validation**:
  - On blur, validate field
  - If invalid: Border turns red (200ms), error message slides down (200ms)
  - If valid: Subtle green checkmark appears in input (fade 200ms)

#### 4. Password Strength Indicator (Sign Up)

- Appears below password field when user starts typing
- Bar fills based on strength (animated width, 300ms)
- Color changes: Red → Yellow → Green
- Text updates: "Weak" → "Medium" → "Strong"

#### 5. Password Match Indicator (Confirm Password)

- Real-time check as user types
- If match: Green checkmark (fade in)
- If no match: Red X icon (fade in)
- Border color reflects state

#### 6. Submit Button

- **Hover**:
  - Background lightens slightly (200ms)
  - Elevation increases (shadow grows)
  - Slight scale (1.01)
- **Active (Mouse Down)**:
  - Scale(0.98)
  - Shadow decreases
- **Click**:
  - Ripple effect from center (300ms)
  - Button disables immediately
  - Text fades out, spinner fades in (200ms)
- **Loading**:
  - Spinner rotates continuously
  - Button width stays same (no layout shift)
  - Cursor changes to wait
- **Success**:
  - Spinner fades out, checkmark fades in (200ms)
  - Checkmark scales up with bounce (400ms)
  - Green background flash (300ms)
  - Redirect after 800ms
- **Error**:
  - Shake animation (300ms, 3 shakes)
  - Red flash (200ms)
  - Spinner fades out, original text fades in
  - Re-enable button

#### 7. Toggle Sign In/Sign Up

- Click "Sign in" or "Sign up" link
- Card content cross-fades (300ms)
- Inputs slide and fade:
  - Sign Up → Sign In: Confirm Password slides up + fades out
  - Sign In → Sign Up: Confirm Password slides down + fades in
- URL updates (client-side routing)

#### 8. Error Animations

- **Field Error**:
  - Input shakes horizontally (200ms, small amplitude)
  - Error message slides down from input (200ms)
  - Icon (!) appears before message
- **Form Error**:
  - Banner slides down from top of card (300ms)
  - Icon and message with close button
  - Auto-dismiss after 5s (fade out)

#### 9. Keyboard Interactions

- **Tab**: Move through inputs → button → footer link
- **Shift+Tab**: Move backwards
- **Enter on input**: Submit form (if valid)
- **Enter on link**: Toggle sign up/in
- **Escape**: Clear focused input (optional)
- **Focus visible**: Purple outline ring

#### 10. Mobile Touch Interactions

- **Tap input**: Focus with keyboard
- **Auto-scroll**: Page scrolls so input is visible above keyboard
- **Tap outside**: Blur input, hide keyboard
- **Swipe down**: Dismiss keyboard (if supported)

#### 11. Accessibility

- **Screen reader**: Announces errors immediately
- **ARIA live region**: For form errors
- **Label association**: Proper label/input linkage
- **Error description**: aria-describedby on invalid inputs

---

## 3. Dashboard

### Overview

Central hub showing overview, stats, and quick access.  
**Includes**: Global navigation bar at top.

---

### Desktop UI Layout

```
┌────────────────────────────────────────────────────────────────┐
│  [Logo] Centrid   [Dashboard] [Workspace]         [🔔] [Profile▾] │ ← Global Nav
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Good morning, John! 👋                         [94% ●]        │
│                                                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  │ 24 Documents │ │ 156 Requests │ │ 12.5K Words  │ │  42 Hours    │
│  │ ↑ 4 this wk  │ │ ↑ 23 this wk │ │ ↑ 3.2K/week  │ │  Saved       │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
│                                                                 │
│                                                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────┐    │
│  │ 📄 Recent Documents     │  │ 💬 Recent Chats         │    │
│  │                         │  │                         │    │
│  │ • Marketing Strategy    │  │ • Create: Blog post     │    │
│  │   [Create] 2h ago       │  │   Marketing Strategy    │    │
│  │                         │  │   5m ago                │    │
│  │ • Project Plan          │  │                         │    │
│  │   [Edit] 5h ago         │  │ • Edit: Improve intro   │    │
│  │                         │  │   Project Plan          │    │
│  │ • Research Notes        │  │   2h ago                │    │
│  │   [Research] 1d ago     │  │                         │    │
│  │                         │  │ • Research: Competitor  │    │
│  └─────────────────────────┘  │   Research Notes        │    │
│                                │   5h ago                │    │
│                                └─────────────────────────┘    │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Dimensions**:

- **Content Container**: Max 1400px, centered, 32px padding
- **Stat Cards**: 4 columns (1fr each), 16px gap, 120px height
- **Navigation Section**: Full width, 240px height
- **Recent Sections**: 2 columns (50% each), 24px gap

---

### Mobile UI Layout

```
┌──────────────────────────┐
│ [☰]  Centrid      [👤]   │ ← Global Nav
├──────────────────────────┤
│                          │
│  Good morning, John! 👋  │
│                          │
│  [94% ●]                 │
│                          │
│  ┌────────────────────┐  │
│  │ 24 Documents       │  │
│  │ ↑ 4 this week      │  │
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │ 156 AI Requests    │  │
│  │ ↑ 23 this week     │  │
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │ 12.5K Words Gen    │  │
│  │ ↑ 3.2K this week   │  │
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │ 42 Hours Saved     │  │
│  └────────────────────┘  │
│                          │
│                          │
│  ┌────────────────────┐  │
│  │ 📄 Recent Docs     │  │
│  │ • Marketing...     │  │
│  │ • Project Plan     │  │
│  │ • Research...      │  │
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │ 💬 Recent Chats    │  │
│  │ • Create: Blog...  │  │
│  │ • Edit: Improve... │  │
│  │ • Research: Comp...│  │
│  └────────────────────┘  │
│                          │
└──────────────────────────┘
```

**Dimensions**:

- **Padding**: 16px horizontal
- **Stat Cards**: Single column, full width, 12px gap
- **Navigation Buttons**: Stacked, full width, 12px gap

**Mobile Notes**:

- Pull-to-refresh for updating stats
- Horizontal swipe on stat cards (alternative)

---

### States

#### Default State (Populated)

- All stats with numbers and trends
- Recent documents/chats (3 each)
- Productivity circle animated

#### Empty State (New User)

- Stats show "0" values
- Recent sections have empty states with CTAs
- "Create Your First Document" button

#### Loading State

- Skeleton loaders on stat cards (shimmer)
- Spinners in recent sections
- Welcome text loads immediately

#### Error State

- Last cached values with warning icon
- Error banner at top: "Unable to load. [Retry]"
- Retry button attempts reload

#### Dark Mode

- Background: `#0d0d0d`
- Cards: `rgba(28, 28, 30, 0.6)` with borders
- Gradient stat: Dark purple

---

### Micro-Interactions

#### 1. Welcome Header

- **On Load**:
  - Text fades in + slides down (400ms)
  - Greeting changes based on time: "Good morning/afternoon/evening"
- **Productivity Circle**:
  - Animates from 0% to 94% (1000ms)
  - Circle stroke draws clockwise
  - Number counts up with easing
  - Hover: Slight scale (1.05), shows tooltip with details

#### 2. Stat Cards

- **On Load**:
  - Cards fade in + slide up (staggered 100ms each)
  - Numbers count up from 0 (800ms with easing)
- **Hover**:
  - Elevation increases (translateY: -4px, 200ms)
  - Shadow grows (shadow-md → shadow-lg)
  - Border glow appears (purple, subtle)
- **Click** (future):
  - Ripple effect
  - Modal opens with detailed analytics
- **Number Update** (real-time):
  - Old number fades out + scales down
  - New number fades in + scales up from below
  - Duration: 400ms
- **Trend Arrow**:
  - Green arrow bounces up slightly on load
  - Pulse animation (1.5s loop) if significant change

#### 3. Gradient Stat Card (Time Saved)

- **Background Animation**:
  - Gradient shifts position (20s loop)
  - Subtle shimmer effect across surface
- **Hover**:
  - Gradient moves faster (1s per shift)
  - Scale(1.02)
  - Glow intensifies

#### 4. Navigation Section

- **Section Entry**:
  - Fades in + slides up (300ms, after stats)
  - Border draws from left to right (400ms)
- **Buttons**:
  - **Open Workspace (Primary)**:
    - Hover: Background lightens, elevation, scale(1.02)
    - Click: Ripple + navigate
    - Keyboard focus: Purple ring
  - **Documents/Settings (Secondary)**:
    - Hover: Border color intensifies, background tint
    - Click: Ripple + action
- **Button Group**:
  - Focus trap: Tab cycles through 3 buttons

#### 5. Recent Documents

- **Section Entry**:
  - Fades in + slides up (after navigation, 300ms)
- **Document Items**:
  - Hover:
    - Background changes to light purple tint (150ms)
    - Slight translate left (2px)
    - Agent badge glows
  - Click:
    - Ripple effect
    - Brief highlight (200ms)
    - Navigate to Workspace with that document
  - Active document:
    - Purple gradient left border
    - Background slightly highlighted
    - "Currently open" badge appears on hover
- **Agent Badges**:
  - Colored background (Create/Edit/Research)
  - Pulse animation on hover
  - Tooltip shows agent type on long hover (600ms delay)
- **Timestamps**:
  - Relative time updates every minute
  - Hover: Shows exact date/time tooltip

#### 6. Recent Chats

- **Similar to Documents**:
  - Hover: Background highlight, glow
  - Click: Opens Workspace with that chat active
- **Active Chat**:
  - Purple border, highlighted background
- **Chat Preview**:
  - Shows first line of last message
  - Truncates with ellipsis
  - Hover: Expands to show more (slide down, 200ms)

#### 7. Empty States

- **Illustration**:
  - Gentle float animation (5s loop)
  - Subtle scale pulse (3s loop)
- **CTA Button**:
  - Hover: Background gradient shift, elevation
  - Click: Ripple + navigate to Workspace or upload modal

#### 8. Loading States

- **Skeleton Cards**:
  - Shimmer animation moves left to right (1.5s loop)
  - Gradient: `linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)`
- **Progressive Loading**:
  - Nav bar → Welcome → Stats → Recent (cascading)

#### 9. Error State

- **Error Banner**:
  - Slides down from top (300ms)
  - Red background with white text
  - Shake animation on appear (3 shakes)
  - Close button (X) with hover effect
  - Auto-dismiss after 8s (fade up)
- **Retry Button**:
  - Hover: Background darkens
  - Click: Loading spinner, attempts reload

#### 10. Pull-to-Refresh (Mobile)

- **Pull Down**:
  - Spinner appears at top (grows as you pull)
  - Page content translates down
- **Release**:
  - Spinner spins while refreshing
  - Page bounces back into place
  - Content updates with fade transition
- **Complete**:
  - Checkmark replaces spinner (300ms)
  - Fades out after 500ms

#### 11. Keyboard Navigation

- Tab order: Welcome → Stat cards → Nav buttons → Recent items
- Arrow keys: Navigate within sections
- Enter: Activate focused item
- Space: Scroll page

#### 12. Smooth Scrolling

- Scroll animations trigger when elements enter viewport
- Fade in + slide up effects
- Different delays for variety

---

## 4. Workspace (3-Panel Layout)

### Overview

Main working area with documents, editor, and AI chat.  
**Includes**: Global navigation bar at top.

---

### Desktop UI Layout

```
┌────────────────────────────────────────────────────────────────────────────┐
│  [Logo] Centrid   [Dashboard] [Workspace]              [🔔] [Profile ▾]    │ ← 64px
├────────────────┬─────────────────────────────────┬───────────────────────┤
│  DOCUMENTS     │     DOCUMENT EDITOR             │    AI CHAT            │
│  (260px)       │     (flex-1)                    │    (360px)            │
│ ┌────────────┐ │ ┌─────────────────────────────┐ │ ┌───────────────────┐ │
│ │ Search...  │ │ │ [B][I][U][H1][H2][•][1.][🔗]│ │ │ ▼ Active Chat     │ │
│ └────────────┘ │ └─────────────────────────────┘ │ │ Auto-selects      │ │
│                │                                 │ │ agent             │ │
│ ▼ 📁 Marketing │ AI Marketing Strategy           │ ├───────────────────┤ │
│   • AI Market  │ #marketing | 📅 2h | 1.2K      │ │                   │ │
│   • Content    │                                 │ │ You:              │ │
│   • Campaign   │ # Executive Summary             │ │ ┌───────────────┐ │ │
│                │                                 │ │ │ Create metrics│ │ │
│ › 📁 Projects  │ Lorem ipsum dolor sit amet...   │ │ └───────────────┘ │ │
│ › 📁 Research  │                                 │ │                   │ │
│ ──────────────│ ## Market Analysis              │ │ [Edit Agent]:     │ │
│ • Quick Notes  │                                 │ │ ┌───────────────┐ │ │
│ • Ideas        │ Content continues...            │ │ │ I'll add...   │ │ │
│                │                                 │ │ └───────────────┘ │ │
│ [+ New Doc]    │                                 │ │                   │ │
└────────────────┴─────────────────────────────────┴ │ ┌─ Suggested ──┐ │ │
                                                     │ │ • Revenue: $X │ │ │
                                                     │ │ [Apply][Revise]│ │ │
                                                     │ └───────────────┘ │ │
                                                     │                   │ │
                                                     │ Quick Switch:     │ │
                                                     │ • Chat 1 (active) │ │
                                                     │ • Chat 2 (2h ago) │ │
                                                     │                   │ │
                                                     │ ┌─────────────────┐ │
                                                     │ │ Type message... │ │
                                                     │ └──────── [Send]──┘ │
                                                     └───────────────────┘ │
```

**Dimensions**:

- **Left Panel**: 260px × `calc(100vh - 64px)`
- **Middle Panel**: `flex: 1` × full height
- **Right Panel**: 360px × full height
- All panels have internal scrolling

---

### Mobile UI Layout

```
┌──────────────────────────────┐
│ [☰]    Centrid        [👤]   │  ← 56px
├──────────────────────────────┤
│ [Documents] [Editor] [Chat]  │  ← 48px tabs
├──────────────────────────────┤
│                              │
│    ACTIVE PANEL              │
│    (full screen, scrollable) │
│                              │
│                              │
│                              │
│                              │
│                              │
│                              │
└──────────────────────────────┘
```

**Tabs**: "Documents", "Editor", "Chat" - only one visible at a time  
**Swipe**: Gesture to switch between tabs  
**Height**: `calc(100vh - 104px)` per panel

---

### States

#### Default State (Document Open)

- Left: Tree expanded, active file highlighted
- Middle: Document content, toolbar visible
- Right: Active chat with messages

#### Empty State (No Documents)

- Left: Empty illustration, "+ Create First Document"
- Middle: Welcome screen, upload CTA
- Right: Empty chat, grayed prompts

#### Loading States

- Document loading: Skeleton in middle
- Chat loading: Typing indicator
- Tree loading: Shimmer on folders

#### AI Processing State

- Right: Agent "working" indicator
- Middle: Read-only overlay
- Suggestion preview when done

#### Saving State

- "Saving..." indicator in nav → "Saved ✓"
- Fades out after 2s

#### Dark Mode

- Left/Right panels: `#1c1c1e`
- Middle panel: `#0d0d0d`
- Borders: `#2c2c2e`

---

### Micro-Interactions

### Left Panel: Documents

#### 1. Search Input

- **Focus**:
  - Border glows purple (200ms)
  - Icon color changes gray → purple
  - Placeholder fades out
- **Typing**:
  - Real-time filter (debounced 200ms)
  - Matching items stay, non-matching fade out (200ms)
  - Matching text highlights in yellow
- **Clear**:
  - X icon appears when text present
  - Click X: Text clears + items fade back in (200ms)

#### 2. Folder/File Tree

- **Folder Click**:
  - Chevron rotates 90deg (200ms ease)
  - Children slide down + fade in (250ms cubic-bezier)
  - Folder icon subtle bounce
- **Folder Collapse**:
  - Chevron rotates back (200ms)
  - Children slide up + fade out (200ms)
- **Folder Hover**:
  - Background color changes (150ms)
  - Cursor changes to pointer
- **File Hover**:
  - Background highlight (150ms)
  - Slight translate right (2px)
  - File icon subtle scale (1.05)
- **File Click**:
  - Ripple effect from click point
  - File item pulses (200ms)
  - Previous active fades out
  - New active fades in with purple border (300ms)
  - Middle panel: Old doc fades out, new fades in (400ms)
- **Active File**:
  - Purple left border draws top to bottom (200ms)
  - Background purple tint
  - Bold text
  - Subtle pulse on first load

#### 3. Drag & Drop (Future)

- **Drag Start**:
  - Item becomes semi-transparent
  - Ghost preview follows cursor
- **Drag Over Folder**:
  - Folder highlights with dashed border
  - Expands if hover > 800ms
- **Drop**:
  - Item animates into folder (300ms)
  - Success: Green flash on folder (200ms)

#### 4. New Document Button

- **Hover**:
  - Background lightens (200ms)
  - Icon rotates 90deg (300ms)
  - Scale(1.02)
- **Click**:
  - Ripple effect
  - Button briefly pulses
  - New "Untitled" document appears at top with highlight
  - Auto-opens in editor with focus on title

---

### Middle Panel: Document Editor

#### 5. Toolbar

- **Button Hover**:
  - Background changes (150ms)
  - Icon color darkens/brightens
  - Tooltip appears below after 400ms delay
- **Button Click**:
  - Active state: Background darker, pressed appearance
  - Format applies to selection
  - Button stays highlighted if format active in selection
- **Format Toggle**:
  - Click Bold on bold text → Remove bold with fade (200ms)
  - Click Bold on normal → Apply bold, text weight animates (200ms)
- **Keyboard Shortcuts**:
  - Cmd+B, Cmd+I, Cmd+U trigger same animations as clicks

#### 6. Document Title

- **Hover** (if editable):
  - Subtle underline appears (200ms)
  - Cursor changes to text
- **Click**:
  - Title becomes contentEditable
  - Text selects all
  - Border appears around title (200ms)
- **Editing**:
  - Character count appears if long (fade in)
  - Enter: Blur and save
  - Escape: Cancel and revert
- **Save**:
  - "Saving..." indicator appears briefly
  - Green checkmark fades in then out (1s total)

#### 7. Document Content

- **Text Selection**:
  - Mini formatting toolbar appears above selection (200ms fade)
  - Toolbar includes: Bold, Italic, Link, Comment (future)
- **Typing**:
  - Auto-save triggers after 2s idle
  - Cursor blinks smoothly
  - Word count updates in real-time (metadata bar)
- **Link Hover**:
  - Underline appears (150ms)
  - Preview tooltip after 600ms
  - Click: Open in new tab with animation
- **Heading Creation**:
  - Type `#` + space: Converts to H1 with animation (300ms)
  - Type `##` + space: Converts to H2
  - Text size animates to heading size

#### 8. AI Suggestions Overlay

- **Appear**:
  - Slides in from right + fades in (400ms)
  - Relevant text in document highlights yellow (300ms)
  - Gentle pulse draws attention
- **Hover**:
  - Elevation increases
  - Border glows purple
- **Apply Button**:
  - Hover: Background darkens, scale(1.02)
  - Click:
    - Button shows spinner briefly
    - Overlay fades out (300ms)
    - Suggested text appears in document with green highlight (500ms)
    - Green fades to normal after 2s
    - Success toast: "Changes applied"
- **Revise Button**:
  - Click: Overlay minimizes to chat panel (300ms transform)
  - Chat panel highlights, input pre-fills with "Revise: ..."
- **Dismiss**:
  - X button hover: Rotates 90deg
  - Click: Overlay slides out right + fades (300ms)
  - Highlight in document fades (200ms)

#### 9. Scroll Behavior

- **Smooth Scrolling**: Eased scrolling throughout
- **Scroll Shadows**: Top/bottom fade shadows appear when content scrollable
- **Reading Progress**: Subtle progress bar at top (optional)

---

### Right Panel: AI Chat

#### 10. Chat Selector

- **Dropdown Click**:
  - Opens with slide down + fade (200ms)
  - List of all chats appears
  - Current chat highlighted
- **Dropdown Item Hover**:
  - Background highlight (150ms)
  - Slight indent (2px)
- **Select Different Chat**:
  - Dropdown closes (200ms)
  - Chat messages cross-fade (400ms)
  - Old messages fade out + slide up
  - New messages fade in + slide down
  - Input area updates placeholder

#### 11. New Chat Button

- **Hover**:
  - Icon rotates 90deg (300ms)
  - Scale(1.05)
- **Click**:
  - Button pulses
  - New empty chat loads (cross-fade 300ms)
  - Input auto-focuses
  - Placeholder suggests: "Ask about the current document..."

#### 12. Chat Messages

- **New Message Arrival** (User):
  - Message slides up from input area (300ms)
  - Fades in simultaneously
  - Auto-scroll to bottom (smooth, 400ms)
- **New Message Arrival** (AI):
  - Typing indicator appears (3 dots animating)
  - Message fades in + slides up from typing indicator (400ms)
  - Agent badge appears with subtle bounce
  - Auto-scroll to bottom
- **Message Hover**:
  - Slight scale(1.01)
  - Actions appear (copy, delete) - future
  - Timestamp becomes visible (if hidden)
- **Long Message**:
  - Initially collapsed with "Show more" link
  - Click: Expands with slide down (300ms)

#### 13. Agent Badge

- **Appears**: Fades in with message
- **Hover**: Tooltip shows agent details (300ms delay)
- **Color**: Matches agent type (Create/Edit/Research)

#### 14. Suggested Changes Card

- **Appear**:
  - Slides down + fades in (300ms)
  - Pulse effect draws attention
  - Preview shows diff (green additions)
- **Apply Button**:
  - Hover: Glows green
  - Click:
    - Spinner appears (200ms)
    - Card minimizes + moves to document (800ms transform)
    - Appears in middle panel
    - Applies changes there
    - Success feedback in chat: "✓ Applied"
- **Revise Button**:
  - Click: Card minimizes, input pre-fills

#### 15. Chat Input

- **Focus**:
  - Border glows purple (200ms)
  - Placeholder fades (150ms)
  - Textarea expands slightly (200ms)
- **Typing**:
  - Textarea auto-expands as lines added (smooth)
  - Max height: 120px, then scrolls
  - Character count if near limit (fade in)
- **Send Button**:
  - Disabled until text entered
  - Enabled: Fades in purple (200ms)
  - Hover: Glows, scale(1.05)
  - Click or Enter:
    - Button briefly pulses
    - Message text fades out from input (200ms)
    - Appears as message bubble (see #12)
    - Input collapses to original size
- **Shift+Enter**: Inserts new line (no send)
- **Slash Command** (future):
  - Type `/`: Command palette appears above (200ms)
  - Arrow keys navigate commands
  - Enter selects

#### 16. Quick Switch Section

- **Chat Item Hover**:
  - Background highlight (150ms)
  - Slight scale(1.01)
- **Chat Item Click**:
  - Ripple effect
  - Brief highlight (200ms)
  - Current chat swaps (see #10)
- **Active Chat**:
  - Purple left border
  - Background slightly highlighted
  - Bold text
- **Badge Updates**:
  - If new message in background chat: Badge appears with number
  - Badge pulses (1s loop)
  - Click chat: Badge fades out (200ms)

#### 17. Scroll Behavior (Chat)

- **Auto-scroll**: When new message arrives
  - If user at bottom: Smooth scroll to new message (400ms)
  - If user scrolled up: "New message" indicator appears at bottom
- **Manual Scroll Up**: Load older messages (infinite scroll)
  - Spinner appears at top briefly
  - Old messages fade in + slide down (300ms)
- **Scroll to Bottom Button**:
  - Appears when user scrolls up (fade in 200ms)
  - Floats above input
  - Click: Smooth scroll to bottom (600ms)

---

### Mobile: Tab Switching

#### 18. Tab Navigation

- **Tab Click**:
  - Active tab indicator slides to new tab (300ms)
  - Previous panel slides out (300ms)
  - New panel slides in (300ms)
  - URL updates (client-side routing)
- **Swipe Gesture**:
  - Swipe left/right on panel
  - Panel follows finger
  - Release: Snaps to prev/next tab (300ms ease-out)
  - Indicator follows
- **Tab Indicator**:
  - Purple underline
  - Slides smoothly between tabs
  - Width matches tab width

---

### Cross-Panel Interactions

#### 19. Document Context in Chat

- When document opens in editor, chat shows:
  - "Now discussing: [Document Name]" (toast, 3s)
  - AI knows document context
- Select text in editor (future):
  - Mini button appears: "Ask AI"
  - Click: Opens chat with selection quoted

#### 20. Chat References in Document

- AI mentions section name in chat
- Click section name:
  - Chat minimizes slightly
  - Document scrolls to section (600ms smooth)
  - Section highlights yellow briefly (2s)

#### 21. Collaborative Editing (Future)

- Other users' cursors appear with name labels
- Cursor colors match user avatars
- Cursors move smoothly (interpolated)
- Selections show as colored highlights

---

### Keyboard Shortcuts

- **Global**:
  - `Cmd+S`: Manual save (shows "Saved" briefly)
  - `Cmd+N`: New document
  - `Cmd+K`: Quick search/command palette
  - `Cmd+/`: Toggle focus: Editor ↔ Chat
- **Editor**:
  - `Cmd+B/I/U`: Format text
  - `Cmd+Enter`: New line in editor (prevents search)
  - `Tab`: Indent, not cycle focus
- **Chat**:
  - `Cmd+Enter`: Send message
  - `Up Arrow`: Edit last message (future)
  - `/`: Command palette

---

## 5. Settings (Future)

### Overview

User preferences, account management, and billing.  
**Includes**: Global navigation bar at top.

---

### Desktop UI Layout (Planned)

```
┌────────────────────────────────────────────────────────────────┐
│  [Logo] Centrid   [Dashboard] [Workspace]         [🔔] [Profile▾] │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┬───────────────────────────────────────────┐  │
│  │  Profile     │  Profile Settings                         │  │
│  │  Preferences │                                           │  │
│  │  Billing     │  [Avatar Upload]                          │  │
│  │  Security    │                                           │  │
│  │  API Keys    │  Name: [John Doe              ]          │  │
│  │  Team        │  Email: [john@example.com     ]          │  │
│  │              │  Bio: [                       ]          │  │
│  │              │                                           │  │
│  │              │  [Save Changes]                           │  │
│  └──────────────┴───────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Planned Sections**:

1. **Profile**: Name, email, avatar, bio
2. **Preferences**: Language, timezone, theme, notifications
3. **Billing**: Plan, payment, invoices
4. **Security**: Password, 2FA
5. **API Keys**: Developer access
6. **Team** (future): Invite members

---

### Mobile UI Layout (Planned)

```
┌──────────────────────────┐
│ [☰]  Settings     [👤]   │
├──────────────────────────┤
│                          │
│ ▼ Profile                │
│   [Avatar]               │
│   Name: [John Doe]       │
│   Email: [john@...]      │
│   [Save]                 │
│                          │
│ › Preferences            │
│ › Billing                │
│ › Security               │
│ › API Keys               │
│                          │
└──────────────────────────┘
```

Single column, collapsible sections

---

## Cross-Screen Features

### Keyboard Shortcuts (Desktop)

**Global** (work across all screens):

- `Cmd+K`: Quick search/command palette
- `Cmd+N`: New document (in Workspace)
- `Cmd+S`: Manual save
- `Cmd+Enter`: Send chat message (in Workspace)
- `Cmd+D`: Go to Dashboard
- `Cmd+W`: Go to Workspace
- `Cmd+,`: Open Settings
- `Esc`: Close modals/overlays
- `Tab`: Navigate elements
- `/`: Quick command (in chat)

### Loading Patterns

**Initial App Load**:

- Full-page loader with Centrid logo
- Logo fades in + scales (600ms)
- Spinner rotates below
- Gradient background animates
- Duration target: < 3s

**Page Transitions**:

- Smooth fade between screens (400ms)
- Content slides slightly (20px)
- No jarring jumps
- Scroll position preserved when returning

**Content Loading**:

- **Skeleton screens** for cards/lists
- **Shimmer animation** (1.5s loop, left-right gradient)
- **Progressive loading**: Shell → Content
- **Fade in**: Content appears gracefully (300ms)

**Action Loading**:

- **Button spinners** for form submissions
- **Inline loaders** for small actions
- **Progress bars** for long operations (AI)
- **Percentage** shown if > 3s

**Background Loading**:

- **Toast notifications** slide down from top
- **Notification badge** on bell icon
- **Auto-dismiss** after 5s (slide up)

### Error Handling

**Network Errors**:

- Toast: "Connection lost. Retrying..." (orange)
- Auto-retry with exponential backoff
- Manual [Retry] button if fails
- Offline indicator in nav (future)

**Validation Errors**:

- Inline field errors (red border + message)
- Form-level error banner at top
- Icon (!) before message
- Shake animation on appear (300ms)

**System Errors**:

- Modal overlay with error details
- "Something went wrong" message
- [Contact Support] button
- [Reload Page] button
- Error code shown for support

**Rate Limits**:

- Banner: "You've reached your plan limit"
- Shows current usage vs limit
- [Upgrade] button (purple, prominent)
- Persistent until resolved

**Graceful Degradation**:

- Show cached data if fresh fails
- Indicate data is stale (timestamp)
- Disable features requiring network
- Clear messaging about unavailable features

---

## Design System Reference

All screens follow the design tokens defined in `DESIGN-SYSTEM.md`:

### Colors

**Brand Colors**:

- **Primary**: `#7c3aed` (light), `#8b5cf6` (dark)
- **Dark**: `#1a1a1a` (light), `#f2f2f7` (dark text)
- **Light**: `#f8f9fa` (light), `#0d0d0d` (dark bg)

**Agent Colors**:

- **Create**: `#7c3aed` → `#a855f7`
- **Edit**: `#a855f7` → `#c084fc`
- **Research**: `#6366f1` → `#818cf8`

**System Colors**:

- **Success**: `#34c759` (light), `#30d158` (dark)
- **Warning**: `#ff9f0a` (light), `#ffd60a` (dark)
- **Error**: `#ff3b30` (light), `#ff453a` (dark)

**Gray Scale**:

- **50**: `#f8f9fa` (light), `#1c1c1e` (dark)
- **100**: `#e9ecef` (light), `#2c2c2e` (dark)
- **300**: `#adb5bd` (light), `#48484a` (dark)
- **500**: `#6c757d` (light), `#8e8e93` (dark)
- **700**: `#495057` (light), `#aeaeb2` (dark)
- **900**: `#1a1a1a` (light), `#f2f2f7` (dark)

### Typography Scale

- **Display Large**: 80px (landing hero desktop)
- **Display Medium**: 57px
- **Headline Large**: 42px (document titles)
- **Headline Medium**: 32px (section headings)
- **Body Large**: 18px (document content)
- **Body Medium**: 14-16px (UI text)
- **Body Small**: 12-13px (metadata)

**Font Family**: System font stack  
**Line Height**: 1.2 (headings), 1.6 (body), 1.4 (UI)

### Spacing Grid (4px base)

- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **xxl**: 48px
- **xxxl**: 64px

### Border Radius

- **sm**: 4px (tags)
- **md**: 8px (buttons, inputs)
- **lg**: 12px (cards)
- **xl**: 16px (large cards)

### Shadows

**Light Mode**:

- **sm**: `0px 1px 2px rgba(0,0,0,0.04)`
- **md**: `0px 2px 8px rgba(0,0,0,0.04)`
- **lg**: `0px 4px 16px rgba(0,0,0,0.08)`

**Dark Mode**:

- **sm**: `0px 1px 2px rgba(0,0,0,0.4)`
- **md**: `0px 2px 8px rgba(0,0,0,0.3)`
- **lg**: `0px 4px 16px rgba(0,0,0,0.25)`

### Transitions

- **Fast**: 150ms (hover, small changes)
- **Medium**: 250ms (panels, fades)
- **Slow**: 350ms (page transitions)
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)`

---

## Document Maintenance

This document should be updated whenever:

- New screens added
- Screen layouts/states change
- New features/interactions added
- Design system tokens updated
- User feedback leads to UI changes

**Last Updated**: 2025-01-15  
**Next Review**: When implementing Phase 2
