-- Tamanhos sugeridos por categoria (ex.: 40-48), separados por vírgula
ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS size_options VARCHAR(500) NOT NULL DEFAULT '40-48';

UPDATE categories
SET size_options = '40-48'
WHERE size_options IS NULL OR TRIM(size_options) = '';

-- Amplia nome do tamanho do produto (ex.: 40-48, 50-52)
ALTER TABLE product_sizes
    ALTER COLUMN name TYPE VARCHAR(20);
