ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS shipping_service_code VARCHAR(20),
    ADD COLUMN IF NOT EXISTS shipping_service_name VARCHAR(80),
    ADD COLUMN IF NOT EXISTS shipping_deadline_days INTEGER;

UPDATE orders
SET shipping_cost = 0
WHERE shipping_cost IS NULL;
