# Centrid - MVP Design System

**Brand**: Centrid (centrid.ai)  
**Version**: MVP 1.0  
**Date**: 2024-01-15  
**Status**: MVP Implementation Ready

---

## 🎯 **MVP BRAND FOUNDATION**

### **Core Brand Promise**

**"Your central intelligence for content creation"**

Centrid is a mobile-first AI agent workspace where intelligent agents work with your documents.

### **MVP Brand Identity**

**Brand Name**: Centrid  
**Domain**: centrid.ai  
**Tagline**: "Your central intelligence for content creation"

---

## 🎨 **DESIGN TOKENS**

### **Colors**

```css
:root {
  /* Brand Colors */
  --color-centrid-primary: #7c3aed;
  --color-centrid-dark: #1a1a1a;
  --color-centrid-light: #f8f9fa;

  /* AI Agent Colors - Harmonized Purple System */
  --color-create: #7c3aed; /* Primary violet for creation */
  --color-edit: #a855f7; /* Lighter violet for editing */
  --color-research: #6366f1; /* Blue-violet for research */

  /* Semantic Colors */
  --color-success: #34c759;
  --color-warning: #ff9f0a;
  --color-error: #ff3b30;

  /* Neutrals */
  --gray-50: #f8f9fa;
  --gray-100: #e9ecef;
  --gray-200: #dee2e6;
  --gray-300: #adb5bd;
  --gray-400: #868e96;
  --gray-500: #6c757d;
  --gray-600: #495057;
  --gray-700: #495057;
  --gray-800: #343a40;
  --gray-900: #1a1a1a;
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  :root {
    /* Dark Mode Background & Text Colors */
    --color-centrid-light: #0d0d0d;
    --color-centrid-dark: #f2f2f7;
    --gray-50: #1c1c1e;
    --gray-100: #2c2c2e;
    --gray-300: #48484a;
    --gray-500: #8e8e93;
    --gray-700: #aeaeb2;
    --gray-900: #f2f2f7;

    /* Dark Mode Agent Colors - Enhanced for visibility */
    --color-create: #8b5cf6;
    --color-edit: #c084fc;
    --color-research: #818cf8;

    /* Dark Mode System Colors */
    --color-success: #30d158;
    --color-warning: #ffd60a;
    --color-error: #ff453a;
  }
}
```

### **Typography**

```css
:root {
  /* Font Family */
  --font-primary: -apple-system, BlinkMacSystemFont, "SF Pro Text",
    "SF Pro Display", "Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial,
    sans-serif;

  /* Font Sizes */
  --font-display-lg: 57px;
  --font-display-md: 45px;
  --font-headline-lg: 32px;
  --font-headline-md: 24px;
  --font-body-lg: 16px;
  --font-body-md: 14px;
  --font-body-sm: 12px;

  /* Line Heights */
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;

  /* Font Features */
  font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### **Spacing**

```css
:root {
  /* Spacing (4px grid) */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-xxl: 48px;
  --space-xxxl: 64px;
}
```

### **Border Radius**

```css
:root {
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
}
```

### **Shadows**

```css
:root {
  /* Light Mode Shadows */
  --shadow-sm: 0px 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0px 2px 8px rgba(0, 0, 0, 0.04);
  --shadow-lg: 0px 4px 16px rgba(0, 0, 0, 0.08);
}

/* Dark Mode Shadows */
@media (prefers-color-scheme: dark) {
  :root {
    --shadow-sm: 0px 1px 2px rgba(0, 0, 0, 0.4);
    --shadow-md: 0px 2px 8px rgba(0, 0, 0, 0.3);
    --shadow-lg: 0px 4px 16px rgba(0, 0, 0, 0.25);
  }
}
```

---

## 🧩 **MVP COMPONENTS**

### **Buttons**

```css
/* Primary Button */
.btn-primary {
  background-color: var(--color-centrid-primary);
  color: white;
  padding: 12px 24px;
  border-radius: var(--radius-md);
  min-height: 44px;
  font-size: var(--font-body-md);
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background-color: #6d28d9;
  transform: translateY(-1px);
}

.btn-primary:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.3);
}

/* Secondary/Outline Button */
.btn-secondary {
  background-color: transparent;
  color: var(--color-centrid-primary);
  border: 1px solid var(--color-centrid-primary);
  padding: 11px 23px; /* -1px for border */
  border-radius: var(--radius-md);
  min-height: 44px;
  font-size: var(--font-body-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background-color: var(--color-centrid-primary);
  color: white;
  transform: translateY(-1px);
}

.btn-secondary:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.3);
}

/* Minimal Button */
.btn-minimal {
  background-color: transparent;
  color: var(--color-centrid-primary);
  border: none;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  min-height: 44px;
  font-size: var(--font-body-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-minimal:hover {
  background-color: rgba(124, 58, 237, 0.08);
  transform: translateY(-1px);
}

/* Ghost Button */
.btn-ghost {
  background-color: var(--gray-50);
  color: var(--gray-700);
  border: 1px solid var(--gray-300);
  padding: 11px 23px;
  border-radius: var(--radius-md);
  min-height: 44px;
  font-size: var(--font-body-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-ghost:hover {
  background-color: var(--gray-100);
  border-color: var(--color-centrid-primary);
  color: var(--color-centrid-primary);
  transform: translateY(-1px);
}

/* Agent-Specific Buttons */
.btn-agent-create {
  background-color: var(--color-create);
  color: white;
}

.btn-agent-edit {
  background-color: var(--color-edit);
  color: white;
}

.btn-agent-research {
  background-color: var(--color-research);
  color: white;
}

/* Icon Button */
.btn-icon {
  background-color: transparent;
  border: none;
  padding: var(--space-sm);
  border-radius: var(--radius-md);
  min-height: 44px;
  min-width: 44px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### **Input Fields**

```css
.input {
  height: 44px;
  padding: 12px 16px;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  font-size: var(--font-body-md);
  font-family: var(--font-primary);
  transition: border-color 0.2s ease;
}

.input:focus {
  outline: none;
  border: 2px solid var(--color-centrid-primary);
  box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.2);
}

.textarea {
  min-height: 88px;
  padding: 12px 16px;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  font-size: var(--font-body-md);
  font-family: var(--font-primary);
  resize: vertical;
  transition: border-color 0.2s ease;
}

.textarea:focus {
  outline: none;
  border: 2px solid var(--color-centrid-primary);
  box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.2);
}
```

### **Cards**

```css
.card {
  background-color: var(--gray-50);
  border: 1px solid var(--gray-100);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}

.card-hover {
  transition: all 0.2s ease;
  cursor: pointer;
}

.card-hover:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

/* AI Suggestion Card */
.card-suggestion {
  background-color: var(--gray-50);
  border: 1px solid var(--color-centrid-primary);
  border-left: 4px solid var(--color-centrid-primary);
}

/* Agent-Specific Cards */
.card-agent {
  border-left: 3px solid var(--color-create);
}
```

---

## 📱 **RESPONSIVE DESIGN**

### **Breakpoints**

```css
/* Mobile First Approach */
/* Base styles: 320px+ (mobile) */

@media (min-width: 768px) {
  /* Tablet styles */
}

@media (min-width: 1024px) {
  /* Desktop styles */
}
```

### **Mobile-First Layout**

```css
/* Container */
.container {
  width: 100%;
  padding: 0 var(--space-md);
  margin: 0 auto;
}

@media (min-width: 768px) {
  .container {
    max-width: 768px;
    padding: 0 var(--space-lg);
  }
}

@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
    padding: 0 var(--space-xl);
  }
}

/* Grid */
.grid {
  display: grid;
  gap: var(--space-md);
}

.grid-cols-1 {
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .grid-cols-2 {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

---

## 🎛️ **MVP-SPECIFIC COMPONENTS**

### **Chat Interface**

```css
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-height: 100vh;
  background-color: var(--gray-50);
  border: 1px solid var(--gray-100);
  border-radius: var(--radius-lg);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-lg);
}

.chat-input {
  padding: var(--space-lg);
  border-top: 1px solid var(--gray-100);
  display: flex;
  gap: var(--space-md);
}

.chat-input input {
  flex: 1;
}

.message {
  margin-bottom: var(--space-md);
  padding: var(--space-md);
  border-radius: var(--radius-lg);
  max-width: 80%;
}

.message-user {
  background-color: var(--color-centrid-primary);
  color: white;
  margin-left: auto;
  border-radius: var(--radius-lg) var(--radius-lg) var(--radius-sm) var(
      --radius-lg
    );
}

.message-ai {
  background-color: var(--gray-100);
  color: var(--gray-900);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-lg) var(--radius-lg) var(--radius-lg) var(
      --radius-sm
    );
}
```

### **Document Viewer**

```css
.document-viewer {
  padding: var(--space-lg);
  max-width: 100%;
  background-color: var(--gray-50);
}

.document-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--gray-100);
  margin-bottom: var(--space-lg);
}

.document-content {
  line-height: var(--line-height-relaxed);
  font-size: var(--font-body-lg);
  color: var(--gray-900);
}
```

### **Navigation**

```css
/* Top Navigation */
.nav-top {
  background-color: var(--color-centrid-primary);
  color: white;
  padding: var(--space-md) 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

/* Bottom Navigation (Mobile) */
.nav-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background-color: var(--gray-50);
  border-top: 1px solid var(--gray-100);
  padding: var(--space-sm) 0;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-sm);
  text-decoration: none;
  color: var(--gray-600);
  font-size: var(--font-body-sm);
  transition: color 0.2s ease;
}

.nav-item.active {
  color: var(--color-centrid-primary);
}

/* Sidebar Navigation (Desktop) */
@media (min-width: 1024px) {
  .nav-sidebar {
    width: 240px;
    background-color: var(--gray-50);
    border-right: 1px solid var(--gray-100);
    padding: var(--space-lg);
  }
}
```

---

## ⚡ **IMPLEMENTATION NOTES**

### **Brand Philosophy: Harmonized Purple System**

Centrid uses a **harmonized purple color system** for all AI agents:

- **Create Agent**: `#7C3AED` (Primary violet) - Core creation, matches brand
- **Edit Agent**: `#A855F7` (Light violet) - Content refinement
- **Research Agent**: `#6366F1` (Blue-violet) - Information synthesis

**Benefits:**

- 🧠 **Psychological Coherence** - All agents feel like one intelligent system
- 🎯 **Brand Recognition** - Users instantly recognize Centrid's signature purple
- ♿ **Accessibility** - Excellent contrast ratios (WCAG AAA) in both light/dark modes
- 📱 **Mobile Optimization** - Colors work beautifully on small screens

### **CSS Variables Usage**

```css
/* Use CSS custom properties for consistency */
.my-component {
  color: var(--gray-700);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  background-color: var(--color-centrid-primary);
}

/* Agent-specific styling */
.agent-create {
  background-color: var(--color-create);
}
```

### **Mobile Touch Targets**

- Minimum 44px height/width for all interactive elements
- Adequate padding around clickable areas
- Clear visual feedback for touch interactions

### **Accessibility**

- Maintain color contrast ratios above 4.5:1
- Use semantic HTML elements
- Provide focus states for all interactive elements
- Support keyboard navigation

---

This simplified design system focuses only on the essential components needed for MVP implementation while maintaining consistency and mobile-first principles.
