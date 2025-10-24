-- Create function to get product review statistics
-- This function aggregates reviews from orders to products

CREATE OR REPLACE FUNCTION get_product_review_stats(product_ids UUID[])
RETURNS TABLE (
  product_id UUID,
  avg_rating DECIMAL,
  review_count BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    oi.product_id,
    ROUND(AVG(r.rating)::numeric, 1) as avg_rating,
    COUNT(DISTINCT r.id) as review_count
  FROM order_items oi
  INNER JOIN orders o ON oi.order_id = o.id
  LEFT JOIN order_reviews r ON r.order_id = o.id
  WHERE oi.product_id = ANY(product_ids)
    AND r.id IS NOT NULL  -- Only count products with reviews
  GROUP BY oi.product_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_product_review_stats(UUID[]) TO anon, authenticated;

