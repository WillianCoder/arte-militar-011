/* =====================================================================
   ARTE MILITAR 011 — GRAVAÇÃO DOS ARQUIVOS DE DADOS
   ---------------------------------------------------------------------
   Gera o texto de config.js e produtos.js a partir dos dados.
   Usado pelo painel administrativo (site/admin/) e pelo ajudante de
   fotos (ferramentas/fotos.js), para que os dois gravem igual.
   O site em si não precisa deste arquivo.
   ===================================================================== */
(function (raiz) {
  "use strict";

  var CABECALHO_CONFIG = [
    "/* =====================================================================",
    "   ARTE MILITAR 011 — CONFIGURAÇÃO DA LOJA",
    "   ---------------------------------------------------------------------",
    "   O jeito fácil de editar é pelo PAINEL: <endereço do site>/admin/",
    "   Também dá para editar aqui (formato JSON: textos entre aspas, vírgula",
    "   entre os itens). Guia: docs/GUIA-DE-EDICAO.md",
    "",
    "   nome, slogan, descricao ... dados gerais da loja",
    "   contato .................. WhatsApp (55 + DDD + número), telefone, e-mail, redes",
    "   lojaFisica ............... endereço, CEP, enderecoMapa (texto do Google Maps), horários",
    "   pedidos .................. entregas, pagamentos, descontoPix (%), avisoTopo",
    "   banners .................. carrossel da página inicial",
    "   categorias ............... menu lateral (id sem acento/espaço + subcategorias)",
    "   cores .................... cores das variações (\"Nome\": \"#código\")",
    "   tema ..................... cores do site inteiro (paleta + 6 cores) — veja js/tema.js",
    "   sobre, politicaTrocas, privacidade, urlSite",
    "   ===================================================================== */"
  ].join("\n");

  var CABECALHO_PRODUTOS = [
    "/* =====================================================================",
    "   ARTE MILITAR 011 — CATÁLOGO DE PRODUTOS",
    "   ---------------------------------------------------------------------",
    "   O jeito fácil de editar é pelo PAINEL: <endereço do site>/admin/",
    "   Também dá para editar aqui (formato JSON). Guia: docs/PRODUTOS.md",
    "",
    "   id ............ identificador único (minúsculas, sem acento, hífens) — vai no link",
    "   codigo ........ código curto, ex.: \"CAL-001\" (pedido do WhatsApp e nome das fotos)",
    "   categoria / subcategoria ... ids do config.js",
    "   preco ......... ex.: 289.9 (ponto, sem aspas) | precoAntigo: 0 = sem promoção",
    "   imagens ....... [\"img/produtos/CAL-001.webp\", ...] — vazio usa a ilustração",
    "   ilustracao .... { tipo, cor } desenho usado quando não há foto",
    "   resumo, descricao, destaques[], especificacoes{}",
    "   variacoes ..... { \"Tamanho\": [\"40\",\"41\"], \"Cor\": [\"Preto\"] }",
    "   disponivel .... true / false (false = Esgotado)",
    "   selos ......... \"destaque\", \"lancamento\", \"oferta\", \"mais-vendido\"",
    "   marca ......... opcional",
    "   ===================================================================== */"
  ].join("\n");

  var ORDEM_PRODUTO = [
    "id", "codigo", "nome", "categoria", "subcategoria", "preco", "precoAntigo", "imagens", "ilustracao",
    "resumo", "descricao", "destaques", "especificacoes", "variacoes", "disponivel", "selos", "marca"
  ];

  /* Mantém sempre a mesma ordem de campos (diferenças pequenas no histórico do GitHub) */
  function ordenarProduto(p) {
    var o = {};
    ORDEM_PRODUTO.forEach(function (k) { if (p[k] !== undefined) o[k] = p[k]; });
    Object.keys(p).forEach(function (k) { if (o[k] === undefined && p[k] !== undefined) o[k] = p[k]; });
    if (o.marca === "") delete o.marca;
    return o;
  }

  function gerarConfigJs(loja) {
    return CABECALHO_CONFIG + "\n\nwindow.LOJA = " + JSON.stringify(loja, null, 2) + ";\n";
  }

  function gerarProdutosJs(produtos) {
    return CABECALHO_PRODUTOS + "\n\nwindow.PRODUTOS = " + JSON.stringify(produtos.map(ordenarProduto), null, 2) + ";\n";
  }

  /* Lê o texto de config.js / produtos.js e devolve os dados (sem tocar na página) */
  function lerDados(textoConfig, textoProdutos) {
    var janela = {};
    /* eslint-disable no-new-func */
    if (textoConfig) new Function("window", textoConfig)(janela);
    if (textoProdutos) new Function("window", textoProdutos)(janela);
    return { loja: janela.LOJA, produtos: janela.PRODUTOS };
  }

  var API = { gerarConfigJs: gerarConfigJs, gerarProdutosJs: gerarProdutosJs, lerDados: lerDados, ordenarProduto: ordenarProduto };
  raiz.SERIALIZAR = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
