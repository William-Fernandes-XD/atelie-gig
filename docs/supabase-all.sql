-- GIG — Moda Feminina | Schema completo para Supabase
-- Cole este arquivo em: Supabase → SQL Editor → New query → Run
-- Opcional: se preferir, o Java (Flyway) cria as tabelas sozinho ao iniciar.


-- ========== V1__initial_schema.sql ==========
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password        VARCHAR(255) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'CLIENTE',
    phone           VARCHAR(20),
    cpf             VARCHAR(14),
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE addresses (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT REFERENCES users(id) ON DELETE CASCADE,
    cep             VARCHAR(9) NOT NULL,
    street          VARCHAR(200) NOT NULL,
    number          VARCHAR(20) NOT NULL,
    neighborhood    VARCHAR(100) NOT NULL,
    city            VARCHAR(100) NOT NULL,
    state           VARCHAR(2) NOT NULL,
    complement      VARCHAR(200),
    reference       VARCHAR(200),
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE categories (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    description     VARCHAR(500),
    slug            VARCHAR(120) NOT NULL UNIQUE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
    id              BIGSERIAL PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    category_id     BIGINT NOT NULL REFERENCES categories(id),
    price           DECIMAL(10, 2) NOT NULL,
    wholesale_price DECIMAL(10, 2) NOT NULL,
    main_image_url  VARCHAR(500),
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE product_colors (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name            VARCHAR(50) NOT NULL,
    hex_code        VARCHAR(7),
    UNIQUE (product_id, name)
);

CREATE TABLE product_sizes (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name            VARCHAR(10) NOT NULL,
    UNIQUE (product_id, name)
);

CREATE TABLE product_specifications (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    spec_key        VARCHAR(100) NOT NULL,
    spec_value      VARCHAR(255) NOT NULL
);

CREATE TABLE product_images (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url       VARCHAR(500) NOT NULL,
    display_order   INT NOT NULL DEFAULT 0
);

CREATE TABLE stock (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    color_id        BIGINT NOT NULL REFERENCES product_colors(id) ON DELETE CASCADE,
    size_id         BIGINT NOT NULL REFERENCES product_sizes(id) ON DELETE CASCADE,
    quantity        INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    UNIQUE (product_id, color_id, size_id)
);

CREATE TABLE orders (
    id                      BIGSERIAL PRIMARY KEY,
    order_number            VARCHAR(30) NOT NULL UNIQUE,
    user_id                 BIGINT REFERENCES users(id),
    guest_name              VARCHAR(150),
    guest_email             VARCHAR(150),
    guest_phone             VARCHAR(20),
    guest_cpf               VARCHAR(14),
    shipping_cep            VARCHAR(9) NOT NULL,
    shipping_street         VARCHAR(200) NOT NULL,
    shipping_number         VARCHAR(20) NOT NULL,
    shipping_neighborhood   VARCHAR(100) NOT NULL,
    shipping_city           VARCHAR(100) NOT NULL,
    shipping_state          VARCHAR(2) NOT NULL,
    shipping_complement     VARCHAR(200),
    shipping_reference      VARCHAR(200),
    status                  VARCHAR(30) NOT NULL DEFAULT 'PENDING_PAYMENT',
    subtotal                DECIMAL(10, 2) NOT NULL,
    total                   DECIMAL(10, 2) NOT NULL,
    wholesale_applied       BOOLEAN NOT NULL DEFAULT FALSE,
    mercadopago_preference_id VARCHAR(100),
    mercadopago_payment_id  VARCHAR(100),
    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
    id              BIGSERIAL PRIMARY KEY,
    order_id        BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      BIGINT NOT NULL REFERENCES products(id),
    product_title   VARCHAR(200) NOT NULL,
    color_name      VARCHAR(50) NOT NULL,
    size_name       VARCHAR(10) NOT NULL,
    quantity        INT NOT NULL CHECK (quantity > 0),
    unit_price      DECIMAL(10, 2) NOT NULL,
    total_price     DECIMAL(10, 2) NOT NULL
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_stock_product ON stock(product_id);


-- ========== V10__order_shipping_cost.sql ==========
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS shipping_service_code VARCHAR(20),
    ADD COLUMN IF NOT EXISTS shipping_service_name VARCHAR(80),
    ADD COLUMN IF NOT EXISTS shipping_deadline_days INTEGER;

UPDATE orders
SET shipping_cost = 0
WHERE shipping_cost IS NULL;


-- ========== V2__seed_default_category.sql ==========
INSERT INTO categories (name, description, slug)
VALUES ('Sem Categoria', 'Produtos sem categoria definida', 'sem-categoria')
ON CONFLICT (slug) DO NOTHING;


-- ========== V3__password_reset_and_order_expiration.sql ==========
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_expires_at TIMESTAMP;

UPDATE orders
SET payment_expires_at = created_at + INTERVAL '24 hours'
WHERE payment_expires_at IS NULL;

CREATE TABLE password_reset_tokens (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code            VARCHAR(6) NOT NULL,
    expires_at      TIMESTAMP NOT NULL,
    used            BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_password_reset_user ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_code ON password_reset_tokens(code);


-- ========== V4__user_profile_photo.sql ==========
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url VARCHAR(500);


-- ========== V5__payment_transactions.sql ==========
CREATE TABLE payment_transactions (
    id                      BIGSERIAL PRIMARY KEY,
    order_id                BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    mercadopago_payment_id  VARCHAR(100),
    method                  VARCHAR(20) NOT NULL,
    status                  VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    amount                  DECIMAL(10, 2) NOT NULL,
    status_detail           VARCHAR(200),
    pix_qr_code             TEXT,
    pix_qr_code_base64      TEXT,
    pix_expiration          TIMESTAMP,
    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_mp_id ON payment_transactions(mercadopago_payment_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20);


-- ========== V6__order_status_history.sql ==========
CREATE TABLE order_status_history (
    id              BIGSERIAL PRIMARY KEY,
    order_id        BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status          VARCHAR(30) NOT NULL,
    observation     VARCHAR(500),
    created_by      VARCHAR(150),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_status_history_order ON order_status_history(order_id);
CREATE INDEX idx_order_status_history_created ON order_status_history(created_at);

-- Backfill: registra o status atual dos pedidos existentes
INSERT INTO order_status_history (order_id, status, observation, created_by, created_at)
SELECT
    id,
    status,
    CASE status
        WHEN 'PENDING_PAYMENT' THEN 'Pedido criado. Aguardando confirmação do pagamento.'
        WHEN 'PAID' THEN 'Pagamento confirmado.'
        WHEN 'PROCESSING' THEN 'Pedido em preparação.'
        WHEN 'SHIPPED' THEN 'Pedido enviado.'
        WHEN 'DELIVERED' THEN 'Pedido entregue.'
        WHEN 'CANCELLED' THEN 'Pedido cancelado.'
        WHEN 'REFUNDED' THEN 'Pedido reembolsado.'
        ELSE 'Status registrado.'
    END,
    'sistema',
    COALESCE(updated_at, created_at)
FROM orders;


-- ========== V7__order_item_product_image.sql ==========
ALTER TABLE order_items
    ADD COLUMN IF NOT EXISTS product_image_url VARCHAR(500);

-- Backfill com a imagem atual do produto
UPDATE order_items oi
SET product_image_url = p.main_image_url
FROM products p
WHERE oi.product_id = p.id
  AND (oi.product_image_url IS NULL OR oi.product_image_url = '');


-- ========== V8__timezone_brazil_and_order_number.sql ==========
-- Corrige timestamps gravados em UTC para horário de Brasília (America/Sao_Paulo)
UPDATE orders
SET created_at = created_at - INTERVAL '3 hours',
    updated_at = updated_at - INTERVAL '3 hours',
    payment_expires_at = CASE
        WHEN payment_expires_at IS NULL THEN NULL
        ELSE payment_expires_at - INTERVAL '3 hours'
    END;

UPDATE order_status_history
SET created_at = created_at - INTERVAL '3 hours';

UPDATE payment_transactions
SET created_at = created_at - INTERVAL '3 hours',
    updated_at = updated_at - INTERVAL '3 hours',
    pix_expiration = CASE
        WHEN pix_expiration IS NULL THEN NULL
        ELSE pix_expiration - INTERVAL '3 hours'
    END;

-- Número do pedido com sufixo aleatório (evita colisão no mesmo segundo)
ALTER TABLE orders ALTER COLUMN order_number TYPE VARCHAR(40);


-- ========== V9__category_size_options.sql ==========
-- Tamanhos sugeridos por categoria (ex.: 40-48), separados por vírgula
ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS size_options VARCHAR(500) NOT NULL DEFAULT '40-48';

UPDATE categories
SET size_options = '40-48'
WHERE size_options IS NULL OR TRIM(size_options) = '';

-- Amplia nome do tamanho do produto (ex.: 40-48, 50-52)
ALTER TABLE product_sizes
    ALTER COLUMN name TYPE VARCHAR(20);

