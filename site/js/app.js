/* =====================================================================
   ARTE MILITAR 011 — APLICAÇÃO (telas e navegação)
   ---------------------------------------------------------------------
   Monta todas as páginas a partir de config.js e produtos.js.
   Para mudar TEXTOS, CONTATOS, CATEGORIAS ou PRODUTOS você não precisa
   mexer aqui — edite config.js e produtos.js.

   Páginas (endereço depois do #):
     #/                     início
     #/categoria/ID         categoria (filtros: ?sub=&cor=&ordem=&estoque=1)
     #/produto/ID           produto
     #/busca?q=texto        busca
     #/ofertas  #/lancamentos  #/mais-vendidos  #/todos
     #/pedido               carrinho + finalizar pelo WhatsApp
     #/pedido-enviado/NUM   confirmação
     #/meus-pedidos         histórico (neste aparelho)
     #/loja  #/contato  #/como-comprar  #/sobre  #/trocas  #/privacidade
   ===================================================================== */

(function () {
  "use strict";

  /* Prévia do painel administrativo: mostra as alterações ainda não publicadas */
  var EM_PREVIA = /[?&]previa=1/.test(location.search);
  if (EM_PREVIA) {
    try {
      var previa = JSON.parse(localStorage.getItem("am011:previa"));
      if (previa && previa.loja && previa.produtos) {
        window.LOJA = previa.loja;
        window.PRODUTOS = previa.produtos;
        if (window.TEMA) window.TEMA.aplicar(previa.loja.tema);
      }
    } catch (e) { /* sem prévia: mostra o site normal */ }
  }

  var LOJA = window.LOJA;
  var PRODUTOS = window.PRODUTOS || [];
  var IL = window.ILUSTRACOES;
  var PD = window.PEDIDO;
  var icone = IL.icone;
  var R = PD.formatarPreco;

  var CHAVE_CARRINHO = "am011:carrinho";
  var CHAVE_CLIENTE = "am011:cliente";
  var CHAVE_HISTORICO = "am011:historico";

  /* ============================== utilidades ============================== */
  function $(sel, el) { return (el || document).querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }
  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function enc(t) { return encodeURIComponent(t); }

  var armazenamento = {
    ler: function (chave, padrao) {
      try {
        var v = localStorage.getItem(chave);
        return v ? JSON.parse(v) : padrao;
      } catch (e) { return padrao; }
    },
    gravar: function (chave, valor) {
      try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) { /* modo privado: segue sem salvar */ }
    },
    apagar: function (chave) {
      try { localStorage.removeItem(chave); } catch (e) { /* ignora */ }
    }
  };

  /* ================================ índices =============================== */
  var categoriaPorId = {};
  var subcategoriaPorId = {};
  LOJA.categorias.forEach(function (c) {
    categoriaPorId[c.id] = c;
    (c.subcategorias || []).forEach(function (s) { subcategoriaPorId[c.id + "/" + s.id] = s; });
  });
  var produtoPorId = {};
  PRODUTOS.forEach(function (p) {
    p.imagens = p.imagens || [];
    p.variacoes = p.variacoes || {};
    p.selos = p.selos || [];
    p.destaques = p.destaques || [];
    p.especificacoes = p.especificacoes || {};
    produtoPorId[p.id] = p;
  });

  function nomeSub(p) {
    var s = subcategoriaPorId[p.categoria + "/" + p.subcategoria];
    return s ? s.nome : categoriaPorId[p.categoria] ? categoriaPorId[p.categoria].nome : "";
  }
  function temSelo(p, selo) { return p.selos.indexOf(selo) !== -1; }
  function produtosDaCategoria(id) { return PRODUTOS.filter(function (p) { return p.categoria === id; }); }

  /* ============================== carrinho =============================== */
  var carrinho = armazenamento.ler(CHAVE_CARRINHO, []).filter(function (i) {
    return i && produtoPorId[i.id] && i.qtd > 0;
  });

  function salvarCarrinho(lista) {
    carrinho = lista;
    armazenamento.gravar(CHAVE_CARRINHO, carrinho);
    atualizarContadores();
  }

  function atualizarContadores() {
    var linhas = PD.linhasDoCarrinho(carrinho, PRODUTOS);
    var qtd = PD.totalItens(linhas);
    var total = linhas.reduce(function (s, l) { return s + l.total; }, 0);
    $$("[data-contador]").forEach(function (el) {
      el.textContent = qtd;
      el.hidden = qtd === 0;
    });
    $$("[data-total-pedido]").forEach(function (el) {
      el.textContent = qtd ? R(total) : "vazio";
    });
  }

  /* ============================== imagens ================================ */
  function corPadrao(p) {
    return (p.variacoes.Cor && p.variacoes.Cor[0]) || (p.ilustracao && p.ilustracao.cor) || "Verde Oliva";
  }

  function midiaProduto(p, opcoes) {
    opcoes = opcoes || {};
    var cor = opcoes.cor || (p.ilustracao && p.ilustracao.cor) || corPadrao(p);
    var foto = p.imagens[opcoes.indice || 0];
    var tipo = (p.ilustracao && p.ilustracao.tipo) || "mochila";
    if (foto) {
      return (
        '<img src="' + esc(foto) + '" alt="' + esc(p.nome) + '" ' +
        (opcoes.prioridade ? 'fetchpriority="high"' : 'loading="lazy"') +
        ' decoding="async" data-tipo="' + esc(tipo) + '" data-cor="' + esc(cor) + '">'
      );
    }
    return IL.ilustracao(tipo, cor, p.nome);
  }

  /* Foto que não carregou (link errado/arquivo faltando) vira ilustração automaticamente */
  document.addEventListener(
    "error",
    function (e) {
      var img = e.target;
      if (img.tagName === "IMG" && img.dataset.tipo && !img.dataset.falhou) {
        img.dataset.falhou = "1";
        var tmp = document.createElement("div");
        tmp.innerHTML = IL.ilustracao(img.dataset.tipo, img.dataset.cor, img.alt);
        img.replaceWith(tmp.firstChild);
      }
    },
    true
  );

  /* ========================= componentes de tela ========================= */
  function selosHtml(p) {
    var s = "";
    var desc = PD.descontoPercentual(p);
    if (p.disponivel === false) s += '<span class="selo selo--esgotado">Esgotado</span>';
    if (desc) s += '<span class="selo selo--oferta">-' + desc + "%</span>";
    if (temSelo(p, "lancamento")) s += '<span class="selo selo--novo">Novo</span>';
    if (temSelo(p, "mais-vendido")) s += '<span class="selo selo--top">Mais vendido</span>';
    return s ? '<div class="selos">' + s + "</div>" : "";
  }

  function precoHtml(p, grande) {
    var pix = LOJA.pedidos.descontoPix;
    return (
      '<div class="preco' + (grande ? " preco--grande" : "") + '">' +
      (p.precoAntigo > p.preco ? '<s class="preco__antigo" aria-label="Preço anterior">' + R(p.precoAntigo) + "</s>" : "") +
      '<strong class="preco__atual">' + R(p.preco) + "</strong>" +
      (pix ? '<span class="preco__pix">' + R(PD.precoPix(p.preco, pix)) + " no Pix</span>" : "") +
      "</div>"
    );
  }

  function bolinhasCor(p) {
    var cores = p.variacoes.Cor;
    if (!cores || cores.length < 2) return "";
    return (
      '<div class="bolinhas" aria-label="' + cores.length + ' cores disponíveis">' +
      cores.slice(0, 5).map(function (c) { return '<span class="bolinha" style="background:' + amostraCor(c) + '" title="' + esc(c) + '"></span>'; }).join("") +
      (cores.length > 5 ? '<span class="bolinhas__mais">+' + (cores.length - 5) + "</span>" : "") +
      "</div>"
    );
  }

  function amostraCor(nome) {
    var v = LOJA.cores[nome] || "#556b2f";
    if (v === "camo-multicam") return "linear-gradient(135deg,#a6966c 0 30%,#6f6a43 30% 55%,#c8b88a 55% 75%,#4e4630 75%)";
    if (v === "camo-verde") return "linear-gradient(135deg,#5d6b3c 0 30%,#262619 30% 50%,#86784b 50% 75%,#3a4426 75%)";
    if (v === "camo-urbano") return "linear-gradient(135deg,#878a8c 0 30%,#2e3032 30% 50%,#c0c2c2 50% 75%,#5a5d60 75%)";
    return v;
  }

  function cardProduto(p) {
    return (
      '<article class="card' + (p.disponivel === false ? " card--esgotado" : "") + '">' +
      '<a class="card__link" href="#/produto/' + enc(p.id) + '">' +
      '<div class="card__midia">' + midiaProduto(p) + selosHtml(p) + "</div>" +
      '<div class="card__corpo">' +
      '<span class="card__cat">' + esc(nomeSub(p)) + "</span>" +
      '<h3 class="card__nome">' + esc(p.nome) + "</h3>" +
      '<p class="card__resumo">' + esc(p.resumo || "") + "</p>" +
      bolinhasCor(p) +
      precoHtml(p) +
      '<span class="card__acao">' + (p.disponivel === false ? "Ver detalhes" : "Ver produto") + icone("seta") + "</span>" +
      "</div></a></article>"
    );
  }

  function grade(lista, vazio) {
    if (!lista.length) {
      return (
        '<div class="vazio">' + icone("busca", "vazio__icone") +
        "<p>" + (vazio || "Nenhum produto encontrado.") + "</p>" +
        '<a class="btn btn--secundario" href="#/todos">Ver todos os produtos</a></div>'
      );
    }
    return '<div class="grade">' + lista.map(cardProduto).join("") + "</div>";
  }

  function cabecalhoPagina(migalhas, titulo, subtitulo) {
    var trilha = [{ nome: "Início", link: "#/" }].concat(migalhas || []);
    return (
      '<div class="topo-pagina">' +
      '<div class="topo-pagina__nav">' +
      '<button class="btn-voltar" type="button" data-voltar>' + icone("voltar") + "Voltar</button>" +
      '<nav class="migalhas" aria-label="Você está em"><ol>' +
      trilha.map(function (m, i) {
        return i === trilha.length - 1 && !titulo
          ? '<li aria-current="page">' + esc(m.nome) + "</li>"
          : "<li>" + (m.link ? '<a href="' + m.link + '">' + esc(m.nome) + "</a>" : esc(m.nome)) + "</li>";
      }).join("") +
      (titulo ? '<li aria-current="page">' + esc(titulo) + "</li>" : "") +
      "</ol></nav></div>" +
      (titulo ? '<h1 class="titulo-pagina">' + esc(titulo) + "</h1>" : "") +
      (subtitulo ? '<p class="subtitulo-pagina">' + subtitulo + "</p>" : "") +
      "</div>"
    );
  }

  function ordenar(lista, ordem) {
    var l = lista.slice();
    var peso = function (p) {
      return (p.disponivel === false ? 0 : 100) + (temSelo(p, "destaque") ? 4 : 0) + (temSelo(p, "mais-vendido") ? 3 : 0) + (temSelo(p, "oferta") ? 1 : 0);
    };
    if (ordem === "menor-preco") l.sort(function (a, b) { return a.preco - b.preco; });
    else if (ordem === "maior-preco") l.sort(function (a, b) { return b.preco - a.preco; });
    else if (ordem === "nome") l.sort(function (a, b) { return a.nome.localeCompare(b.nome, "pt-BR"); });
    else if (ordem === "desconto") l.sort(function (a, b) { return PD.descontoPercentual(b) - PD.descontoPercentual(a); });
    else l.sort(function (a, b) { return peso(b) - peso(a); });
    return l;
  }

  function linkWhats(texto) { return PD.linkWhatsApp(LOJA.contato.whatsapp, texto); }
  function urlDoProduto(p) {
    return urlBase() + "#/produto/" + p.id;
  }

  /* ============================ painel lateral ============================ */
  var EMBLEMA =
    '<svg class="emblema" viewBox="0 0 64 64" aria-hidden="true">' +
    '<path d="M32 3L58 12V30C58 46 46 57 32 61C18 57 6 46 6 30V12Z" style="fill:var(--linha);stroke:var(--coyote)" stroke-width="3"/>' +
    '<path d="M32 15L35.6 25.6H46.8L37.7 32.2L41.2 42.8L32 36.2L22.8 42.8L26.3 32.2L17.2 25.6H28.4Z" style="fill:var(--coyote)"/>' +
    '<path d="M14 48H50" style="stroke:var(--coyote)" stroke-width="2.5"/></svg>';

  function logoHtml() {
    return EMBLEMA + '<span class="logo__texto"><span class="logo__nome">Arte Militar</span><span class="logo__num">011</span></span>';
  }

  function montarLateral() {
    var c = LOJA.contato;
    var cats = LOJA.categorias.map(function (cat) {
      var qtd = produtosDaCategoria(cat.id).length;
      return (
        '<li class="nav-cat" data-cat="' + esc(cat.id) + '">' +
        '<button class="nav-cat__btn" type="button" aria-expanded="false" aria-controls="sub-' + esc(cat.id) + '">' +
        icone(cat.icone || "patch") + '<span class="nav-cat__nome">' + esc(cat.nome) + "</span>" +
        '<span class="nav-cat__qtd">' + qtd + "</span>" + icone("seta", "nav-cat__seta") +
        "</button>" +
        '<ul class="nav-sub" id="sub-' + esc(cat.id) + '" hidden>' +
        '<li><a href="#/categoria/' + enc(cat.id) + '" data-rota="/categoria/' + esc(cat.id) + '">Ver tudo em ' + esc(cat.nome) + "</a></li>" +
        (cat.subcategorias || []).map(function (s) {
          return '<li><a href="#/categoria/' + enc(cat.id) + "?sub=" + enc(s.id) + '" data-rota="/categoria/' + esc(cat.id) + "?sub=" + esc(s.id) + '">' + esc(s.nome) + "</a></li>";
        }).join("") +
        "</ul></li>"
      );
    }).join("");

    var link = function (rota, ic, nome) {
      return '<a class="nav-link" href="#' + rota + '" data-rota="' + rota + '">' + icone(ic) + "<span>" + nome + "</span></a>";
    };

    $("#lateral").innerHTML =
      '<div class="lateral__topo">' +
      '<a class="logo" href="#/" aria-label="' + esc(LOJA.nome) + ' — página inicial">' + logoHtml() + "</a>" +
      '<button class="btn-icone lateral__fechar" type="button" id="fechar-menu" aria-label="Fechar menu">' + icone("fechar") + "</button>" +
      "</div>" +
      '<form class="busca" role="search" id="form-busca">' +
      '<label class="sr" for="campo-busca">Buscar produtos</label>' +
      icone("busca", "busca__icone") +
      '<input id="campo-busca" type="search" placeholder="Buscar coturno, mochila..." autocomplete="off" enterkeyhint="search">' +
      "</form>" +
      '<a class="btn-pedido" href="#/pedido" data-rota="/pedido">' + icone("pedido") +
      '<span class="btn-pedido__texto"><strong>Meu pedido</strong><small data-total-pedido>vazio</small></span>' +
      '<span class="contador" data-contador hidden>0</span></a>' +
      '<nav class="nav" aria-label="Menu principal">' +
      link("/", "inicio", "Página inicial") +
      '<p class="nav-titulo">Categorias</p>' +
      '<ul class="nav-cats">' + cats + "</ul>" +
      '<p class="nav-titulo">Vitrine</p>' +
      link("/ofertas", "fogo", "Ofertas") +
      link("/lancamentos", "novo", "Lançamentos") +
      link("/mais-vendidos", "estrela", "Mais vendidos") +
      link("/todos", "lista", "Todos os produtos") +
      '<p class="nav-titulo">Atendimento</p>' +
      link("/loja", "mapa", "Loja física e mapa") +
      link("/contato", "telefone", "Contato") +
      link("/como-comprar", "info", "Como comprar") +
      link("/meus-pedidos", "pedido", "Meus pedidos") +
      link("/trocas", "escudo", "Trocas e garantia") +
      "</nav>" +
      '<div class="lateral__contato">' +
      '<a class="btn btn--whats btn--bloco" href="' + linkWhats("Olá! Vim pelo site da " + LOJA.nome + ".") + '" target="_blank" rel="noopener">' + icone("whatsapp") + "Chamar no WhatsApp</a>" +
      '<a class="contato-mini" href="tel:+55' + esc(PD.somenteDigitos(c.telefone)) + '">' + icone("telefone") + esc(c.telefoneExibicao) + "</a>" +
      '<a class="contato-mini" href="mailto:' + esc(c.email) + '">' + icone("email") + esc(c.email) + "</a>" +
      "</div>";

    // abrir/fechar categorias: SÓ NO CLIQUE (nada de abrir ao passar o mouse)
    $$(".nav-cat__btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        alternarCategoria(btn.parentElement, btn.getAttribute("aria-expanded") !== "true");
      });
    });

    var campo = $("#campo-busca");
    var espera;
    campo.addEventListener("input", function () {
      clearTimeout(espera);
      espera = setTimeout(function () {
        // no celular o menu cobre a tela: a busca só roda ao tocar em "buscar" no teclado
        if (!window.matchMedia("(min-width: 1024px)").matches) return;
        var q = campo.value.trim();
        var naBusca = location.hash.indexOf("#/busca") === 0;
        if (q.length >= 2) navegar("#/busca?q=" + enc(q), { substituir: naBusca, manterMenu: true });
        else if (!q && naBusca) navegar("#/busca", { substituir: true, manterMenu: true });
      }, 280);
    });
    $("#form-busca").addEventListener("submit", function (e) {
      e.preventDefault();
      clearTimeout(espera);
      navegar("#/busca?q=" + enc(campo.value.trim()));
      campo.blur();
    });

    $("#fechar-menu").addEventListener("click", fecharMenu);
  }

  function alternarCategoria(li, abrir) {
    var btn = $(".nav-cat__btn", li);
    btn.setAttribute("aria-expanded", abrir ? "true" : "false");
    $(".nav-sub", li).hidden = !abrir;
    li.classList.toggle("aberta", abrir);
  }

  function marcarAtivo(caminho, consulta) {
    var subAtual = new URLSearchParams(consulta).get("sub") || "";
    $$("#lateral [data-rota]").forEach(function (a) {
      var r = a.getAttribute("data-rota").split("?");
      var subLink = new URLSearchParams(r[1] || "").get("sub") || "";
      var ativo = r[0] === caminho && subLink === subAtual;
      if (ativo) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    var partes = caminho.split("/");
    $$(".nav-cat").forEach(function (li) {
      var ativa = partes[1] === "categoria" && partes[2] === li.dataset.cat;
      var produto = partes[1] === "produto" && produtoPorId[decodeURIComponent(partes[2] || "")];
      if (produto && produto.categoria === li.dataset.cat) ativa = true;
      li.classList.toggle("ativa", !!ativa);
      if (ativa) alternarCategoria(li, true);
    });
  }

  /* menu no celular */
  var ultimoFoco = null;
  function abrirMenu() {
    ultimoFoco = document.activeElement;
    document.body.classList.add("menu-aberto");
    $("#sombra").hidden = false;
    $("#abrir-menu").setAttribute("aria-expanded", "true");
    setTimeout(function () { $("#campo-busca").focus({ preventScroll: true }); }, 50);
  }
  function fecharMenu() {
    if (!document.body.classList.contains("menu-aberto")) return;
    document.body.classList.remove("menu-aberto");
    $("#sombra").hidden = true;
    $("#abrir-menu").setAttribute("aria-expanded", "false");
    if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus({ preventScroll: true });
  }

  /* ================================ rotas ================================= */
  var timerBanner = null;
  var opcoesNavegacao = {};

  function navegar(hash, opcoes) {
    opcoesNavegacao = opcoes || {};
    if (opcoesNavegacao.substituir) {
      history.replaceState(null, "", hash);
      renderizar();
    } else if (location.hash === hash) {
      renderizar();
    } else {
      location.hash = hash;
    }
  }

  function lerRota() {
    var h = location.hash.slice(1) || "/";
    var i = h.indexOf("?");
    var caminho = i === -1 ? h : h.slice(0, i);
    var consulta = i === -1 ? "" : h.slice(i + 1);
    return { caminho: caminho, consulta: consulta, partes: caminho.split("/").filter(Boolean), q: new URLSearchParams(consulta) };
  }

  function renderizar() {
    if (location.hash && location.hash.indexOf("#/") !== 0) return; // âncoras internas (#conteudo)
    var opcoes = opcoesNavegacao;
    opcoesNavegacao = {};
    clearInterval(timerBanner);
    esconderAviso();

    var r = lerRota();
    var p = r.partes;
    var html;
    var meta = { titulo: "", descricao: "" };

    switch (p[0]) {
      case undefined: html = paginaInicio(meta); break;
      case "categoria": html = paginaCategoria(decodeURIComponent(p[1] || ""), r.q, meta); break;
      case "produto": html = paginaProduto(decodeURIComponent(p[1] || ""), meta); break;
      case "busca": html = paginaBusca(r.q.get("q") || "", meta); break;
      case "ofertas":
        html = paginaVitrine(meta, "Ofertas", "Produtos com preço especial por tempo limitado.", function (x) { return PD.descontoPercentual(x) > 0 || temSelo(x, "oferta"); }, "desconto");
        break;
      case "lancamentos":
        html = paginaVitrine(meta, "Lançamentos", "Novidades que acabaram de chegar na loja.", function (x) { return temSelo(x, "lancamento"); });
        break;
      case "mais-vendidos":
        html = paginaVitrine(meta, "Mais vendidos", "Os preferidos de quem já comprou com a gente.", function (x) { return temSelo(x, "mais-vendido"); });
        break;
      case "todos":
        html = paginaVitrine(meta, "Todos os produtos", PRODUTOS.length + " produtos no catálogo.", function () { return true; }, r.q.get("ordem"));
        break;
      case "pedido": html = paginaPedido(meta); break;
      case "pedido-enviado": html = paginaEnviado(decodeURIComponent(p[1] || ""), meta); break;
      case "meus-pedidos": html = paginaMeusPedidos(meta); break;
      case "loja": html = paginaLoja(meta); break;
      case "contato": html = paginaContato(meta); break;
      case "como-comprar": html = paginaComoComprar(meta); break;
      case "sobre": html = paginaTexto(meta, "Sobre a loja", "<p>" + esc(LOJA.sobre) + "</p>"); break;
      case "trocas": html = paginaTexto(meta, "Trocas e garantia", "<ul class='lista-check'>" + LOJA.politicaTrocas.map(function (t) { return "<li>" + icone("check") + esc(t) + "</li>"; }).join("") + "</ul>"); break;
      case "privacidade": html = paginaTexto(meta, "Privacidade", "<p>" + esc(LOJA.privacidade) + "</p>"); break;
      default: html = pagina404(meta);
    }

    var main = $("#conteudo");
    main.innerHTML = html;
    document.title = meta.titulo ? meta.titulo + " | " + LOJA.nome : LOJA.nome + " — " + LOJA.slogan;
    var desc = $('meta[name="description"]');
    if (desc) desc.setAttribute("content", meta.descricao || LOJA.descricao);
    if (!meta.produtoJsonLd) removerJsonLd("jsonld-produto");

    marcarAtivo(r.caminho, r.consulta);
    if (!opcoes.manterMenu) fecharMenu();
    var campo = $("#campo-busca");
    if (campo && p[0] !== "busca" && document.activeElement !== campo) campo.value = "";

    ligarEventosDaPagina(p[0], r);
    atualizarContadores();

    if (!opcoes.manterRolagem) {
      window.scrollTo(0, 0);
      if (!opcoes.manterMenu) {
        var h1 = $("h1", main);
        if (h1) { h1.setAttribute("tabindex", "-1"); h1.focus({ preventScroll: true }); }
      }
    }
  }

  /* ================================ páginas =============================== */
  function paginaInicio(meta) {
    meta.titulo = "";
    var banners = LOJA.banners || [];
    var slides = banners.map(function (b, i) {
      var fundo = b.imagem ? ' style="background-image:linear-gradient(90deg,rgba(var(--fundo-rgb),.92) 0%,rgba(var(--fundo-rgb),.6) 55%,rgba(var(--fundo-rgb),.25) 100%),url(\'' + esc(b.imagem) + '\')"' : "";
      var Tag = i === 0 ? "h1" : "h2";
      return (
        '<article class="hero__slide' + (i === 0 ? " ativo" : "") + (b.imagem ? " hero__slide--foto" : "") + '"' + fundo + ' aria-roledescription="slide" aria-label="' + (i + 1) + " de " + banners.length + '"' + (i === 0 ? "" : ' aria-hidden="true"') + ">" +
        '<div class="hero__texto">' +
        '<span class="hero__sobre">' + esc(LOJA.nome) + "</span>" +
        "<" + Tag + ' class="hero__titulo">' + esc(b.titulo) + "</" + Tag + ">" +
        '<p class="hero__descricao">' + esc(b.texto) + "</p>" +
        '<div class="hero__botoes"><a class="btn btn--primario" href="' + esc(b.link) + '"' + (i === 0 ? "" : ' tabindex="-1"') + ">" + esc(b.botao) + icone("seta") + "</a></div>" +
        "</div>" +
        (b.imagem ? "" : '<div class="hero__arte" aria-hidden="true">' + IL.ilustracao(b.ilustracao.tipo, b.ilustracao.cor, "") + "</div>") +
        "</article>"
      );
    }).join("");

    var controles = banners.length > 1
      ? '<div class="hero__controles">' +
        '<button class="hero__seta" type="button" data-banner="-1" aria-label="Banner anterior">' + icone("voltar") + "</button>" +
        '<div class="hero__pontos">' + banners.map(function (b, i) {
          return '<button type="button" class="hero__ponto' + (i === 0 ? " ativo" : "") + '" data-ponto="' + i + '" aria-label="Ir para o banner ' + (i + 1) + '"></button>';
        }).join("") + "</div>" +
        '<button class="hero__seta" type="button" data-banner="1" aria-label="Próximo banner">' + icone("seta") + "</button></div>"
      : "";

    var beneficios = [
      ["caminhao", "Envio para todo o Brasil", "Correios e transportadora"],
      ["loja", "Retire na loja física", "Sem custo de frete em SP"],
      ["whatsapp", "Pedido pelo WhatsApp", "Atendimento de gente de verdade"],
      ["pix", LOJA.pedidos.descontoPix ? LOJA.pedidos.descontoPix + "% off no Pix" : "Pague como preferir", "Pix, cartão ou dinheiro"]
    ].map(function (b) {
      return '<li class="beneficio">' + icone(b[0]) + "<div><strong>" + b[1] + "</strong><span>" + b[2] + "</span></div></li>";
    }).join("");

    var categorias = LOJA.categorias.map(function (c) {
      var primeiro = produtosDaCategoria(c.id)[0];
      var arte = primeiro ? midiaProduto(primeiro) : "";
      return (
        '<a class="cat-card" href="#/categoria/' + enc(c.id) + '">' +
        '<div class="cat-card__arte">' + arte + "</div>" +
        '<div class="cat-card__texto"><h3>' + esc(c.nome) + "</h3><p>" + esc(c.descricao) + "</p>" +
        '<span class="cat-card__qtd">' + produtosDaCategoria(c.id).length + " produtos " + icone("seta") + "</span></div></a>"
      );
    }).join("");

    var destaques = ordenar(PRODUTOS.filter(function (x) { return temSelo(x, "destaque"); })).slice(0, 8);
    var ofertas = ordenar(PRODUTOS.filter(function (x) { return PD.descontoPercentual(x) > 0; }), "desconto").slice(0, 4);
    var novos = PRODUTOS.filter(function (x) { return temSelo(x, "lancamento"); }).slice(0, 4);
    var lj = LOJA.lojaFisica;

    return (
      '<section class="hero" aria-roledescription="carrossel" aria-label="Destaques da loja">' +
      '<div class="hero__slides">' + slides + "</div>" + controles + "</section>" +
      '<ul class="beneficios">' + beneficios + "</ul>" +
      secao("Compre por categoria", "Clique numa categoria para ver todos os produtos.", '<div class="cat-grade">' + categorias + "</div>") +
      secao("Destaques da semana", "", grade(destaques), "#/todos", "Ver todos") +
      (ofertas.length ? secao("Ofertas", "Preço especial enquanto durar o estoque.", grade(ofertas), "#/ofertas", "Ver todas as ofertas", "secao--oferta") : "") +
      '<section class="faixa-loja">' +
      '<div class="faixa-loja__texto">' +
      '<span class="hero__sobre">Loja física</span>' +
      "<h2>Venha conhecer a nossa loja</h2>" +
      "<p>" + icone("mapa") + esc(lj.endereco) + " — " + esc(lj.cidade) + "</p>" +
      "<p>" + icone("relogio") + esc(lj.horarios[0].dias) + ": " + esc(lj.horarios[0].horas) + "</p>" +
      '<div class="hero__botoes"><a class="btn btn--primario" href="#/loja">Ver no mapa' + icone("seta") + "</a>" +
      '<a class="btn btn--whats" href="' + linkWhats("Olá! Quero tirar uma dúvida antes de ir até a loja.") + '" target="_blank" rel="noopener">' + icone("whatsapp") + "WhatsApp</a></div>" +
      "</div>" +
      '<div class="faixa-loja__arte" aria-hidden="true">' + EMBLEMA + "</div></section>" +
      (novos.length ? secao("Lançamentos", "", grade(novos), "#/lancamentos", "Ver lançamentos") : "") +
      secao("Como comprar", "Simples e rápido, sem cadastro.", passosCompra())
    );
  }

  function secao(titulo, sub, conteudo, link, textoLink, classe) {
    return (
      '<section class="secao ' + (classe || "") + '">' +
      '<div class="secao__topo"><div><h2 class="secao__titulo">' + titulo + "</h2>" + (sub ? '<p class="secao__sub">' + sub + "</p>" : "") + "</div>" +
      (link ? '<a class="link-seta" href="' + link + '">' + textoLink + icone("seta") + "</a>" : "") +
      "</div>" + conteudo + "</section>"
    );
  }

  function passosCompra() {
    var passos = [
      ["busca", "1. Escolha", "Navegue pelas categorias no menu lateral e escolha tamanho e cor."],
      ["pedido", "2. Monte seu pedido", "Adicione quantos produtos quiser e preencha seus dados de entrega."],
      ["whatsapp", "3. Envie pelo WhatsApp", "O pedido chega pronto no nosso WhatsApp. Confirmamos frete e pagamento."],
      ["caminhao", "4. Receba ou retire", "Enviamos para todo o Brasil ou você retira na loja física."]
    ];
    return '<ol class="passos">' + passos.map(function (p) {
      return '<li class="passo">' + icone(p[0]) + "<h3>" + p[1] + "</h3><p>" + p[2] + "</p></li>";
    }).join("") + "</ol>";
  }

  function paginaCategoria(id, q, meta) {
    var cat = categoriaPorId[id];
    if (!cat) return pagina404(meta);
    var sub = q.get("sub") || "";
    var cor = q.get("cor") || "";
    var ordem = q.get("ordem") || "";
    var estoque = q.get("estoque") === "1";
    var todos = produtosDaCategoria(id);
    var subAtual = subcategoriaPorId[id + "/" + sub];

    var lista = todos.filter(function (p) {
      return (!sub || p.subcategoria === sub) && (!cor || (p.variacoes.Cor || [corPadrao(p)]).indexOf(cor) !== -1) && (!estoque || p.disponivel !== false);
    });

    meta.titulo = subAtual ? subAtual.nome + " — " + cat.nome : cat.nome;
    meta.descricao = cat.descricao;

    var urlCom = function (mudancas) {
      var n = new URLSearchParams(q.toString());
      Object.keys(mudancas).forEach(function (k) { if (mudancas[k]) n.set(k, mudancas[k]); else n.delete(k); });
      var s = n.toString();
      return "#/categoria/" + enc(id) + (s ? "?" + s : "");
    };

    var chipsSub =
      '<a class="chip' + (!sub ? " ativo" : "") + '" href="' + urlCom({ sub: "" }) + '" data-filtro>Todos <span>' + todos.length + "</span></a>" +
      (cat.subcategorias || []).map(function (s) {
        var n = todos.filter(function (p) { return p.subcategoria === s.id; }).length;
        if (!n) return "";
        return '<a class="chip' + (sub === s.id ? " ativo" : "") + '" href="' + urlCom({ sub: s.id }) + '" data-filtro>' + esc(s.nome) + " <span>" + n + "</span></a>";
      }).join("");

    var coresPresentes = [];
    todos.forEach(function (p) {
      (p.variacoes.Cor || [corPadrao(p)]).forEach(function (c) { if (coresPresentes.indexOf(c) === -1) coresPresentes.push(c); });
    });
    var chipsCor = coresPresentes.map(function (c) {
      return '<a class="chip chip--cor' + (cor === c ? " ativo" : "") + '" href="' + urlCom({ cor: cor === c ? "" : c }) + '" data-filtro><span class="bolinha" style="background:' + amostraCor(c) + '"></span>' + esc(c) + "</a>";
    }).join("");

    var migalhas = [{ nome: cat.nome, link: subAtual ? "#/categoria/" + enc(id) : "" }];
    return (
      cabecalhoPagina(subAtual ? migalhas : [], subAtual ? subAtual.nome : cat.nome, esc(cat.descricao)) +
      '<div class="filtros">' +
      '<div class="filtros__linha" role="group" aria-label="Subcategorias">' + chipsSub + "</div>" +
      (coresPresentes.length > 1 ? '<div class="filtros__linha" role="group" aria-label="Cores"><span class="filtros__rotulo">Cor:</span>' + chipsCor + "</div>" : "") +
      '<div class="filtros__barra">' +
      '<span class="filtros__total">' + lista.length + (lista.length === 1 ? " produto" : " produtos") + "</span>" +
      '<label class="caixa"><input type="checkbox" id="filtro-estoque"' + (estoque ? " checked" : "") + "> Somente disponíveis</label>" +
      seletorOrdem(ordem) +
      "</div></div>" +
      grade(ordenar(lista, ordem), "Nenhum produto com esses filtros.")
    );
  }

  function seletorOrdem(ordem) {
    var opcoes = [["", "Relevância"], ["menor-preco", "Menor preço"], ["maior-preco", "Maior preço"], ["desconto", "Maior desconto"], ["nome", "Nome (A–Z)"]];
    return (
      '<label class="ordenar">Ordenar: <select id="ordem">' +
      opcoes.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === (ordem || "") ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") +
      "</select></label>"
    );
  }

  function paginaVitrine(meta, titulo, sub, filtro, ordemPadrao) {
    meta.titulo = titulo;
    meta.descricao = sub;
    var ordem = lerRota().q.get("ordem") || ordemPadrao || "";
    var lista = ordenar(PRODUTOS.filter(filtro), ordem);
    return (
      cabecalhoPagina([], titulo, esc(sub)) +
      '<div class="filtros"><div class="filtros__barra"><span class="filtros__total">' + lista.length + " produtos</span>" + seletorOrdem(ordem) + "</div></div>" +
      grade(lista)
    );
  }

  function buscar(texto) {
    var termos = PD.normalizar(texto).split(/\s+/).filter(Boolean);
    if (!termos.length) return [];
    return PRODUTOS.map(function (p) {
      var cat = categoriaPorId[p.categoria];
      var nome = PD.normalizar(p.nome);
      var tudo = PD.normalizar([p.nome, p.resumo, p.descricao, cat && cat.nome, nomeSub(p), (p.variacoes.Cor || []).join(" "), p.marca].join(" "));
      var ok = termos.every(function (t) { return tudo.indexOf(t) !== -1; });
      var pontos = termos.reduce(function (s, t) { return s + (nome.indexOf(t) !== -1 ? 3 : 1); }, 0);
      return ok ? { p: p, pontos: pontos } : null;
    }).filter(Boolean).sort(function (a, b) { return b.pontos - a.pontos; }).map(function (x) { return x.p; });
  }

  function paginaBusca(texto, meta) {
    meta.titulo = texto ? "Busca: " + texto : "Buscar";
    var campo = $("#campo-busca");
    if (campo && document.activeElement !== campo) campo.value = texto;
    var res = buscar(texto);
    var sugestoes = LOJA.categorias.map(function (c) {
      return '<a class="chip" href="#/categoria/' + enc(c.id) + '">' + esc(c.nome) + "</a>";
    }).join("");
    return (
      cabecalhoPagina([], texto ? "Resultados para “" + texto + "”" : "Buscar produtos", texto ? res.length + (res.length === 1 ? " produto encontrado" : " produtos encontrados") : "Digite no campo de busca do menu lateral.") +
      '<form class="busca busca--pagina" role="search" id="form-busca-pagina"><label class="sr" for="busca-pagina">Buscar</label>' + icone("busca", "busca__icone") +
      '<input id="busca-pagina" type="search" value="' + esc(texto) + '" placeholder="O que você procura?" enterkeyhint="search"><button class="btn btn--primario" type="submit">Buscar</button></form>' +
      (texto ? grade(res, "Não encontramos “" + esc(texto) + "”. Tente outra palavra ou chame no WhatsApp — podemos ter na loja!") : "") +
      '<div class="sugestoes"><p>Ou navegue pelas categorias:</p><div class="filtros__linha">' + sugestoes + "</div></div>"
    );
  }

  /* -------------------------------- produto ------------------------------- */
  var estadoProduto = null;

  function paginaProduto(id, meta) {
    var p = produtoPorId[id];
    if (!p) return pagina404(meta);
    var cat = categoriaPorId[p.categoria];
    meta.titulo = p.nome;
    meta.descricao = p.resumo || p.descricao;
    meta.produtoJsonLd = true;
    inserirJsonLdProduto(p);

    var selecao = {};
    Object.keys(p.variacoes).forEach(function (k) { if (p.variacoes[k].length === 1) selecao[k] = p.variacoes[k][0]; });
    estadoProduto = { p: p, selecao: selecao, qtd: 1, foto: 0 };

    var grupos = Object.keys(p.variacoes).filter(function (k) { return p.variacoes[k].length; }).map(function (k) {
      var ehCor = k === "Cor";
      return (
        '<fieldset class="variacao" data-grupo="' + esc(k) + '">' +
        "<legend>" + esc(k) + ': <strong data-escolha="' + esc(k) + '">' + (selecao[k] ? esc(selecao[k]) : "escolha") + "</strong></legend>" +
        '<div class="variacao__opcoes">' +
        p.variacoes[k].map(function (v) {
          return (
            '<button type="button" class="opcao' + (ehCor ? " opcao--cor" : "") + (selecao[k] === v ? " ativo" : "") + '" data-variacao="' + esc(k) + '" data-valor="' + esc(v) + '" aria-pressed="' + (selecao[k] === v) + '">' +
            (ehCor ? '<span class="bolinha" style="background:' + amostraCor(v) + '"></span>' : "") + esc(v) + "</button>"
          );
        }).join("") +
        '</div><p class="erro-campo" hidden>Escolha uma opção de ' + esc(k.toLowerCase()) + ".</p></fieldset>"
      );
    }).join("");

    var miniaturas = p.imagens.length > 1
      ? '<div class="galeria__miniaturas">' + p.imagens.map(function (src, i) {
          return '<button type="button" class="miniatura' + (i === 0 ? " ativo" : "") + '" data-foto="' + i + '" aria-label="Foto ' + (i + 1) + '"><img src="' + esc(src) + '" alt="" loading="lazy" decoding="async"></button>';
        }).join("") + "</div>"
      : "";

    var specs = Object.keys(p.especificacoes);
    var relacionados = ordenar(PRODUTOS.filter(function (x) { return x.categoria === p.categoria && x.id !== p.id; })).slice(0, 4);
    var esgotado = p.disponivel === false;

    return (
      cabecalhoPagina([{ nome: cat ? cat.nome : "", link: "#/categoria/" + enc(p.categoria) }, { nome: nomeSub(p), link: "#/categoria/" + enc(p.categoria) + "?sub=" + enc(p.subcategoria) }], "") +
      '<div class="produto">' +
      '<div class="galeria">' +
      '<div class="galeria__principal" id="foto-principal">' + midiaProduto(p, { prioridade: true }) + selosHtml(p) + "</div>" +
      miniaturas +
      (p.imagens.length ? "" : '<p class="galeria__nota">Imagem ilustrativa.</p>') +
      "</div>" +
      '<div class="produto__info">' +
      '<span class="card__cat">' + esc(nomeSub(p)) + (p.marca ? " · " + esc(p.marca) : "") + "</span>" +
      '<h1 class="produto__nome">' + esc(p.nome) + "</h1>" +
      '<p class="produto__resumo">' + esc(p.resumo || "") + "</p>" +
      precoHtml(p, true) +
      (esgotado ? '<p class="alerta">Produto esgotado no momento. Fale com a gente para saber quando chega.</p>' : "") +
      grupos +
      (esgotado ? "" :
        '<div class="comprar">' +
        '<div class="qtd" role="group" aria-label="Quantidade">' +
        '<button type="button" class="qtd__btn" data-qtd="-1" aria-label="Diminuir">' + icone("menos") + "</button>" +
        '<output id="qtd-produto" aria-live="polite">1</output>' +
        '<button type="button" class="qtd__btn" data-qtd="1" aria-label="Aumentar">' + icone("mais") + "</button></div>" +
        '<button type="button" class="btn btn--primario btn--grande" id="adicionar">' + icone("pedido") + "Adicionar ao pedido</button>" +
        "</div>") +
      '<button type="button" class="btn btn--whats btn--bloco btn--grande" id="comprar-whats">' + icone("whatsapp") + (esgotado ? "Avise-me quando chegar" : "Comprar agora pelo WhatsApp") + "</button>" +
      '<div class="produto__extras">' +
      '<div class="info-mini">' + icone("loja") + "<div><strong>Retire na loja física</strong><span>" + esc(LOJA.lojaFisica.endereco) + "</span></div></div>" +
      '<div class="info-mini">' + icone("caminhao") + "<div><strong>Enviamos para todo o Brasil</strong><span>Frete informado pelo WhatsApp</span></div></div>" +
      "</div>" +
      '<button type="button" class="link-seta" id="compartilhar">' + icone("compartilhar") + "Compartilhar este produto</button>" +
      "</div></div>" +
      '<div class="produto__detalhes">' +
      '<section class="bloco"><h2>Descrição</h2><p>' + esc(p.descricao || p.resumo || "") + "</p>" +
      (p.destaques.length ? '<ul class="lista-check">' + p.destaques.map(function (d) { return "<li>" + icone("check") + esc(d) + "</li>"; }).join("") + "</ul>" : "") +
      "</section>" +
      (specs.length ? '<section class="bloco"><h2>Especificações</h2><table class="tabela-specs"><tbody>' +
        specs.map(function (k) { return '<tr><th scope="row">' + esc(k) + "</th><td>" + esc(p.especificacoes[k]) + "</td></tr>"; }).join("") +
        "</tbody></table></section>" : "") +
      "</div>" +
      (relacionados.length ? secao("Você também pode gostar", "", grade(relacionados), "#/categoria/" + enc(p.categoria), "Ver categoria") : "")
    );
  }

  function ligarProduto() {
    var est = estadoProduto;
    var p = est.p;

    $$("[data-variacao]").forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.dataset.variacao;
        est.selecao[k] = b.dataset.valor;
        $$('[data-variacao="' + cssEsc(k) + '"]').forEach(function (o) {
          var on = o === b;
          o.classList.toggle("ativo", on);
          o.setAttribute("aria-pressed", on);
        });
        var rotulo = $('[data-escolha="' + cssEsc(k) + '"]');
        if (rotulo) rotulo.textContent = b.dataset.valor;
        var grupo = b.closest(".variacao");
        grupo.classList.remove("com-erro");
        $(".erro-campo", grupo).hidden = true;
        if (k === "Cor" && !p.imagens.length) {
          $("#foto-principal").innerHTML = midiaProduto(p, { cor: b.dataset.valor }) + selosHtml(p);
        }
      });
    });

    $$("[data-qtd]").forEach(function (b) {
      b.addEventListener("click", function () {
        est.qtd = Math.max(1, Math.min(PD.QTD_MAX, est.qtd + Number(b.dataset.qtd)));
        $("#qtd-produto").textContent = est.qtd;
      });
    });

    $$("[data-foto]").forEach(function (b) {
      b.addEventListener("click", function () {
        var i = Number(b.dataset.foto);
        $("#foto-principal").innerHTML = midiaProduto(p, { indice: i }) + selosHtml(p);
        $$("[data-foto]").forEach(function (o) { o.classList.toggle("ativo", o === b); });
      });
    });

    function validar() {
      var faltando = Object.keys(p.variacoes).filter(function (k) { return p.variacoes[k].length && !est.selecao[k]; });
      faltando.forEach(function (k) {
        var g = $('[data-grupo="' + cssEsc(k) + '"]');
        g.classList.add("com-erro");
        $(".erro-campo", g).hidden = false;
      });
      if (faltando.length) {
        var primeiro = $('[data-grupo="' + cssEsc(faltando[0]) + '"] .opcao');
        primeiro.focus();
        primeiro.closest(".variacao").scrollIntoView({ block: "center", behavior: "smooth" });
        mostrarAviso("Escolha " + faltando.join(" e ").toLowerCase() + " antes de continuar.");
        return false;
      }
      return true;
    }

    var add = $("#adicionar");
    if (add) {
      add.addEventListener("click", function () {
        if (!validar()) return;
        salvarCarrinho(PD.adicionarItem(carrinho, { id: p.id, variacoes: Object.assign({}, est.selecao), qtd: est.qtd }));
        mostrarAviso("<strong>" + esc(p.nome) + "</strong> foi adicionado ao pedido.", { texto: "Ver pedido", link: "#/pedido" });
      });
    }

    $("#comprar-whats").addEventListener("click", function () {
      var texto;
      if (p.disponivel === false) {
        texto = "Olá! Quero ser avisado quando o produto *" + p.nome + "* (cód. " + (p.codigo || p.id) + ") chegar." +
          (LOJA.pedidos.linkDosProdutos ? "\n" + urlDoProduto(p) : "");
      } else {
        if (!validar()) return;
        texto = PD.mensagemProduto(p, est.selecao, est.qtd, LOJA, urlDoProduto(p));
      }
      abrirExterno(linkWhats(texto));
    });

    $("#compartilhar").addEventListener("click", function () {
      var url = urlDoProduto(p);
      if (navigator.share) {
        navigator.share({ title: p.nome, text: p.resumo, url: url }).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function () { mostrarAviso("Link copiado!"); }, function () { mostrarAviso(url); });
      } else {
        mostrarAviso(url);
      }
    });
  }

  function cssEsc(t) { return window.CSS && CSS.escape ? CSS.escape(t) : String(t).replace(/"/g, '\\"'); }

  /* ----------------------------- pedido (carrinho) ------------------------- */
  function paginaPedido(meta) {
    meta.titulo = "Meu pedido";
    var linhas = PD.linhasDoCarrinho(carrinho, PRODUTOS);
    if (!linhas.length) {
      return (
        cabecalhoPagina([], "Meu pedido") +
        '<div class="vazio vazio--grande">' + icone("pedido", "vazio__icone") +
        "<h2>Seu pedido está vazio</h2><p>Navegue pelas categorias no menu e adicione os produtos que quiser.</p>" +
        '<div class="hero__botoes"><a class="btn btn--primario" href="#/">Ir para a página inicial</a><a class="btn btn--secundario" href="#/ofertas">Ver ofertas</a></div></div>'
      );
    }
    var cli = armazenamento.ler(CHAVE_CLIENTE, {});
    var end = cli.endereco || {};
    var P = LOJA.pedidos;

    var itens = linhas.map(function (l) {
      var v = PD.textoVariacoes(l.variacoes);
      return (
        '<li class="item" data-chave="' + esc(l.chave) + '">' +
        '<a class="item__midia" href="#/produto/' + enc(l.id) + '" tabindex="-1" aria-hidden="true">' + midiaProduto(l.produto, { cor: l.variacoes.Cor }) + "</a>" +
        '<div class="item__info"><a class="item__nome" href="#/produto/' + enc(l.id) + '">' + esc(l.nome) + "</a>" +
        (v ? '<span class="item__var">' + esc(v) + "</span>" : "") +
        '<span class="item__unit">' + R(l.precoUnitario) + " cada</span>" +
        (l.disponivel ? "" : '<span class="alerta alerta--mini">Esgotado — confirmaremos pelo WhatsApp</span>') +
        "</div>" +
        '<div class="qtd qtd--mini" role="group" aria-label="Quantidade de ' + esc(l.nome) + '">' +
        '<button type="button" class="qtd__btn" data-item-qtd="-1" aria-label="Diminuir">' + icone("menos") + "</button>" +
        "<output>" + l.qtd + "</output>" +
        '<button type="button" class="qtd__btn" data-item-qtd="1" aria-label="Aumentar">' + icone("mais") + "</button></div>" +
        '<strong class="item__total">' + R(l.total) + "</strong>" +
        '<button type="button" class="btn-icone item__remover" data-remover aria-label="Remover ' + esc(l.nome) + '">' + icone("lixeira") + "</button>" +
        "</li>"
      );
    }).join("");

    var radio = function (nome, valor, titulo, detalhe, marcado) {
      return (
        '<label class="opcao-card"><input type="radio" name="' + nome + '" value="' + esc(valor) + '"' + (marcado ? " checked" : "") + ">" +
        "<span><strong>" + esc(titulo) + "</strong>" + (detalhe ? "<small>" + esc(detalhe) + "</small>" : "") + "</span></label>"
      );
    };
    var campo = function (id, rotulo, valor, extra, classe) {
      return (
        '<div class="campo ' + (classe || "") + '"><label for="f-' + id + '">' + rotulo + "</label>" +
        '<input id="f-' + id + '" name="' + id + '" value="' + esc(valor || "") + '" ' + (extra || "") + '><p class="erro-campo" data-erro="' + id + '" hidden></p></div>'
      );
    };

    return (
      cabecalhoPagina([], "Meu pedido", "Revise os itens, preencha seus dados e envie o pedido pronto para o nosso WhatsApp.") +
      '<form class="checkout" id="checkout" novalidate>' +
      '<div class="checkout__principal">' +
      '<section class="bloco"><h2>' + icone("pedido") + 'Itens</h2><ul class="itens">' + itens + "</ul>" +
      '<p class="erro-campo" data-erro="itens" hidden></p>' +
      '<a class="link-seta" href="#/">' + icone("mais") + "Adicionar mais produtos</a></section>" +

      '<section class="bloco"><h2>' + icone("info") + "Seus dados</h2>" +
      '<div class="campos">' +
      campo("nome", "Nome completo *", cli.nome, 'autocomplete="name" required', "campo--largo") +
      campo("telefone", "WhatsApp / Telefone *", cli.telefone, 'type="tel" inputmode="tel" autocomplete="tel" placeholder="(11) 90000-0000" required') +
      campo("email", "E-mail (opcional)", cli.email, 'type="email" autocomplete="email"') +
      "</div></section>" +

      (P.notaFiscal === false ? "" :
        '<section class="bloco"><h2>' + icone("lista") + "Nota fiscal</h2>" +
        '<label class="caixa"><input type="checkbox" name="nf" id="f-nf"' + (cli.nf ? " checked" : "") + "> Quero nota fiscal desta compra</label>" +
        '<div class="campos" id="campos-nf" hidden>' +
        campo("nf_doc", "CPF ou CNPJ *", cli.nfDoc, 'inputmode="numeric" placeholder="000.000.000-00" maxlength="18"') +
        campo("nf_razao", "Razão social (empresa) *", cli.nfRazao, 'autocomplete="organization"', "campo--razao") +
        '<p class="dica campo--largo">Para a nota, precisamos também do endereço completo (aparece logo abaixo, em Entrega).</p>' +
        "</div></section>") +

      '<section class="bloco"><h2>' + icone("caminhao") + "Entrega</h2>" +
      '<div class="opcoes-card" role="radiogroup" aria-label="Forma de entrega">' +
      P.entregas.map(function (e) { return radio("entrega", e.id, e.nome, e.detalhe, cli.entrega === e.id); }).join("") +
      '</div><p class="erro-campo" data-erro="entrega" hidden></p>' +
      '<div class="campos" id="campos-endereco" hidden>' +
      campo("cep", "CEP *", end.cep, 'inputmode="numeric" autocomplete="postal-code" placeholder="00000-000" maxlength="9"') +
      '<p class="dica" id="dica-cep">Digite o CEP que preenchemos o endereço.</p>' +
      campo("rua", "Rua / Avenida *", end.rua, 'autocomplete="address-line1"', "campo--largo") +
      campo("numero", "Número *", end.numero, 'inputmode="text"') +
      campo("complemento", "Complemento", end.complemento, 'autocomplete="address-line2" placeholder="Apto, bloco..."') +
      campo("bairro", "Bairro *", end.bairro, "") +
      campo("cidade", "Cidade *", end.cidade, 'autocomplete="address-level2"') +
      campo("uf", "UF *", end.uf, 'maxlength="2" autocomplete="address-level1" placeholder="SP"', "campo--curto") +
      "</div></section>" +

      '<section class="bloco"><h2>' + icone("pix") + "Pagamento</h2>" +
      '<p class="dica">O pagamento é combinado pelo WhatsApp depois que confirmarmos o pedido.</p>' +
      '<div class="opcoes-card opcoes-card--linha" role="radiogroup" aria-label="Forma de pagamento">' +
      P.pagamentos.map(function (pg) {
        var det = PD.normalizar(pg) === "pix" && P.descontoPix ? P.descontoPix + "% de desconto" : "";
        return radio("pagamento", pg, pg, det, cli.pagamento === pg);
      }).join("") +
      '</div><p class="erro-campo" data-erro="pagamento" hidden></p>' +
      '<div class="campo campo--largo"><label for="f-obs">Observações</label>' +
      '<textarea id="f-obs" name="obs" rows="3" placeholder="Ex.: nome para gravar na tarjeta, melhor horário para entrega, dúvidas..."></textarea></div>' +
      "</section>" +
      "</div>" +

      '<aside class="resumo" aria-label="Resumo do pedido">' +
      '<div class="resumo__caixa">' +
      "<h2>Resumo</h2>" +
      '<dl class="resumo__linhas" id="resumo-linhas"></dl>' +
      '<button type="submit" class="btn btn--whats btn--bloco btn--grande">' + icone("whatsapp") + "Enviar pedido pelo WhatsApp</button>" +
      '<p class="resumo__nota">Você será levado ao WhatsApp com o pedido pronto. Lá confirmamos disponibilidade, frete e pagamento. Nada é cobrado pelo site.</p>' +
      '<details class="previa" id="previa-mensagem"><summary>' + icone("whatsapp") + "Ver a mensagem que será enviada</summary>" +
      '<pre class="previa__texto" id="previa-texto"></pre></details>' +
      '<label class="caixa"><input type="checkbox" id="lembrar"' + (cli.nome || !Object.keys(cli).length ? " checked" : "") + "> Lembrar meus dados neste aparelho</label>" +
      '<button type="button" class="link-seta link-seta--perigo" id="limpar-pedido">' + icone("lixeira") + "Esvaziar pedido</button>" +
      "</div></aside>" +
      "</form>"
    );
  }

  function ligarPedido() {
    var form = $("#checkout");
    if (!form) return;

    function atualizarResumo() {
      var linhas = PD.linhasDoCarrinho(carrinho, PRODUTOS);
      var qtd = PD.totalItens(linhas);
      var sub = linhas.reduce(function (s, l) { return s + l.total; }, 0);
      var pag = (form.querySelector('[name="pagamento"]:checked') || {}).value || "";
      var ent = (form.querySelector('[name="entrega"]:checked') || {}).value || "";
      var t = PD.calcularTotais(sub, pag, LOJA.pedidos.descontoPix);
      var economia = linhas.reduce(function (s, l) {
        var a = l.produto.precoAntigo;
        return s + (a > l.precoUnitario ? (a - l.precoUnitario) * l.qtd : 0);
      }, 0);
      $("#resumo-linhas").innerHTML =
        '<div class="resumo__contagem"><dt>Produtos diferentes</dt><dd>' + linhas.length + "</dd></div>" +
        '<div class="resumo__contagem"><dt>Unidades</dt><dd>' + qtd + "</dd></div>" +
        "<div><dt>Subtotal</dt><dd>" + R(t.subtotal) + "</dd></div>" +
        (economia ? '<div class="resumo__desconto"><dt>Você economiza nas promoções</dt><dd>' + R(economia) + "</dd></div>" : "") +
        (t.descontoPix ? '<div class="resumo__desconto"><dt>Desconto Pix (' + t.percentualPix + "%)</dt><dd>-" + R(t.descontoPix) + "</dd></div>" : "") +
        "<div><dt>Frete</dt><dd>" + (ent === "retirada" ? "Grátis (retirada)" : "A combinar") + "</dd></div>" +
        '<div class="resumo__total"><dt>Total</dt><dd>' + R(t.total) + "</dd></div>" +
        (ent === "retirada" ? "" : '<p class="resumo__frete">+ frete, informado pelo WhatsApp</p>');
      atualizarPrevia();
    }

    // prévia: mostra exatamente o texto que vai chegar no WhatsApp
    var previa = $("#previa-mensagem");
    function atualizarPrevia() {
      if (!previa || !previa.open) return;
      var dados = lerFormulario(form);
      if (!dados.cliente.nome) dados.cliente.nome = "(seu nome)";
      if (!dados.cliente.telefone) dados.cliente.telefone = "(seu WhatsApp)";
      var pedido = PD.montarPedido(Object.assign(dados, { numero: LOJA.pedidos.prefixo + "-......-....", urlBase: urlBase() }), PRODUTOS, LOJA);
      $("#previa-texto").textContent = PD.mensagemPedido(pedido, LOJA);
    }
    if (previa) {
      previa.addEventListener("toggle", atualizarPrevia);
      form.addEventListener("input", atualizarPrevia);
    }

    function mostrarEndereco() {
      var ent = (form.querySelector('[name="entrega"]:checked') || {}).value;
      var nf = $("#f-nf") && $("#f-nf").checked;
      $("#campos-endereco").hidden = !nf && (!ent || ent === "retirada");
      if ($("#campos-nf")) {
        $("#campos-nf").hidden = !nf;
        var cnpj = PD.somenteDigitos($("#f-nf_doc").value).length > 11;
        $(".campo--razao", form).hidden = !cnpj;
      }
      atualizarResumo();
    }
    var caixaNf = $("#f-nf");
    if (caixaNf) {
      caixaNf.addEventListener("change", mostrarEndereco);
      var docNf = $("#f-nf_doc");
      docNf.addEventListener("input", function () {
        var d = PD.somenteDigitos(docNf.value).slice(0, 14);
        docNf.value = d.length <= 11
          ? d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2")
          : d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, "$1.$2.$3/$4-$5");
        mostrarEndereco();
      });
    }

    $$('[name="entrega"]', form).forEach(function (r) { r.addEventListener("change", mostrarEndereco); });
    $$('[name="pagamento"]', form).forEach(function (r) { r.addEventListener("change", atualizarResumo); });
    mostrarEndereco();

    // quantidade / remover
    $$(".item", form).forEach(function (li) {
      var chave = li.dataset.chave;
      $$("[data-item-qtd]", li).forEach(function (b) {
        b.addEventListener("click", function () {
          var item = carrinho.find(function (i) { return PD.chaveItem(i.id, i.variacoes) === chave; });
          if (!item) return;
          var nova = item.qtd + Number(b.dataset.itemQtd);
          if (nova < 1) return removerLinha(li, chave);
          salvarCarrinho(PD.alterarQuantidade(carrinho, chave, nova));
          var linha = PD.linhasDoCarrinho(carrinho, PRODUTOS).find(function (l) { return l.chave === chave; });
          $("output", li).textContent = linha.qtd;
          $(".item__total", li).textContent = R(linha.total);
          atualizarResumo();
        });
      });
      $("[data-remover]", li).addEventListener("click", function () { removerLinha(li, chave); });
    });

    function removerLinha(li, chave) {
      salvarCarrinho(PD.removerItem(carrinho, chave));
      if (!carrinho.length) return renderizar();
      li.remove();
      atualizarResumo();
      mostrarAviso("Item removido do pedido.");
    }

    $("#limpar-pedido").addEventListener("click", function () {
      if (confirm("Remover todos os itens do pedido?")) {
        salvarCarrinho([]);
        renderizar();
      }
    });

    // máscaras simples
    var tel = $("#f-telefone");
    tel.addEventListener("input", function () { tel.value = mascaraTelefone(tel.value); });
    var cep = $("#f-cep");
    cep.addEventListener("input", function () {
      var d = PD.somenteDigitos(cep.value).slice(0, 8);
      cep.value = d.length > 5 ? d.slice(0, 5) + "-" + d.slice(5) : d;
      if (d.length === 8) buscarCep(d);
    });
    var uf = $("#f-uf");
    uf.addEventListener("input", function () { uf.value = uf.value.replace(/[^a-z]/gi, "").toUpperCase(); });

    // apaga o aviso de erro do campo assim que o cliente corrige
    var limparErro = function (e) {
      var nome = e.target.name;
      var aviso = nome && $('[data-erro="' + nome + '"]', form);
      if (aviso) aviso.hidden = true;
      e.target.removeAttribute("aria-invalid");
    };
    form.addEventListener("input", limparErro);
    form.addEventListener("change", limparErro);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      enviarPedido(form);
    });

    atualizarResumo();
  }

  function mascaraTelefone(v) {
    var d = PD.somenteDigitos(v).slice(0, 11);
    if (d.length <= 2) return d.length ? "(" + d : "";
    if (d.length <= 6) return "(" + d.slice(0, 2) + ") " + d.slice(2);
    if (d.length <= 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
    return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
  }

  function buscarCep(cep) {
    var dica = $("#dica-cep");
    if (!dica || !window.fetch) return;
    dica.textContent = "Buscando endereço...";
    fetch("https://viacep.com.br/ws/" + cep + "/json/")
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!$("#dica-cep")) return;
        if (d.erro) { dica.textContent = "CEP não encontrado. Preencha o endereço manualmente."; return; }
        var set = function (id, v) { var el = $("#f-" + id); if (el && v) el.value = v; };
        set("rua", d.logradouro); set("bairro", d.bairro); set("cidade", d.localidade); set("uf", d.uf);
        dica.textContent = "Endereço encontrado. Confira e informe o número.";
        $("#f-numero").focus();
      })
      .catch(function () { if ($("#dica-cep")) dica.textContent = "Não foi possível buscar o CEP agora. Preencha manualmente."; });
  }

  function lerFormulario(form) {
    var val = function (n) { var el = form.querySelector('[name="' + n + '"]'); return el ? el.value.trim() : ""; };
    var marcado = function (n) { var el = form.querySelector('[name="' + n + '"]:checked'); return el ? el.value : ""; };
    return {
      itens: carrinho,
      cliente: { nome: val("nome"), telefone: val("telefone"), email: val("email") },
      entrega: marcado("entrega"),
      pagamento: marcado("pagamento"),
      endereco: { cep: val("cep"), rua: val("rua"), numero: val("numero"), complemento: val("complemento"), bairro: val("bairro"), cidade: val("cidade"), uf: val("uf") },
      observacoes: val("obs"),
      notaFiscal: { quer: !!(form.querySelector('[name="nf"]') || {}).checked, documento: val("nf_doc"), razaoSocial: val("nf_razao") }
    };
  }

  function urlBase() {
    return location.protocol === "file:" ? LOJA.urlSite : location.origin + location.pathname;
  }

  function enviarPedido(form) {
    var dados = lerFormulario(form);

    var erros = PD.validarPedido(dados, LOJA);
    $$("[data-erro]", form).forEach(function (p) {
      var msg = erros[p.dataset.erro];
      p.hidden = !msg;
      p.textContent = msg || "";
      var input = $("#f-" + p.dataset.erro);
      if (input) {
        if (msg) input.setAttribute("aria-invalid", "true");
        else input.removeAttribute("aria-invalid");
      }
    });
    var chaves = Object.keys(erros);
    if (chaves.length) {
      var alvo = $("#f-" + chaves[0]) || $('[data-erro="' + chaves[0] + '"]');
      if (alvo) {
        alvo.scrollIntoView({ block: "center", behavior: "smooth" });
        if (alvo.focus) alvo.focus({ preventScroll: true });
      }
      mostrarAviso("Confira os campos destacados.");
      return;
    }

    if ($("#lembrar").checked) {
      armazenamento.gravar(CHAVE_CLIENTE, { nome: dados.cliente.nome, telefone: dados.cliente.telefone, email: dados.cliente.email, entrega: dados.entrega, pagamento: dados.pagamento, endereco: dados.endereco, nf: dados.notaFiscal.quer, nfDoc: dados.notaFiscal.documento, nfRazao: dados.notaFiscal.razaoSocial });
    } else {
      armazenamento.apagar(CHAVE_CLIENTE);
    }

    dados.urlBase = urlBase();
    var pedido = PD.montarPedido(dados, PRODUTOS, LOJA);
    var historico = armazenamento.ler(CHAVE_HISTORICO, []);
    historico.unshift(pedido);
    armazenamento.gravar(CHAVE_HISTORICO, historico.slice(0, 20));

    var finalizar = PD.FINALIZADORES[LOJA.pedidos.finalizacao || "whatsapp"] || PD.FINALIZADORES.whatsapp;
    var acao = finalizar(pedido, LOJA);
    salvarCarrinho([]);
    navegar("#/pedido-enviado/" + enc(pedido.numero));
    abrirExterno(acao.url);
  }

  /* Abre o WhatsApp em nova aba; se o navegador bloquear, abre na mesma aba */
  function abrirExterno(url) {
    var janela = window.open(url, "_blank");
    if (janela) janela.opener = null;
    else location.href = url;
  }

  function acharPedido(numero) {
    return armazenamento.ler(CHAVE_HISTORICO, []).find(function (p) { return p.numero === numero; });
  }

  function paginaEnviado(numero, meta) {
    meta.titulo = "Pedido enviado";
    var pedido = acharPedido(numero);
    if (!pedido) return pagina404(meta);
    return (
      '<div class="sucesso">' +
      '<div class="sucesso__icone">' + icone("check") + "</div>" +
      "<h1>Pedido pronto!</h1>" +
      "<p>O número do seu pedido é <strong>" + esc(pedido.numero) + "</strong>.</p>" +
      "<p>Abrimos o WhatsApp com tudo preenchido — é só tocar em <strong>enviar</strong> por lá. Respondemos confirmando disponibilidade, frete e pagamento.</p>" +
      '<div class="hero__botoes">' +
      '<a class="btn btn--whats btn--grande" href="' + esc(PD.FINALIZADORES.whatsapp(pedido, LOJA).url) + '" target="_blank" rel="noopener">' + icone("whatsapp") + "O WhatsApp não abriu? Clique aqui</a>" +
      '<a class="btn btn--secundario" href="#/">Continuar comprando</a></div>' +
      resumoDoPedido(pedido) +
      '<p class="dica">Seus pedidos ficam salvos neste aparelho em <a href="#/meus-pedidos">Meus pedidos</a>.</p>' +
      "</div>"
    );
  }

  /* Resumo do pedido enviado (mesmas informações da mensagem do WhatsApp) */
  function resumoDoPedido(pedido) {
    var retirada = pedido.entrega && pedido.entrega.id === "retirada";
    var qtd = pedido.quantidade || 0;
    var diferentes = pedido.produtosDiferentes || pedido.linhas.length;
    return (
      '<section class="bloco resumo-pedido">' +
      "<h2>" + icone("lista") + "Resumo do pedido</h2>" +
      '<p class="resumo-pedido__contagem">' + diferentes + (diferentes === 1 ? " produto" : " produtos diferentes") + " · " + qtd + (qtd === 1 ? " unidade" : " unidades") + "</p>" +
      '<table class="tabela-pedido"><thead><tr><th scope="col">Produto</th><th scope="col">Qtd</th><th scope="col">Total</th></tr></thead><tbody>' +
      pedido.linhas.map(function (l) {
        var v = PD.textoVariacoes(l.variacoes);
        return (
          "<tr><td><strong>" + esc(l.nome) + "</strong><small>" + esc((l.codigo || l.id) + (v ? " · " + v : "")) + "</small></td>" +
          "<td>" + l.qtd + "</td><td>" + R(l.total) + "</td></tr>"
        );
      }).join("") +
      "</tbody></table>" +
      '<dl class="resumo__linhas">' +
      "<div><dt>Subtotal</dt><dd>" + R(pedido.subtotal) + "</dd></div>" +
      (pedido.economia ? '<div class="resumo__desconto"><dt>Economia nas promoções</dt><dd>' + R(pedido.economia) + "</dd></div>" : "") +
      (pedido.descontoPix ? '<div class="resumo__desconto"><dt>Desconto Pix (' + pedido.percentualPix + "%)</dt><dd>-" + R(pedido.descontoPix) + "</dd></div>" : "") +
      "<div><dt>Frete</dt><dd>" + (retirada ? "Grátis (retirada)" : "A combinar") + "</dd></div>" +
      '<div class="resumo__total"><dt>Total</dt><dd>' + R(pedido.total) + "</dd></div>" +
      "</dl>" +
      '<p class="dica">Entrega: ' + esc(pedido.entrega ? pedido.entrega.nome : "-") + " · Pagamento: " + esc(pedido.pagamento || "-") +
      (pedido.notaFiscal ? " · Nota fiscal: " + esc(pedido.notaFiscal.tipo) + " " + esc(pedido.notaFiscal.documento) : "") + "</p>" +
      "</section>"
    );
  }

  function paginaMeusPedidos(meta) {
    meta.titulo = "Meus pedidos";
    var historico = armazenamento.ler(CHAVE_HISTORICO, []);
    var lista = historico.length
      ? '<ul class="historico">' + historico.map(function (p) {
          return (
            '<li class="bloco historico__item">' +
            '<div class="historico__topo"><strong>' + esc(p.numero) + "</strong><span>" + esc(p.dataTexto) + "</span></div>" +
            '<ul class="historico__itens">' + p.linhas.map(function (l) {
              var v = PD.textoVariacoes(l.variacoes);
              return "<li>" + l.qtd + "× " + esc(l.nome) + (v ? " <small>(" + esc(v) + ")</small>" : "") + "</li>";
            }).join("") + "</ul>" +
            '<div class="historico__rodape"><span>Total: <strong>' + R(p.total) + "</strong></span>" +
            '<div class="historico__acoes">' +
            '<button type="button" class="btn btn--secundario" data-repetir="' + esc(p.numero) + '">' + icone("pedido") + "Pedir de novo</button>" +
            '<a class="btn btn--whats" href="' + PD.FINALIZADORES.whatsapp(p, LOJA).url + '" target="_blank" rel="noopener">' + icone("whatsapp") + "Reenviar</a>" +
            "</div></div></li>"
          );
        }).join("") + "</ul>" +
        '<button type="button" class="link-seta link-seta--perigo" id="apagar-historico">' + icone("lixeira") + "Apagar histórico deste aparelho</button>"
      : '<div class="vazio">' + icone("pedido", "vazio__icone") + "<p>Você ainda não enviou pedidos por este aparelho.</p>" + '<a class="btn btn--primario" href="#/">Começar a comprar</a></div>';
    return cabecalhoPagina([], "Meus pedidos", "Pedidos enviados a partir deste aparelho e navegador.") + lista;
  }

  function ligarMeusPedidos() {
    $$("[data-repetir]").forEach(function (b) {
      b.addEventListener("click", function () {
        var p = acharPedido(b.dataset.repetir);
        if (!p) return;
        var lista = carrinho;
        p.linhas.forEach(function (l) { if (produtoPorId[l.id]) lista = PD.adicionarItem(lista, { id: l.id, variacoes: l.variacoes, qtd: l.qtd }); });
        salvarCarrinho(lista);
        navegar("#/pedido");
      });
    });
    var apagar = $("#apagar-historico");
    if (apagar) apagar.addEventListener("click", function () {
      if (confirm("Apagar o histórico de pedidos deste aparelho?")) {
        armazenamento.apagar(CHAVE_HISTORICO);
        renderizar();
      }
    });
  }

  /* ---------------------------- loja e contato ---------------------------- */
  function horariosHtml() {
    return '<table class="horarios"><tbody>' + LOJA.lojaFisica.horarios.map(function (h) {
      return '<tr><th scope="row">' + esc(h.dias) + "</th><td>" + esc(h.horas) + "</td></tr>";
    }).join("") + "</tbody></table>";
  }

  function paginaLoja(meta) {
    meta.titulo = "Loja física";
    meta.descricao = "Visite a " + LOJA.nome + ": " + LOJA.lojaFisica.endereco + ", " + LOJA.lojaFisica.cidade + ".";
    var lj = LOJA.lojaFisica;
    var q = enc(lj.enderecoMapa);
    return (
      cabecalhoPagina([], "Loja física", "Venha experimentar o seu coturno, conferir o tamanho da farda e ver tudo de perto.") +
      '<div class="loja">' +
      '<div class="bloco loja__info">' +
      "<h2>" + icone("mapa") + "Endereço</h2>" +
      '<p class="loja__endereco">' + esc(lj.endereco) + "<br>" + esc(lj.cidade) + (lj.cep ? " — CEP " + esc(lj.cep) : "") + "</p>" +
      (lj.referencia ? '<p class="dica">' + esc(lj.referencia) + "</p>" : "") +
      '<div class="hero__botoes">' +
      '<a class="btn btn--primario" href="https://www.google.com/maps/search/?api=1&query=' + q + '" target="_blank" rel="noopener">' + icone("navegar") + "Google Maps</a>" +
      '<a class="btn btn--secundario" href="https://waze.com/ul?q=' + q + '&navigate=yes" target="_blank" rel="noopener">' + icone("navegar") + "Waze</a></div>" +
      "<h2>" + icone("relogio") + "Horário de funcionamento</h2>" + horariosHtml() +
      "<h2>" + icone("telefone") + "Fale antes de vir</h2>" +
      '<div class="hero__botoes">' +
      '<a class="btn btn--whats" href="' + linkWhats("Olá! Quero confirmar se tem um produto na loja física antes de ir.") + '" target="_blank" rel="noopener">' + icone("whatsapp") + "WhatsApp</a>" +
      '<a class="btn btn--secundario" href="tel:+55' + PD.somenteDigitos(LOJA.contato.telefone) + '">' + icone("telefone") + esc(LOJA.contato.telefoneExibicao) + "</a></div>" +
      "</div>" +
      '<div class="loja__mapa">' +
      '<iframe title="Mapa com a localização da loja" src="https://www.google.com/maps?q=' + q + '&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>' +
      "</div></div>"
    );
  }

  function paginaContato(meta) {
    meta.titulo = "Contato";
    var c = LOJA.contato;
    var redes = [["instagram", "Instagram", c.instagram], ["facebook", "Facebook", c.facebook], ["tiktok", "TikTok", c.tiktok]]
      .filter(function (r) { return r[2]; })
      .map(function (r) { return '<a class="contato-card" href="' + esc(r[2]) + '" target="_blank" rel="noopener">' + icone(r[0]) + "<strong>" + r[1] + "</strong><span>Siga a loja</span></a>"; })
      .join("");
    return (
      cabecalhoPagina([], "Contato", "Escolha o canal que preferir. O WhatsApp é o jeito mais rápido.") +
      '<div class="contatos">' +
      '<a class="contato-card contato-card--whats" href="' + linkWhats("Olá! Vim pelo site da " + LOJA.nome + ".") + '" target="_blank" rel="noopener">' + icone("whatsapp") + "<strong>WhatsApp</strong><span>" + esc(c.whatsappExibicao) + "</span></a>" +
      '<a class="contato-card" href="tel:+55' + PD.somenteDigitos(c.telefone) + '">' + icone("telefone") + "<strong>Telefone</strong><span>" + esc(c.telefoneExibicao) + "</span></a>" +
      '<a class="contato-card" href="mailto:' + esc(c.email) + '">' + icone("email") + "<strong>E-mail</strong><span>" + esc(c.email) + "</span></a>" +
      '<a class="contato-card" href="#/loja">' + icone("mapa") + "<strong>Loja física</strong><span>" + esc(LOJA.lojaFisica.endereco) + "</span></a>" +
      redes +
      "</div>" +
      '<section class="bloco bloco--estreito"><h2>' + icone("whatsapp") + "Mande sua mensagem</h2>" +
      '<p class="dica">Preencha e enviaremos direto para o nosso WhatsApp.</p>' +
      '<form id="form-contato" class="campos">' +
      '<div class="campo"><label for="c-nome">Seu nome</label><input id="c-nome" required autocomplete="name"></div>' +
      '<div class="campo"><label for="c-assunto">Assunto</label><select id="c-assunto"><option>Dúvida sobre produto</option><option>Disponibilidade / tamanho</option><option>Troca ou garantia</option><option>Compra para empresa / corporação</option><option>Outro</option></select></div>' +
      '<div class="campo campo--largo"><label for="c-msg">Mensagem</label><textarea id="c-msg" rows="4" required></textarea></div>' +
      '<button class="btn btn--whats" type="submit">' + icone("whatsapp") + "Enviar pelo WhatsApp</button>" +
      "</form></section>"
    );
  }

  function ligarContato() {
    var f = $("#form-contato");
    if (!f) return;
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var nome = $("#c-nome").value.trim();
      var msg = $("#c-msg").value.trim();
      if (!nome || !msg) { mostrarAviso("Preencha seu nome e a mensagem."); return; }
      abrirExterno(linkWhats("*" + $("#c-assunto").value + "*\nNome: " + nome + "\n\n" + msg));
    });
  }

  function paginaComoComprar(meta) {
    meta.titulo = "Como comprar";
    var P = LOJA.pedidos;
    var perguntas = [
      ["Preciso criar conta para comprar?", "Não. Você escolhe os produtos, preenche seus dados no pedido e envia pelo WhatsApp. Simples assim."],
      ["Quais as formas de pagamento?", P.pagamentos.join(", ") + "." + (P.descontoPix ? " No Pix você ganha " + P.descontoPix + "% de desconto." : "") + " O pagamento é combinado pelo WhatsApp após a confirmação do pedido."],
      ["Como é calculado o frete?", "Depois de receber seu pedido, calculamos o frete para o seu CEP e informamos pelo WhatsApp antes de você pagar."],
      ["Posso retirar na loja?", "Sim! Escolha \"Retirar na loja física\" no pedido. Avisamos quando estiver separado. Endereço: " + LOJA.lojaFisica.endereco + " — " + LOJA.lojaFisica.cidade + "."],
      ["Não sei meu tamanho. E agora?", "Chame no WhatsApp com a sua numeração habitual que ajudamos a escolher. Na loja física você pode experimentar."],
      ["Como funciona a troca?", LOJA.politicaTrocas.join(" ")],
      ["Os preços do site são definitivos?", "Os preços e a disponibilidade são confirmados no atendimento pelo WhatsApp, pois o estoque é compartilhado com a loja física."]
    ];
    return (
      cabecalhoPagina([], "Como comprar") +
      passosCompra() +
      '<section class="secao"><h2 class="secao__titulo">Perguntas frequentes</h2><div class="faq">' +
      perguntas.map(function (q) { return "<details><summary>" + esc(q[0]) + icone("mais") + "</summary><p>" + esc(q[1]) + "</p></details>"; }).join("") +
      "</div></section>"
    );
  }

  function paginaTexto(meta, titulo, conteudo) {
    meta.titulo = titulo;
    return cabecalhoPagina([], titulo) + '<section class="bloco bloco--texto">' + conteudo + "</section>";
  }

  function pagina404(meta) {
    meta.titulo = "Página não encontrada";
    return (
      '<div class="vazio vazio--grande"><span class="erro-404">404</span><h1>Página não encontrada</h1>' +
      "<p>O produto ou página que você procurou não existe mais ou mudou de endereço.</p>" +
      '<div class="hero__botoes"><a class="btn btn--primario" href="#/">' + icone("inicio") + "Voltar para o início</a>" +
      '<a class="btn btn--secundario" href="#/todos">Ver todos os produtos</a></div></div>'
    );
  }

  /* ===================== eventos que dependem da página ==================== */
  function ligarEventosDaPagina(pagina) {
    $$("[data-voltar]").forEach(function (b) {
      b.addEventListener("click", function () {
        var navegou = false;
        try { navegou = !!sessionStorage.getItem("am011:navegou"); } catch (e) { /* ignora */ }
        if (navegou) history.back();
        else navegar("#/");
      });
    });

    var ordem = $("#ordem");
    if (ordem) ordem.addEventListener("change", function () { trocarFiltro("ordem", ordem.value); });
    var est = $("#filtro-estoque");
    if (est) est.addEventListener("change", function () { trocarFiltro("estoque", est.checked ? "1" : ""); });
    $$("[data-filtro]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        navegar(a.getAttribute("href"), { substituir: true, manterRolagem: true });
      });
    });

    var fb = $("#form-busca-pagina");
    if (fb) fb.addEventListener("submit", function (e) {
      e.preventDefault();
      navegar("#/busca?q=" + enc($("#busca-pagina").value.trim()));
    });

    if (pagina === undefined) ligarBanner();
    if (pagina === "produto" && estadoProduto && $("#comprar-whats")) ligarProduto();
    if (pagina === "pedido") ligarPedido();
    if (pagina === "meus-pedidos") ligarMeusPedidos();
    if (pagina === "contato") ligarContato();
  }

  function trocarFiltro(chave, valor) {
    var r = lerRota();
    if (valor) r.q.set(chave, valor); else r.q.delete(chave);
    var s = r.q.toString();
    navegar("#" + r.caminho + (s ? "?" + s : ""), { substituir: true, manterRolagem: true });
  }

  function ligarBanner() {
    var slides = $$(".hero__slide");
    if (slides.length < 2) return;
    var atual = 0;
    var ir = function (i) {
      atual = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) {
        var on = k === atual;
        s.classList.toggle("ativo", on);
        if (on) s.removeAttribute("aria-hidden"); else s.setAttribute("aria-hidden", "true");
        $$("a", s).forEach(function (a) { if (on) a.removeAttribute("tabindex"); else a.setAttribute("tabindex", "-1"); });
      });
      $$(".hero__ponto").forEach(function (p, k) { p.classList.toggle("ativo", k === atual); });
    };
    $$("[data-banner]").forEach(function (b) {
      b.addEventListener("click", function () { parar(); ir(atual + Number(b.dataset.banner)); });
    });
    $$("[data-ponto]").forEach(function (b) {
      b.addEventListener("click", function () { parar(); ir(Number(b.dataset.ponto)); });
    });
    var parar = function () { clearInterval(timerBanner); };
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      timerBanner = setInterval(function () { ir(atual + 1); }, 6500);
      var hero = $(".hero");
      hero.addEventListener("mouseenter", parar);
      hero.addEventListener("focusin", parar);
    }
  }

  /* ================================ avisos ================================= */
  var timerAviso;
  function esconderAviso() {
    var t = $("#toast");
    if (!t || t.hidden) return;
    clearTimeout(timerAviso);
    t.classList.remove("visivel");
    t.hidden = true;
  }
  function mostrarAviso(html, acao) {
    var t = $("#toast");
    t.innerHTML = "<span>" + html + "</span>" + (acao ? '<a class="toast__acao" href="' + acao.link + '">' + acao.texto + "</a>" : "");
    t.hidden = false;
    requestAnimationFrame(function () { t.classList.add("visivel"); });
    clearTimeout(timerAviso);
    timerAviso = setTimeout(function () {
      t.classList.remove("visivel");
      setTimeout(function () { t.hidden = true; }, 250);
    }, acao ? 5000 : 3200);
  }

  /* =============================== SEO ==================================== */
  function jsonLd(id, dados) {
    removerJsonLd(id);
    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.id = id;
    s.textContent = JSON.stringify(dados);
    document.head.appendChild(s);
  }
  function removerJsonLd(id) {
    var el = document.getElementById(id);
    if (el) el.remove();
  }
  function inserirJsonLdProduto(p) {
    jsonLd("jsonld-produto", {
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.nome,
      description: p.descricao || p.resumo,
      sku: p.id,
      category: categoriaPorId[p.categoria] ? categoriaPorId[p.categoria].nome : "",
      brand: p.marca ? { "@type": "Brand", name: p.marca } : undefined,
      image: p.imagens.length ? p.imagens.map(function (i) { return new URL(i, location.href).href; }) : undefined,
      offers: {
        "@type": "Offer",
        priceCurrency: "BRL",
        price: p.preco.toFixed(2),
        availability: p.disponivel === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
        url: urlDoProduto(p)
      }
    });
  }
  function jsonLdLoja() {
    var lj = LOJA.lojaFisica;
    jsonLd("jsonld-loja", {
      "@context": "https://schema.org",
      "@type": "Store",
      name: LOJA.nome,
      description: LOJA.descricao,
      url: LOJA.urlSite,
      telephone: "+55" + PD.somenteDigitos(LOJA.contato.telefone),
      email: LOJA.contato.email,
      address: { "@type": "PostalAddress", streetAddress: lj.endereco, addressLocality: lj.cidade, postalCode: lj.cep, addressCountry: "BR" },
      sameAs: [LOJA.contato.instagram, LOJA.contato.facebook, LOJA.contato.tiktok].filter(Boolean)
    });
  }

  /* =============================== rodapé ================================== */
  function montarRodape() {
    var c = LOJA.contato;
    var lj = LOJA.lojaFisica;
    var redes = [["instagram", c.instagram, "Instagram"], ["facebook", c.facebook, "Facebook"], ["tiktok", c.tiktok, "TikTok"]]
      .filter(function (r) { return r[1]; })
      .map(function (r) { return '<a class="btn-icone" href="' + esc(r[1]) + '" target="_blank" rel="noopener" aria-label="' + r[2] + '">' + icone(r[0]) + "</a>"; })
      .join("");
    $("#rodape").innerHTML =
      '<div class="rodape__grade">' +
      '<div class="rodape__marca"><a class="logo" href="#/">' + logoHtml() + "</a><p>" + esc(LOJA.descricao) + "</p>" +
      (redes ? '<div class="rodape__redes">' + redes + "</div>" : "") + "</div>" +
      '<div><h2>Categorias</h2><ul>' + LOJA.categorias.map(function (cat) { return '<li><a href="#/categoria/' + enc(cat.id) + '">' + esc(cat.nome) + "</a></li>"; }).join("") + "</ul></div>" +
      '<div><h2>Atendimento</h2><ul>' +
      '<li><a href="#/como-comprar">Como comprar</a></li><li><a href="#/trocas">Trocas e garantia</a></li>' +
      '<li><a href="#/meus-pedidos">Meus pedidos</a></li><li><a href="#/sobre">Sobre a loja</a></li><li><a href="#/privacidade">Privacidade</a></li></ul></div>' +
      '<div><h2>Contato</h2><ul class="rodape__contato">' +
      '<li><a href="' + linkWhats("Olá! Vim pelo site.") + '" target="_blank" rel="noopener">' + icone("whatsapp") + esc(c.whatsappExibicao) + "</a></li>" +
      '<li><a href="tel:+55' + PD.somenteDigitos(c.telefone) + '">' + icone("telefone") + esc(c.telefoneExibicao) + "</a></li>" +
      '<li><a href="mailto:' + esc(c.email) + '">' + icone("email") + esc(c.email) + "</a></li>" +
      '<li><a href="#/loja">' + icone("mapa") + esc(lj.endereco) + " — " + esc(lj.cidade) + "</a></li>" +
      "</ul></div></div>" +
      '<div class="rodape__base"><span>© ' + new Date().getFullYear() + " " + esc(LOJA.nome) + ". Todos os direitos reservados.</span>" +
      "<span>Pedidos finalizados pelo WhatsApp. Preços e estoque sujeitos a confirmação.</span></div>";
  }

  /* ================================ início ================================= */
  function iniciar() {
    montarLateral();
    montarRodape();
    jsonLdLoja();

    $("#abrir-menu").innerHTML = icone("menu");
    $("#abrir-menu").addEventListener("click", abrirMenu);
    $(".barra-movel .logo").innerHTML = logoHtml();
    $(".btn-pedido-movel").innerHTML = icone("pedido") + '<span class="contador" data-contador hidden>0</span>';
    $("#sombra").addEventListener("click", fecharMenu);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") fecharMenu(); });

    var aviso = EM_PREVIA ? "PRÉVIA DO PAINEL — alterações ainda não publicadas. Clientes não veem esta versão." : LOJA.pedidos.avisoTopo;
    if (EM_PREVIA) $("#aviso-topo").classList.add("aviso-topo--previa");
    if (aviso) {
      $("#aviso-topo").textContent = aviso;
      $("#aviso-topo").hidden = false;
    }

    var wf = $("#whats-flutuante");
    wf.href = linkWhats("Olá! Vim pelo site da " + LOJA.nome + ".");
    wf.innerHTML = icone("whatsapp") + '<span class="whats-flutuante__texto">Fale conosco</span>';

    $(".pular").addEventListener("click", function (e) {
      e.preventDefault();
      $("#conteudo").focus();
    });

    window.addEventListener("hashchange", function () {
      try { sessionStorage.setItem("am011:navegou", "1"); } catch (e) { /* ignora */ }
      renderizar();
    });
    // outra aba alterou o carrinho
    window.addEventListener("storage", function (e) {
      if (e.key === CHAVE_CARRINHO) {
        carrinho = armazenamento.ler(CHAVE_CARRINHO, []);
        atualizarContadores();
      }
    });

    renderizar();
    document.body.classList.add("pronto");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
