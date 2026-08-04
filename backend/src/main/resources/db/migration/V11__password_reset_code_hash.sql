-- Códigos de reset passam a ser armazenados com hash (BCrypt ~60 chars).
ALTER TABLE password_reset_tokens
    ALTER COLUMN code TYPE VARCHAR(100);

-- Tokens em texto puro antigos ficam inválidos (segurança).
UPDATE password_reset_tokens SET used = TRUE WHERE used = FALSE;
