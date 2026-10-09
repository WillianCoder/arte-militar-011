# Publicar e divulgar

## Onde o site está no ar
Este repositório publica a pasta `site/` no **GitHub Pages** automaticamente (workflow `.github/workflows/pages.yml`) sempre que algo entra na branch `main` — e só publica se os testes passarem:

**https://williancoder.github.io/arte-militar-011/**

Não precisa fazer nada: editou e salvou na `main` → em ~1 minuto o site atualiza. Acompanhe na aba **Actions**.

> O navegador pode guardar a versão antiga por alguns minutos. Use **Ctrl + F5** (ou aba anônima) para ver na hora.

**Primeira vez:** em **Settings → Pages**, confira se *Source* está como **GitHub Actions** (o workflow tenta ativar sozinho).

## Painel administrativo
Fica em **/admin/** do site (ex.: `https://williancoder.github.io/arte-militar-011/admin/`). Ele publica pelo mesmo caminho: grava no GitHub e o workflow põe no ar. Guia: [PAINEL.md](PAINEL.md).

## Endereço sem "github" (grátis) e repositório privado
Objetivo: o cliente vê só `artemilitar011.pages.dev` (ou `artemilitar011.com.br`) e ninguém consegue achar o código. O painel continua funcionando igual.

**1. Conta grátis na Cloudflare** → https://dash.cloudflare.com/sign-up

**2. Criar o site ligado a este repositório** (passo a passo oficial: https://developers.cloudflare.com/pages/get-started/git-integration/)
- No painel da Cloudflare: **Workers & Pages → Create → Pages → Connect to Git**.
- Escolha **GitHub**, autorize e marque **Only select repositories → `arte-militar-011`** (só este).
- Configure assim:
  | Campo | Valor |
  |---|---|
  | Project name | `artemilitar011` (vira `artemilitar011.pages.dev`) |
  | Production branch | `main` |
  | Framework preset | `None` |
  | Build command | *(deixe vazio)* |
  | Build output directory | `site` |
- **Save and Deploy**. Em ~1 minuto o site está no ar no endereço novo. Cada publicação do painel atualiza sozinha.

**3. Trocar os links do site para o endereço novo**: `urlSite` (Painel → Textos → Endereço do site) e o `og:image` no topo do `site/index.html` (precisa do endereço completo).

**4. Desligar o endereço antigo do GitHub**: https://github.com/WillianCoder/arte-militar-011/settings/pages → **Unpublish site**. Depois apague o arquivo `.github/workflows/pages.yml` (os testes continuam no `testes.yml`).

**5. Deixar o repositório privado**: https://github.com/WillianCoder/arte-militar-011/settings → fim da página (**Danger Zone**) → **Change visibility → Make private**.
- O painel continua funcionando (a chave de acesso já é deste repositório).
- A Cloudflare continua publicando (ela tem acesso pelo passo 2).
- Ajuda oficial: https://docs.github.com/pt/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility

> Ordem importa: primeiro a Cloudflare no ar (passo 2), depois privado (passo 5). No plano grátis do GitHub, repositório privado não publica no GitHub Pages, então fazendo ao contrário o site sai do ar até a Cloudflare entrar.

### Domínio próprio `.com.br` (opcional, cerca de R$ 40 por ano)
É o domínio mais barato que passa confiança no Brasil. Um `.com` sai mais caro (perto de US$ 10 por ano).
1. Registre em https://registro.br (precisa de CPF ou CNPJ; pode estar no nome do dono da loja).
2. No projeto da Cloudflare: **Custom domains → Set up a custom domain** → `artemilitar011.com.br`. A Cloudflare vai pedir para adicionar o domínio na conta (plano **Free**) e mostrar **2 servidores DNS** (ex.: `xxx.ns.cloudflare.com`). Guia: https://developers.cloudflare.com/pages/configuration/custom-domains/
3. No registro.br: **seu domínio → DNS → Alterar servidores DNS** → cole os 2 servidores da Cloudflare → salvar.
4. Espere a ativação (de minutos a algumas horas). O cadeado (HTTPS) vem sozinho.
5. Troque `urlSite` e `og:image` para `https://artemilitar011.com.br/`.

**Bônus grátis:** e-mail `contato@artemilitar011.com.br` que chega no Gmail da loja, pelo **Email Routing** da Cloudflare: https://developers.cloudflare.com/email-routing/get-started/

## Google e prévia do link
- **Título e descrição no Google:** no topo do `site/index.html` (`<title>` e `<meta name="description">`). Cada página do site também troca o título da aba sozinha.
- **Prévia ao compartilhar no WhatsApp/Instagram:** usa `og:title`, `og:description` e a imagem `site/img/compartilhar.jpg` (1200×630). Para trocar a imagem, substitua o arquivo mantendo o nome. O `og:image` precisa do **endereço completo** (https://...).
- **Dados estruturados:** o site informa ao Google que é uma **Loja** (endereço, telefone, e-mail) e, na página de cada produto, o **Produto** com preço e disponibilidade.
- **Google Search Console** ([search.google.com/search-console](https://search.google.com/search-console)): adicione o site e envie o endereço para indexação.
- **Perfil da Empresa no Google** (antigo Google Meu Negócio) — o mais importante para loja física: aparece no Google Maps, com fotos, horários, avaliações e botão de WhatsApp. Coloque o link do site lá. Crie em [google.com/business](https://www.google.com/business/).
- Limitação conhecida: como as páginas usam `#/` (ex.: `#/produto/coturno`), o Google trata o site quase como uma página só. Para ranquear **cada produto** no Google, o próximo passo seria gerar uma página HTML por produto (dá para automatizar com um script) — fica como melhoria futura.

## WhatsApp Business — configure para receber os pedidos
- **Perfil comercial:** nome "Arte Militar 011", endereço, horário, e-mail e link do site.
- **Mensagem de saudação** e **mensagem de ausência** (fora do horário).
- **Respostas rápidas** — sugestões:
  - `/recebido` → "Recebemos seu pedido! Já vamos conferir o estoque e calcular o frete. 🪖"
  - `/pix` → "Segue a chave Pix: ... Assim que pagar, envie o comprovante por aqui."
  - `/retirada` → "Seu pedido está separado! Pode retirar em ... no horário ..."
- **Etiquetas:** "Novo pedido", "Aguardando pagamento", "Pago", "Enviado", "Entregue".
- **Catálogo do WhatsApp** (opcional): pode espelhar os principais produtos do site.

## Como testar no computador
```bash
cd site
python -m http.server 8000
```
Abra http://localhost:8000. (Abrir o `index.html` com dois cliques também funciona.)

## Checklist de lançamento
- [ ] Dados reais no `config.js` (WhatsApp, telefone, e-mail, endereço, horários)
- [ ] Produtos e preços reais no `produtos.js`
- [ ] Fotos dos principais produtos
- [ ] Testar um pedido completo no celular e conferir a mensagem que chega no WhatsApp Business
- [ ] Testar o mapa e os botões Google Maps/Waze
- [ ] Link do site no Instagram, no Perfil da Empresa no Google e no WhatsApp Business
