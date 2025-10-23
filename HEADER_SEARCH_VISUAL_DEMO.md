# 🔍 Header Search - Visual Demo

## Desktop Experience

### Step 1: User Sees Header with Search Icon
```
╔═══════════════════════════════════════════════════════════════╗
║  [Logo]    HOME  ABOUT  SERVICES  CONTACT    🔍  ❤️  🛒  👤  ║
║                                                (Icon is here) ║
╚═══════════════════════════════════════════════════════════════╝
```

### Step 2: User Hovers Over Search Icon
```
╔═══════════════════════════════════════════════════════════════╗
║  [Logo]    HOME  ABOUT  SERVICES  CONTACT    🔍* ❤️  🛒  👤  ║
║                                              ↑
║                                         Light gray background
║                                         Orange color (#ee4d2d)
║                                         Scale: 1.08
╚═══════════════════════════════════════════════════════════════╝
```

### Step 3: User Clicks Search Icon
```
╔═══════════════════════════════════════════════════════════════╗
║  [Logo]    HOME  ABOUT  SERVICES  CONTACT    🔍* ❤️  🛒  👤  ║
╚═══════════════════════════════════════════════════════════════╝

░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░         Dark overlay backdrop (30% opacity)                     ░
░                                                                 ░
░           ╔═════════════════════════════════════╗              ░
░           ║ [Search products...] [🔍] [✕]    ║              ░
░           ╚═════════════════════════════════════╝              ░
░                   ↑                                             ░
░             Dropdown appears with                              ░
░             smooth slide-down animation                        ░
░                                                                 ░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

### Step 4: User Types in Input
```
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░                                                                 ░
░           ╔═════════════════════════════════════╗              ░
░           ║ [nike shoes] [🔍] [✕]              ║              ░
░           ║ Auto-focused ↑                      ║              ░
░           ╚═════════════════════════════════════╝              ░
░                                                                 ░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

### Step 5: User Hovers Over Search Button
```
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░                                                                 ░
░           ╔═════════════════════════════════════╗              ░
░           ║ [nike shoes] [🔍*] [✕]             ║              ░
░           ║                 ↑                    ║              ░
░           ║        Darker orange (#d63d1f)      ║              ░
░           ║        With shadow                  ║              ░
░           ╚═════════════════════════════════════╝              ░
░                                                                 ░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

### Step 6: User Clicks Search Button or Close Button
**Option A: Search Button**
- Query is captured
- User navigates to search results
- Dropdown closes

**Option B: Close Button (✕)**
```
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░                                                                 ░
░           ╔═════════════════════════════════════╗              ░
░           ║ [nike shoes] [🔍] [✕*]             ║              ░
░           ║                      ↑               ║              ░
░           ║           Hovering over close btn   ║              ░
░           ╚═════════════════════════════════════╝              ░
░                                                                 ░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  (Click) → Dropdown closes with fade-out animation
```

**Option C: Click Outside**
```
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░ (Click on overlay) ←                                            ░
░           ╔═════════════════════════════════════╗              ░
░           ║ [nike shoes] [🔍] [✕]              ║              ░
░           ╚═════════════════════════════════════╝              ░
░                                                                 ░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  (Click) → Dropdown closes with fade-out animation
```

## Mobile Experience (< 480px)

### Step 1: Header on Mobile
```
╔═══════════════════════════════════╗
║  [Logo]  🏠  ❤️  🛒  🔍  👤     ║
║  (Icons arranged horizontally)    ║
╚═══════════════════════════════════╝
```

### Step 2: User Clicks Search Icon
```
╔═══════════════════════════════════╗
║  [Logo]  🏠  ❤️  🛒  🔍  👤     ║
╚═══════════════════════════════════╝

░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░  ╔═══════════════════════════════╗░
░  ║ [Search...] [🔍] [✕]        ║░
░  ║ (Full width dropdown)         ║░
░  ╚═══════════════════════════════╝░
░                                   ░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

### Step 3: Mobile Search Active
```
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░  ╔═══════════════════════════════╗░
░  ║ [jersey] [🔍] [✕]            ║░
░  ║  ↑                            ║░
░  ║  Input focused, ready to type ║░
░  ╚═══════════════════════════════╝░
░                                   ░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

## Tablet Experience (480px - 768px)

### Header
```
╔════════════════════════════════════════════════════════╗
║  [Logo]  HOME  ABOUT  SERVICES  🔍  ❤️  🛒  👤      ║
╚════════════════════════════════════════════════════════╝
```

### Dropdown
```
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░        Dark overlay backdrop                            ░
░         ╔═════════════════════════════════╗            ░
░         ║ [Search...] [🔍] [✕]          ║            ░
░         ║ (450px max-width)               ║            ░
░         ╚═════════════════════════════════╝            ░
░                                                         ░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

## Animation Timeline

### Icon Click → Dropdown Appearance
```
t=0ms:     Icon clicked
           └─→ showSearchDropdown = true
           └─→ JSX renders overlay & container

t=0-200ms: Overlay fade-in
           ░ (starts at opacity 0)
           ░ (ends at opacity 1)

t=0-300ms: Container slide-down
           ╔═════════════════════════╗
           ║ translateY(-20px)       ║ ← From this position
           ╚═════════════════════════╝
                     ↓
           ╔═════════════════════════╗
           ║ translateY(0)           ║ ← To this position
           ╚═════════════════════════╝

t=300ms:   Animation complete
           Input field focused
           Ready for user input
```

## Component States

### Search Icon Button States

**Default**
```
🔍 (size: 36×36px, color: #222222, bg: transparent)
```

**Hover**
```
🔍 (size: 36×36px, color: #ee4d2d, bg: #f5f5f5, scale: 1.08)
```

**Active (Clicked)**
```
🔍 (size: 36×36px, color: #ee4d2d, bg: #f5f5f5, scale: 0.95)
```

### Search Button States

**Default**
```
╔════════════════╗
║    🔍          │ (bg: #ee4d2d, color: white)
╚════════════════╝
```

**Hover**
```
╔════════════════╗
║    🔍          │ (bg: #d63d1f, color: white, shadow)
╚════════════════╝
```

**Active**
```
╔════════════════╗
║    🔍          │ (bg: #d63d1f, color: white, scale: 0.97)
╚════════════════╝
```

### Close Button States

**Default**
```
[✕] (bg: transparent, color: #999999, size: 32×32px)
```

**Hover**
```
[✕] (bg: #f5f5f5, color: #222222, size: 32×32px)
```

**Active**
```
[✕] (bg: #efefef, color: #222222, size: 32×32px)
```

## Layout Structure

### Responsive Widths

**Desktop (1200px+)**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┌──────────────────────────────┐
│  [Search...] [🔍] [✕]       │ ← 500px max-width
└──────────────────────────────┘ ← 90% width (smaller)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Tablet (768px)**
```
━━━━━━━━━━━━━━━━━━━━━━━━━
┌─────────────────────────┐
│  [Search...] [🔍] [✕] │ ← 450px max-width
└─────────────────────────┘ ← 95% width
━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Mobile (480px)**
```
━━━━━━━━━━━━━━━━━━━━
┌──────────────────┐
│ [Search][🔍][✕] │ ← 97% width (nearly full)
└──────────────────┘
━━━━━━━━━━━━━━━━━━━━
```

## Color Transitions

### Icon on Hover
```
#222222 (Dark Gray)
    ↓
    (scale: 1.08, bg appears)
    ↓
#ee4d2d (Shopee Orange) + #f5f5f5 (Light Gray BG)
```

### Button on Hover
```
#ee4d2d (Orange)
    ↓
    (shadow appears)
    ↓
#d63d1f (Dark Orange) + Shadow 0 2px 8px rgba(238, 77, 45, 0.25)
```

## Accessibility Features

### Focus States
```
User presses TAB:
  Search Icon Button
    ↓ (focus ring visible)
    ↓
  Overlay appears, input auto-focuses
    ↓
  Input field ready (cursor blinking)
```

### Keyboard Navigation
```
🔍 Icon → TAB → Input → TAB → Search Button → TAB → Close Button
```

### Screen Reader Support
```
aria-label="Search"           (Search icon button)
title="Search"                (Hover tooltip)

aria-label="Search"           (Search button in dropdown)
title="Search"                (Hover tooltip)

aria-label="Close search"     (Close button)
title="Close"                 (Hover tooltip)
```

---

## Summary

✨ **Icon-only in header** → Cleaner UI
🎯 **Click to open** → Focused search
🎨 **Beautiful dropdown** → Professional look
📱 **Responsive design** → Works everywhere
🎭 **Smooth animations** → Polished feel

**All while matching your CartModal's Shopee-inspired design!**

## Desktop Experience

### Step 1: User Sees Header with Search Icon
```
╔═══════════════════════════════════════════════════════════════╗
║  [Logo]    HOME  ABOUT  SERVICES  CONTACT    🔍  ❤️  🛒  👤  ║
║                                                (Icon is here) ║
╚═══════════════════════════════════════════════════════════════╝
```

### Step 2: User Hovers Over Search Icon
```
╔═══════════════════════════════════════════════════════════════╗
║  [Logo]    HOME  ABOUT  SERVICES  CONTACT    🔍* ❤️  🛒  👤  ║
║                                              ↑
║                                         Light gray background
║                                         Orange color (#ee4d2d)
║                                         Scale: 1.08
╚═══════════════════════════════════════════════════════════════╝
```

### Step 3: User Clicks Search Icon
```
╔═══════════════════════════════════════════════════════════════╗
║  [Logo]    HOME  ABOUT  SERVICES  CONTACT    🔍* ❤️  🛒  👤  ║
╚═══════════════════════════════════════════════════════════════╝

░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░         Dark overlay backdrop (30% opacity)                     ░
░                                                                 ░
░           ╔═════════════════════════════════════╗              ░
░           ║ [Search products...] [🔍] [✕]    ║              ░
░           ╚═════════════════════════════════════╝              ░
░                   ↑                                             ░
░             Dropdown appears with                              ░
░             smooth slide-down animation                        ░
░                                                                 ░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

### Step 4: User Types in Input
```
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░                                                                 ░
░           ╔═════════════════════════════════════╗              ░
░           ║ [nike shoes] [🔍] [✕]              ║              ░
░           ║ Auto-focused ↑                      ║              ░
░           ╚═════════════════════════════════════╝              ░
░                                                                 ░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

### Step 5: User Hovers Over Search Button
```
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░                                                                 ░
░           ╔═════════════════════════════════════╗              ░
░           ║ [nike shoes] [🔍*] [✕]             ║              ░
░           ║                 ↑                    ║              ░
░           ║        Darker orange (#d63d1f)      ║              ░
░           ║        With shadow                  ║              ░
░           ╚═════════════════════════════════════╝              ░
░                                                                 ░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

### Step 6: User Clicks Search Button or Close Button
**Option A: Search Button**
- Query is captured
- User navigates to search results
- Dropdown closes

**Option B: Close Button (✕)**
```
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░                                                                 ░
░           ╔═════════════════════════════════════╗              ░
░           ║ [nike shoes] [🔍] [✕*]             ║              ░
░           ║                      ↑               ║              ░
░           ║           Hovering over close btn   ║              ░
░           ╚═════════════════════════════════════╝              ░
░                                                                 ░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  (Click) → Dropdown closes with fade-out animation
```

**Option C: Click Outside**
```
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░ (Click on overlay) ←                                            ░
░           ╔═════════════════════════════════════╗              ░
░           ║ [nike shoes] [🔍] [✕]              ║              ░
░           ╚═════════════════════════════════════╝              ░
░                                                                 ░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  (Click) → Dropdown closes with fade-out animation
```

## Mobile Experience (< 480px)

### Step 1: Header on Mobile
```
╔═══════════════════════════════════╗
║  [Logo]  🏠  ❤️  🛒  🔍  👤     ║
║  (Icons arranged horizontally)    ║
╚═══════════════════════════════════╝
```

### Step 2: User Clicks Search Icon
```
╔═══════════════════════════════════╗
║  [Logo]  🏠  ❤️  🛒  🔍  👤     ║
╚═══════════════════════════════════╝

░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░  ╔═══════════════════════════════╗░
░  ║ [Search...] [🔍] [✕]        ║░
░  ║ (Full width dropdown)         ║░
░  ╚═══════════════════════════════╝░
░                                   ░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

### Step 3: Mobile Search Active
```
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░  ╔═══════════════════════════════╗░
░  ║ [jersey] [🔍] [✕]            ║░
░  ║  ↑                            ║░
░  ║  Input focused, ready to type ║░
░  ╚═══════════════════════════════╝░
░                                   ░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

## Tablet Experience (480px - 768px)

### Header
```
╔════════════════════════════════════════════════════════╗
║  [Logo]  HOME  ABOUT  SERVICES  🔍  ❤️  🛒  👤      ║
╚════════════════════════════════════════════════════════╝
```

### Dropdown
```
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░        Dark overlay backdrop                            ░
░         ╔═════════════════════════════════╗            ░
░         ║ [Search...] [🔍] [✕]          ║            ░
░         ║ (450px max-width)               ║            ░
░         ╚═════════════════════════════════╝            ░
░                                                         ░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

## Animation Timeline

### Icon Click → Dropdown Appearance
```
t=0ms:     Icon clicked
           └─→ showSearchDropdown = true
           └─→ JSX renders overlay & container

t=0-200ms: Overlay fade-in
           ░ (starts at opacity 0)
           ░ (ends at opacity 1)

t=0-300ms: Container slide-down
           ╔═════════════════════════╗
           ║ translateY(-20px)       ║ ← From this position
           ╚═════════════════════════╝
                     ↓
           ╔═════════════════════════╗
           ║ translateY(0)           ║ ← To this position
           ╚═════════════════════════╝

t=300ms:   Animation complete
           Input field focused
           Ready for user input
```

## Component States

### Search Icon Button States

**Default**
```
🔍 (size: 36×36px, color: #222222, bg: transparent)
```

**Hover**
```
🔍 (size: 36×36px, color: #ee4d2d, bg: #f5f5f5, scale: 1.08)
```

**Active (Clicked)**
```
🔍 (size: 36×36px, color: #ee4d2d, bg: #f5f5f5, scale: 0.95)
```

### Search Button States

**Default**
```
╔════════════════╗
║    🔍          │ (bg: #ee4d2d, color: white)
╚════════════════╝
```

**Hover**
```
╔════════════════╗
║    🔍          │ (bg: #d63d1f, color: white, shadow)
╚════════════════╝
```

**Active**
```
╔════════════════╗
║    🔍          │ (bg: #d63d1f, color: white, scale: 0.97)
╚════════════════╝
```

### Close Button States

**Default**
```
[✕] (bg: transparent, color: #999999, size: 32×32px)
```

**Hover**
```
[✕] (bg: #f5f5f5, color: #222222, size: 32×32px)
```

**Active**
```
[✕] (bg: #efefef, color: #222222, size: 32×32px)
```

## Layout Structure

### Responsive Widths

**Desktop (1200px+)**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┌──────────────────────────────┐
│  [Search...] [🔍] [✕]       │ ← 500px max-width
└──────────────────────────────┘ ← 90% width (smaller)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Tablet (768px)**
```
━━━━━━━━━━━━━━━━━━━━━━━━━
┌─────────────────────────┐
│  [Search...] [🔍] [✕] │ ← 450px max-width
└─────────────────────────┘ ← 95% width
━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Mobile (480px)**
```
━━━━━━━━━━━━━━━━━━━━
┌──────────────────┐
│ [Search][🔍][✕] │ ← 97% width (nearly full)
└──────────────────┘
━━━━━━━━━━━━━━━━━━━━
```

## Color Transitions

### Icon on Hover
```
#222222 (Dark Gray)
    ↓
    (scale: 1.08, bg appears)
    ↓
#ee4d2d (Shopee Orange) + #f5f5f5 (Light Gray BG)
```

### Button on Hover
```
#ee4d2d (Orange)
    ↓
    (shadow appears)
    ↓
#d63d1f (Dark Orange) + Shadow 0 2px 8px rgba(238, 77, 45, 0.25)
```

## Accessibility Features

### Focus States
```
User presses TAB:
  Search Icon Button
    ↓ (focus ring visible)
    ↓
  Overlay appears, input auto-focuses
    ↓
  Input field ready (cursor blinking)
```

### Keyboard Navigation
```
🔍 Icon → TAB → Input → TAB → Search Button → TAB → Close Button
```

### Screen Reader Support
```
aria-label="Search"           (Search icon button)
title="Search"                (Hover tooltip)

aria-label="Search"           (Search button in dropdown)
title="Search"                (Hover tooltip)

aria-label="Close search"     (Close button)
title="Close"                 (Hover tooltip)
```

---

## Summary

✨ **Icon-only in header** → Cleaner UI
🎯 **Click to open** → Focused search
🎨 **Beautiful dropdown** → Professional look
📱 **Responsive design** → Works everywhere
🎭 **Smooth animations** → Polished feel

**All while matching your CartModal's Shopee-inspired design!**
