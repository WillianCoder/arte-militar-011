# Arte Militar 011 — Loja virtual

> ![Status](https://img.shields.io/badge/status-em%20desenvolvimento-f5c518) ![Versão](https://img.shields.io/badge/vers%C3%A3o-1.3.0-f5c518)

## 📌 Sobre
Site de vendas da **Arte Militar 011**: artigos militares, táticos e de aventura. O cliente navega pelo **painel lateral à esquerda**, escolhe tamanho e cor, monta o pedido e **envia tudo pronto para o WhatsApp Business** da loja. Tem página da **loja física com mapa**, contatos, perguntas frequentes e histórico de pedidos.

🌐 **Site no ar:** https://williancoder.github.io/arte-militar-011/
(publicado automaticamente pelo GitHub Pages a cada alteração na `main` — workflow `.github/workflows/pages.yml`, que publica só a pasta `site/`)

## 📸 Imagens
| Computador | Celular (menu aberto) |
|---|---|
| ![Página inicial no computador com o painel lateral à esquerda](screenshots/inicio-computador.jpg) | ![Menu lateral aberto no celular com as subcategorias de Equipamentos Táticos](screenshots/menu-celular.jpg) |
| ![Página de produto com escolha de cor e botões de pedido](screenshots/produto-computador.jpg) | ![Página inicial no celular](screenshots/inicio-celular.jpg) |

## 🛠️ Painel administrativo
Edite produtos, fotos, preços, banners, categorias, contatos, WhatsApp e textos **sem mexer em código**:

**https://williancoder.github.io/arte-militar-011/admin/** — guia: [docs/PAINEL.md](docs/PAINEL.md)

Você edita, confere na prévia e clica em **Publicar**; em 1 a 3 minutos o site atualiza.

## ✅ Antes de divulgar — troque os dados de exemplo
Tudo isso dá para fazer pelo **painel** (seções *Loja e contatos* e *Produtos*), ou à mão em [`site/js/config.js`](site/js/config.js).

- [ ] `contato.whatsapp` — **seu número do WhatsApp Business** (só números: `55` + DDD + número). Todos os pedidos vão para ele.
- [ ] `contato.whatsappExibicao`, `telefone`, `telefoneExibicao`, `email`, `instagram`
- [ ] `lojaFisica` — endereço, CEP, `enderecoMapa` (o que você digitaria no Google Maps) e horários
- [ ] `produtos.js` — seus produtos e preços reais (os atuais são exemplos)
- [ ] Fotos reais dos produtos ([como colocar](docs/PRODUTOS.md#fotos))

## 🧭 O que editar e onde
O caminho mais fácil para tudo abaixo é o [painel](docs/PAINEL.md). A tabela mostra onde cada coisa fica, caso prefira editar os arquivos.

| Quero mudar… | Arquivo | Guia |
|---|---|---|
| WhatsApp, telefone, e-mail, redes sociais | `site/js/config.js` → `contato` | [Guia de edição](docs/GUIA-DE-EDICAO.md#1-contatos) |
| Endereço, mapa e horários da loja | `site/js/config.js` → `lojaFisica` | [Guia de edição](docs/GUIA-DE-EDICAO.md#2-loja-física-e-mapa) |
| Produtos, preços, fotos, tamanhos, cores | `site/js/produtos.js` | [Produtos](docs/PRODUTOS.md) |
| Fotos reais (qual foto vai em qual produto) | `site/img/produtos/` + `node ferramentas/fotos.js --vincular` | [Lista de fotos](docs/FOTOS.md) |
| Categorias e subcategorias do menu lateral | `site/js/config.js` → `categorias` | [Guia de edição](docs/GUIA-DE-EDICAO.md#5-categorias-do-menu-lateral) |
| Banners da página inicial | `site/js/config.js` → `banners` | [Guia de edição](docs/GUIA-DE-EDICAO.md#4-banners-da-página-inicial) |
| Entregas, pagamentos, desconto Pix, aviso do topo | `site/js/config.js` → `pedidos` | [Guia de edição](docs/GUIA-DE-EDICAO.md#3-pedidos-entrega-pagamento-e-pix) |
| Textos "Sobre", trocas e privacidade | `site/js/config.js` (final do arquivo) | [Guia de edição](docs/GUIA-DE-EDICAO.md#7-textos-institucionais) |
| Cores do site | `site/css/estilo.css` → bloco `:root` | [Guia de edição](docs/GUIA-DE-EDICAO.md#8-cores-e-fontes) |
| Título no Google / prévia no WhatsApp | `site/index.html` (topo) | [Publicar](docs/PUBLICAR.md#google-e-prévia-do-link) |
| ✅ O que falta antes de mostrar ao cliente | — | [Checklist de lançamento](docs/CHECKLIST-LANCAMENTO.md) |
| Nota fiscal (o que o site coleta e como emitir) | Painel → Pedidos e pagamento | [Nota fiscal](docs/NOTA-FISCAL.md) |
| Pagamento pelo site (futuro) | `site/js/pedido.js` → `FINALIZADORES` | [Pagamentos](docs/PAGAMENTOS-FUTURO.md) |

> Dá para editar **direto no GitHub pelo navegador** (abra o arquivo → ícone de lápis → "Commit changes"). Em ~1 minuto o site se atualiza. Passo a passo no [guia de edição](docs/GUIA-DE-EDICAO.md#como-editar-pelo-github-sem-instalar-nada).

## 🛒 Como o cliente compra
1. Navega pelo **menu lateral** (as categorias abrem **no clique**, não ao passar o mouse) ou pela busca.
2. Na página do produto escolhe **tamanho/cor** e a quantidade.
3. **Adicionar ao pedido** → pode continuar comprando. Ou **Comprar agora pelo WhatsApp** (um produto só).
4. Em **Meu pedido** preenche nome, telefone, entrega (retirada, Correios ou motoboy — o CEP preenche o endereço sozinho) e forma de pagamento preferida.
5. **Enviar pedido pelo WhatsApp** → abre o WhatsApp com a mensagem pronta e organizada em blocos:
   - **Resumo:** número do pedido, quantos produtos diferentes e unidades, total, entrega e pagamento.
   - **Produtos:** para cada item, nome, **código** (ex.: `CAL-001`), categoria, tamanho/cor, quantidade × preço, preço antigo se estava em promoção, uma frase de descrição e o link do produto.
   - **Valores:** subtotal, economia nas promoções, desconto Pix, frete e **total**.
   - **Cliente, entrega** (endereço completo), **pagamento** e **observações**.

   Pedidos muito grandes saem numa versão compacta (sem a frase e o link de cada item), para caber no WhatsApp. Você confirma frete e pagamento por lá.

Exemplo da mensagem que chega para você (o cliente pode juntar quantos produtos quiser; antes de enviar ele vê essa prévia no site, e depois um resumo igual na tela de confirmação):
```
*PEDIDO AM011-261004-0547*
Arte Militar 011 | 04/10/2026 14:30

*RESUMO*
2 produtos diferentes | 3 unidades
Total: *R$ 598,21* + frete
Entrega: Envio pelos Correios / transportadora
Pagamento: Pix

------------------------------
*PRODUTOS*

*1. Coturno Tático Cano Alto*
Cód. CAL-001 | Calçados > Coturnos
Tamanho: 42 | Cor: Preto
1 un. x R$ 289,90 = *R$ 289,90* (de R$ 349,90 cada)
Couro e nylon, solado antiderrapante e palmilha anatômica.
https://williancoder.github.io/arte-militar-011/#/produto/coturno-tatico-cano-alto

*2. Calça Tática Rip-Stop*
Cód. VES-003 | Vestuário > Calças Táticas
Tamanho: 42 | Cor: Caqui
2 un. x R$ 169,90 = *R$ 339,80* (de R$ 199,90 cada)
8 bolsos, elastano para mobilidade e reforço nos joelhos.
https://williancoder.github.io/arte-militar-011/#/produto/calca-tatica-ripstop

------------------------------
*VALORES*
Produtos (3 unidades): R$ 629,70
Economia nas promoções: R$ 120,00
Desconto Pix (5%): -R$ 31,49
Frete: a combinar
*TOTAL DOS PRODUTOS: R$ 598,21* + frete

------------------------------
*CLIENTE*
Nome: Fulano de Tal
WhatsApp: (11) 98765-4321

*ENTREGA*
Envio pelos Correios / transportadora
Praça da Sé, 100
Sé - São Paulo/SP
CEP 01001-000

*PAGAMENTO*
Pix

*OBSERVAÇÕES*
Entregar à tarde

------------------------------
Próximo passo: a loja confirma o estoque, o frete e o pagamento por aqui.
```

## 🗺️ Páginas
Início (banners, categorias, destaques, ofertas, lançamentos, loja física, como comprar) · Categoria com filtros (subcategoria, cor, disponíveis, ordenação) · Produto · Busca · Ofertas · Lançamentos · Mais vendidos · Todos · Meu pedido · Pedido enviado · Meus pedidos · Loja física (mapa, Google Maps, Waze, horários) · Contato (com formulário que manda para o WhatsApp) · Como comprar (FAQ) · Trocas · Sobre · Privacidade · Página 404.

## 🛠️ Tecnologias
HTML, CSS e JavaScript puros — **sem framework, sem instalação, sem servidor**. Carrega rápido até em 3G e funciona no GitHub Pages de graça. Ilustrações dos produtos em SVG (desenhadas em código), mapa do Google Maps incorporado e busca de CEP pelo [ViaCEP](https://viacep.com.br).

## 📂 Estrutura
```
arte-militar-011/
├── README.md               # esta página
├── LICENSE
├── .github/workflows/      # publicação no GitHub Pages + testes
├── meta.json / CHANGELOG.md
├── docs/
│   ├── PAINEL.md           # ★ como usar o painel administrativo
│   ├── NOTA-FISCAL.md      # nota fiscal explicada de forma simples
│   ├── GUIA-DE-EDICAO.md   # como mudar cada coisa do site (à mão)
│   ├── PRODUTOS.md         # cadastrar produtos e fotos
│   ├── PAGAMENTOS-FUTURO.md# plano para cobrar pelo site
│   ├── PUBLICAR.md         # domínio próprio, Google, WhatsApp Business
│   ├── PESQUISA-REFERENCIAS.md # lojas analisadas e decisões
│   └── FOTOS.md            # lista de conferência das fotos (gerada)
├── ferramentas/fotos.js    # liga as fotos aos produtos pelo código
├── site/                   # ← o site (é isso que vai para o ar)
│   ├── index.html
│   ├── admin/              # ★ painel administrativo (index.html, admin.js, admin.css)
│   ├── css/estilo.css      # visual (cores no topo)
│   ├── js/config.js        # ★ dados da loja
│   ├── js/produtos.js      # ★ catálogo
│   ├── js/pedido.js        # cálculo do pedido + mensagem do WhatsApp
│   ├── js/ilustracoes.js   # desenhos dos produtos e ícones
│   ├── js/app.js           # telas e navegação
│   ├── js/validar.js       # regras que o painel confere antes de publicar
│   ├── js/serializar.js    # grava config.js/produtos.js (painel e ajudante de fotos)
│   └── img/                # fotos (produtos/, banners/), ícone, imagem de compartilhamento
├── tests/                  # testes automáticos (rodam no GitHub a cada alteração)
└── screenshots/            # imagens deste README
```

## ▶️ Como abrir no computador
- **Mais simples:** dê dois cliques em `site/index.html`.
- **Igual ao site no ar** (recomendado para testar o mapa e o CEP):
  ```bash
  cd site
  python -m http.server 8000
  # abra http://localhost:8000
  ```

## 🧪 Testes
Conferem o catálogo (categoria existe? preço é número? foto existe? cor cadastrada?) e o pedido (valores, Pix, mensagem do WhatsApp).
```bash
node --test tests/*.test.js
```
Se você errar algo ao editar um produto, o teste diz qual produto e o que está errado. Eles também rodam sozinhos no GitHub (aba **Actions**).

## 📊 Status
Versão 1.3.0 pronta para uso — faltam os dados reais da loja (veja o checklist acima). Histórico no [CHANGELOG](CHANGELOG.md).

## 🔮 Próximas melhorias
- [ ] Fotos reais dos produtos
- [ ] Domínio próprio (ex.: `artemilitar011.com.br`) — [como fazer](docs/PUBLICAR.md#domínio-próprio)
- [ ] Pagamento pelo site + cálculo de frete — [plano](docs/PAGAMENTOS-FUTURO.md)

## 🐛 Problemas conhecidos
- O histórico "Meus pedidos" fica salvo só no aparelho/navegador do cliente (não há banco de dados — de propósito, por enquanto).
- Como as páginas usam `#/` no endereço, o Google indexa melhor a página inicial do que cada produto. Se SEO de produto virar prioridade, ver [Publicar](docs/PUBLICAR.md#google-e-prévia-do-link).

## 📄 Licença
Código sob a licença [MIT](LICENSE). Marcas e fotos de fabricantes pertencem aos seus donos.
