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
