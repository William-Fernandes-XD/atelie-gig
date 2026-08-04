-- CMS: Hero da Home (singleton ativo + badges)

CREATE TABLE hero_sections (
    id                      BIGSERIAL PRIMARY KEY,
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    title_line1             VARCHAR(200) NOT NULL,
    title_line2             VARCHAR(200),
    title_line2_color       VARCHAR(40),
    title_font_weight       VARCHAR(40) NOT NULL DEFAULT 'bold',
    title_font_size         VARCHAR(40) NOT NULL DEFAULT 'md',
    description             VARCHAR(1000),
    button_text             VARCHAR(120),
    button_link             VARCHAR(500),
    button_background       VARCHAR(40),
    button_text_color       VARCHAR(40),
    button_border_radius    VARCHAR(40) NOT NULL DEFAULT 'full',
    button_visible          BOOLEAN NOT NULL DEFAULT TRUE,
    button_hover_background VARCHAR(40),
    secondary_button1_text  VARCHAR(120),
    secondary_button1_url   VARCHAR(500),
    secondary_button1_color VARCHAR(40),
    secondary_button1_visible BOOLEAN NOT NULL DEFAULT FALSE,
    secondary_button2_text  VARCHAR(120),
    secondary_button2_url   VARCHAR(500),
    secondary_button2_color VARCHAR(40),
    secondary_button2_visible BOOLEAN NOT NULL DEFAULT FALSE,
    hero_image_url          VARCHAR(500),
    logo_image_url          VARCHAR(500),
    background_type         VARCHAR(40) NOT NULL DEFAULT 'gradient',
    background_color        VARCHAR(40),
    background_gradient     VARCHAR(500),
    background_image_url    VARCHAR(500),
    overlay_color           VARCHAR(40),
    overlay_opacity         NUMERIC(4, 3) NOT NULL DEFAULT 0,
    text_alignment          VARCHAR(20) NOT NULL DEFAULT 'center',
    hero_height             VARCHAR(20) NOT NULL DEFAULT 'medium',
    image_position          VARCHAR(20) NOT NULL DEFAULT 'right',
    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_hero_sections_one_active
    ON hero_sections (is_active)
    WHERE is_active = TRUE;

CREATE TABLE hero_features (
    id               BIGSERIAL PRIMARY KEY,
    hero_section_id  BIGINT NOT NULL REFERENCES hero_sections(id) ON DELETE CASCADE,
    icon             VARCHAR(40) NOT NULL DEFAULT 'heart',
    title            VARCHAR(120) NOT NULL,
    display_order    INT NOT NULL DEFAULT 0,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hero_features_section_order
    ON hero_features (hero_section_id, display_order);

-- Seed com o visual atual da Home
INSERT INTO hero_sections (
    is_active,
    title_line1,
    title_line2,
    title_line2_color,
    title_font_weight,
    title_font_size,
    description,
    button_text,
    button_link,
    button_background,
    button_text_color,
    button_border_radius,
    button_visible,
    button_hover_background,
    hero_image_url,
    background_type,
    background_gradient,
    overlay_opacity,
    text_alignment,
    hero_height,
    image_position
) VALUES (
    TRUE,
    'Vestidos que contam',
    'histórias',
    '#9B8FD9',
    'bold',
    'md',
    'Descubra peças exclusivas da GIG, criadas com elegância para mulheres especiais.',
    'Conheça a coleção',
    '#colecao',
    '#E8A8B8',
    '#2B2B2B',
    'full',
    TRUE,
    '#E0A4AE',
    '/images/hero-boutique.png',
    'gradient',
    'from-[#F7E6EA] via-[#FBF3F5] to-[#F3DDE3]',
    0,
    'center',
    'medium',
    'right'
);

INSERT INTO hero_features (hero_section_id, icon, title, display_order)
SELECT id, 'dress', 'Peças exclusivas', 0 FROM hero_sections WHERE is_active = TRUE
UNION ALL
SELECT id, 'heart', 'Feito para você', 1 FROM hero_sections WHERE is_active = TRUE
UNION ALL
SELECT id, 'sparkle', 'Elegância em cada detalhe', 2 FROM hero_sections WHERE is_active = TRUE;
