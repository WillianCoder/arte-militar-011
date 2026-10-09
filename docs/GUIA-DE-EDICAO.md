# Guia de edição — Arte Militar 011

> **Mais fácil:** quase tudo deste guia dá para fazer pelo [painel administrativo](PAINEL.md), sem abrir arquivo nenhum. Este guia é para quem quiser editar os arquivos à mão.
>
> Os arquivos `config.js` e `produtos.js` são gravados pelo painel no formato **JSON**: os nomes dos campos ficam entre aspas (`"nome": "Arte Militar 011"`). Os exemplos abaixo mostram os campos; ao editar à mão, siga o formato que estiver no arquivo.

Tudo que é **informação da loja** fica em dois arquivos:

| Arquivo | O que tem |
|---|---|
| [`site/js/config.js`](../site/js/config.js) | contatos, endereço, horários, entregas, pagamentos, banners, categorias, cores, textos |
| [`site/js/produtos.js`](../site/js/produtos.js) | os produtos (guia próprio: [PRODUTOS.md](PRODUTOS.md)) |

Os outros arquivos (`app.js`, `pedido.js`, `ilustracoes.js`, `estilo.css`) são o "motor" do site — só mexa neles se quiser mudar o funcionamento ou o visual.

---

## Como editar pelo GitHub (sem instalar nada)
1. Abra o repositório **arte-militar-011** no GitHub e entre em `site/js/`.
2. Clique no arquivo (ex.: `config.js`) e depois no **ícone de lápis** ✏️ ("Edit this file").
3. Faça a alteração.
4. Clique em **Commit changes…** → escreva o que mudou (ex.: "troca número do WhatsApp") → **Commit changes**.
5. Aguarde ~1 minuto e recarregue o site com **Ctrl + F5** (no celular, feche e abra a aba).

> Pelo celular também funciona: app do GitHub ou navegador em modo "site para computador".

Para conferir se ficou tudo certo, veja a aba **Actions** do repositório: ✅ verde = ok; ❌ vermelho = abra o item e leia a mensagem (ela diz o produto e o campo com problema).

## Regras de ouro ao editar
- Texto fica **entre aspas**: `nome: "Arte Militar 011",`
- Cada linha de uma lista termina com **vírgula** — menos a última antes de `}` ou `]`.
- Preço usa **ponto**, sem aspas e sem "R$": `preco: 189.9,` (aparece como R$ 189,90).
- Se precisar usar aspas dentro de um texto, troque por aspas simples por fora: `'Notebook até 15,6"'`.
- Errou e o site ficou em branco? No GitHub, abra o arquivo → **History** → veja a última mudança e desfaça. Ou aperte F12 no navegador → aba **Console**: a mensagem em vermelho mostra o arquivo e a linha.

---

## 1. Contatos
```js
contato: {
  whatsapp: "5511987654321",          // ← SÓ números: 55 + DDD + número
  whatsappExibicao: "(11) 98765-4321",// ← como aparece escrito no site
  telefone: "1130000000",
  telefoneExibicao: "(11) 3000-0000",
  email: "contato@artemilitar011.com.br",
  instagram: "https://instagram.com/artemilitar011", // "" esconde
  facebook: "",
  tiktok: ""
},
```
O `whatsapp` é usado em **todos** os botões e pedidos. Teste depois de trocar: clique em "Chamar no WhatsApp" no site.

## 2. Loja física e mapa
```js
lojaFisica: {
  endereco: "Rua Exemplo, 123 — Centro",
  cidade: "São Paulo — SP",
  cep: "01000-000",
  enderecoMapa: "Rua Exemplo, 123, Centro, São Paulo - SP", // o que você digitaria no Google Maps
  referencia: "Próximo ao metrô Sé",
  horarios: [
    { dias: "Segunda a sexta", horas: "09h às 18h" },
    { dias: "Sábado", horas: "09h às 14h" },
    { dias: "Domingo e feriados", horas: "Fechado" }
  ]
},
```
- O **mapa**, o botão **Google Maps** e o botão **Waze** usam o `enderecoMapa`. Dica: se a loja já está no Google (Perfil da Empresa), use o nome exato dela, ex.: `"Arte Militar 011, São Paulo"` — o mapa mostra o pin com o nome da loja.
- Pode adicionar ou tirar linhas de horário à vontade. O primeiro horário também aparece na página inicial.

## 3. Pedidos: entrega, pagamento e Pix
```js
pedidos: {
  prefixo: "AM011",            // número do pedido: AM011-261004-4821
  entregas: [
    { id: "retirada", nome: "Retirar na loja física", detalhe: "Sem custo — avisamos quando estiver separado." },
    { id: "envio", nome: "Envio pelos Correios / transportadora", detalhe: "Frete calculado e informado pelo WhatsApp." },
    { id: "motoboy", nome: "Motoboy (Grande São Paulo)", detalhe: "Valor combinado pelo WhatsApp." }
  ],
  pagamentos: ["Pix", "Cartão de crédito", "Cartão de débito", "Dinheiro (na retirada)"],
  descontoPix: 5,              // % de desconto no Pix. 0 = não mostra
  avisoTopo: "Enviamos para todo o Brasil • ..." // faixa no topo. "" esconde
},
```
- Entrega com `id: "retirada"` **não pede endereço**; todas as outras pedem (com busca automática do CEP).
- Para remover o motoboy, apague o bloco `{ id: "motoboy", ... },` inteiro.
- O desconto Pix aparece nos cards ("R$ 275,40 no Pix"), no resumo do pedido e na mensagem do WhatsApp.

## 4. Banners da página inicial
```js
banners: [
  {
    titulo: "Pronto para qualquer missão",
    texto: "Coturnos, fardas e equipamentos táticos...",
    botao: "Ver equipamentos",
    link: "#/categoria/equipamentos",   // para onde o botão leva
    imagem: "",                          // ex.: "img/banners/coturnos.jpg"
    ilustracao: { tipo: "colete", cor: "Multicam" } // usada quando não há imagem
  },
  ...
]
```
- **Com foto:** coloque o arquivo em `site/img/banners/` e preencha `imagem`. Use foto **horizontal** (ideal 1600×700 px, até ~250 KB). O site escurece o lado esquerdo sozinho para o texto ficar legível.
- Links úteis para o botão: `#/categoria/ID`, `#/categoria/calcados?sub=coturnos`, `#/produto/ID`, `#/ofertas`, `#/lancamentos`, `#/loja`, `#/contato`.
- Os banners trocam sozinhos a cada 6,5 s (param quando o cliente passa o mouse ou clica nas setas).

## 5. Categorias do menu lateral
```js
{
  id: "calcados",            // usado nos links e nos produtos (sem acento/espaço)
  nome: "Calçados",          // como aparece no menu
  icone: "coturno",          // camisa, coturno, colete, mochila, lanterna, patch
  descricao: "Coturnos, botas táticas e meias para longas jornadas.",
  subcategorias: [
    { id: "coturnos", nome: "Coturnos" },
    { id: "botas", nome: "Botas Táticas" },
    { id: "meias", nome: "Meias" }
  ]
},
```
- **Nova categoria:** copie um bloco `{ ... },` inteiro, cole abaixo e troque `id`, `nome`, `descricao` e as subcategorias. Depois use esse `id` nos produtos.
- **Mudar a ordem do menu:** mude a ordem dos blocos.
- **Renomear:** troque só o `nome` (se trocar o `id`, troque também em todos os produtos daquela categoria — os testes avisam se esquecer).
- Categorias e subcategorias **sem produtos** continuam no menu; o contador mostra 0.
- No menu, as categorias **abrem e fecham no clique** (sem "hover"), e a categoria da página atual já abre sozinha.

## 6. Cores das variações
```js
cores: {
  "Preto": "#1d1f1b",
  "Verde Oliva": "#556b2f",
  "Coyote": "#9c7c52",
  "Multicam": "camo-multicam",       // camuflados especiais já prontos:
  "Camuflado Verde": "camo-verde",   // camo-multicam, camo-verde, camo-urbano
  ...
}
```
Estas são as cores **dos produtos** (o cliente escolhe "Preto", "Coyote"...). As cores **do site** ficam no item 8.

Toda cor usada em `variacoes: { "Cor": [...] }` de um produto precisa existir aqui (o nome tem que ser **idêntico**, com maiúsculas e acentos). Para criar uma cor: `"Vinho": "#5a1f2b",` — pegue o código em [htmlcolorcodes.com](https://htmlcolorcodes.com/pt/).

## 7. Textos institucionais
No final do `config.js`: `sobre`, `politicaTrocas` (lista de frases), `privacidade` e `descricao` (aparece no rodapé e no Google). O `urlSite` é o endereço público do site — troque quando tiver domínio próprio.

## 8. Cores do site (paletas) e fontes
**Pelo painel → Cores do site.** Há 8 paletas prontas, cada uma com uma miniatura da loja para comparar:

| Paleta | Estilo |
|---|---|
| **Militar** (atual) | preto oliva com coyote |
| **Verde Oliva** | verde de campanha com detalhes em areia |
| **Deserto** | marrom escuro e caramelo |
| **Marinha** | azul marinho com dourado |
| **Black Ops** | preto total com laranja tático |
| **Urbano** | grafite com vermelho, estilo policial |
| **Areia Clara** | fundo claro cor de areia com marrom |
| **Campo Claro** | claro e limpo, com verde oliva |

Escolha uma, clique em **Ver prévia** e depois em **Publicar no site**.

**Link de amostra (para mostrar a um cliente):** acrescente `?paleta=` + nome ao endereço, por exemplo `<endereço do site>/?paleta=marinha`. Mostra o site inteiro naquela paleta só para quem abriu o link, com um aviso no topo. Nomes: `militar`, `verde-oliva`, `deserto`, `marinha`, `black-ops`, `urbano`, `areia-clara`, `campo-claro`.

**Ajuste fino:** na mesma tela dá para trocar qualquer uma das 6 cores-base (fundo, cartões, texto, cor principal, cor de apoio, ofertas). O resto (bordas, textos suaves, cor ao passar o mouse, letra em cima dos botões) é **calculado sozinho** a partir delas, por isso tudo continua combinando. Se alguma combinação ficar difícil de ler, o painel avisa na hora.

No arquivo fica assim, em `config.js`:
```json
"tema": {
  "paleta": "marinha",
  "cores": { "fundo": "#0a0f17", "superficie": "#121b28", "texto": "#e6ebf2",
             "destaque": "#d6b25a", "apoio": "#5b8ac2", "oferta": "#d24b3e" }
}
```
- As paletas prontas e as contas de cor ficam em [`site/js/tema.js`](../site/js/tema.js). Para criar uma paleta nova, copie um bloco da lista `PALETAS` e troque nome e cores; o teste `tests/tema.test.js` confere se ela é legível.
- O bloco `:root` do [`site/css/estilo.css`](../site/css/estilo.css) guarda a paleta Militar como reserva (usada se o JavaScript falhar). Não troque cores direto ali: use o painel.
- O verde do WhatsApp não muda com a paleta (é a cor da marca e as pessoas a reconhecem).

Fontes: títulos em **Oswald** e logo em **Black Ops One** (Google Fonts, linha `fonts.googleapis.com` no `index.html`).

## 9. Logo
O logo é o escudo com estrela desenhado no `app.js` (constante `EMBLEMA`) + o nome em texto. Para usar um **logo em imagem**:
1. Salve como `site/img/logo.png` (fundo transparente, ~200 px de altura).
2. No `app.js`, troque a função `logoHtml` por:
   ```js
   function logoHtml() { return '<img src="img/logo.png" alt="Arte Militar 011" style="height:56px">'; }
   ```
3. Troque também o `site/img/favicon.svg` (ícone da aba) se quiser.

## 10. Onde cada coisa aparece
| Informação | Aparece em |
|---|---|
| `contato.whatsapp` | botão flutuante, menu lateral, produto, pedido, contato, rodapé |
| `lojaFisica` | página Loja física, faixa na home, produto ("Retire na loja"), rodapé, FAQ |
| `pedidos.descontoPix` | cards, produto, resumo do pedido, mensagem, benefícios da home |
| `categorias` | menu lateral, home, rodapé, busca, filtros |
| `banners` | carrossel da home |
