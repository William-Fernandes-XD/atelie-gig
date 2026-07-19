ALTER TABLE order_items
    ADD COLUMN IF NOT EXISTS product_image_url VARCHAR(500);

-- Backfill com a imagem atual do produto
UPDATE order_items oi
SET product_image_url = p.main_image_url
FROM products p
WHERE oi.product_id = p.id
  AND (oi.product_image_url IS NULL OR oi.product_image_url = '');
