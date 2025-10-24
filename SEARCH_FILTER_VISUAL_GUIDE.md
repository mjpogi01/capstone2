# Search & Filter Bar - Visual Guide 📐

## 🎨 Desktop Layout (768px+)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Shop Products Redesign                                             [×]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    SEARCH & FILTER BAR                             │ │
│  ├────────────────────────────────────────────────────────────────────┤ │
│  │                                                                    │ │
│  │  ┌──────────────────────────────────┐ ┌──────────┐ ┌──────────┐  │ │
│  │  │ 🔍  Search for products...       │ │ 🔽  All  │ │ ⬇  Name  │  │ │
│  │  └──────────────────────────────────┘ └──────────┘ └──────────┘  │ │
│  │     ↑ Grows to fill space              ↑ 160px      ↑ 160px     │ │
│  │     Min: 280px                          Fixed       Fixed         │ │
│  │                                                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  [Product Grid Below...]                                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### **Measurements:**
```
Container Height:     42px (all elements)
Container Padding:    16px 24px
Elements Gap:         12px
Border Radius:        0.5rem (8px)
Border Width:         1px
```

---

## 📱 Tablet Layout (768px - 1199px)

```
┌────────────────────────────────────────────────────────┐
│  Shop Products                                     [×]  │
├────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │          SEARCH & FILTER BAR (TIGHTER)           │ │
│  ├──────────────────────────────────────────────────┤ │
│  │                                                  │ │
│  │  ┌────────────────────┐ ┌────────┐ ┌────────┐  │ │
│  │  │ 🔍  Search...      │ │🔽 All  │ │⬇ Name  │  │ │
│  │  └────────────────────┘ └────────┘ └────────┘  │ │
│  │     ↑ Still flexible    ↑ 140px    ↑ 140px    │ │
│  │     Min: 200px                                  │ │
│  │                                                  │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

### **Measurements:**
```
Container Height:     42px
Elements Gap:         10px (slightly tighter)
Search Min-Width:     200px
Filter Min-Width:     140px
```

---

## 📱 Mobile Layout (<768px)

```
┌───────────────────────────┐
│  Shop Products        [×] │
├───────────────────────────┤
│                           │
│  ┌─────────────────────┐ │
│  │  STACKED LAYOUT     │ │
│  ├─────────────────────┤ │
│  │                     │ │
│  │ ┌─────────────────┐ │ │
│  │ │ 🔍  Search...   │ │ │
│  │ └─────────────────┘ │ │
│  │                     │ │
│  │ ┌─────────────────┐ │ │
│  │ │ 🔽  Category    │ │ │
│  │ └─────────────────┘ │ │
│  │                     │ │
│  │ ┌─────────────────┐ │ │
│  │ │ ⬇  Sort         │ │ │
│  │ └─────────────────┘ │ │
│  │                     │ │
│  └─────────────────────┘ │
│                           │
│  [Products Below...]      │
└───────────────────────────┘
```

### **Measurements:**
```
Elements Height:      42px each
Elements Width:       100%
Stack Gap:            10px
Padding:              12px 16px
```

---

## 🎨 Color & Style Details

### **Default State**
```
┌────────────────────────────────┐
│ 🔍  Search for products...     │  ← White background
└────────────────────────────────┘    Light gray border (#e5e7eb)
                                      Subtle shadow
```

### **Hover State**
```
┌────────────────────────────────┐
│ 🔍  Search for products...     │  ← White background
└────────────────────────────────┘    Medium gray border (#d1d5db)
                                      Enhanced shadow
```

### **Focus State**
```
┌────────────────────────────────┐
│ 🔍  Search for products...│    │  ← White background
└────────────────────────────────┘    Blue border (#3b82f6)
        ╰───────────────╯              Blue ring shadow (3px)
```

---

## 📐 Detailed Measurements

### **Search Input**
```
┌─────────────────────────────────────────┐
│  [14px icon] [42px] Search text (14px)  │
│  ↑            ↑      ↑                   │
│  Left 14px   Height  Padding-left 42px  │
└─────────────────────────────────────────┘
Width: flex: 1 (grows)
Min-width: 280px (desktop), 200px (tablet)
Padding: 0 16px 0 42px
```

### **Filter Dropdown**
```
┌───────────────────────┐
│ [icon] Category    [▼]│
│  ↑     ↑           ↑  │
│  8px   Text        BG │
│  gap   14px        img│
└───────────────────────┘
Width: min-width 160px (desktop), 140px (tablet)
Height: 42px
Padding: 0 14px
```

---

## 🎯 Element Spacing

### **Desktop - Horizontal Layout**
```
Padding: 16px 24px
├──────────────────────────────────────────────────────────────┤

   [Search.................................]  [Filter]  [Sort]
   ↑                                    ↑     ↑        ↑       ↑
   24px                           flex:1    12px     12px    24px
   from                           grows     gap      gap     from
   edge                                              edge
```

### **Mobile - Vertical Stack**
```
Padding: 12px 16px
├─────────────────┤

   [Search.......]
        ↓ 10px gap
   [Filter.......]
        ↓ 10px gap
   [Sort.........]

   ↑             ↑
   16px        16px
   from edge   from edge
```

---

## 🎨 Color Palette

### **Backgrounds**
```
┌─────────┬──────────────────────┐
│ #ffffff │ Main white bg        │
│ #f9fafb │ Page bg (behind bar) │
└─────────┴──────────────────────┘
```

### **Borders**
```
┌─────────┬──────────────────────┐
│ #e5e7eb │ Default border       │
│ #d1d5db │ Hover border         │
│ #3b82f6 │ Focus border (blue)  │
└─────────┴──────────────────────┘
```

### **Text**
```
┌─────────┬──────────────────────┐
│ #111827 │ Primary text         │
│ #374151 │ Secondary text       │
│ #6b7280 │ Icons                │
│ #9ca3af │ Placeholder text     │
└─────────┴──────────────────────┘
```

### **Shadows**
```
Default:  0 1px 2px rgba(0, 0, 0, 0.05)
          ↑ Subtle depth

Hover:    0 2px 4px rgba(0, 0, 0, 0.08)
          ↑ Slightly more depth

Focus:    0 0 0 3px rgba(59, 130, 246, 0.1)
          ↑ Blue ring around element
```

---

## 🎬 Animation Examples

### **Hover Transition**
```
Time 0ms:  Border: #e5e7eb ─────────┐
           Shadow: subtle           │ 200ms ease
Time 200ms: Border: #d1d5db ────────┘
           Shadow: enhanced
```

### **Focus Transition**
```
Time 0ms:  Border: #e5e7eb ─────────┐
           Shadow: none             │ 200ms ease
Time 200ms: Border: #3b82f6 ────────┘
           Shadow: blue ring (3px)
```

---

## 📱 Responsive Breakpoints

```
┌──────────────┬─────────────┬──────────────┬───────────────┐
│ Screen Size  │ Layout      │ Search Width │ Filter Width  │
├──────────────┼─────────────┼──────────────┼───────────────┤
│ 1600px+      │ Horizontal  │ flex: 1      │ 160px         │
│ 1200-1599px  │ Horizontal  │ flex: 1      │ 160px         │
│ 768-1199px   │ Horizontal  │ min: 200px   │ 140px         │
│ 480-767px    │ Vertical    │ 100%         │ 100%          │
│ <480px       │ Vertical    │ 100%         │ 100%          │
└──────────────┴─────────────┴──────────────┴───────────────┘
```

---

## ✨ Interactive Demo

### **Try These Actions:**

1. **Hover over search bar**
   - Border changes from light to medium gray
   - Shadow becomes more prominent
   - Cursor changes to text input cursor

2. **Click search bar (focus)**
   - Border changes to blue
   - Blue ring appears around input (3px)
   - Placeholder text may shift

3. **Hover over filter dropdowns**
   - Border darkens
   - Shadow enhances
   - Cursor shows it's clickable

4. **Click filter dropdown**
   - Blue focus ring appears
   - Dropdown menu opens
   - Text color darkens

5. **Resize window**
   - Above 768px: Horizontal layout
   - Below 768px: Stacks vertically
   - Smooth transition between layouts

---

## 🎉 Final Result

A **beautifully designed** search and filter bar that:

✅ **Desktop:** All on one clean horizontal line  
✅ **Tablet:** Still horizontal, slightly optimized  
✅ **Mobile:** Stacks vertically for easy touch  
✅ **Hover:** Subtle border and shadow changes  
✅ **Focus:** Clear blue ring indicator  
✅ **Icons:** Visual cues for each element  
✅ **Spacing:** Perfect 12px gaps throughout  
✅ **Height:** Consistent 42px for all elements  

**Professional. Modern. Responsive.** 🎊

