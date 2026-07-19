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
