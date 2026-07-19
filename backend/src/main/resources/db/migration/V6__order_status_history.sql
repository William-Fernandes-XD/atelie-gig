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
