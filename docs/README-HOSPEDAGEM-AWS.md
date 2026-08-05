# Hospedagem na AWS (EC2) — passo a passo

Guia para subir **o projeto inteiro** numa máquina EC2 gratuita (ou free tier) e deixar **só o banco no Supabase**.

```
Cliente
   ↓
AWS EC2 (Docker: frontend React + API Java)
   ↓
Supabase (PostgreSQL)
```

> Você está no console **AWS**, não na Oracle. Isso funciona — só lembre: o free da AWS costuma ser **~12 meses** e a máquina free tem **~1 GB de RAM** (apertada para Java).

---

## Parte 0 — Antes de clicar em “Executar instância”

Na tela **Executar uma instância**, ajuste isto:

### 0.1 Região (importante)

No canto superior direito está **Europa (Estocolmo)**.  
Para clientes no Brasil, mude para **América do Sul (São Paulo) `sa-east-1`**.

1. Clique na região (canto superior direito)  
2. Escolha **América do Sul (São Paulo)**  
3. Comece de novo **Executar uma instância** (a tela reseta)

### 0.2 Nome

- **Nome:** `atelie-gig` (já está ok)

### 0.3 Imagem (AMI) + tipo de instância (não misture)

Você marcou **Amazon Linux 2023 Arm**. Arm só funciona com tipos **`t4g.*`**.

Escolha **uma** destas combinações:

**Opção A — Free tier clássico (recomendado para começar)**  
| Campo | Valor |
|-------|--------|
| AMI | Amazon Linux 2023 **x86_64** (não Arm) |
| Tipo | **`t3.micro`** ou **`t2.micro`** (Qualificado para o nível gratuito) |

**Opção B — Arm**  
| Campo | Valor |
|-------|--------|
| AMI | Amazon Linux 2023 **Arm** |
| Tipo | **`t4g.micro`** (free tier Arm, se aparecer na sua conta) |

Se a AMI for Arm e o tipo for `t3.micro`, a AWS pode recusar ou dar problema.

### 0.4 Par de chaves (obrigatório)

1. Em **Par de chaves** → **Criar novo par de chaves**  
2. Nome: `atelie-gig-key`  
3. Tipo: **RSA**  
4. Formato: **`.pem`** (se for usar PowerShell/OpenSSH no Windows)  
5. **Criar** e **guarde o arquivo `.pem`** — sem ele você não entra no servidor

### 0.5 Firewall (grupo de segurança)

Edite as regras de entrada e permita:

| Tipo | Porta | Origem | Para quê |
|------|-------|--------|----------|
| SSH | 22 | Meu IP (melhor) ou `0.0.0.0/0` | Acesso admin |
| HTTP | 80 | `0.0.0.0/0` | Site |
| HTTPS | 443 | `0.0.0.0/0` | Site com cadeado (depois) |

Não precisa abrir 8080/5173 se o Docker usar o nginx na porta **80** (como no `docker-compose` atual).

### 0.6 Armazenamento

- Free tier costuma incluir até **30 GiB**  
- Troque **8 GiB → 20 ou 30 GiB** (Docker + Java comem espaço)

### 0.7 Executar

Clique em **Executar instância** → espere ficar **Em execução** → anote o **IP público** / **DNS público IPv4**.

---

## Parte 1 — Entrar por SSH (Windows)

No PowerShell (ajuste o caminho da chave e o IP):

```powershell
icacls "C:\Users\SEU_USUARIO\Downloads\atelie-gig-key.pem" /inheritance:r
icacls "C:\Users\SEU_USUARIO\Downloads\atelie-gig-key.pem" /grant:r "$($env:USERNAME):(R)"

ssh -i "C:\Users\SEU_USUARIO\Downloads\atelie-gig-key.pem" ec2-user@SEU_IP_PUBLICO
```

- Usuário do **Amazon Linux:** `ec2-user`  
- Na primeira vez digite `yes`

---

## Parte 2 — Instalar Docker no Amazon Linux 2023

Cole no SSH:

```bash
sudo dnf update -y
sudo dnf install -y docker git
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user
```

Saia e entre de novo no SSH:

```bash
exit
```

(conecte de novo com o mesmo `ssh -i ...`)

Confira:

```bash
docker --version
```

Instalar o plugin **Compose** (escolha o arquivo certo da arquitetura):

**Se a instância for x86_64 (`t3.micro`):**

```bash
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL "https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
docker compose version
```

**Se for Arm (`t4g.micro`):**

```bash
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL "https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-aarch64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
docker compose version
```

### Swap (quase obrigatório com 1 GB de RAM)

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab
free -h
```

---

## Parte 3 — Supabase (banco)

Se ainda não tiver:

1. https://supabase.com → projeto  
2. Senha do banco anotada  
3. Connection **Session** pooler (não Transaction)

Valores para o `.env`:

```env
DB_HOST=aws-0-REGIAO.pooler.supabase.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres.SEU_PROJECT_REF
DB_PASSWORD=sua-senha
DB_SSL_MODE=require
DB_POOL_SIZE=5
```

---

## Parte 4 — Código + `.env` + subir tudo

### 4.1 Clonar o projeto

```bash
cd ~
git clone https://github.com/SEU_USUARIO/atelie-gg.git
cd atelie-gg
```

(Se o repo for privado, use um Personal Access Token do GitHub no clone.)

### 4.2 Criar `.env`

```bash
cp .env.example .env
nano .env
```

Preencha (troque pelo IP público da EC2):

```env
APP_ENV=production
SERVER_PORT=8080
FRONTEND_PORT=5173

# HTTPS sem domínio próprio (Caddy + sslip.io) — use o IP real
PUBLIC_HOST=SEU_IP_PUBLICO.sslip.io
CORS_ALLOWED_ORIGINS=https://SEU_IP_PUBLICO.sslip.io
FRONTEND_PORT=127.0.0.1:5173

# Supabase
DB_HOST=...
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres.SEU_REF
DB_PASSWORD=...
DB_SSL_MODE=require
DB_POOL_SIZE=5

JWT_SECRET=chave-aleatoria-com-pelo-menos-64-caracteres
JWT_EXPIRATION_MS=86400000

ADMIN_NAME=GIG — Moda Feminina
ADMIN_EMAIL=seu-email@gmail.com
ADMIN_PASSWORD=senha-forte
ADMIN_RESET_PASSWORD=false

# Vazio: o nginx do frontend faz proxy de /api e /uploads
VITE_API_URL=

MERCADOPAGO_PUBLIC_KEY=...
MERCADOPAGO_ACCESS_TOKEN=...
MERCADOPAGO_WEBHOOK_SECRET=...
MERCADOPAGO_SUCCESS_URL=https://SEU_IP_PUBLICO.sslip.io/checkout/sucesso
MERCADOPAGO_FAILURE_URL=https://SEU_IP_PUBLICO.sslip.io/checkout/falha
MERCADOPAGO_PENDING_URL=https://SEU_IP_PUBLICO.sslip.io/checkout/pendente

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=...
MAIL_PASSWORD=...
MAIL_FROM=GIG — Moda Feminina <seu-email@gmail.com>

GOOGLE_CLIENT_ID=
SHIPPING_ORIGIN_CEP=01310100
ORDER_PAYMENT_EXPIRATION_HOURS=24
UPLOAD_DIR=uploads
```

Salvar no nano: `Ctrl+O`, Enter, `Ctrl+X`.

### 4.3 HTTPS sem comprar domínio (Caddy + sslip.io)

O Google Login **exige HTTPS com hostname** (IP puro / HTTP são bloqueados).  
No repo já existe `docker-compose.aws.yml` + `Caddyfile`: o Caddy pega certificado Let's Encrypt usando um hostname grátis do **sslip.io** que aponta para o IP da EC2.

No `.env` da EC2 (troque pelo IP público real):

```env
PUBLIC_HOST=54.233.12.34.sslip.io
CORS_ALLOWED_ORIGINS=https://54.233.12.34.sslip.io
VITE_API_URL=
FRONTEND_PORT=127.0.0.1:5173
MERCADOPAGO_SUCCESS_URL=https://54.233.12.34.sslip.io/checkout/sucesso
MERCADOPAGO_FAILURE_URL=https://54.233.12.34.sslip.io/checkout/falha
MERCADOPAGO_PENDING_URL=https://54.233.12.34.sslip.io/checkout/pendente
```

Security Group: portas **80** e **443** abertas (`0.0.0.0/0`).

### 4.4 Subir o stack

```bash
cd ~/atelie-gg
docker compose -f docker-compose.yml -f docker-compose.aws.yml up -d --build
```

A primeira vez demora (baixa Maven/Node e compila). O Caddy emite o certificado sozinho (pode levar 1–2 min).

Acompanhe:

```bash
docker compose -f docker-compose.yml -f docker-compose.aws.yml ps
docker logs atelie-gg-backend --tail 80
docker logs atelie-gg-caddy --tail 40
```

Procure `Started AtelieGgApplication` e, no Caddy, certificado ok (sem erro de ACME).

### 4.5 Testar

No navegador:

- Loja: `https://SEU_IP.sslip.io`  
- API: `https://SEU_IP.sslip.io/api/cms/hero`

Login admin com `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

### 4.6 Google Login (obrigatório no Console)

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → cliente OAuth **Web**  
2. **Origens JavaScript autorizadas** → adicione:
   ```
   https://SEU_IP.sslip.io
   http://localhost:5173
   ```
3. Se existir **URIs de redirecionamento**, use o mesmo host `https://SEU_IP.sslip.io`  
4. Confirme `GOOGLE_CLIENT_ID` no `.env` da EC2 e reinicie o backend se mudou

---

## Parte 5 — Domínio próprio (opcional)

Se depois comprar um domínio (Registro.br etc.):

1. Registro **A** → IP da EC2  
2. No `.env`: `PUBLIC_HOST=www.sualoja.com.br` e URLs/CORS com `https://www.sualoja.com.br`  
3. Rebuild:

```bash
docker compose -f docker-compose.yml -f docker-compose.aws.yml up -d --build
```

---

## Parte 6 — Atualizar a loja depois

```bash
cd ~/atelie-gg
git pull
docker compose -f docker-compose.yml -f docker-compose.aws.yml up -d --build
```

---

## Checklist

- [ ] Região São Paulo (se possível)  
- [ ] AMI e tipo de instância compatíveis (x86+`t3.micro` **ou** Arm+`t4g.micro`)  
- [ ] Chave `.pem` salva  
- [ ] Portas 22, 80, 443 no Security Group  
- [ ] Disco ≥ 20 GiB + swap 2G  
- [ ] Docker + Compose ok  
- [ ] Supabase no `.env` com `DB_SSL_MODE=require`  
- [ ] `PUBLIC_HOST=SEU_IP.sslip.io` + CORS/MP em `https://...`  
- [ ] `docker compose ... -f docker-compose.aws.yml up -d --build` sem erro  
- [ ] Site abre em `https://SEU_IP.sslip.io`  
- [ ] Origem Google OAuth = mesmo HTTPS  
- [ ] Admin loga e cadastra produto  

---

## Problemas comuns nesta EC2 free

| Sintoma | O que fazer |
|---------|-------------|
| Instância mata o Java / OOM | Confirme o swap; reduza uso; no longo prazo use instância maior (paga) ou Oracle Ampere |
| `Permission denied (publickey)` | Caminho do `.pem`, usuário `ec2-user`, permissões `icacls` |
| Site não abre | Security Group porta 80 + `docker compose ps` |
| **Produtos aparecem, mas imagens quebradas** | Ver seção **Imagens não carregam** abaixo |
| Build muito lento / trava | Normal em 1 GB; espere; veja `docker logs` e `free -h` |
| Depois de 12 meses começa a cobrar | Pare a instância ou mude de plano; acompanhe o **Billing** da AWS |

### Imagens não carregam

O **Supabase guarda só o caminho** no banco (`/uploads/products/...`). Os **arquivos ficam no disco** do Docker (`uploads_data`). Subir o site na AWS **não copia** as fotos que estavam no seu PC.

**1. Confirme no navegador** (F12 → Network): a URL da imagem dá **404**?

**2. Confira no servidor se o volume tem arquivos:**

```bash
docker exec atelie-gg-backend ls -la /app/uploads/products
```

Se a pasta estiver vazia (ou não existir), as fotos nunca chegaram na EC2.

**3. Opções:**

- **Mais simples:** no admin da loja na AWS, abra cada produto e **envie as imagens de novo**.
- **Migrar do PC:** se as fotos ainda estão no Docker local, copie o volume (ou a pasta `backend/uploads`) para a EC2 e para `/app/uploads` do container.

**4. No `.env` da AWS, deixe:**

```env
VITE_API_URL=
```

(vazio — o nginx já faz proxy de `/uploads`). Se estiver `http://localhost:8080`, as imagens quebram para quem acessa pela internet.

**5. Depois de corrigir o código/nginx, rebuild:**

```bash
docker compose -f docker-compose.yml -f docker-compose.aws.yml up -d --build
```

Parar tudo (sem apagar a máquina):

```bash
cd ~/atelie-gg
docker compose -f docker-compose.yml -f docker-compose.aws.yml down
```

No console AWS: **Parar instância** (Stop) para não gastar horas à toa.

---

## Resumo do que fazer **agora** na sua tela

1. Mudar região para **São Paulo** (se for atender Brasil)  
2. AMI **Amazon Linux 2023 x86_64** + tipo **`t3.micro`** (free)  
   — ou Arm + **`t4g.micro`**  
3. Criar e baixar o **par de chaves**  
4. Abrir portas **22 / 80 / 443**  
5. Disco **20–30 GiB**  
6. **Executar instância**  
7. Seguir este arquivo a partir da **Parte 1 (SSH)**
