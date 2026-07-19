INSERT INTO categories (name, description, slug)
VALUES ('Sem Categoria', 'Produtos sem categoria definida', 'sem-categoria')
ON CONFLICT (slug) DO NOTHING;
