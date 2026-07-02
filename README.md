# Guia: Como Hospedar no GitHub Pages de Graça com Planilha Google Sheets

Este guia prático ensina passo a passo como colocar seu Bolão Brasil 2026 no ar usando o **GitHub Pages** (gratuito) e salvando todos os palpites, pagamentos, regulamento e acúmulos diretamente em uma planilha do **Google Sheets**!

---

## Passo 1: Configurar a Planilha do Google Sheets

1. Acesse o [Google Planilhas](https://sheets.google.com) e crie uma nova planilha em branco.
2. Renomeie a planilha para algo como `Bolão Brasil 2026`.
3. Crie exatamente **3 abas** nessa planilha de acordo com os nomes e cabeçalhos abaixo (atenção à maiúsculas e minúsculas):

### Aba 1: `Matches` (Confrontos)
Na célula **A1 até L1**, digite exatamente as seguintes colunas como cabeçalho:
`id` | `teamA` | `teamAFlag` | `teamB` | `teamBFlag` | `date` | `time` | `stadium` | `round` | `resultGoalsA` | `resultGoalsB` | `status`

### Aba 2: `Predictions` (Palpites)
Na célula **A1 até H1**, digite exatamente as seguintes colunas como cabeçalho:
`id` | `matchId` | `name` | `whatsapp` | `goalsA` | `goalsB` | `statusPix` | `createdAt`

### Aba 3: `Settings` (Configurações Gerais)
Na célula **A1 e B1**, defina o seguinte cabeçalho:
`key` | `value`

---

## Passo 2: Implantar o Google Apps Script (Nosso Banco de Dados)

1. Com a planilha aberta, vá no menu superior em **Acessórios** (ou **Extensões**) > **Apps Script**.
2. Apague qualquer código gerado automaticamente por lá.
3. Abra o arquivo `google-apps-script.gs` contido na raiz deste projeto, copie **todo o conteúdo** e cole dentro do editor do Apps Script.
4. Clique no ícone de disquete (Salvar projeto).
5. Clique no botão azul **Implantar** (ou **Deploy**) no canto superior direito e selecione **Nova implantação**.
6. No ícone de engrenagem à esquerda, mude o tipo para **App da Web** (Web App).
7. Configure as opções exatamente assim:
   * **Descrição:** `Banco Bolao`
   * **Executar como:** `Me` (Sua conta Google / Você mesmo)
   * **Quem tem acesso:** `Qualquer pessoa` (Anyone) - *Isso é necessário para o app enviar os palpites.*
8. Clique em **Implantar**. O Google pedirá que você autorize permissões na sua conta. Clique em avançar e conceda o acesso com segurança.
9. Ao concluir, o Google gerará uma **URL do App da Web** (terminada em `/exec`). **COPIE ESSA URL**, pois ela será a conexão oficial do seu site!

---

## Passo 3: Testar e Configurar no Código

Antes de hospedar no GitHub, você pode testar localmente se a comunicação já está ativa:
1. Abra ou crie seu arquivo `.env` local.
2. Adicione a variável apontando para a sua URL do Apps Script:
   ```env
   VITE_SHEETS_API_URL="COLE_AQUI_A_SUA_URL_DO_GOOGLE_APPS_SCRIPT"
   ```
3. Ao recarregar a sua aplicação com essa variável ativa, todos os palpites, novos confrontos adicionados na aba Gerenciar e as parametrizações do PIX serão lidos e salvos na sua planilha em tempo real!

---

## Passo 4: Hospedar no GitHub Pages de Graça

O site já foi configurado para suportar links relativos (`base: "./"` no arquivo `vite.config.ts`), facilitando a hospedagem em qualquer subpasta do GitHub.

### Alternativa A: Usando o comando automatico gh-pages (Mais fácil)

1. Caso não tenha o Git configurado no projeto, inicie e faça o commit da sua aplicação em um repositório seu do GitHub:
   ```bash
   git init
   git add .
   git commit -m "commit inicial"
   git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPOSITORIO.git
   git branch -M main
   git push -u origin main
   ```
2. Instale o pacote utilitário para deploy no GitHub Pages:
   ```bash
   npm install gh-pages --save-dev
   ```
3. Abra seu arquivo `package.json` e adicione a seguinte propriedade no primeiro nível do JSON:
   ```json
   "homepage": "https://SEU_USUARIO.github.io/NOME_DO_REPOSITORIO",
   ```
4. Ainda no `package.json`, adicione esses dois scripts na lista `"scripts"`:
   ```json
   "predeploy": "npm run build",
   "deploy": "gh-pages -d dist"
   ```
5. Agora para publicar, basta rodar no seu terminal do computador:
   ```bash
   npm run deploy
   ```
   *Pronto! Em alguns minutos seu site estará no ar no link da sua homepage!*

### Alternativa B: Usando GitHub Actions (Sem instalar nada)

Se você preferir que o próprio GitHub compile e faça deploy toda vez que enviar código para a branch `main`:
1. No seu repositório do GitHub, vá em **Settings** > **Pages**.
2. Em **Build and deployment** > **Source**, altere para **GitHub Actions**.
3. Crie um arquivo no caminho `.github/workflows/deploy.yml` com as instruções padrão de build do Vite e deploy para a página em questão.

---

## Como configurar o link da Planilha no GitHub Pages ativo?

Como o site rodará estático no navegador do participante, declare a URL de conexão à sua Planilha Google de duas maneiras possíveis:

1. **Através de arquivo local:** Crie um arquivo `.env` antes do build com `VITE_SHEETS_API_URL=...` para que fique embutido no código compilado.
2. **Direto no terminal de publicação:** Ao subir, garanta que a variável esteja exportada na máquina ou no fluxo de build.
