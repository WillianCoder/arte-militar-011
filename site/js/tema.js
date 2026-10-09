/* =====================================================================
   ARTE MILITAR 011 — CORES DO SITE (PALETAS)
   ---------------------------------------------------------------------
   O site inteiro sai de só 6 cores (fundo, cartões, texto, principal,
   apoio e ofertas). Todo o resto (bordas, textos suaves, hover, letras
   sobre os botões...) é calculado daqui, para tudo sempre combinar.

   Troque pelo PAINEL → "Cores do site". No config.js fica assim:
     "tema": { "paleta": "militar", "cores": { "fundo": "#0d0f0b", ... } }
   Sem "tema", o site usa a paleta Militar.
   ===================================================================== */
(function (raiz) {
  "use strict";

  /* Ordem e nomes que aparecem no painel */
  var CAMPOS = [
    ["fundo", "Fundo", "Cor de fundo da página"],
    ["superficie", "Cartões", "Fundo dos cartões, do menu e das caixas"],
    ["texto", "Texto", "Cor das letras"],
    ["destaque", "Cor principal", "Botões, preços, menu ativo e detalhes"],
    ["apoio", "Cor de apoio", "Selo \"Novo\", desconto Pix e ícones de confirmação"],
    ["oferta", "Ofertas e alertas", "Selo de oferta, contador do pedido e avisos"]
  ];

  var PALETAS = [
    {
      id: "militar", nome: "Militar", descricao: "Preto oliva com coyote. A cara original da loja.",
      cores: { fundo: "#0d0f0b", superficie: "#161a12", texto: "#ece8da", destaque: "#c9a46a", apoio: "#6f8240", oferta: "#c4452f" },
      // tons finos desenhados à mão (valem só enquanto as 6 cores forem exatamente estas)
      ajustes: {
        "--fundo-lateral": "#10130d", "--superficie-2": "#1d2218", "--linha": "#2b3124", "--linha-2": "#3d4632",
        "--texto-suave": "#a9a891", "--texto-fraco": "#7d7e6a", "--coyote-forte": "#e0bd80", "--oliva-claro": "#93a65a",
        "--oferta-texto": "#f0b2a6", "--sobre-destaque": "#17190f", "--sobre-apoio": "#ffffff"
      }
    },
    {
      id: "verde-oliva", nome: "Verde Oliva", descricao: "Verde de campanha com detalhes em areia.",
      cores: { fundo: "#0e130c", superficie: "#18211a", texto: "#e8ecdc", destaque: "#a9bd6f", apoio: "#c9a46a", oferta: "#d0563b" }
    },
    {
      id: "deserto", nome: "Deserto", descricao: "Marrom escuro e caramelo, clima de operação no deserto.",
      cores: { fundo: "#14100b", superficie: "#201911", texto: "#f2e8d6", destaque: "#dba55e", apoio: "#9a7a4c", oferta: "#c4402f" }
    },
    {
      id: "marinha", nome: "Marinha", descricao: "Azul marinho profundo com dourado.",
      cores: { fundo: "#0a0f17", superficie: "#121b28", texto: "#e6ebf2", destaque: "#d6b25a", apoio: "#5b8ac2", oferta: "#d24b3e" }
    },
    {
      id: "black-ops", nome: "Black Ops", descricao: "Preto total com laranja tático.",
      cores: { fundo: "#0b0b0c", superficie: "#161617", texto: "#ededed", destaque: "#f39a2e", apoio: "#7d8f63", oferta: "#d83c41" }
    },
    {
      id: "urbano", nome: "Urbano", descricao: "Cinza grafite com vermelho, estilo policial.",
      cores: { fundo: "#101214", superficie: "#1a1d21", texto: "#e9ebee", destaque: "#e0574a", apoio: "#7f97ad", oferta: "#f0a53a" }
    },
    {
      id: "areia-clara", nome: "Areia Clara", descricao: "Fundo claro cor de areia com marrom coyote.",
      cores: { fundo: "#f3eee3", superficie: "#fffdf8", texto: "#23251c", destaque: "#8a5a1f", apoio: "#556528", oferta: "#b3361f" }
    },
    {
      id: "campo-claro", nome: "Campo Claro", descricao: "Claro e limpo, com verde oliva.",
      cores: { fundo: "#eef0e7", superficie: "#ffffff", texto: "#1c2216", destaque: "#4b5d1f", apoio: "#8a6630", oferta: "#b0382a" }
    }
  ];

  var PADRAO = PALETAS[0];

  /* ------------------------------ contas de cor ------------------------------ */
  function hexValido(v) { return typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v); }

  function paraRgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function paraHex(rgb) {
    return "#" + rgb.map(function (c) {
      var v = Math.max(0, Math.min(255, Math.round(c)));
      return (v < 16 ? "0" : "") + v.toString(16);
    }).join("");
  }

  /* mistura a com b: t = 0 → a, t = 1 → b */
  function misturar(a, b, t) {
    var x = paraRgb(a), y = paraRgb(b);
    return paraHex([0, 1, 2].map(function (i) { return x[i] + (y[i] - x[i]) * t; }));
  }

  function paraHsl(hex) {
    var c = paraRgb(hex).map(function (v) { return v / 255; });
    var max = Math.max.apply(null, c), min = Math.min.apply(null, c), d = max - min;
    var l = (max + min) / 2, h = 0, s = 0;
    if (d) {
      s = d / (1 - Math.abs(2 * l - 1));
      h = max === c[0] ? ((c[1] - c[2]) / d) % 6 : max === c[1] ? (c[2] - c[0]) / d + 2 : (c[0] - c[1]) / d + 4;
      h *= 60;
    }
    return [h < 0 ? h + 360 : h, s, l];
  }

  function deHsl(h, s, l) {
    var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
    var r = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return paraHex(r.map(function (v) { return (v + m) * 255; }));
  }

  /* mesma cor, mais clara (dl > 0) ou mais escura (dl < 0), sem perder o tom */
  function clarear(hex, dl) {
    var hsl = paraHsl(hex);
    return deHsl(hsl[0], hsl[1], Math.max(0, Math.min(1, hsl[2] + dl)));
  }

  function luminancia(hex) {
    var c = paraRgb(hex).map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }

  /* contraste de leitura (padrão WCAG): 1 = nenhum, 21 = máximo. Texto pede 4,5+ */
  function contraste(a, b) {
    var la = luminancia(a), lb = luminancia(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }

  /* a cor de letra (entre as opções) que mais aparece em cima do fundo dado;
     com "preferida", ela ganha sempre que ainda for bem legível (selos em branco) */
  function letraSobre(fundo, opcoes, preferida) {
    if (preferida && contraste(fundo, preferida) >= 4) return preferida;
    return opcoes.reduce(function (melhor, c) { return contraste(fundo, c) > contraste(fundo, melhor) ? c : melhor; });
  }

  /* --------------------------------- tema ---------------------------------- */
  /* Completa as cores que faltarem (ou vierem erradas) com as da paleta padrão */
  function normalizar(tema) {
    var cores = (tema && tema.cores) || {};
    var out = {};
    CAMPOS.forEach(function (c) { out[c[0]] = hexValido(cores[c[0]]) ? cores[c[0]].toLowerCase() : PADRAO.cores[c[0]]; });
    return out;
  }

  function claro(cores) { return luminancia(cores.fundo) > 0.35; }

  /* As 6 cores viram todas as variáveis que o estilo.css usa */
  function variaveis(tema) {
    var c = normalizar(tema);
    var ehClaro = claro(c);
    // "forte" = a cor um pouco mais longe do fundo (clareia no escuro, escurece no claro)
    var passo = ehClaro ? -0.1 : 0.1;
    var escuroBase = misturar(c.fundo, "#000000", ehClaro ? 0.85 : 0.25);
    var letras = [escuroBase, "#ffffff"];
    var rgb = function (hex) { return paraRgb(hex).join(", "); };
    var v = {
      "--fundo": c.fundo,
      "--fundo-lateral": misturar(c.fundo, c.superficie, 0.3),
      "--superficie": c.superficie,
      "--superficie-2": misturar(c.superficie, c.texto, 0.035),
      "--linha": misturar(c.superficie, c.texto, 0.1),
      "--linha-2": misturar(c.superficie, c.texto, 0.19),
      "--texto": c.texto,
      "--texto-suave": misturar(c.texto, c.fundo, 0.3),
      "--texto-fraco": misturar(c.texto, c.fundo, ehClaro ? 0.42 : 0.5),
      "--coyote": c.destaque,
      "--coyote-forte": clarear(c.destaque, passo),
      "--oliva": c.apoio,
      "--oliva-claro": clarear(c.apoio, passo * 1.2),
      "--vermelho": c.oferta,
      "--oferta-texto": misturar(c.oferta, c.texto, ehClaro ? 0.25 : 0.45),
      "--sobre-destaque": letraSobre(c.destaque, letras),
      "--sobre-apoio": letraSobre(c.apoio, letras, "#ffffff"),
      "--sobre-oferta": letraSobre(c.oferta, letras, "#ffffff"),
      "--fundo-rgb": rgb(c.fundo),
      "--texto-rgb": rgb(c.texto),
      "--destaque-rgb": rgb(c.destaque),
      "--oferta-rgb": rgb(c.oferta)
    };
    var p = paletaDasCores(c);
    if (p && p.ajustes) Object.keys(p.ajustes).forEach(function (k) { v[k] = p.ajustes[k]; });
    return v;
  }

  /* a paleta pronta que tem exatamente estas 6 cores (ou null, se foram mexidas) */
  function paletaDasCores(cores) {
    for (var i = 0; i < PALETAS.length; i++) {
      var p = PALETAS[i];
      if (CAMPOS.every(function (k) { return p.cores[k[0]] === cores[k[0]]; })) return p;
    }
    return null;
  }

  /* Pontos fracos de leitura de um conjunto de cores (vazio = tudo certo) */
  function problemas(tema) {
    var v = variaveis(tema);
    var lista = [];
    var conferir = function (a, b, minimo, texto) {
      if (contraste(v[a], v[b]) < minimo) lista.push(texto);
    };
    conferir("--texto", "--fundo", 7, "O texto está pouco visível sobre o fundo.");
    conferir("--texto", "--superficie", 7, "O texto está pouco visível sobre os cartões.");
    conferir("--texto-suave", "--superficie", 4.5, "Os textos secundários ficam apagados nos cartões.");
    conferir("--sobre-destaque", "--coyote", 4.5, "As letras dos botões ficam difíceis de ler na cor principal.");
    conferir("--coyote-forte", "--superficie", 4.5, "Os preços (cor principal) ficam fracos sobre os cartões.");
    conferir("--coyote", "--fundo", 3, "A cor principal quase some no fundo.");
    conferir("--oliva-claro", "--superficie", 3, "A cor de apoio quase some nos cartões.");
    conferir("--sobre-apoio", "--oliva", 4, "As letras sobre a cor de apoio ficam difíceis de ler.");
    conferir("--sobre-oferta", "--vermelho", 4, "As letras do selo de oferta ficam difíceis de ler.");
    conferir("--oferta-texto", "--superficie", 4.5, "Os avisos ficam difíceis de ler.");
    return lista;
  }

  /* Pinta a página (o elemento <html>) com o tema */
  function aplicar(tema, doc) {
    doc = doc || raiz.document;
    if (!doc || !doc.documentElement) return;
    var v = variaveis(tema);
    var est = doc.documentElement.style;
    Object.keys(v).forEach(function (k) { est.setProperty(k, v[k]); });
    var c = normalizar(tema);
    var meta = doc.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", c.fundo);
    var esquema = doc.querySelector('meta[name="color-scheme"]');
    if (esquema) esquema.setAttribute("content", claro(c) ? "light" : "dark");
  }

  /* "style" pronto para pintar só um pedaço (as miniaturas do painel) */
  function estiloInline(tema) {
    var v = variaveis(tema);
    return Object.keys(v).map(function (k) { return k + ":" + v[k]; }).join(";");
  }

  function paleta(id) {
    for (var i = 0; i < PALETAS.length; i++) if (PALETAS[i].id === id) return PALETAS[i];
    return null;
  }

  raiz.TEMA = {
    CAMPOS: CAMPOS,
    PALETAS: PALETAS,
    paleta: paleta,
    paletaDasCores: function (cores) { return paletaDasCores(normalizar({ cores: cores })); },
    hexValido: hexValido,
    contraste: contraste,
    normalizar: normalizar,
    variaveis: variaveis,
    problemas: problemas,
    aplicar: aplicar,
    estiloInline: estiloInline
  };

  // pinta já, antes de a página aparecer (evita piscar com as cores antigas)
  if (raiz.document && raiz.LOJA) aplicar(raiz.LOJA.tema);
})(typeof window !== "undefined" ? window : globalThis);
