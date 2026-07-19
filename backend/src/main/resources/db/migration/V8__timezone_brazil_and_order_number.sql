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
