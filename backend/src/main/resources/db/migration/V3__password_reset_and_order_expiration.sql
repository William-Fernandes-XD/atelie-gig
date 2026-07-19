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
