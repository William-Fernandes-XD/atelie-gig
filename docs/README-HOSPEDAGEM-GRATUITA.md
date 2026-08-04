# Hospedagem gratuita — do jeito que eu faria

Este é o caminho que eu usaria para colocar a **GIG** no ar **sem pagar mensalidade** (dentro dos limites free de cada serviço).

## Arquitetura escolhida

| Peça | Serviço | Por quê |
|------|---------|---------|
| Site (React) | **Vercel** (Hobby) | Deploy fácil, HTTPS, domínio, combina com o frontend Vite |
| API (Java) | **Oracle Cloud Always Free** | Única opção free com RAM de verdade e **ligada 24h** (webhook/pagamentos) |
| Banco | **Supabase** (Free) | Postgres gerenciado, SSL, enough para começar |

```
Cliente
   ↓
Vercel ──────────► frontend React (loja + admin)
   ↓ chama HTTPS
Oracle Free ─────► API Spring Boot + pasta /uploads
   ↓
Supabase ────────► PostgreSQL
```

### O que eu **não** usaria de graça para a API

- **Render / Railway free que “dorme”** → cold start longo e webhook do Mercado Pago falha  
- **Vercel para Java** → não hospeda Spring Boot direito  
- **Fly.io / Koyeb free minúsculo** → RAM apertada demais para Java 21  

Oracle dá trabalho no começo, mas é o que sustenta loja de verdade de graça.

---

## Ordem do deploy (não pule etapas)

1. Supabase (banco)  
2. Oracle (API)  
3. Vercel (site)  
4. Ligar pontas: CORS, `VITE_API_URL`, Mercado Pago, e-mail  

---

# 1) Supabase — banco

### 1.1 Conta e projeto

1. https://supabase.com → criar conta  
2. **New project**
   - Nome: `atelie-gig`
   - Senha do banco: forte → **anote**
   - Região: a mais perto do Brasil  
3. Espere **Ready**

### 1.2 Dados de conexão (Session pooler)

Project Settings → **Database** → Connection string / pooler em modo **Session** (não Transaction).

No `.env` da API (vai criar na Oracle):

```env
DB_HOST=aws-0-REGIAO.pooler.supabase.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres.SEU_PROJECT_REF
DB_PASSWORD=sua-senha
DB_SSL_MODE=require
DB_POOL_SIZE=5
```

### 1.3 Tabelas

**Não crie na mão.** Na primeira subida do Java, o Flyway cria tudo.

Depois confira em **Table Editor** (`users`, `products`, `orders`, `hero_sections`…).

---

# 2) Oracle Always Free — API Java

### 2.1 Conta

1. https://www.oracle.com/cloud/free/  
2. Cadastro + cartão (validação; Always Free em geral não cobra se ficar nos limites)  
3. Console: https://cloud.oracle.com  
4. Anote a **Home Region**

### 2.2 VM Ampere (a que eu criaria)

Compute → Instances → **Create instance**

| Campo | Valor |
|-------|--------|
| Name | `atelie-gig-api` |
| Image | Ubuntu 22.04 ou 24.04 **aarch64** |
| Shape | Ampere `VM.Standard.A1.Flex` |
| Recursos | comece com **2 OCPU / 12 GB** (ou o máximo free) |
| Rede | IP público ligado |
| SSH | gerar key pair e baixar a chave privada |

Se der **Out of capacity**: trocar AD, reduzir shape, outro horário, ou Pay As You Go (ainda pode usar Always Free).

### 2.3 Portas (Security List)

Na VCN → Security Lists → Ingress:

| Porta | Uso |
|-------|-----|
| 22 | SSH |
| 80 | HTTP / Let’s Encrypt |
| 443 | HTTPS da API |
| 8080 | temporário (feche depois do HTTPS) |

### 2.4 SSH + iptables (Ubuntu Oracle costuma bloquear)

```powershell
ssh -i "C:\caminho\sua-chave.key" ubuntu@SEU_IP
```

No servidor:

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 8080 -j ACCEPT
sudo apt install -y iptables-persistent
sudo netfilter-persistent save
```

### 2.5 Docker

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
exit
```

Entre de novo e confira `docker compose version`.

### 2.6 Código + `.env`

```bash
cd ~
git clone https://github.com/SEU_USUARIO/atelie-gg.git
cd atelie-gg
cp .env.example .env
nano .env
```

Modelo mínimo do que eu colocaria:

```env
APP_ENV=production
SERVER_PORT=8080

# Supabase
DB_HOST=...
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres.SEU_REF
DB_PASSWORD=...
DB_SSL_MODE=require
DB_POOL_SIZE=5

JWT_SECRET=gere-64-chars-aleatorios-no-minimo
JWT_EXPIRATION_MS=86400000

ADMIN_NAME=GIG — Moda Feminina
ADMIN_EMAIL=seu-email@gmail.com
ADMIN_PASSWORD=senha-forte
ADMIN_RESET_PASSWORD=false

# Depois da Vercel, troque pela URL real do site
CORS_ALLOWED_ORIGINS=https://seu-app.vercel.app

MERCADOPAGO_PUBLIC_KEY=...
MERCADOPAGO_ACCESS_TOKEN=...
MERCADOPAGO_WEBHOOK_SECRET=...
MERCADOPAGO_SUCCESS_URL=https://seu-app.vercel.app/checkout/sucesso
MERCADOPAGO_FAILURE_URL=https://seu-app.vercel.app/checkout/falha
MERCADOPAGO_PENDING_URL=https://seu-app.vercel.app/checkout/pendente

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=...
MAIL_PASSWORD=...          # senha de app do Gmail
MAIL_FROM=GIG — Moda Feminina <seu-email@gmail.com>

GOOGLE_CLIENT_ID=
SHIPPING_ORIGIN_CEP=01310100
ORDER_PAYMENT_EXPIRATION_HOURS=24
UPLOAD_DIR=uploads
VITE_API_URL=
```

Em `production` o backend **exige** JWT forte + token MP + webhook secret.

### 2.7 Subir **só a API**

```bash
cd ~/atelie-gg
docker compose up -d --build backend
docker logs atelie-gg-backend --tail 80
```

Teste:

```bash
curl -s http://127.0.0.1:8080/api/cms/hero | head
```

### 2.8 HTTPS na API (eu faria isso antes da Vercel em produção)

1. DNS: registro **A** `api.sualoja.com.br` → IP da Oracle  
2. Instalar **Caddy**:

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```

`/etc/caddy/Caddyfile`:

```caddy
api.sualoja.com.br {
        reverse_proxy 127.0.0.1:8080
}
```

```bash
sudo systemctl reload caddy
```

3. Webhook MP: `https://api.sualoja.com.br/api/orders/webhook/mercadopago`  
4. Fechar porta **8080** na Security List (deixar 22/80/443)

Sem domínio ainda: dá para testar `http://IP:8080`, mas a Vercel (HTTPS) **bloqueia** chamar API HTTP → HTTPS na API é quase obrigatório.

### 2.9 Atualizar API depois

```bash
cd ~/atelie-gg
git pull
docker compose up -d --build backend
```

Uploads ficam no volume Docker (`uploads_data`).

---

# 3) Vercel — frontend

### 3.1 Projeto

1. Código no GitHub (sem `.env`)  
2. https://vercel.com → importar o repo  
3. Configuração:

| Campo | Valor |
|-------|--------|
| Framework | Vite |
| Root Directory | `frontend` |
| Build | `npm run build` |
| Output | `dist` |

O arquivo `frontend/vercel.json` já cuida das rotas do React.

### 3.2 Variável obrigatória

Settings → Environment Variables:

| Nome | Valor |
|------|--------|
| `VITE_API_URL` | `https://api.sualoja.com.br` |

- Sem barra no final  
- Production + Preview  
- **Redeploy** depois de salvar  

### 3.3 Domínio do site (opcional)

Vercel → Domains → `www.sualoja.com.br` e siga o DNS.

### 3.4 Voltar na Oracle e fechar o circuito

No `.env` da Oracle:

```env
CORS_ALLOWED_ORIGINS=https://www.sualoja.com.br,https://seu-app.vercel.app
MERCADOPAGO_SUCCESS_URL=https://www.sualoja.com.br/checkout/sucesso
MERCADOPAGO_FAILURE_URL=https://www.sualoja.com.br/checkout/falha
MERCADOPAGO_PENDING_URL=https://www.sualoja.com.br/checkout/pendente
```

```bash
docker compose up -d backend
```

---

# 4) Checklist final (como eu validaria)

- [ ] Supabase com tabelas após o 1º boot do Java  
- [ ] `https://api.../api/cms/hero` retorna JSON  
- [ ] Site na Vercel abre  
- [ ] Login admin funciona  
- [ ] Upload de foto do produto aparece (URL aponta para a Oracle)  
- [ ] CORS sem erro no DevTools  
- [ ] Webhook Mercado Pago na URL da API  
- [ ] E-mail “esqueci senha” com senha de app  
- [ ] `APP_ENV=production` na Oracle  

---

# Custos reais (expectativa)

| Item | Free típico | Atenção |
|------|-------------|---------|
| Vercel Hobby | site ok | limites de bandwidth |
| Oracle Always Free | API 24h | cartão na criação; fique no Always Free |
| Supabase Free | banco ok | pode **pausar** por inatividade |
| Domínio | pago (Registro.br etc.) | opcional no começo |
| Gmail SMTP | free com senha de app | limites de envio |

Planos mudam: confira sempre as páginas oficiais de pricing.

---

# Problemas que eu já esperaria

| Sintoma | Causa mais comum |
|---------|------------------|
| API não sobe | `.env` Supabase errado / SSL / pooler Transaction |
| Site chama API e CORS bloqueia | URL da Vercel fora de `CORS_ALLOWED_ORIGINS` |
| Fotos quebradas | `VITE_API_URL` vazio ou com barra no final |
| Mixed Content | site HTTPS + API só HTTP no IP |
| Pagamento não confirma | webhook errado / secret ausente |
| Oracle sem capacidade | Ampere esgotado na região |

Logs:

```bash
docker logs atelie-gg-backend --tail 100
```

---

# Resumo em uma frase

**Banco no Supabase, cérebro Java sempre ligado na Oracle, vitrine na Vercel** — essa é a combinação free que eu usaria para esta loja.

Para desenvolvimento local no PC: veja o `README.md` na raiz (`docker compose up -d --build`).
