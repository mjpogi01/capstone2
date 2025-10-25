-- Add columns to products table for ratings and sales tracking
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sold_quantity INTEGER DEFAULT 0;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_average_rating ON products(average_rating);
CREATE INDEX IF NOT EXISTS idx_products_sold_quantity ON products(sold_quantity);

-- Create a function to calculate and update product statistics
CREATE OR REPLACE FUNCTION update_product_stats()
RETURNS void AS $$
BEGIN
  -- Update average ratings and review counts for all products
  UPDATE products p
  SET 
    average_rating = COALESCE(
      (
        SELECT AVG(r.rating)::DECIMAL(3,2)
        FROM order_reviews r
        JOIN orders o ON r.order_id = o.id
        JOIN LATERAL jsonb_array_elements(o.order_items::jsonb) AS item ON true
        WHERE (item->>'product_id')::uuid = p.id
        AND o.status NOT IN ('cancelled', 'refunded')
      ), 
      0.00
    ),
    review_count = COALESCE(
      (
        SELECT COUNT(DISTINCT r.id)
        FROM order_reviews r
        JOIN orders o ON r.order_id = o.id
        JOIN LATERAL jsonb_array_elements(o.order_items::jsonb) AS item ON true
        WHERE (item->>'product_id')::uuid = p.id
        AND o.status NOT IN ('cancelled', 'refunded')
      ),
      0
    ),
    sold_quantity = COALESCE(
      (
        SELECT SUM((item->>'quantity')::INTEGER)
        FROM orders o
        JOIN LATERAL jsonb_array_elements(o.order_items::jsonb) AS item ON true
        WHERE (item->>'product_id')::uuid = p.id
        AND o.status IN ('shipped', 'out_for_delivery', 'delivered', 'picked_up_delivered', 'completed')
      ),
      0
    );
END;
$$ LANGUAGE plpgsql;

-- Create a trigger function to automatically update product stats when a review is added
CREATE OR REPLACE FUNCTION trigger_update_product_stats()
RETURNS TRIGGER AS $$
DECLARE
  affected_product_ids uuid[];
BEGIN
  -- Get all product IDs from the order
  SELECT ARRAY_AGG(DISTINCT (item->>'product_id')::uuid)
  INTO affected_product_ids
  FROM orders o
  JOIN LATERAL jsonb_array_elements(o.order_items::jsonb) AS item ON true
  WHERE o.id = COALESCE(NEW.order_id, OLD.order_id);

  -- Update stats for affected products
  UPDATE products p
  SET 
    average_rating = COALESCE(
      (
        SELECT AVG(r.rating)::DECIMAL(3,2)
        FROM order_reviews r
        JOIN orders o ON r.order_id = o.id
        JOIN LATERAL jsonb_array_elements(o.order_items::jsonb) AS item ON true
        WHERE (item->>'product_id')::uuid = p.id
        AND o.status NOT IN ('cancelled', 'refunded')
      ), 
      0.00
    ),
    review_count = COALESCE(
      (
        SELECT COUNT(DISTINCT r.id)
        FROM order_reviews r
        JOIN orders o ON r.order_id = o.id
        JOIN LATERAL jsonb_array_elements(o.order_items::jsonb) AS item ON true
        WHERE (item->>'product_id')::uuid = p.id
        AND o.status NOT IN ('cancelled', 'refunded')
      ),
      0
    )
  WHERE p.id = ANY(affected_product_ids);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-update product stats
DROP TRIGGER IF EXISTS update_product_stats_on_review_insert ON order_reviews;
CREATE TRIGGER update_product_stats_on_review_insert
  AFTER INSERT ON order_reviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_product_stats();

DROP TRIGGER IF EXISTS update_product_stats_on_review_update ON order_reviews;
CREATE TRIGGER update_product_stats_on_review_update
  AFTER UPDATE ON order_reviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_product_stats();

DROP TRIGGER IF EXISTS update_product_stats_on_review_delete ON order_reviews;
CREATE TRIGGER update_product_stats_on_review_delete
  AFTER DELETE ON order_reviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_product_stats();

-- Initial calculation of product stats
SELECT update_product_stats();

