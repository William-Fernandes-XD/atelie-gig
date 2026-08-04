# GIG — Moda Feminina

Loja virtual da **GIG — Moda Feminina** (vestidos e moda feminina).

## Como o sistema funciona (visão simples)

Imagine três peças que trabalham juntas:

| Peça | O que faz | Onde fica (produção recomendada) |
|------|-----------|----------------------------------|
| **Loja (React)** | O site que a cliente vê: produtos, carrinho, pagamento | **Vercel** |
| **API (Java)** | O “cérebro”: login, estoque, pedidos, Mercado Pago, frete | **Oracle Cloud Free Tier** |
| **Banco (Supabase)** | Onde ficam salvos produtos, clientes e pedidos | **Supabase** (PostgreSQL) |

```
Cliente no celular/computador
        ↓
  Site na Vercel (React)
        ↓
  API na Oracle (Java)
        ↓
  Banco no Supabase (PostgreSQL)
```

**Guia de hospedagem gratuita (recomendado):** [`docs/README-HOSPEDAGEM-GRATUITA.md`](docs/README-HOSPEDAGEM-GRATUITA.md) — Supabase + Oracle Always Free + Vercel.

**Se for usar AWS EC2 (projeto inteiro na máquina + Supabase):** [`docs/README-HOSPEDAGEM-AWS.md`](docs/README-HOSPEDAGEM-AWS.md).

O restante deste README serve para entender o projeto e rodar **localmente**.

---

## O que você vai precisar

1. Um computador com internet  
2. Conta de e-mail  
3. Cartão de crédito (a Oracle e o Supabase pedem na criação; no plano gratuito **não cobram** o uso básico descrito aqui — confira sempre os termos atuais)  
4. Conta no [Mercado Pago Developers](https://www.mercadopago.com.br/developers/panel/app) (para receber pagamentos)  
5. (Opcional no começo) um domínio, tipo `www.sua-loja.com.br`

**Programas no seu PC (só se for testar na sua máquina):**

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — facilita ligar a loja no computador  
- Ou peça ajuda a alguém técnico só para o primeiro “ligar”

---

## Parte 1 — Criar o banco no Supabase (passo a passo)

O Supabase é o “armário” onde a loja guarda os dados. É gratuito no início.

### 1.1 Criar a conta

1. Abra: **https://supabase.com**  
2. Clique em **Start your project** / **Sign up**  
3. Entre com GitHub ou e-mail  
4. Confirme o e-mail se pedir

### 1.2 Criar o projeto

1. Clique em **New project**  
2. Preencha:
   - **Name:** `atelie-gig` (ou o nome da sua loja)  
   - **Database Password:** invente uma senha **forte** e **anote em um lugar seguro** (você vai colar no arquivo `.env` depois)  
   - **Region:** escolha a mais perto do Brasil (ex.: **South America (São Paulo)** se aparecer; senão a mais próxima da América do Sul)  
3. Clique em **Create new project**  
4. Espere alguns minutos até o projeto ficar **Ready**

> Guarde a senha do banco. Se perder, terá que gerar outra no painel.

### 1.3 Copiar os dados de conexão (importante)

1. No menu esquerdo, vá em **Project Settings** (ícone de engrenagem)  
2. Clique em **Database**  
3. Role até **Connection string** / **Connection info**  
4. Anote estes campos (os nomes podem variar um pouco na tela):

| Campo no painel | O que colocar no arquivo `.env` | Exemplo |
|-----------------|----------------------------------|---------|
| Host | `DB_HOST` | `db.abcdefghijk.supabase.co` |
| Port (Direct / Session) | `DB_PORT` | `5432` |
| Database name | `DB_NAME` | `postgres` |
| User | `DB_USER` | `postgres` |
| Password | `DB_PASSWORD` | a senha que você criou |

5. No arquivo `.env` da loja, use também:

```env
DB_SSL_MODE=require
DB_POOL_SIZE=5
```

**Recomendação para esta loja (Java):**

- Use a conexão **Direct** (porta **5432**) ou o pooler em modo **Session**  
- Evite o modo “Transaction” do pooler com esta API Java (pode dar erro estranho)  
- Com poucos clientes ao mesmo tempo, porta **5432** + `DB_POOL_SIZE=5` é suficiente

### 1.4 Você precisa criar tabelas no site do Supabase?

**Não.** Quando o Java (backend) ligar pela primeira vez, ele cria sozinho as tabelas (sistema chamado Flyway).

Você só precisa:

1. Preencher o `.env` com os dados do Supabase  
2. Ligar o backend (na Oracle ou no seu PC)  
3. Na primeira subida, o banco recebe a estrutura da loja automaticamente

### 1.5 (Opcional) Ver se o banco está vazio / ver tabelas depois

1. No Supabase, menu **Table Editor**  
2. Depois que o sistema subir uma vez, você verá tabelas como `users`, `products`, `orders`, etc.

### 1.6 Segurança básica no Supabase

Para esta arquitetura (**Java fala com o banco; o site React NÃO acessa o banco direto**):

- **Não** compartilhe a senha do banco com ninguém  
- **Não** coloque a senha no Instagram, WhatsApp ou no código público do GitHub  
- O arquivo `.env` **nunca** deve ser enviado para o GitHub (já está protegido no projeto)

Você **não precisa** configurar “Row Level Security” agora. Quem controla o acesso é o Java.

---

## Parte 2 — Criar o servidor na Oracle Cloud Free Tier (passo a passo)

A Oracle oferece um servidor **Always Free** (sempre gratuito, dentro dos limites do plano). É nele que o site e a API vão rodar 24 horas.

### 2.1 Criar a conta Oracle Cloud

1. Abra o link oficial: **https://www.oracle.com/cloud/free/**  
2. Clique em **Start for free** / **Começar gratuitamente**  
3. Preencha país **Brazil**, e-mail e dados pessoais/empresa  
4. Vai pedir **cartão de crédito** para validar a conta (uso free normalmente não gera cobrança se você ficar no Always Free — leia os avisos da tela)  
5. Confirme o e-mail e faça login no **Oracle Cloud Console**:  
   **https://cloud.oracle.com**

> Se a criação falhar, tente outro navegador, outro horário, ou outra região home no cadastro. Contas free às vezes demoram ou pedem reenvio de documentos.

### 2.2 Escolher a região

No canto superior do console, veja a **Region**.  
Prefira uma região com boa disponibilidade do plano free (ex.: **South America East (Sao Paulo)** se disponível na sua conta, ou a que a Oracle liberou no cadastro).

**Dica:** depois de criar a conta, a “Home Region” costuma ficar fixa. Anote qual é.

### 2.3 Criar a máquina virtual (Compute Instance)

Você precisa de uma máquina **Ampere (ARM)** do Always Free — é a que tem memória suficiente para Java + site.

1. No menu ☰ (hambúrguer), vá em **Compute** → **Instances**  
2. Clique em **Create instance**  
3. **Name:** `atelie-gig-server`  
4. Em **Image and shape**:
   - Image: **Canonical Ubuntu 22.04** (ou 24.04)  
   - Shape: clique em **Change shape**  
   - Escolha **Ampere** / **VM.Standard.A1.Flex**  
   - Sugestão para começar: **2 OCPUs** e **12 GB de memória** (ou o máximo free que sua conta permitir, até o limite Always Free)  
5. Em **Networking**:
   - Deixe criar VCN nova se for a primeira vez  
   - Marque atribuir IP público (**Assign a public IPv4 address**)  
6. Em **Add SSH keys**:
   - Escolha **Generate a key pair for me**  
   - Baixe a chave privada (**Save private key**) e guarde com carinho (é a “chave da porta” do servidor)  
7. Clique em **Create**

Se aparecer **Out of capacity** (sem capacidade):

- Tente outra Availability Domain  
- Tente reduzir OCPU/memória  
- Tente mais tarde ou outra região (se sua conta permitir)  
- Sem Ampere com RAM boa, o plano free AMD de 1 GB **não serve** bem para esta loja

### 2.4 Abrir as portas (para o site funcionar na internet)

1. Menu ☰ → **Networking** → **Virtual Cloud Networks**  
2. Entre na VCN criada → **Security Lists** → **Default Security List**  
3. **Add Ingress Rules** e crie regras para:

| Fonte (Source CIDR) | Protocolo | Porta | Para quê |
|---------------------|-----------|-------|----------|
| `0.0.0.0/0` | TCP | **22** | Acesso SSH (administração) |
| `0.0.0.0/0` | TCP | **80** | Site HTTP |
| `0.0.0.0/0` | TCP | **443** | Site HTTPS (cadeado) |
| `0.0.0.0/0` | TCP | **8080** | API (pode fechar depois se usar só proxy) |

Salve cada regra.

### 2.5 Anotar o IP público

1. Volte em **Compute** → **Instances**  
2. Clique na instância `atelie-gig-server`  
3. Copie o **Public IP address** (exemplo: `129.146.x.x`)  
4. Guarde esse IP — é o endereço temporário da loja até ter domínio

### 2.6 Entrar no servidor (SSH)

No **Windows**, use o PowerShell (ou o programa [PuTTY](https://www.putty.org/)).

Exemplo (troque o caminho da chave e o IP):

```powershell
ssh -i "C:\Users\SEU_USUARIO\Downloads\ssh-key-xxxx.key" ubuntu@SEU_IP_PUBLICO
```

Na primeira vez, digite `yes` quando perguntar se confia no servidor.

Se der erro de permissão da chave no Windows, no PowerShell:

```powershell
icacls "C:\caminho\da\chave.key" /inheritance:r
icacls "C:\caminho\da\chave.key" /grant:r "$($env:USERNAME):(R)"
```

### 2.7 Preparar o servidor (comandos para colar)

Depois de entrar no SSH, cole **um bloco de cada vez** e espere terminar:

```bash
sudo apt update && sudo apt upgrade -y
```

```bash
sudo apt install -y ca-certificates curl git
```

Instalar Docker:

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
```

Saia e entre de novo no SSH para o Docker valer:

```bash
exit
```

(conecte novamente com o mesmo `ssh -i ...`)

Teste:

```bash
docker --version
docker compose version
```

### 2.8 Colocar o código da loja no servidor

**Opção A — com GitHub (recomendado)**  
Se o projeto estiver no GitHub:

```bash
cd ~
git clone https://github.com/SEU_USUARIO/atelie-gg.git
cd atelie-gg
```

**Opção B — enviar pelo computador**  
Use um programa como [WinSCP](https://winscp.net/) para copiar a pasta do projeto para `/home/ubuntu/atelie-gg` (sem enviar a pasta `node_modules` se existir).

### 2.9 Criar o arquivo de senhas (`.env`) no servidor

```bash
cd ~/atelie-gg
cp .env.example .env
nano .env
```

No editor `nano`:

- Preencha **todos** os dados do Supabase (`DB_HOST`, `DB_PASSWORD`, `DB_SSL_MODE=require`, etc.)  
- Preencha Mercado Pago, e-mail, senha do admin, `JWT_SECRET` (uma frase longa aleatória)  
- Em `CORS_ALLOWED_ORIGINS`, coloque temporariamente: `http://SEU_IP_PUBLICO:5173`  
- Deixe `VITE_API_URL=` vazio  

Salvar no nano: `Ctrl + O`, Enter, depois sair: `Ctrl + X`.

### 2.10 Ligar a loja na Oracle

Ainda na pasta do projeto:

```bash
cd ~/atelie-gg
docker compose up -d --build
```

Espere alguns minutos na primeira vez (baixa imagens e monta o Java).

Ver se está rodando:

```bash
docker compose ps
docker logs atelie-gg-backend --tail 50
```

No log, procure mensagens de sucesso (sem erro de conexão com o banco).

### 2.11 Testar no navegador

Abra:

- Loja: `http://SEU_IP_PUBLICO:5173`  
- API (só no servidor / localhost): `http://127.0.0.1:8080`  
  Em produção (`APP_ENV=production`) o Swagger fica desligado.

Faça login no admin com o e-mail/senha do `.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`).

### 2.12 (Recomendado) Domínio + HTTPS (cadeado)

Quando tiver um domínio (Registro.br, Hostinger, etc.):

1. Crie um registro **A** apontando para o IP da Oracle  
2. No servidor, use um proxy (ex.: Caddy ou Nginx) nas portas 80/443  
3. Atualize no `.env`:
   - `CORS_ALLOWED_ORIGINS=https://www.seudominio.com.br`  
   - URLs do Mercado Pago (`MERCADOPAGO_SUCCESS_URL`, etc.)  
4. No painel do Mercado Pago, configure o webhook:  
   `https://www.seudominio.com.br/api/orders/webhook/mercadopago`  
   Copie a **assinatura secreta** do webhook para `MERCADOPAGO_WEBHOOK_SECRET` no `.env`.  
5. No `.env` da Oracle use `APP_ENV=production`.  
6. Rebuild do frontend se necessário:  
   `docker compose up -d --build frontend`

> Se precisar de ajuda só nesta parte do domínio/HTTPS, chame alguém técnico uma vez — o resto do guia você já consegue sozinho.

---

## Parte 3 — Arquivo `.env` (o que cada coisa significa)

Na raiz do projeto existe o modelo `.env.example`.  
Copie para `.env` e preencha:

```bash
cp .env.example .env
```

| Variável | Em português simples |
|----------|----------------------|
| `DB_HOST` | Endereço do banco Supabase |
| `DB_PORT` | Porta do banco (geralmente 5432) |
| `DB_NAME` | Nome do banco (`postgres` no Supabase) |
| `DB_USER` | Usuário (`postgres`) |
| `DB_PASSWORD` | Senha do banco (a que você anotou) |
| `DB_SSL_MODE` | No Supabase: `require` |
| `DB_POOL_SIZE` | Quantas “filas” no banco (comece com 5) |
| `JWT_SECRET` | Senha secreta interna do sistema (longa e aleatória) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Login do painel da loja |
| `MERCADOPAGO_*` | Credenciais para receber PIX/cartão |
| `MAIL_*` | E-mail para “esqueci minha senha” |
| `SHIPPING_ORIGIN_CEP` | CEP de onde vocês postam as encomendas |
| `CORS_ALLOWED_ORIGINS` | Endereço do site permitido a falar com a API |
| `VITE_API_URL` | Deixe vazio no Docker/Oracle |

---

## Parte 4 — Usar no seu computador (teste local)

### Com Supabase (igual produção, banco na nuvem)

1. Instale o [Docker Desktop](https://www.docker.com/products/docker-desktop/) e deixe ligado  
2. Copie `.env.example` → `.env` e preencha com o Supabase (`DB_SSL_MODE=require`)  
3. Na pasta do projeto:

```bash
docker compose up -d --build
```

4. Abra http://localhost:5173  

### Sem Supabase (banco só na sua máquina)

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml --profile local-db up -d --build
```

Nesse modo o Postgres sobe no Docker local (porta **5434**). Ajuste o `.env` com `DB_SSL_MODE=disable` conforme o comentário do `.env.example`.

---

## Parte 5 — Checklist rápido “loja no ar”

- [ ] Conta Supabase criada e senha do banco anotada  
- [ ] Projeto Supabase na região mais perto possível  
- [ ] Conta Oracle Free criada  
- [ ] VM Ampere criada com IP público  
- [ ] Portas 22, 80, 443 (e 5173/8080 se necessário) abertas  
- [ ] Docker instalado no servidor  
- [ ] Código da loja no servidor  
- [ ] Arquivo `.env` preenchido (Supabase + Mercado Pago + admin)  
- [ ] `docker compose up -d --build` sem erro  
- [ ] Site abre no navegador  
- [ ] Login admin funciona  
- [ ] Produto de teste cadastrado  
- [ ] Pagamento de teste no Mercado Pago validado  

---

## Estrutura das pastas

```
atelie-gg/
├── backend/                 → API Java (Spring Boot)
├── frontend/                → Loja + painel admin (React)
├── docker-compose.yml       → Sobe site + API (banco = Supabase)
├── docker-compose.local.yml → Opcional: Postgres local
├── .env.example             → Modelo do arquivo de senhas
└── README.md                → Este guia
```

---

## O que a loja oferece

### Para a cliente
- Catálogo, filtros, página do produto  
- Carrinho e regra de atacado (mais de 3 peças)  
- Checkout, frete e pagamento (Mercado Pago)  
- Meus pedidos / recuperar senha  

### Para a dona da loja (painel admin)
- Dashboard  
- Produtos, categorias, estoque  
- Pedidos e status  
- Usuários (perfil ADMIN)

Perfis: `ADMIN`, `GERENTE`, `ESTOQUISTA`, `CLIENTE`.

---

## Problemas comuns (e o que fazer)

| Situação | O que tentar |
|----------|--------------|
| Backend não sobe / erro de banco | Conferir `DB_HOST`, senha, `DB_SSL_MODE=require` |
| Site não abre pelo IP | Conferir Security List (portas) e se `docker compose ps` mostra containers “Up” |
| Oracle “Out of capacity” | Tentar outra forma Ampere / outro horário / menos OCPU |
| Esqueci senha do admin | No `.env`: `ADMIN_RESET_PASSWORD=true`, reiniciar backend, depois voltar para `false` |
| Pagamento não confirma | Conferir token do Mercado Pago e URL do webhook |
| Supabase “pausou” o projeto free | Entre no painel e restaure o projeto; planos free podem pausar por inatividade |

Ver logs no servidor:

```bash
docker logs atelie-gg-backend --tail 100
docker logs atelie-gg-frontend --tail 50
```

Parar tudo:

```bash
docker compose down
```

---

## Tecnologias (referência)

- **Frontend:** React + Vite + Tailwind  
- **Backend:** Java 21 + Spring Boot  
- **Banco:** PostgreSQL no **Supabase**  
- **Servidor de app:** **Oracle Cloud Free Tier** (Docker)  
- **Pagamentos:** Mercado Pago  

---

## Aviso importante sobre planos gratuitos

Os limites do **Supabase Free** e do **Oracle Always Free** mudam com o tempo.  
Antes de depender deles no dia a dia do negócio, leia a página oficial de cada um e confirme o que está incluído na sua conta.

- Supabase: https://supabase.com/pricing  
- Oracle Free Tier: https://www.oracle.com/cloud/free/  

---

## Suporte útil

- Mercado Pago (docs): https://www.mercadopago.com.br/developers/pt/docs  
- Supabase (docs): https://supabase.com/docs  
- Oracle Free: https://www.oracle.com/cloud/free/  
