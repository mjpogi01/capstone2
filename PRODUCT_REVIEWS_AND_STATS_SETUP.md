# 📊 Product Reviews & Statistics System

## Overview

This system automatically tracks and displays product statistics including:
- ⭐ **Average Star Ratings** (1.0 - 5.0)
- 💬 **Review Counts**
- 📦 **Sold Quantities**

Reviews are saved to the database and automatically update product statistics in real-time.

---

## 🗄️ Database Setup

### Step 1: Add Columns to Products Table

Run this SQL in your **Supabase SQL Editor**:

```sql
-- Add statistics columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sold_quantity INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_average_rating ON products(average_rating);
CREATE INDEX IF NOT EXISTS idx_products_sold_quantity ON products(sold_quantity);
```

### Step 2: Calculate Initial Statistics

Run the migration script to calculate stats for existing products:

```bash
cd server
node scripts/migrate-product-stats-supabase.js
```

This will:
- Calculate average ratings from existing reviews
- Count total reviews per product
- Calculate sold quantities from completed orders
- Update all products in the database

---

## 🔄 How It Works

### 1. **Reviews Are Saved to Database**

When a customer submits a review through the My Orders modal:
- Review is saved to `order_reviews` table
- Contains: `order_id`, `user_id`, `rating` (1-5), `comment`

### 2. **Product Stats Auto-Update**

After each review submission:
- `productStatsService.updateStatsForOrder()` is called
- Calculates new average rating from all reviews
- Updates review count
- Updates product in database

### 3. **Sold Quantities Track Automatically**

Sold quantities are calculated from orders with status:
- `shipped`
- `out_for_delivery`
- `delivered`
- `picked_up_delivered`
- `completed`

### 4. **Display on Product Cards**

Product cards show stats only if data exists:
```jsx
{product.average_rating > 0 && (
  <div>⭐ {product.average_rating}</div>
)}
{product.sold_quantity > 0 && (
  <div>{product.sold_quantity} sold</div>
)}
```

---

## 📁 Files Created

### Database Scripts
- `server/scripts/add-product-stats-columns.sql` - SQL migration
- `server/scripts/migrate-product-stats-supabase.js` - Node.js migration runner

### Services
- `server/services/productStatsService.js` - Auto-update service

### Updated Routes
- `server/routes/order-tracking.js` - Review submission endpoint

---

## 🔧 API Endpoints

### Submit a Review
```http
POST /api/order-tracking/review
Content-Type: application/json

{
  "orderId": "uuid",
  "userId": "uuid",
  "rating": 5,
  "comment": "Great product!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Review submitted successfully",
  "review": { ... }
}
```

Product statistics are automatically updated after submission.

---

## 📊 Database Schema

### `products` Table (Updated)
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  price DECIMAL(10,2),
  category VARCHAR(100),
  main_image TEXT,
  -- New columns:
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  review_count INTEGER DEFAULT 0,
  sold_quantity INTEGER DEFAULT 0,
  ...
);
```

### `order_reviews` Table (Existing)
```sql
CREATE TABLE order_reviews (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  user_id UUID REFERENCES auth.users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(order_id, user_id)
);
```

---

## 🎯 Usage Examples

### Customer Flow
1. Customer completes an order
2. Order status changes to "delivered" or "picked_up_delivered"
3. Customer opens "My Orders" modal
4. Clicks "Leave a Review" button
5. Rates product 1-5 stars and adds comment
6. Submits review
7. ✅ Review saved to database
8. ✅ Product stats automatically updated
9. ✅ Future customers see updated rating and sold count

### Admin View
- Admins can see which products have the highest ratings
- Filter/sort products by rating or sold quantity
- Track which products are popular

---

## 🔍 Testing

### Test Review Submission
1. Create a test order with status "delivered"
2. Submit a review for that order
3. Check product stats:
```javascript
// In browser console or API call
const { data } = await supabase
  .from('products')
  .select('name, average_rating, review_count, sold_quantity')
  .eq('id', 'product-uuid-here')
  .single();

console.log(data);
// Output: { name: "Jersey Pro", average_rating: 4.50, review_count: 2, sold_quantity: 15 }
```

### Verify Display
1. Go to homepage or shop page
2. Products with ratings should show "⭐4.5  15 sold"
3. Products without ratings/sales show nothing

---

## 🚀 Deployment Checklist

- [ ] Run SQL migration in Supabase
- [ ] Run migration script to calculate initial stats
- [ ] Verify `productStatsService.js` is deployed
- [ ] Test review submission
- [ ] Verify stats update automatically
- [ ] Check product cards display correctly

---

## 🔄 Maintenance

### Recalculate All Stats
If stats get out of sync:
```bash
node server/scripts/migrate-product-stats-supabase.js
```

### Manual Update for Single Product
```javascript
const productStatsService = require('./server/services/productStatsService');
await productStatsService.updateProductStats('product-uuid');
```

---

## 📈 Future Enhancements

Potential improvements:
- [ ] Product review page with all reviews
- [ ] Review moderation for admins
- [ ] Review images/photos
- [ ] Verified purchase badges
- [ ] Review helpfulness voting
- [ ] Filter products by rating
- [ ] Sort products by popularity

---

## 🐛 Troubleshooting

### Stats Not Updating
1. Check if columns exist:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('average_rating', 'review_count', 'sold_quantity');
```

2. Check service logs:
```bash
# Look for: "✅ Updated stats for product..."
```

3. Manually trigger update:
```javascript
await productStatsService.recalculateAllStats();
```

### Reviews Not Saving
1. Check `order_reviews` table exists
2. Verify order status is not "cancelled" or "refunded"
3. Check user is authenticated

---

## ✅ Summary

- ✅ Reviews save to database (`order_reviews` table)
- ✅ Product stats update automatically
- ✅ Display only when data exists
- ✅ Migration scripts provided
- ✅ Auto-update service implemented
- ✅ Real-time rating calculation
- ✅ Sold quantities tracked

Your product review and statistics system is now fully functional! 🎉

