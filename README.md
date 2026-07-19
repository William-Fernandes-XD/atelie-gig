# GIG — Moda Feminina

E-commerce profissional para a loja **GIG — Moda Feminina**, especializada em vestidos femininos. O projeto é dividido em duas aplicações independentes:

```
atelie-gg/
├── backend/     → API REST (Java 21 + Spring Boot)
├── frontend/    → Loja virtual + Painel admin (React + Vite)
├── docker-compose.yml
├── .env.example → Modelo de variáveis sensíveis
└── README.md
```

---

## Pré-requisitos

### Sem Docker
| Ferramenta | Versão mínima |
|------------|---------------|
| Java JDK   | 21 (recomendado; 25+ funciona com Lombok atualizado) |
| Maven      | 3.9+          |
| Node.js    | 20+           |
| PostgreSQL | 16+ (local)   |

### Com Docker
| Ferramenta | Versão mínima |
|------------|---------------|
| Docker     | 24+           |
| Docker Compose | 2+        |

---

## Configuração das variáveis de ambiente

Todas as informações sensíveis ficam no arquivo **`.env`** na raiz do projeto (nunca commite este arquivo).

### Passo 1 — Criar o arquivo `.env`

```bash
cd atelie-gg
cp .env.example .env
```

### Passo 2 — Preencher os parâmetros obrigatórios

Abra o `.env` e atualize os valores:

| Variável | O que é | Onde obter |
|----------|---------|------------|
| `DB_PASSWORD` | Senha do PostgreSQL | Defina uma senha forte |
| `JWT_SECRET` | Chave secreta do JWT | Gere uma string aleatória com 64+ caracteres |
| `MERCADOPAGO_ACCESS_TOKEN` | Token de acesso da API | [Painel Mercado Pago Developers](https://www.mercadopago.com.br/developers/panel/app) |
| `MERCADOPAGO_PUBLIC_KEY` | Chave pública | Painel Mercado Pago → Credenciais de produção |
| `MERCADOPAGO_CLIENT_ID` | Client ID | Painel Mercado Pago |
| `MERCADOPAGO_CLIENT_SECRET` | Client Secret | Painel Mercado Pago |
| `MAIL_PASSWORD` | Senha de app do Gmail | [Google App Passwords](https://myaccount.google.com/apppasswords) |
| `ORDER_PAYMENT_EXPIRATION_HOURS` | Cancelamento automático de pagamentos abertos | Padrão: `24` |
| `MERCADOPAGO_SUCCESS_URL` | URL após pagamento aprovado | URL do seu frontend + `/checkout/sucesso` |
| `MERCADOPAGO_FAILURE_URL` | URL após pagamento recusado | URL do seu frontend + `/checkout/falha` |
| `MERCADOPAGO_PENDING_URL` | URL após pagamento pendente | URL do seu frontend + `/checkout/pendente` |

### Parâmetros opcionais (já possuem defaults)

| Variável | Default | Descrição |
|----------|---------|-----------|
| `DB_HOST` | `localhost` | Host do PostgreSQL |
| `DB_PORT` | `5432` | Porta do PostgreSQL |
| `DB_NAME` | `atelie_gg` | Nome do banco |
| `DB_USER` | `postgres` | Usuário do banco |
| `SERVER_PORT` | `8080` | Porta da API |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Origens permitidas no CORS |
| `UPLOAD_DIR` | `uploads` | Pasta de imagens no servidor |
| `ADMIN_EMAIL` | `atelie.gig@gmail.com` | Email do admin inicial |
| `VITE_API_URL` | `http://localhost:8080` | URL da API para o frontend |

> **Mercado Pago:** use credenciais de **TESTE** durante o desenvolvimento. Em produção, substitua pelo token de produção e atualize as URLs de retorno.

> **Docker:** deixe `VITE_API_URL` vazio (`VITE_API_URL=`) para que o frontend use o proxy do Nginx integrado.

---

## Subir o projeto COM Docker (recomendado)

```bash
cd atelie-gg
cp .env.example .env
# Edite o .env com suas credenciais

docker compose up --build -d
```

### Acessos após subir

| Serviço | URL |
|---------|-----|
| Loja (frontend) | http://localhost:5173 |
| API (backend) | http://localhost:8080 |
| Swagger / OpenAPI | http://localhost:8080/swagger-ui.html |
| PostgreSQL | localhost:5432 |

### Ver logs (senha do admin)

Na **primeira inicialização**, o backend cria automaticamente o usuário administrador.

**Forma recomendada:** defina a senha no `.env`:

```env
ADMIN_EMAIL=atelie.gig@gmail.com
ADMIN_PASSWORD=SuaSenhaForte123!
```

Se o admin já existir e você perdeu a senha, use temporariamente:

```env
ADMIN_RESET_PASSWORD=true
```

Reinicie o backend (`docker compose restart backend`) e faça login com `ADMIN_PASSWORD`. Depois volte `ADMIN_RESET_PASSWORD=false`.

**CMD (Prompt de Comando):**

```cmd
docker logs atelie-gg-backend 2>&1 | findstr /i "ADMINISTRADOR Senha"
```

**PowerShell:**

```powershell
docker logs atelie-gg-backend 2>&1 | Select-String "ADMINISTRADOR|Senha:"
```

Credenciais do admin:
- **Email:** `atelie.gig@gmail.com` (ou valor de `ADMIN_EMAIL`)
- **Senha:** valor de `ADMIN_PASSWORD` no `.env`, ou exibida nos logs se não houver senha configurada

### Parar os containers

```bash
docker compose down
```

Para remover também os volumes (banco de dados):

```bash
docker compose down -v
```

---

## Subir o projeto SEM Docker

### 1. Banco de dados PostgreSQL

Crie o banco localmente:

```sql
CREATE DATABASE atelie_gg;
```

As tabelas são criadas automaticamente pelo **Flyway** na primeira execução do backend.

### 2. Backend

```bash
cd atelie-gg
cp .env.example .env
# Edite o .env

cd backend

# Windows PowerShell — carregar variáveis do .env
Get-Content ..\.env | ForEach-Object {
  if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
    [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), 'Process')
  }
}

mvn spring-boot:run
```

**Linux/macOS:**

```bash
cd atelie-gg/backend
export $(grep -v '^#' ../.env | xargs) && mvn spring-boot:run
```

Na primeira execução, verifique o console para a **senha do administrador**.

### 3. Frontend

Em outro terminal:

```bash
cd atelie-gg/frontend
npm install
npm run dev
```

Acesse: http://localhost:5173

O Vite está configurado com proxy para `/api` e `/uploads` apontando para `http://localhost:8080`.

---

## Estrutura do sistema

### Loja Virtual (clientes)
- Listagem de produtos com busca e filtro por categoria
- Página de produto com galeria, zoom, cores, tamanhos e estoque
- Carrinho no **LocalStorage** (Zustand + persist)
- Regra de atacado: mais de 3 peças → preço atacado automático
- Checkout com login, cadastro ou compra como visitante
- Pagamento via **Mercado Pago**

### Painel Administrativo
Acessível para perfis: `ADMIN`, `GERENTE`, `ESTOQUISTA`

| Módulo | Funcionalidades |
|--------|-----------------|
| Dashboard | Faturamento, pedidos, top vendas, sem estoque, últimas vendas |
| Produtos | CRUD, imagens, estoque por cor/tamanho |
| Categorias | CRUD (remoção move produtos para "Sem Categoria") |
| Pedidos | Listagem e atualização de status |
| Usuários | CRUD com papéis (somente ADMIN) |

### Perfis de acesso
- `ADMIN` — acesso total + gestão de usuários
- `GERENTE` — painel administrativo
- `ESTOQUISTA` — painel administrativo
- `CLIENTE` — loja virtual

---

## API REST

Documentação interativa disponível em:

```
http://localhost:8080/swagger-ui.html
```

Principais endpoints:

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/forgot-password` | Solicitar código por email |
| POST | `/api/auth/reset-password` | Redefinir senha com código |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Cadastro de cliente |
| GET | `/api/products` | Listar produtos (loja) |
| GET | `/api/products/{id}` | Detalhe do produto |
| POST | `/api/checkout` | Finalizar compra |
| GET | `/api/admin/dashboard` | Métricas do painel |
| CRUD | `/api/categories` | Categorias |
| CRUD | `/api/products` | Produtos (admin) |
| CRUD | `/api/users` | Usuários (admin) |

---

## Imagens de produtos

As imagens **não** são armazenadas no banco. São salvas em:

```
backend/uploads/products/{productId}/
```

O banco armazena apenas os caminhos (URLs). Upload via:

- `POST /api/products/{id}/image/main` — imagem principal
- `POST /api/products/{id}/image/gallery` — galeria

---

## O que atualizar no código ao ir para produção

1. **`.env`** — todas as variáveis com valores de produção
2. **`MERCADOPAGO_ACCESS_TOKEN`** — token de produção do Mercado Pago
3. **`MERCADOPAGO_*_URL`** — URLs reais do seu domínio
4. **`JWT_SECRET`** — chave forte e única para produção
5. **`CORS_ALLOWED_ORIGINS`** — domínio real do frontend
6. **`VITE_API_URL`** — URL pública da API (ou vazio se usar proxy Nginx)
7. **Webhook Mercado Pago** — configure em produção apontando para:
   ```
   https://seu-dominio.com/api/orders/webhook/mercadopago
   ```

---

## Tecnologias

### Backend
Java 21 · Spring Boot · Spring Security · JWT · Spring Data JPA · PostgreSQL · Flyway · Lombok · Bean Validation · Mercado Pago SDK · Swagger/OpenAPI

### Frontend
React · Vite · React Router · Axios · TanStack Query · Tailwind CSS · React Hook Form · Zustand · LocalStorage

---

## Identidade visual

Paleta inspirada na identidade da marca:
- **Rosa pastel** — destaques e painel de login
- **Lavanda** — botões de ação
- **Carvão** — textos e bordas
- **Playfair Display** — títulos e logo
- **Montserrat** — interface e navegação

---

## Suporte

Para dúvidas sobre integração Mercado Pago: [Documentação oficial](https://www.mercadopago.com.br/developers/pt/docs)
"# atelie-gig" 
