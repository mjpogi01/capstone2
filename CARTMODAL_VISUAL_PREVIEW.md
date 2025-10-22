# CartModal - Visual Preview & Mockups

## 🖼️ Desktop View (500px Modal)

```
╔════════════════════════════════════════════════════════════╗
║ MY CART                                              ✕     ║  ← Header (light gray bg)
╠════════════════════════════════════════════════════════════╣
║                                                             ║
║  ☑ 📷 Nike Jersey          Qty: ⊖ 1 ⊕   ₱1,500    🗑      ║  ← Item Row
║      Team Order ▼                                          ║     - Checkbox (left)
║      ├─ Team: Lakers                                       ║     - Image 88×88px
║      ├─ Jersey: 23                                         ║     - Product info (center)
║      └─ Size: L                                            ║     - Price (indigo)
║                                                             ║     - Remove button
║  ────────────────────────────────────────────────────────  ║
║                                                             ║
║  ☑ 📷 Adidas Jersey        Qty: ⊖ 2 ⊕   ₱2,000    🗑      ║  ← Another Item
║      Single Order ▼                                        ║
║      ├─ Team: Heat                                         ║
║      ├─ Jersey: 3                                          ║
║      └─ Size: M                                            ║
║                                                             ║
║  ────────────────────────────────────────────────────────  ║
║                                                             ║
╠════════════════════════════════════════════════════════════╣
║                                                             ║
║  ☑ Select All (2)                                          ║  ← Footer section (light gray)
║                                                             ║
║  ┌──────────────────────────────────────────────────────┐  ║  ← Total box (white bg)
║  │ Total (2 Items):                    ₱3,500 (indigo) │  ║
║  └──────────────────────────────────────────────────────┘  ║
║                                                             ║
║  [      CHECK OUT (2 items)     ]  ← Full width button    ║
║                                                             ║
╚════════════════════════════════════════════════════════════╝

Design Details:
- Modal max-width: 500px
- White background with light gray header/footer
- Soft shadows and 12px border radius
- Clean typography hierarchy
- Indigo accent color (#4f46e5)
- Smooth animations
```

---

## 📱 Tablet View (≤ 768px)

```
┌─────────────────────────────────┐
│ MY CART                      ✕   │  ← Adjusted header (20px padding)
├─────────────────────────────────┤
│                                 │
│ ☑ 📷 Nike Jersey              │  ← Responsive item
│   Team Order ▼                │
│   Qty: ⊖ 1 ⊕  ₱1,500  🗑    │
│                                 │
│ ☑ 📷 Adidas Jersey              │
│   Single Order ▼                │
│   Qty: ⊖ 2 ⊕  ₱2,000  🗑    │
│                                 │
├─────────────────────────────────┤
│                                 │
│ ☑ Select All (2)                │
│                                 │
│ ┌───────────────────────────┐   │
│ │ Total (2 Items): ₱3,500   │   │
│ └───────────────────────────┘   │
│                                 │
│ [ CHECK OUT (2 items) ]         │
│                                 │
└─────────────────────────────────┘

Tablet Adjustments:
- Full screen width (100%)
- Reduced padding (20px header)
- Smaller image (72×72px)
- Font sizes slightly reduced
- Same clean aesthetic
```

---

## 📱 Mobile View (≤ 480px)

```
┌────────────────────────────────┐
│ MY CART                     ✕   │  ← Smaller padding (16px)
├────────────────────────────────┤
│                                │
│ ☑ 📷 Nike                     │
│   Team Ord... ▼                │  ← Image: 64×64px
│   Qty: ⊖ 1 ⊕                  │
│   ₱1,500                       │
│                                │
│ ☑ 📷 Adidas                    │
│   Single Order ▼               │
│   Qty: ⊖ 2 ⊕                  │
│   ₱2,000                       │
│                                │
├────────────────────────────────┤
│                                │
│ ☑ Select All (2)               │
│                                │
│ ┌──────────────────────────┐   │
│ │   Total (2 Items)        │   │ ← Vertical layout
│ │   ₱3,500                 │   │
│ └──────────────────────────┘   │
│                                │
│ [ CHECK OUT (2 items) ]        │  ← Full width
│                                │
└────────────────────────────────┘

Mobile Optimizations:
- Full screen, no max-width
- Rounded top corners (12px 12px 0 0)
- Minimal padding (12px-16px)
- Compact image (64×64px)
- Vertical total layout
- 100% width button
- Easy touch targets (44px min height)
```

---

## 🎨 Color Palette Showcase

```
┌─────────────────────────────────────────────────────────┐
│                    COLOR PALETTE                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Primary Accent                                          │
│  ■ #4f46e5 (Indigo) - Used for buttons, accents        │
│    └─ Hover: #4338ca (darker indigo)                    │
│                                                          │
│  Backgrounds                                             │
│  ■ #ffffff (White) - Main background                    │
│  ■ #f8f9fa (Light Gray) - Headers, footers, hover       │
│                                                          │
│  Text                                                    │
│  ■ #1f2937 (Dark Gray) - Primary text, headings         │
│  ■ #6b7280 (Medium Gray) - Secondary text               │
│                                                          │
│  Borders                                                 │
│  ■ #e5e7eb (Subtle Border) - Dividers, edges            │
│                                                          │
│  Shadows                                                 │
│  ▓ --mycart-shadow-sm  - Subtle (0 1px 2px)             │
│  ▓ --mycart-shadow-md  - Medium (0 4px 6px)             │
│  ▓ --mycart-shadow-lg  - Large (0 10px 15px)            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## ✨ Interactive States

### Button States

```
NORMAL STATE:
┌──────────────────────────────────┐
│   CHECK OUT (2 items)            │  ← Indigo bg, 12px hover shadow
└──────────────────────────────────┘

HOVER STATE:
┌──────────────────────────────────┐
│   CHECK OUT (2 items)            │  ← Darker indigo, lifted (-2px)
└──────────────────────────────────┘  ← Enhanced shadow, scale-up

ACTIVE/PRESSED STATE:
┌──────────────────────────────────┐
│   CHECK OUT (2 items)            │  ← Scales down to 0.95x
└──────────────────────────────────┘

DISABLED STATE:
┌──────────────────────────────────┐
│   CHECK OUT (0 items)            │  ← Gray background, opacity 0.6
└──────────────────────────────────┘  ← No shadow, cursor: not-allowed
```

### Item Box Hover

```
NORMAL:
┌──────────────────────────────────────────────┐
│ ☑ 📷 Product Name  Order Type ▼  ₱1,500  🗑 │
└──────────────────────────────────────────────┘

HOVER (Subtle):
┌──────────────────────────────────────────────┐
│ ☑ 📷 Product Name  Order Type ▼  ₱1,500  🗑 │  ← Light gray bg
└──────────────────────────────────────────────┘  ← Image zooms 1.05x

Focus/Active:
┌──────────────────────────────────────────────┐
│ ☑ 📷 Product Name  Order Type ▼  ₱1,500  🗑 │  ← Subtle highlight
└──────────────────────────────────────────────┘
```

### Quantity Controls

```
NORMAL:
  ⊖  1  ⊕   ← Light gray border, indigo buttons

HOVER:
  ⊖  1  ⊕   ← Darker border, slight indigo glow

BUTTON HOVER:
  ⊖  1  ⊕   ← Button scale up 1.08x, cursor pointer

BUTTON ACTIVE:
  ⊖  1  ⊕   ← Button scale down 0.95x
```

### Expandable Order Type

```
COLLAPSED:
┌─────────────────────────────────┐
│ Team Order ▼                    │  ← Arrow pointing down
└─────────────────────────────────┘

EXPANDED:
┌─────────────────────────────────┐
│ Team Order ▲                    │  ← Arrow rotated 180deg
├─────────────────────────────────┤
│ Team: Lakers                     │
│ Jersey: 23                       │
│ Size: L (Adult)                  │
│                                 │
│ [Team Member 1]                 │
│  ├─ Surname: Smith              │
│  ├─ Jersey: 2                   │
│  └─ Size: M                     │
│                                 │
│ [Team Member 2]                 │
│  ├─ Surname: Johnson            │
│  ├─ Jersey: 5                   │
│  └─ Size: L                     │
└─────────────────────────────────┘
```

---

## 📏 Spacing & Layout

```
HEADER SECTION:
╔════════════════════════════════════════════╗
║ 24px                                       ║
║         MY CART                      ✕     ║
║ 24px                                       ║
╠════════════════════════════════════════════╣

PRODUCT ITEM:
║ 16px ┌────────────────────────────────┐   ║
║      │☑   📷    Product Name  🗑       │   ║
║      │    Item   Order Type ▼          │   ║
║      │   Image   Qty: ⊖ 1 ⊕           │   ║
║      │ 88×88px   ₱1,500                │   ║
║ 16px │────────────────────────────────│   ║
║      │          Gap: 16px               │   ║
║ 24px └────────────────────────────────┘   ║

GAP BETWEEN ITEMS: 0px (separated by border)

FOOTER SECTION:
╠════════════════════════════════════════════╣
║ 20px                                       ║
║  ☑ Select All (2)                         ║
║                                            ║
║  ┌─────────────────────────────────────┐  ║
║  │ Total (2 Items):  ₱3,500            │  ║
║  └─────────────────────────────────────┘  ║
║                                            ║
║  [ CHECK OUT (2 items) ]                  ║
║ 20px                                       ║
╚════════════════════════════════════════════╝

Spacing Scale: 8px base (all multiples of 8)
- 8px  (extra small gap)
- 16px (default item spacing)
- 24px (padding/margins)
- 32px (large spacing)
```

---

## 🎬 Animations

### Modal Entry Animation

```
FRAME 0 (100ms):
                  ╔════╗
                  ║Cart║
                  ╚════╝
         Opacity: 0%, Translate: +100%

FRAME 1 (200ms):
           ╔════════════════╗
           ║       Cart     ║
           ╚════════════════╝
         Opacity: 50%, Translate: +50%

FRAME 2 (300ms - FINAL):
┌─────────────────────────────────────┐
│           MY CART                   │
├─────────────────────────────────────┤
│           [Items]                   │
├─────────────────────────────────────┤
│           [Footer]                  │
└─────────────────────────────────────┘
  Opacity: 100%, Translate: 0%
```

**Animation Properties:**
- Duration: 300ms
- Timing: ease-out
- Transform: translateX from +100% to 0
- Opacity: 0 to 1

### Overlay Fade-In

```
Overlay opacity: 0 → 1
Duration: 200ms
Timing: ease-out
```

### Loading Spinner

```
Frame 0°:    Frame 90°:   Frame 180°:  Frame 270°:
   ◐            ◑            ◒            ◓

Continuous rotation, 1 second per cycle
Direction: Clockwise
Timing: linear (consistent speed)
```

---

## 🔄 State Transitions

```
DEFAULT
   ↓
[User hovers on item]
   ↓
HOVER (light gray background, 200ms)
   ↓
[User clicks expand button]
   ↓
EXPANDED (arrow rotates 180°, details show)
   ↓
[User clicks collapse]
   ↓
COLLAPSED (details hide, arrow rotates back)

QUANTITY CHANGE
   ↓
[User clicks + button]
   ↓
BUTTON ACTIVE (scale 0.95x)
   ↓
BUTTON HOVER (scale 1.08x)
   ↓
UPDATED (quantity changes in UI)

CHECKOUT
   ↓
[All items selected]
   ↓
BUTTON ENABLED (full opacity, interactive)
   ↓
[No items selected]
   ↓
BUTTON DISABLED (gray, opacity 0.6, not-allowed cursor)
```

---

## 💡 Responsive Grid Layout

### Product Item Layout Grid

```
Desktop (500px+):
┌──────────────────────────────────────────────────────┐
│  ☑   [Image]   Name      Order ▼   Qty   Price  🗑  │
│      88×88px   Type      Details         ₱1,500    │
└──────────────────────────────────────────────────────┘
Grid: 1fr (checkbox) - flex (image) - 1fr (info) - flex (remove)

Tablet (768px):
┌────────────────────────────────────────────┐
│  ☑   [Image]   Name      Order ▼  ₱1,500  │
│      72×72px   Type      Qty       🗑      │
└────────────────────────────────────────────┘
Grid: Same structure, smaller image

Mobile (480px):
┌──────────────────────────┐
│  ☑ [Image]  Product      │
│       64×64px  Name      │
│            Order ▼       │
│            Qty: ⊖ 1 ⊕    │
│            ₱1,500   🗑   │
└──────────────────────────┘
Grid: Flex column, image smaller, elements wrap
```

---

## 🎨 Typography Preview

```
HEADER (MY CART)
═══════════════════════════════════════════
MY CART
  Size: 1.5rem (24px)
  Weight: 600 (semibold)
  Color: #1f2937 (dark gray)
  Font: Segoe UI, Inter, system


PRODUCT NAME
───────────────────────────────────────────
Nike Team Jersey Elite Pro
  Size: 0.95rem (15px)
  Weight: 600 (semibold)
  Color: #1f2937 (dark gray)
  Max lines: 2 (with ellipsis)


ORDER TYPE LABEL
───────────────────────────────────────────
Team Order
  Size: 0.85rem (13.6px)
  Weight: 500 (medium)
  Color: #1f2937 (dark gray)


DETAIL TEXT
───────────────────────────────────────────
Label Text: Team, Jersey, Size (Weight: 600, Color: #1f2937)
Value Text: Lakers, 23, L Adult (Weight: 400, Color: #6b7280)
  Size: 0.8rem (12.8px)
  Line height: 1.5


TOTAL AMOUNT
═══════════════════════════════════════════
₱3,500
  Size: 1.2rem (19.2px)
  Weight: 700 (bold)
  Color: #4f46e5 (indigo primary)


BUTTON TEXT
───────────────────────────────────────────
CHECK OUT (2 items)
  Size: 0.95rem (15px)
  Weight: 600 (semibold)
  Color: #ffffff (white)
  Text transform: uppercase
  Letter spacing: 0.5px
```

---

## ♿ Accessibility Features

```
KEYBOARD NAVIGATION:
Tab ↹ → Cycles through:
  1. Close button
  2. Checkboxes (each item)
  3. Quantity buttons (each item)
  4. Remove buttons (each item)
  5. Select All checkbox
  6. Checkout button

FOCUS STATES:
- All interactive elements have visible focus rings
- Focus indicator color: --mycart-primary (#4f46e5)
- Outline: 2px solid with offset

SCREEN READERS:
- Proper label associations (<label for="id">)
- ARIA attributes on expandable sections
- Alt text on all product images
- Semantic HTML structure

COLOR CONTRAST:
- Text on background: 4.5:1+ WCAG AA
- Button text on button: 7:1+ WCAG AAA
- No color-only indicators
```

---

## 📊 Component Hierarchy

```
CartModal (Main Container)
├─ Overlay (backdrop)
└─ Container
   ├─ Header
   │  ├─ Title (h2)
   │  └─ Close Button
   ├─ Content (scrollable)
   │  └─ ItemsList
   │     └─ Item (repeating)
   │        ├─ Checkbox
   │        ├─ Image
   │        └─ ProductInfo
   │           ├─ NameRow
   │           ├─ OrderType (expandable)
   │           ├─ QuantityControls
   │           └─ Price
   └─ Footer
      ├─ SelectAll
      ├─ TotalSection
      └─ CheckoutButton
```

---

## 🎯 Design System Summary

```
┌─────────────────────────────────────────────────┐
│            DESIGN SYSTEM ATTRIBUTES             │
├─────────────────────────────────────────────────┤
│                                                  │
│  ▪ Background: Light & Neutral                  │
│  ▪ Accents: Subtle Indigo (#4f46e5)            │
│  ▪ Typography: Clear Hierarchy                  │
│  ▪ Spacing: 8px Scale (16, 24, 32...)          │
│  ▪ Shadows: Soft & Minimal                      │
│  ▪ Borders: 1px Subtle Gray                     │
│  ▪ Radius: 12px Main, 8px Medium, 6px Small   │
│  ▪ Responsive: Mobile-First Approach            │
│  ▪ Animations: 200-300ms Ease-Out              │
│  ▪ Accessibility: WCAG AA Compliant            │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

**Visual Preview Version**: 1.0  
**Last Updated**: October 2025  
**Design Status**: ✅ Complete & Production Ready

## 🖼️ Desktop View (500px Modal)

```
╔════════════════════════════════════════════════════════════╗
║ MY CART                                              ✕     ║  ← Header (light gray bg)
╠════════════════════════════════════════════════════════════╣
║                                                             ║
║  ☑ 📷 Nike Jersey          Qty: ⊖ 1 ⊕   ₱1,500    🗑      ║  ← Item Row
║      Team Order ▼                                          ║     - Checkbox (left)
║      ├─ Team: Lakers                                       ║     - Image 88×88px
║      ├─ Jersey: 23                                         ║     - Product info (center)
║      └─ Size: L                                            ║     - Price (indigo)
║                                                             ║     - Remove button
║  ────────────────────────────────────────────────────────  ║
║                                                             ║
║  ☑ 📷 Adidas Jersey        Qty: ⊖ 2 ⊕   ₱2,000    🗑      ║  ← Another Item
║      Single Order ▼                                        ║
║      ├─ Team: Heat                                         ║
║      ├─ Jersey: 3                                          ║
║      └─ Size: M                                            ║
║                                                             ║
║  ────────────────────────────────────────────────────────  ║
║                                                             ║
╠════════════════════════════════════════════════════════════╣
║                                                             ║
║  ☑ Select All (2)                                          ║  ← Footer section (light gray)
║                                                             ║
║  ┌──────────────────────────────────────────────────────┐  ║  ← Total box (white bg)
║  │ Total (2 Items):                    ₱3,500 (indigo) │  ║
║  └──────────────────────────────────────────────────────┘  ║
║                                                             ║
║  [      CHECK OUT (2 items)     ]  ← Full width button    ║
║                                                             ║
╚════════════════════════════════════════════════════════════╝

Design Details:
- Modal max-width: 500px
- White background with light gray header/footer
- Soft shadows and 12px border radius
- Clean typography hierarchy
- Indigo accent color (#4f46e5)
- Smooth animations
```

---

## 📱 Tablet View (≤ 768px)

```
┌─────────────────────────────────┐
│ MY CART                      ✕   │  ← Adjusted header (20px padding)
├─────────────────────────────────┤
│                                 │
│ ☑ 📷 Nike Jersey              │  ← Responsive item
│   Team Order ▼                │
│   Qty: ⊖ 1 ⊕  ₱1,500  🗑    │
│                                 │
│ ☑ 📷 Adidas Jersey              │
│   Single Order ▼                │
│   Qty: ⊖ 2 ⊕  ₱2,000  🗑    │
│                                 │
├─────────────────────────────────┤
│                                 │
│ ☑ Select All (2)                │
│                                 │
│ ┌───────────────────────────┐   │
│ │ Total (2 Items): ₱3,500   │   │
│ └───────────────────────────┘   │
│                                 │
│ [ CHECK OUT (2 items) ]         │
│                                 │
└─────────────────────────────────┘

Tablet Adjustments:
- Full screen width (100%)
- Reduced padding (20px header)
- Smaller image (72×72px)
- Font sizes slightly reduced
- Same clean aesthetic
```

---

## 📱 Mobile View (≤ 480px)

```
┌────────────────────────────────┐
│ MY CART                     ✕   │  ← Smaller padding (16px)
├────────────────────────────────┤
│                                │
│ ☑ 📷 Nike                     │
│   Team Ord... ▼                │  ← Image: 64×64px
│   Qty: ⊖ 1 ⊕                  │
│   ₱1,500                       │
│                                │
│ ☑ 📷 Adidas                    │
│   Single Order ▼               │
│   Qty: ⊖ 2 ⊕                  │
│   ₱2,000                       │
│                                │
├────────────────────────────────┤
│                                │
│ ☑ Select All (2)               │
│                                │
│ ┌──────────────────────────┐   │
│ │   Total (2 Items)        │   │ ← Vertical layout
│ │   ₱3,500                 │   │
│ └──────────────────────────┘   │
│                                │
│ [ CHECK OUT (2 items) ]        │  ← Full width
│                                │
└────────────────────────────────┘

Mobile Optimizations:
- Full screen, no max-width
- Rounded top corners (12px 12px 0 0)
- Minimal padding (12px-16px)
- Compact image (64×64px)
- Vertical total layout
- 100% width button
- Easy touch targets (44px min height)
```

---

## 🎨 Color Palette Showcase

```
┌─────────────────────────────────────────────────────────┐
│                    COLOR PALETTE                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Primary Accent                                          │
│  ■ #4f46e5 (Indigo) - Used for buttons, accents        │
│    └─ Hover: #4338ca (darker indigo)                    │
│                                                          │
│  Backgrounds                                             │
│  ■ #ffffff (White) - Main background                    │
│  ■ #f8f9fa (Light Gray) - Headers, footers, hover       │
│                                                          │
│  Text                                                    │
│  ■ #1f2937 (Dark Gray) - Primary text, headings         │
│  ■ #6b7280 (Medium Gray) - Secondary text               │
│                                                          │
│  Borders                                                 │
│  ■ #e5e7eb (Subtle Border) - Dividers, edges            │
│                                                          │
│  Shadows                                                 │
│  ▓ --mycart-shadow-sm  - Subtle (0 1px 2px)             │
│  ▓ --mycart-shadow-md  - Medium (0 4px 6px)             │
│  ▓ --mycart-shadow-lg  - Large (0 10px 15px)            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## ✨ Interactive States

### Button States

```
NORMAL STATE:
┌──────────────────────────────────┐
│   CHECK OUT (2 items)            │  ← Indigo bg, 12px hover shadow
└──────────────────────────────────┘

HOVER STATE:
┌──────────────────────────────────┐
│   CHECK OUT (2 items)            │  ← Darker indigo, lifted (-2px)
└──────────────────────────────────┘  ← Enhanced shadow, scale-up

ACTIVE/PRESSED STATE:
┌──────────────────────────────────┐
│   CHECK OUT (2 items)            │  ← Scales down to 0.95x
└──────────────────────────────────┘

DISABLED STATE:
┌──────────────────────────────────┐
│   CHECK OUT (0 items)            │  ← Gray background, opacity 0.6
└──────────────────────────────────┘  ← No shadow, cursor: not-allowed
```

### Item Box Hover

```
NORMAL:
┌──────────────────────────────────────────────┐
│ ☑ 📷 Product Name  Order Type ▼  ₱1,500  🗑 │
└──────────────────────────────────────────────┘

HOVER (Subtle):
┌──────────────────────────────────────────────┐
│ ☑ 📷 Product Name  Order Type ▼  ₱1,500  🗑 │  ← Light gray bg
└──────────────────────────────────────────────┘  ← Image zooms 1.05x

Focus/Active:
┌──────────────────────────────────────────────┐
│ ☑ 📷 Product Name  Order Type ▼  ₱1,500  🗑 │  ← Subtle highlight
└──────────────────────────────────────────────┘
```

### Quantity Controls

```
NORMAL:
  ⊖  1  ⊕   ← Light gray border, indigo buttons

HOVER:
  ⊖  1  ⊕   ← Darker border, slight indigo glow

BUTTON HOVER:
  ⊖  1  ⊕   ← Button scale up 1.08x, cursor pointer

BUTTON ACTIVE:
  ⊖  1  ⊕   ← Button scale down 0.95x
```

### Expandable Order Type

```
COLLAPSED:
┌─────────────────────────────────┐
│ Team Order ▼                    │  ← Arrow pointing down
└─────────────────────────────────┘

EXPANDED:
┌─────────────────────────────────┐
│ Team Order ▲                    │  ← Arrow rotated 180deg
├─────────────────────────────────┤
│ Team: Lakers                     │
│ Jersey: 23                       │
│ Size: L (Adult)                  │
│                                 │
│ [Team Member 1]                 │
│  ├─ Surname: Smith              │
│  ├─ Jersey: 2                   │
│  └─ Size: M                     │
│                                 │
│ [Team Member 2]                 │
│  ├─ Surname: Johnson            │
│  ├─ Jersey: 5                   │
│  └─ Size: L                     │
└─────────────────────────────────┘
```

---

## 📏 Spacing & Layout

```
HEADER SECTION:
╔════════════════════════════════════════════╗
║ 24px                                       ║
║         MY CART                      ✕     ║
║ 24px                                       ║
╠════════════════════════════════════════════╣

PRODUCT ITEM:
║ 16px ┌────────────────────────────────┐   ║
║      │☑   📷    Product Name  🗑       │   ║
║      │    Item   Order Type ▼          │   ║
║      │   Image   Qty: ⊖ 1 ⊕           │   ║
║      │ 88×88px   ₱1,500                │   ║
║ 16px │────────────────────────────────│   ║
║      │          Gap: 16px               │   ║
║ 24px └────────────────────────────────┘   ║

GAP BETWEEN ITEMS: 0px (separated by border)

FOOTER SECTION:
╠════════════════════════════════════════════╣
║ 20px                                       ║
║  ☑ Select All (2)                         ║
║                                            ║
║  ┌─────────────────────────────────────┐  ║
║  │ Total (2 Items):  ₱3,500            │  ║
║  └─────────────────────────────────────┘  ║
║                                            ║
║  [ CHECK OUT (2 items) ]                  ║
║ 20px                                       ║
╚════════════════════════════════════════════╝

Spacing Scale: 8px base (all multiples of 8)
- 8px  (extra small gap)
- 16px (default item spacing)
- 24px (padding/margins)
- 32px (large spacing)
```

---

## 🎬 Animations

### Modal Entry Animation

```
FRAME 0 (100ms):
                  ╔════╗
                  ║Cart║
                  ╚════╝
         Opacity: 0%, Translate: +100%

FRAME 1 (200ms):
           ╔════════════════╗
           ║       Cart     ║
           ╚════════════════╝
         Opacity: 50%, Translate: +50%

FRAME 2 (300ms - FINAL):
┌─────────────────────────────────────┐
│           MY CART                   │
├─────────────────────────────────────┤
│           [Items]                   │
├─────────────────────────────────────┤
│           [Footer]                  │
└─────────────────────────────────────┘
  Opacity: 100%, Translate: 0%
```

**Animation Properties:**
- Duration: 300ms
- Timing: ease-out
- Transform: translateX from +100% to 0
- Opacity: 0 to 1

### Overlay Fade-In

```
Overlay opacity: 0 → 1
Duration: 200ms
Timing: ease-out
```

### Loading Spinner

```
Frame 0°:    Frame 90°:   Frame 180°:  Frame 270°:
   ◐            ◑            ◒            ◓

Continuous rotation, 1 second per cycle
Direction: Clockwise
Timing: linear (consistent speed)
```

---

## 🔄 State Transitions

```
DEFAULT
   ↓
[User hovers on item]
   ↓
HOVER (light gray background, 200ms)
   ↓
[User clicks expand button]
   ↓
EXPANDED (arrow rotates 180°, details show)
   ↓
[User clicks collapse]
   ↓
COLLAPSED (details hide, arrow rotates back)

QUANTITY CHANGE
   ↓
[User clicks + button]
   ↓
BUTTON ACTIVE (scale 0.95x)
   ↓
BUTTON HOVER (scale 1.08x)
   ↓
UPDATED (quantity changes in UI)

CHECKOUT
   ↓
[All items selected]
   ↓
BUTTON ENABLED (full opacity, interactive)
   ↓
[No items selected]
   ↓
BUTTON DISABLED (gray, opacity 0.6, not-allowed cursor)
```

---

## 💡 Responsive Grid Layout

### Product Item Layout Grid

```
Desktop (500px+):
┌──────────────────────────────────────────────────────┐
│  ☑   [Image]   Name      Order ▼   Qty   Price  🗑  │
│      88×88px   Type      Details         ₱1,500    │
└──────────────────────────────────────────────────────┘
Grid: 1fr (checkbox) - flex (image) - 1fr (info) - flex (remove)

Tablet (768px):
┌────────────────────────────────────────────┐
│  ☑   [Image]   Name      Order ▼  ₱1,500  │
│      72×72px   Type      Qty       🗑      │
└────────────────────────────────────────────┘
Grid: Same structure, smaller image

Mobile (480px):
┌──────────────────────────┐
│  ☑ [Image]  Product      │
│       64×64px  Name      │
│            Order ▼       │
│            Qty: ⊖ 1 ⊕    │
│            ₱1,500   🗑   │
└──────────────────────────┘
Grid: Flex column, image smaller, elements wrap
```

---

## 🎨 Typography Preview

```
HEADER (MY CART)
═══════════════════════════════════════════
MY CART
  Size: 1.5rem (24px)
  Weight: 600 (semibold)
  Color: #1f2937 (dark gray)
  Font: Segoe UI, Inter, system


PRODUCT NAME
───────────────────────────────────────────
Nike Team Jersey Elite Pro
  Size: 0.95rem (15px)
  Weight: 600 (semibold)
  Color: #1f2937 (dark gray)
  Max lines: 2 (with ellipsis)


ORDER TYPE LABEL
───────────────────────────────────────────
Team Order
  Size: 0.85rem (13.6px)
  Weight: 500 (medium)
  Color: #1f2937 (dark gray)


DETAIL TEXT
───────────────────────────────────────────
Label Text: Team, Jersey, Size (Weight: 600, Color: #1f2937)
Value Text: Lakers, 23, L Adult (Weight: 400, Color: #6b7280)
  Size: 0.8rem (12.8px)
  Line height: 1.5


TOTAL AMOUNT
═══════════════════════════════════════════
₱3,500
  Size: 1.2rem (19.2px)
  Weight: 700 (bold)
  Color: #4f46e5 (indigo primary)


BUTTON TEXT
───────────────────────────────────────────
CHECK OUT (2 items)
  Size: 0.95rem (15px)
  Weight: 600 (semibold)
  Color: #ffffff (white)
  Text transform: uppercase
  Letter spacing: 0.5px
```

---

## ♿ Accessibility Features

```
KEYBOARD NAVIGATION:
Tab ↹ → Cycles through:
  1. Close button
  2. Checkboxes (each item)
  3. Quantity buttons (each item)
  4. Remove buttons (each item)
  5. Select All checkbox
  6. Checkout button

FOCUS STATES:
- All interactive elements have visible focus rings
- Focus indicator color: --mycart-primary (#4f46e5)
- Outline: 2px solid with offset

SCREEN READERS:
- Proper label associations (<label for="id">)
- ARIA attributes on expandable sections
- Alt text on all product images
- Semantic HTML structure

COLOR CONTRAST:
- Text on background: 4.5:1+ WCAG AA
- Button text on button: 7:1+ WCAG AAA
- No color-only indicators
```

---

## 📊 Component Hierarchy

```
CartModal (Main Container)
├─ Overlay (backdrop)
└─ Container
   ├─ Header
   │  ├─ Title (h2)
   │  └─ Close Button
   ├─ Content (scrollable)
   │  └─ ItemsList
   │     └─ Item (repeating)
   │        ├─ Checkbox
   │        ├─ Image
   │        └─ ProductInfo
   │           ├─ NameRow
   │           ├─ OrderType (expandable)
   │           ├─ QuantityControls
   │           └─ Price
   └─ Footer
      ├─ SelectAll
      ├─ TotalSection
      └─ CheckoutButton
```

---

## 🎯 Design System Summary

```
┌─────────────────────────────────────────────────┐
│            DESIGN SYSTEM ATTRIBUTES             │
├─────────────────────────────────────────────────┤
│                                                  │
│  ▪ Background: Light & Neutral                  │
│  ▪ Accents: Subtle Indigo (#4f46e5)            │
│  ▪ Typography: Clear Hierarchy                  │
│  ▪ Spacing: 8px Scale (16, 24, 32...)          │
│  ▪ Shadows: Soft & Minimal                      │
│  ▪ Borders: 1px Subtle Gray                     │
│  ▪ Radius: 12px Main, 8px Medium, 6px Small   │
│  ▪ Responsive: Mobile-First Approach            │
│  ▪ Animations: 200-300ms Ease-Out              │
│  ▪ Accessibility: WCAG AA Compliant            │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

**Visual Preview Version**: 1.0  
**Last Updated**: October 2025  
**Design Status**: ✅ Complete & Production Ready
