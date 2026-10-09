/* =====================================================================
   ARTE MILITAR 011 — PAINEL ADMINISTRATIVO
   ---------------------------------------------------------------------
   Edita produtos, fotos, banners, categorias, contatos, pedidos, cores
   e textos. As alterações ficam num rascunho até você clicar em
   "Publicar": aí o painel grava config.js, produtos.js e as fotos
   direto no GitHub (um commit) e o site se atualiza sozinho.

   Acesso: chave do GitHub (token "fine-grained") com permissão
   Contents: Read and write SÓ no repositório da loja. A chave fica
   apenas neste navegador. Guia: docs/PAINEL.md
   ===================================================================== */
(function () {
  "use strict";

  var IL = window.ILUSTRACOES;
  var PD = window.PEDIDO;
  var V = window.VALIDAR;
  var S = window.SERIALIZAR;
  var TM = window.TEMA;
  var R = PD.formatarPreco;

  var PASTA = "site"; // pasta do site dentro do repositório
  var ARQ_CONFIG = PASTA + "/js/config.js";
  var ARQ_PRODUTOS = PASTA + "/js/produtos.js";
  var CHAVE_CONEXAO = "am011:admin:conexao";
  var CHAVE_RASCUNHO = "am011:admin:rascunho";
  var CHAVE_PREVIA = "am011:previa";

  var PREFIXOS = { vestuario: "VES", calcados: "CAL", equipamentos: "EQP", mochilas: "MOC", camping: "CAM", acessorios: "ACS" };
  var ICONES_CATEGORIA = ["camisa", "coturno", "colete", "mochila", "lanterna", "patch"];
  var SELOS_INFO = {
    destaque: "Destaque (vitrine da página inicial)",
    lancamento: "Lançamento (selo Novo)",
    "mais-vendido": "Mais vendido",
    oferta: "Oferta (entra em Ofertas)"
  };
  var TAMANHOS_PRONTOS = [
    ["Calçados 37–45", "37, 38, 39, 40, 41, 42, 43, 44, 45"],
    ["Roupas P–XG", "P, M, G, GG, XG"],
    ["Calças 36–50", "36, 38, 40, 42, 44, 46, 48, 50"],
    ["Tamanho único", "Único"]
  ];

  var estado = {
    conexao: null,
    base: null, // { sha, config, produtos } — versão carregada do GitHub
    loja: null,
    produtos: null,
    novosArquivos: {}, // caminho no repositório -> { base64, dataUrl }
    mudancas: [],
    secao: "produtos",
    editando: null, // id do produto (ou "__novo__")
    rascunhoProduto: null,
    filtro: { texto: "", categoria: "" }
  };
  var ligacoes = {}; // eventos de cada tela

  /* ============================== utilidades ============================== */
  function $(sel, el) { return (el || document).querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }
  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function icone(n, c) { return IL.icone(n, c); }
  function clonar(o) { return JSON.parse(JSON.stringify(o)); }
  function slug(t) {
    return PD.normalizar(t).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "item";
  }
  function idUnico(base, existentes) {
    var id = base, n = 2;
    while (existentes.indexOf(id) !== -1) id = base + "-" + n++;
    return id;
  }
  function lerNumero(t) {
    var s = String(t || "").replace(/[^\d,.-]/g, "");
    if (s.indexOf(",") !== -1) s = s.replace(/\./g, "").replace(",", ".");
    var n = parseFloat(s);
    return isFinite(n) ? Math.round(n * 100) / 100 : 0;
  }
  function numeroParaCampo(n) { return n ? String(n.toFixed(2)).replace(".", ",") : ""; }
  function linhas(t) { return String(t || "").split("\n").map(function (l) { return l.trim(); }).filter(Boolean); }
  function lista(t) { return String(t || "").split(/[,;\n]/).map(function (l) { return l.trim(); }).filter(Boolean); }
  function getCaminho(obj, caminho) {
    return caminho.split(".").reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }
  function setCaminho(obj, caminho, valor) {
    var partes = caminho.split(".");
    var alvo = partes.slice(0, -1).reduce(function (o, k) { return o[k]; }, obj);
    alvo[partes[partes.length - 1]] = valor;
  }
  function formatarTelefone(d) {
    d = PD.somenteDigitos(d).replace(/^55(?=\d{10,11}$)/, "");
    if (d.length === 11) return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
    if (d.length === 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
    return d;
  }
  function guardar(chave, valor, local) {
    try {
      (local ? localStorage : sessionStorage).setItem(chave, JSON.stringify(valor));
      return true;
    } catch (e) { return false; }
  }
  function ler(chave) {
    try {
      var v = sessionStorage.getItem(chave) || localStorage.getItem(chave);
      return v ? JSON.parse(v) : null;
    } catch (e) { return null; }
  }
  function apagar(chave) {
    try { sessionStorage.removeItem(chave); localStorage.removeItem(chave); } catch (e) { /* ignora */ }
  }
  function textoParaBase64(texto) {
    var bytes = new TextEncoder().encode(texto);
    var bin = "";
    for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function base64ParaTexto(b64) {
    var bin = atob(b64.replace(/\s/g, ""));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  var timerAviso;
  function aviso(html, tipo) {
    var t = $("#toast");
    t.innerHTML = "<span>" + html + "</span>";
    t.className = "toast" + (tipo === "erro" ? " toast--erro" : "");
    t.hidden = false;
    requestAnimationFrame(function () { t.classList.add("visivel"); });
    clearTimeout(timerAviso);
    timerAviso = setTimeout(function () {
      t.classList.remove("visivel");
      setTimeout(function () { t.hidden = true; }, 250);
    }, tipo === "erro" ? 6000 : 3200);
  }

  /* =============================== GitHub ================================= */
  function repoPadrao() {
    // https://dono.github.io/repositorio/admin/ → dono/repositorio
    var m = location.hostname.match(/^([^.]+)\.github\.io$/i);
    var pasta = location.pathname.split("/").filter(Boolean)[0];
    if (m && pasta && pasta !== "admin") return { dono: m[1], repo: pasta };
    return { dono: "WillianCoder", repo: "arte-militar-011" };
  }

  function api(metodo, caminho, corpo) {
    var c = estado.conexao;
    return fetch("https://api.github.com" + caminho, {
      method: metodo,
      cache: "no-store",
      headers: Object.assign(
        { Authorization: "Bearer " + c.token, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
        corpo ? { "Content-Type": "application/json" } : {}
      ),
      body: corpo ? JSON.stringify(corpo) : undefined
    }).then(function (r) {
      return r.text().then(function (t) {
        var dados = null;
        try { dados = t ? JSON.parse(t) : null; } catch (e) { /* corpo não-JSON */ }
        if (!r.ok) throw erroGitHub(r.status, dados);
        return dados;
      });
    }, function () {
      throw new Error("Sem conexão com o GitHub. Confira a internet e tente de novo.");
    });
  }

  function erroGitHub(status, dados) {
    var msg = (dados && dados.message) || "";
    var e = new Error(
      status === 401 ? "Chave de acesso inválida ou vencida. Gere uma nova (veja o passo a passo)." :
      status === 403 ? "A chave não tem permissão de gravar. Ela precisa de Contents: Read and write neste repositório." :
      status === 404 ? "Repositório não encontrado, ou a chave não tem acesso a ele. Confira o nome do repositório e o acesso da chave." :
      status === 409 || status === 422 ? "O site foi alterado em outro lugar enquanto você editava. Seu rascunho está salvo: recarregue a página para continuar." :
      "Erro do GitHub (" + status + "): " + msg
    );
    e.status = status;
    return e;
  }

  function caminhoRepo() { return "/repos/" + estado.conexao.dono + "/" + estado.conexao.repo; }

  function lerArquivo(caminho, sha) {
    return api("GET", caminhoRepo() + "/contents/" + caminho + "?ref=" + sha).then(function (d) {
      return base64ParaTexto(d.content);
    });
  }

  function carregarDoGitHub() {
    var c = estado.conexao;
    return api("GET", caminhoRepo() + "/git/ref/heads/" + c.branch).then(function (ref) {
      var sha = ref.object.sha;
      return Promise.all([lerArquivo(ARQ_CONFIG, sha), lerArquivo(ARQ_PRODUTOS, sha)]).then(function (t) {
        return { sha: sha, config: t[0], produtos: t[1] };
      });
    });
  }

  /* Publica tudo num único commit (config.js + produtos.js + fotos novas) */
  function publicarNoGitHub(mensagem) {
    var c = estado.conexao;
    var base = estado.base;
    var textoConfig = S.gerarConfigJs(estado.loja);
    var textoProdutos = S.gerarProdutosJs(estado.produtos);

    return api("GET", caminhoRepo() + "/git/ref/heads/" + c.branch)
      .then(function (ref) {
        var atual = ref.object.sha;
        if (atual === base.sha) return atual;
        // alguém mudou o repositório: só segue se config.js e produtos.js continuam iguais
        return Promise.all([lerArquivo(ARQ_CONFIG, atual), lerArquivo(ARQ_PRODUTOS, atual)]).then(function (t) {
          if (t[0] !== base.config || t[1] !== base.produtos) throw erroGitHub(409);
          return atual;
        });
      })
      .then(function (pai) {
        return api("GET", caminhoRepo() + "/git/commits/" + pai).then(function (commit) {
          var arquivos = [
            { path: ARQ_CONFIG, content: textoConfig, encoding: "utf-8" },
            { path: ARQ_PRODUTOS, content: textoProdutos, encoding: "utf-8" }
          ];
          Object.keys(estado.novosArquivos).forEach(function (caminho) {
            if (arquivoEmUso(caminho)) arquivos.push({ path: caminho, content: estado.novosArquivos[caminho].base64, encoding: "base64" });
          });
          return Promise.all(arquivos.map(function (a) {
            return api("POST", caminhoRepo() + "/git/blobs", { content: a.content, encoding: a.encoding }).then(function (b) {
              return { path: a.path, mode: "100644", type: "blob", sha: b.sha };
            });
          })).then(function (itens) {
            return api("POST", caminhoRepo() + "/git/trees", { base_tree: commit.tree.sha, tree: itens });
          }).then(function (arvore) {
            return api("POST", caminhoRepo() + "/git/commits", { message: mensagem, tree: arvore.sha, parents: [pai] });
          }).then(function (novo) {
            return api("PATCH", caminhoRepo() + "/git/refs/heads/" + c.branch, { sha: novo.sha }).then(function () {
              estado.base = { sha: novo.sha, config: textoConfig, produtos: textoProdutos };
              return novo.sha;
            });
          });
        });
      });
  }

  function arquivoEmUso(caminhoRepo) {
    var rel = caminhoRepo.replace(PASTA + "/", "");
    var usados = JSON.stringify(estado.produtos) + JSON.stringify(estado.loja.banners);
    return usados.indexOf('"' + rel + '"') !== -1;
  }

  /* ============================== rascunho ================================ */
  function marcarMudanca(descricao) {
    if (descricao && estado.mudancas.indexOf(descricao) === -1) estado.mudancas.push(descricao);
    salvarRascunho();
    atualizarBarra();
  }

  function salvarRascunho() {
    var r = {
      baseSha: estado.base.sha,
      loja: estado.loja,
      produtos: estado.produtos,
      mudancas: estado.mudancas,
      novosArquivos: estado.novosArquivos
    };
    if (!guardar(CHAVE_RASCUNHO, r, true)) {
      // fotos grandes podem não caber no navegador: guarda sem elas
      r.novosArquivos = {};
      guardar(CHAVE_RASCUNHO, r, true);
    }
  }

  function temMudancas() { return estado.mudancas.length > 0; }

  window.addEventListener("beforeunload", function (e) {
    if (estado.base && temMudancas()) { e.preventDefault(); e.returnValue = ""; }
  });

  /* ================================ telas ================================ */
  function telaEntrar(erro) {
    var c = ler(CHAVE_CONEXAO) || {};
    var padrao = repoPadrao();
    $("#adm").innerHTML =
      '<div class="adm-entrar">' +
      '<div class="adm-entrar__caixa">' +
      '<div class="adm-entrar__logo"><img src="../img/favicon.svg" alt="" width="56" height="56"><div><strong>Painel</strong><span>Arte Militar 011</span></div></div>' +
      (erro ? '<p class="alerta">' + esc(erro) + "</p>" : "") +
      '<form id="form-entrar" class="campos">' +
      '<div class="campo campo--largo"><label for="token">Chave de acesso do GitHub</label>' +
      '<input id="token" type="password" autocomplete="off" placeholder="github_pat_..." value="' + esc(c.token || "") + '" required></div>' +
      '<label class="caixa campo--largo"><input type="checkbox" id="lembrar"' + (c.lembrar ? " checked" : "") + "> Lembrar neste aparelho (só no seu computador/celular pessoal)</label>" +
      '<details class="adm-avancado campo--largo"><summary>Repositório</summary><div class="campos">' +
      '<div class="campo"><label for="repo">Repositório (dono/nome)</label><input id="repo" value="' + esc((c.dono || padrao.dono) + "/" + (c.repo || padrao.repo)) + '"></div>' +
      '<div class="campo"><label for="branch">Branch</label><input id="branch" value="' + esc(c.branch || "main") + '"></div>' +
      "</div></details>" +
      '<button class="btn btn--primario btn--grande campo--largo" type="submit">Entrar no painel</button>' +
      "</form>" +
      '<details class="adm-ajuda" open><summary>Como conseguir a chave (uma vez só)</summary><ol>' +
      '<li><a class="btn btn--primario" href="' + esc(linkNovaChave(padrao)) + '" target="_blank" rel="noopener">Criar minha chave no GitHub</a><br>(abre o formulário já preenchido; entre na sua conta se pedir)</li>' +
      "<li>Confira: <b>Token name</b> Painel Arte Militar 011 · <b>Expiration</b> 1 ano (preencha se vier vazio).</li>" +
      "<li><b>Repository access:</b> <i>Only select repositories</i> → escolha <b>" + esc(padrao.repo) + "</b>.</li>" +
      "<li><b>Permissions → Repository permissions → Contents:</b> <i>Read and write</i> (confira).</li>" +
      "<li>Clique em <b>Generate token</b>, copie a chave (começa com <code>github_pat_</code>) e cole acima.</li>" +
      "</ol><p>A chave fica só neste navegador e só consegue mexer no repositório da loja. Se perder o celular/computador, apague a chave no mesmo endereço do GitHub.</p></details>" +
      "</div></div>";

    $("#form-entrar").addEventListener("submit", function (e) {
      e.preventDefault();
      var partes = $("#repo").value.trim().split("/");
      var conexao = {
        token: $("#token").value.trim(),
        dono: (partes[0] || "").trim(),
        repo: (partes[1] || "").trim(),
        branch: $("#branch").value.trim() || "main",
        lembrar: $("#lembrar").checked
      };
      if (!conexao.token || !conexao.dono || !conexao.repo) return aviso("Preencha a chave e o repositório.", "erro");
      apagar(CHAVE_CONEXAO);
      guardar(CHAVE_CONEXAO, conexao, conexao.lembrar);
      estado.conexao = conexao;
      iniciarPainel();
    });
  }

  /* Formulário de criação da chave já preenchido (nome, prazo e permissão) */
  function linkNovaChave(repo) {
    return "https://github.com/settings/personal-access-tokens/new?" + [
      "name=" + encodeURIComponent("Painel Arte Militar 011"),
      "description=" + encodeURIComponent("Acesso do painel administrativo da loja"),
      "target_name=" + encodeURIComponent(repo.dono),
      "expires_in=366",
      "contents=write"
    ].join("&");
  }

  function iniciarPainel() {
    $("#adm").innerHTML = '<p class="adm-carregando">Buscando os dados da loja no GitHub...</p>';
    carregarDoGitHub().then(function (base) {
      estado.base = base;
      var dados = S.lerDados(base.config, base.produtos);
      estado.loja = dados.loja;
      estado.produtos = dados.produtos;
      estado.novosArquivos = {};
      estado.mudancas = [];
      var r = ler(CHAVE_RASCUNHO);
      if (r && r.mudancas && r.mudancas.length) {
        if (r.baseSha === base.sha) {
          if (confirm("Você tem alterações não publicadas (" + r.mudancas.length + "). Quer continuar de onde parou?\n\nOK = continuar · Cancelar = descartar")) {
            estado.loja = r.loja;
            estado.produtos = r.produtos;
            estado.mudancas = r.mudancas;
            estado.novosArquivos = r.novosArquivos || {};
          } else apagar(CHAVE_RASCUNHO);
        } else {
          alert("Havia um rascunho antigo, mas o site foi atualizado depois dele. Ele foi descartado para não sobrescrever as mudanças mais novas.");
          apagar(CHAVE_RASCUNHO);
        }
      }
      window.LOJA = estado.loja; // as ilustrações usam as cores da loja
      montarEstrutura();
    }).catch(function (e) {
      telaEntrar(e.message);
    });
  }

  var SECOES = [
    ["produtos", "lista", "Produtos"],
    ["banners", "estrela", "Banners da home"],
    ["categorias", "camisa", "Categorias"],
    ["loja", "loja", "Loja e contatos"],
    ["pedidos", "pedido", "Pedidos e pagamento"],
    ["tema", "paleta", "Cores do site"],
    ["cores", "tag", "Cores dos produtos"],
    ["textos", "info", "Textos"]
  ];

  function montarEstrutura() {
    $("#adm").innerHTML =
      '<div class="adm-app">' +
      '<aside class="adm-lateral">' +
      '<div class="adm-lateral__topo"><img src="../img/favicon.svg" alt="" width="40" height="40"><div><strong>Painel</strong><span>' + esc(estado.loja.nome) + "</span></div></div>" +
      '<nav class="adm-nav">' +
      SECOES.map(function (s) {
        return '<button type="button" class="adm-nav__item" data-secao="' + s[0] + '">' + icone(s[1]) + "<span>" + s[2] + "</span></button>";
      }).join("") +
      "</nav>" +
      '<div class="adm-lateral__rodape">' +
      '<div class="adm-status" id="adm-status"></div>' +
      '<button type="button" class="btn btn--whats btn--bloco" id="btn-publicar">' + icone("check") + "Publicar no site</button>" +
      '<button type="button" class="btn btn--secundario btn--bloco" id="btn-previa">' + icone("busca") + "Ver prévia</button>" +
      '<button type="button" class="link-seta link-seta--perigo" id="btn-descartar">' + icone("lixeira") + "Descartar alterações</button>" +
      '<a class="link-seta" href="../" target="_blank" rel="noopener">' + icone("loja") + "Abrir o site</a>" +
      '<button type="button" class="link-seta" id="btn-sair">' + icone("voltar") + "Sair</button>" +
      "</div></aside>" +
      '<main class="adm-principal" id="adm-principal" tabindex="-1"></main>' +
      "</div>";

    $$(".adm-nav__item").forEach(function (b) {
      b.addEventListener("click", function () {
        if (estado.editando && !confirm("Sair da edição deste produto sem salvar?")) return;
        estado.editando = null;
        estado.secao = b.dataset.secao;
        renderizar();
      });
    });
    $("#btn-publicar").addEventListener("click", abrirPublicar);
    $("#btn-previa").addEventListener("click", abrirPrevia);
    $("#btn-descartar").addEventListener("click", function () {
      if (!temMudancas()) return aviso("Não há alterações para descartar.");
      if (!confirm("Descartar TODAS as alterações não publicadas?")) return;
      apagar(CHAVE_RASCUNHO);
      iniciarPainel();
    });
    $("#btn-sair").addEventListener("click", function () {
      if (temMudancas() && !confirm("Suas alterações não publicadas continuam salvas neste navegador. Sair mesmo assim?")) return;
      apagar(CHAVE_CONEXAO);
      estado.conexao = null;
      telaEntrar();
    });
    renderizar();
  }

  function atualizarBarra() {
    var n = estado.mudancas.length;
    var st = $("#adm-status");
    if (!st) return;
    st.innerHTML = n
      ? "<strong>" + n + (n === 1 ? " alteração" : " alterações") + " não publicada" + (n === 1 ? "" : "s") + "</strong>" +
        '<ul class="adm-status__lista">' + estado.mudancas.slice(-6).map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("") + (n > 6 ? "<li>…</li>" : "") + "</ul>"
      : '<span class="adm-status__ok">' + icone("check") + "Tudo publicado</span>";
    $("#btn-publicar").disabled = !n;
    $$(".adm-nav__item").forEach(function (b) { b.classList.toggle("ativo", b.dataset.secao === estado.secao); });
  }

  function renderizar() {
    var tela = {
      produtos: estado.editando ? telaEditarProduto : telaProdutos,
      banners: telaBanners,
      categorias: telaCategorias,
      loja: telaLoja,
      pedidos: telaPedidos,
      tema: telaTema,
      cores: telaCores,
      textos: telaTextos
    }[estado.secao];
    // cada tela ganha um contêiner novo: os eventos antigos somem junto com ele
    var main = $("#adm-principal");
    main.innerHTML = '<div class="adm-tela">' + tela() + "</div>";
    var tela_ = main.firstChild;
    ligarCamposSimples(tela_);
    if (ligacoes[estado.secao]) ligacoes[estado.secao](tela_);
    atualizarBarra();
    window.scrollTo(0, 0);
  }

  function cabecalho(titulo, sub, acoes) {
    return (
      '<div class="adm-cabecalho"><div><h1>' + titulo + "</h1>" + (sub ? "<p>" + sub + "</p>" : "") + "</div>" +
      (acoes ? '<div class="adm-cabecalho__acoes">' + acoes + "</div>" : "") + "</div>"
    );
  }

  /* --- campos ligados direto em estado.loja (data-campo="contato.email") --- */
  function campo(rotulo, caminho, opcoes) {
    opcoes = opcoes || {};
    var valor = getCaminho(estado.loja, caminho);
    var tipo = opcoes.tipo || "texto";
    var id = "c-" + caminho.replace(/\./g, "-");
    var attrs = 'id="' + id + '" data-campo="' + esc(caminho) + '" data-tipo="' + tipo + '" data-desc="' + esc(opcoes.desc || rotulo) + '"' + (opcoes.placeholder ? ' placeholder="' + esc(opcoes.placeholder) + '"' : "");
    var entrada;
    if (tipo === "area") entrada = "<textarea " + attrs + ' rows="' + (opcoes.linhas || 3) + '">' + esc(valor) + "</textarea>";
    else if (tipo === "linhas") entrada = "<textarea " + attrs + ' rows="' + (opcoes.linhas || 4) + '">' + esc((valor || []).join("\n")) + "</textarea>";
    else if (tipo === "numero") entrada = "<input " + attrs + ' inputmode="decimal" value="' + esc(valor) + '">';
    else entrada = "<input " + attrs + ' value="' + esc(valor) + '">';
    return '<div class="campo' + (opcoes.largo ? " campo--largo" : "") + '"><label for="' + id + '">' + rotulo + "</label>" + entrada +
      (opcoes.dica ? '<p class="dica">' + opcoes.dica + "</p>" : "") + "</div>";
  }

  function ligarCamposSimples(raiz) {
    $$("[data-campo]", raiz).forEach(function (el) {
      el.addEventListener("input", function () {
        var t = el.dataset.tipo;
        var v = t === "linhas" ? linhas(el.value) : t === "numero" ? lerNumero(el.value) : el.value;
        setCaminho(estado.loja, el.dataset.campo, v);
        marcarMudanca(el.dataset.desc);
      });
    });
  }

  function midiaMini(p, cor) {
    var foto = (p.imagens || [])[0];
    if (foto) return '<img src="' + esc(urlFoto(foto)) + '" alt="" loading="lazy">';
    return IL.ilustracao((p.ilustracao || {}).tipo, cor || (p.ilustracao || {}).cor, "");
  }

  function urlFoto(rel) {
    var novo = estado.novosArquivos[PASTA + "/" + rel];
    return novo ? novo.dataUrl : "../" + rel;
  }

  /* =============================== PRODUTOS =============================== */
  function nomeCategoria(id) {
    var c = estado.loja.categorias.find(function (x) { return x.id === id; });
    return c ? c.nome : id;
  }
  function nomeSub(p) {
    var c = estado.loja.categorias.find(function (x) { return x.id === p.categoria; });
    var s = c && (c.subcategorias || []).find(function (x) { return x.id === p.subcategoria; });
    return s ? s.nome : "";
  }

  function telaProdutos() {
    var f = estado.filtro;
    var termo = PD.normalizar(f.texto);
    var lista = estado.produtos.filter(function (p) {
      return (!f.categoria || p.categoria === f.categoria) &&
        (!termo || PD.normalizar(p.nome + " " + p.codigo + " " + nomeSub(p)).indexOf(termo) !== -1);
    });
    var semFoto = estado.produtos.filter(function (p) { return !(p.imagens || []).length; }).length;
    return (
      cabecalho("Produtos", estado.produtos.length + " produtos · " + semFoto + " ainda sem foto real",
        '<button type="button" class="btn btn--primario" id="novo-produto">' + icone("mais") + "Novo produto</button>") +
      '<div class="adm-filtros">' +
      '<div class="busca"><label class="sr" for="filtro-texto">Buscar</label>' + icone("busca", "busca__icone") +
      '<input id="filtro-texto" type="search" placeholder="Buscar por nome ou código (ex.: CAL-001)" value="' + esc(f.texto) + '"></div>' +
      '<select id="filtro-categoria" aria-label="Categoria"><option value="">Todas as categorias</option>' +
      estado.loja.categorias.map(function (c) { return '<option value="' + esc(c.id) + '"' + (f.categoria === c.id ? " selected" : "") + ">" + esc(c.nome) + "</option>"; }).join("") +
      "</select></div>" +
      '<div class="adm-produtos" id="lista-produtos">' +
      (lista.length ? lista.map(linhaProduto).join("") : '<p class="vazio">Nenhum produto encontrado.</p>') +
      "</div>"
    );
  }

  function linhaProduto(p) {
    var desc = PD.descontoPercentual(p);
    return (
      '<div class="adm-produto' + (p.disponivel === false ? " adm-produto--esgotado" : "") + '" data-id="' + esc(p.id) + '">' +
      '<button type="button" class="adm-produto__midia" data-acao="editar" aria-label="Editar ' + esc(p.nome) + '">' + midiaMini(p) + "</button>" +
      '<div class="adm-produto__info">' +
      '<span class="adm-codigo">' + esc(p.codigo) + "</span>" +
      '<button type="button" class="adm-produto__nome" data-acao="editar">' + esc(p.nome) + "</button>" +
      '<span class="adm-produto__cat">' + esc(nomeCategoria(p.categoria)) + " › " + esc(nomeSub(p)) + "</span>" +
      "</div>" +
      '<div class="adm-produto__preco"><strong>' + R(p.preco) + "</strong>" + (desc ? '<span class="selo selo--oferta">-' + desc + "%</span>" : "") +
      ((p.imagens || []).length ? '<span class="adm-tag">' + p.imagens.length + " foto" + (p.imagens.length > 1 ? "s" : "") + "</span>" : '<span class="adm-tag adm-tag--alerta">sem foto</span>') + "</div>" +
      '<label class="adm-interruptor" title="À venda / esgotado"><input type="checkbox" data-acao="disponivel"' + (p.disponivel === false ? "" : " checked") + '><span></span><em>' + (p.disponivel === false ? "Esgotado" : "À venda") + "</em></label>" +
      '<div class="adm-produto__acoes">' +
      '<button type="button" class="btn btn--secundario" data-acao="editar">' + icone("info") + "Editar</button>" +
      '<button type="button" class="btn-icone" data-acao="duplicar" title="Duplicar" aria-label="Duplicar ' + esc(p.nome) + '">' + icone("lista") + "</button>" +
      '<button type="button" class="btn-icone" data-acao="excluir" title="Excluir" aria-label="Excluir ' + esc(p.nome) + '">' + icone("lixeira") + "</button>" +
      "</div></div>"
    );
  }

  function proximoCodigo(categoria) {
    var pre = PREFIXOS[categoria] || slug(categoria).replace(/-/g, "").slice(0, 3).toUpperCase().padEnd(3, "X");
    var usados = estado.produtos.map(function (p) { return p.codigo; });
    var n = 1;
    while (usados.indexOf(pre + "-" + ("00" + n).slice(-3)) !== -1) n++;
    return pre + "-" + ("00" + n).slice(-3);
  }

  function produtoVazio() {
    var cat = estado.loja.categorias[0];
    return {
      id: "",
      codigo: proximoCodigo(cat.id),
      nome: "",
      categoria: cat.id,
      subcategoria: ((cat.subcategorias || [])[0] || {}).id || "",
      preco: 0,
      precoAntigo: 0,
      imagens: [],
      ilustracao: { tipo: "mochila", cor: "Preto" },
      resumo: "",
      descricao: "",
      destaques: [],
      especificacoes: {},
      variacoes: {},
      disponivel: true,
      selos: []
    };
  }

  ligacoesProdutos();
  function ligacoesProdutos() {
    ligacoes.produtos = function (raiz) {
      if (estado.editando) return ligarEditor(raiz);
      $("#novo-produto", raiz).addEventListener("click", function () {
        estado.editando = "__novo__";
        estado.rascunhoProduto = produtoVazio();
        renderizar();
      });
      var t;
      $("#filtro-texto", raiz).addEventListener("input", function (e) {
        clearTimeout(t);
        t = setTimeout(function () {
          estado.filtro.texto = e.target.value;
          var tmp = document.createElement("div");
          tmp.innerHTML = telaProdutos();
          $("#lista-produtos", raiz).replaceWith($("#lista-produtos", tmp));
        }, 200);
      });
      $("#filtro-categoria", raiz).addEventListener("change", function (e) {
        estado.filtro.categoria = e.target.value;
        renderizar();
      });
      raiz.addEventListener("click", function (e) {
        var b = e.target.closest("[data-acao]");
        if (!b || b.dataset.acao === "disponivel") return;
        var id = b.closest("[data-id]").dataset.id;
        var p = estado.produtos.find(function (x) { return x.id === id; });
        if (b.dataset.acao === "editar") {
          estado.editando = id;
          estado.rascunhoProduto = clonar(p);
          renderizar();
        } else if (b.dataset.acao === "duplicar") {
          var copia = clonar(p);
          copia.nome = p.nome + " (cópia)";
          copia.codigo = proximoCodigo(p.categoria);
          copia.id = "";
          copia.imagens = [];
          estado.editando = "__novo__";
          estado.rascunhoProduto = copia;
          renderizar();
          aviso("Cópia criada. Ajuste o que precisar e clique em Salvar produto.");
        } else if (b.dataset.acao === "excluir") {
          if (!confirm("Excluir \"" + p.nome + "\" (" + p.codigo + ")?\n\nEle sai do site quando você publicar.")) return;
          estado.produtos = estado.produtos.filter(function (x) { return x.id !== id; });
          marcarMudanca("Excluiu " + p.codigo + " " + p.nome);
          renderizar();
        }
      });
      raiz.addEventListener("change", function (e) {
        if (e.target.dataset.acao !== "disponivel") return;
        var linha = e.target.closest("[data-id]");
        var p = estado.produtos.find(function (x) { return x.id === linha.dataset.id; });
        p.disponivel = e.target.checked;
        linha.classList.toggle("adm-produto--esgotado", !p.disponivel);
        $("em", e.target.parentElement).textContent = p.disponivel ? "À venda" : "Esgotado";
        marcarMudanca((p.disponivel ? "Voltou à venda: " : "Esgotado: ") + p.codigo);
      });
    };
  }

  /* ---------------------------- editor de produto ---------------------------- */
  function telaEditarProduto() {
    var p = estado.rascunhoProduto;
    var novo = estado.editando === "__novo__";
    var cat = estado.loja.categorias.find(function (c) { return c.id === p.categoria; }) || estado.loja.categorias[0];
    var v = p.variacoes || {};
    var outras = Object.keys(v).filter(function (k) { return k !== "Tamanho" && k !== "Cor"; });
    var nomesCores = Object.keys(estado.loja.cores);
    var specs = Object.keys(p.especificacoes || {}).map(function (k) { return k + ": " + p.especificacoes[k]; }).join("\n");

    return (
      '<button type="button" class="btn-voltar" id="voltar-lista">' + icone("voltar") + "Voltar para a lista</button>" +
      cabecalho(novo ? "Novo produto" : "Editar produto", novo ? "Preencha e clique em <b>Salvar produto</b>. Depois, <b>Publicar no site</b>." : esc(p.codigo + " · " + p.nome)) +
      '<form id="form-produto" class="adm-editor" novalidate>' +
      '<div class="adm-editor__principal">' +

      '<fieldset class="bloco"><legend>' + icone("info") + "Básico</legend><div class=\"campos\">" +
      '<div class="campo campo--largo"><label for="p-nome">Nome do produto *</label><input id="p-nome" value="' + esc(p.nome) + '" required maxlength="90" placeholder="Ex.: Coturno Tático Cano Alto"></div>' +
      '<div class="campo"><label for="p-categoria">Categoria *</label><select id="p-categoria">' +
      estado.loja.categorias.map(function (c) { return '<option value="' + esc(c.id) + '"' + (c.id === p.categoria ? " selected" : "") + ">" + esc(c.nome) + "</option>"; }).join("") +
      "</select></div>" +
      '<div class="campo"><label for="p-sub">Subcategoria *</label><select id="p-sub">' + opcoesSub(cat, p.subcategoria) + "</select></div>" +
      '<div class="campo"><label for="p-codigo">Código</label><input id="p-codigo" value="' + esc(p.codigo) + '" maxlength="8"><p class="dica">Aparece no pedido do WhatsApp. Ex.: CAL-001</p></div>' +
      '<div class="campo"><label for="p-marca">Marca (opcional)</label><input id="p-marca" value="' + esc(p.marca || "") + '"></div>' +
      "</div></fieldset>" +

      '<fieldset class="bloco"><legend>' + icone("tag") + "Preço</legend><div class=\"campos\">" +
      '<div class="campo"><label for="p-preco">Preço de venda (R$) *</label><input id="p-preco" inputmode="decimal" value="' + esc(numeroParaCampo(p.preco)) + '" placeholder="289,90"></div>' +
      '<div class="campo"><label for="p-antigo">Preço antigo — para promoção (R$)</label><input id="p-antigo" inputmode="decimal" value="' + esc(numeroParaCampo(p.precoAntigo)) + '" placeholder="vazio = sem promoção"></div>' +
      '<p class="dica campo--largo" id="p-info-preco"></p>' +
      "</div></fieldset>" +

      '<fieldset class="bloco"><legend>' + icone("busca") + "Fotos</legend>" +
      '<div class="adm-fotos" id="p-fotos"></div>' +
      '<label class="btn btn--secundario adm-upload">' + icone("mais") + "Adicionar fotos<input type=\"file\" id=\"p-arquivos\" accept=\"image/*\" multiple hidden></label>" +
      '<p class="dica">A primeira foto é a capa. As fotos são reduzidas e comprimidas automaticamente (o site continua rápido). Ideal: foto quadrada, fundo claro.</p>' +
      '<div class="campos adm-ilustracao"><p class="dica campo--largo">Sem foto, o site mostra este desenho:</p>' +
      '<div class="campo"><label for="p-il-tipo">Desenho</label><select id="p-il-tipo">' +
      IL.tipos.map(function (t) { return '<option value="' + t + '"' + (t === (p.ilustracao || {}).tipo ? " selected" : "") + ">" + t + "</option>"; }).join("") +
      "</select></div>" +
      '<div class="campo"><label for="p-il-cor">Cor do desenho</label><select id="p-il-cor">' +
      nomesCores.map(function (c) { return '<option' + (c === (p.ilustracao || {}).cor ? " selected" : "") + ">" + esc(c) + "</option>"; }).join("") +
      "</select></div></div>" +
      "</fieldset>" +

      '<fieldset class="bloco"><legend>' + icone("lista") + "Descrição</legend><div class=\"campos\">" +
      '<div class="campo campo--largo"><label for="p-resumo">Resumo (uma frase — aparece no card e no WhatsApp)</label><input id="p-resumo" maxlength="140" value="' + esc(p.resumo) + '"></div>' +
      '<div class="campo campo--largo"><label for="p-descricao">Descrição completa</label><textarea id="p-descricao" rows="5">' + esc(p.descricao) + "</textarea></div>" +
      '<div class="campo"><label for="p-destaques">Pontos fortes (um por linha)</label><textarea id="p-destaques" rows="5" placeholder="Solado antiderrapante&#10;Palmilha anatômica">' + esc((p.destaques || []).join("\n")) + "</textarea></div>" +
      '<div class="campo"><label for="p-specs">Especificações (uma por linha: Nome: valor)</label><textarea id="p-specs" rows="5" placeholder="Material: Couro&#10;Garantia: 90 dias">' + esc(specs) + "</textarea></div>" +
      "</div></fieldset>" +

      '<fieldset class="bloco"><legend>' + icone("filtro") + "Tamanhos, cores e opções</legend><div class=\"campos\">" +
      '<div class="campo campo--largo"><label for="p-tamanhos">Tamanhos (separados por vírgula)</label><input id="p-tamanhos" value="' + esc((v.Tamanho || []).join(", ")) + '" placeholder="vazio = sem tamanho">' +
      '<div class="adm-atalhos">' + TAMANHOS_PRONTOS.map(function (t) { return '<button type="button" class="chip" data-tamanhos="' + esc(t[1]) + '">' + esc(t[0]) + "</button>"; }).join("") + "</div></div>" +
      '<div class="campo campo--largo"><span class="adm-rotulo">Cores disponíveis (clique para marcar)</span><div class="adm-cores" id="p-cores">' +
      nomesCores.map(function (c) {
        var on = (v.Cor || []).indexOf(c) !== -1;
        return '<button type="button" class="chip chip--cor' + (on ? " ativo" : "") + '" data-cor="' + esc(c) + '" aria-pressed="' + on + '"><span class="bolinha" style="background:' + amostra(c) + '"></span>' + esc(c) + "</button>";
      }).join("") +
      '</div><p class="dica">Escolher cores faz o cliente selecionar a cor no site. A ordem dos cliques é a ordem no site.</p></div>' +
      '<div class="campo campo--largo"><label for="p-outras">Outras opções (uma por linha: Nome: opção1, opção2)</label><textarea id="p-outras" rows="2" placeholder="Lado: Destro, Canhoto">' +
      esc(outras.map(function (k) { return k + ": " + v[k].join(", "); }).join("\n")) + "</textarea></div>" +
      "</div></fieldset>" +

      '<fieldset class="bloco"><legend>' + icone("estrela") + "Vitrine</legend>" +
      '<label class="adm-interruptor adm-interruptor--grande"><input type="checkbox" id="p-disponivel"' + (p.disponivel === false ? "" : " checked") + "><span></span><em>À venda (desmarque para mostrar como Esgotado)</em></label>" +
      '<div class="adm-selos">' + Object.keys(SELOS_INFO).map(function (s) {
        return '<label class="caixa"><input type="checkbox" data-selo="' + s + '"' + ((p.selos || []).indexOf(s) !== -1 ? " checked" : "") + "> " + SELOS_INFO[s] + "</label>";
      }).join("") + "</div>" +
      "</fieldset>" +
      "</div>" +

      '<aside class="adm-editor__lado">' +
      '<div class="adm-previa-card" id="p-previa"></div>' +
      '<p class="erro-campo" id="p-erros" hidden></p>' +
      '<button type="submit" class="btn btn--primario btn--bloco btn--grande">' + icone("check") + "Salvar produto</button>" +
      '<button type="button" class="btn btn--secundario btn--bloco" id="cancelar-produto">Cancelar</button>' +
      '<p class="dica">Salvar guarda no rascunho. O cliente só vê depois de <b>Publicar no site</b>.</p>' +
      "</aside></form>"
    );
  }

  function amostra(nome) {
    var v = estado.loja.cores[nome] || "#556b2f";
    if (v === "camo-multicam") return "linear-gradient(135deg,#a6966c 0 30%,#6f6a43 30% 55%,#c8b88a 55% 75%,#4e4630 75%)";
    if (v === "camo-verde") return "linear-gradient(135deg,#5d6b3c 0 30%,#262619 30% 50%,#86784b 50% 75%,#3a4426 75%)";
    if (v === "camo-urbano") return "linear-gradient(135deg,#878a8c 0 30%,#2e3032 30% 50%,#c0c2c2 50% 75%,#5a5d60 75%)";
    return v;
  }

  function opcoesSub(cat, atual) {
    return (cat.subcategorias || []).map(function (s) {
      return '<option value="' + esc(s.id) + '"' + (s.id === atual ? " selected" : "") + ">" + esc(s.nome) + "</option>";
    }).join("");
  }

  function lerEditor(form) {
    var p = estado.rascunhoProduto;
    var val = function (id) { return $("#" + id, form).value.trim(); };
    p.nome = val("p-nome");
    p.categoria = val("p-categoria");
    p.subcategoria = val("p-sub");
    p.codigo = val("p-codigo").toUpperCase();
    p.marca = val("p-marca");
    p.preco = lerNumero(val("p-preco"));
    p.precoAntigo = lerNumero(val("p-antigo"));
    p.ilustracao = { tipo: val("p-il-tipo"), cor: val("p-il-cor") };
    p.resumo = val("p-resumo");
    p.descricao = val("p-descricao");
    p.destaques = linhas(val("p-destaques"));
    p.especificacoes = {};
    linhas(val("p-specs")).forEach(function (l) {
      var i = l.indexOf(":");
      if (i > 0) p.especificacoes[l.slice(0, i).trim()] = l.slice(i + 1).trim();
    });
    var variacoes = {};
    var tam = lista(val("p-tamanhos"));
    if (tam.length) variacoes.Tamanho = tam;
    var cores = $$("#p-cores .ativo", form).map(function (b) { return b.dataset.cor; });
    // mantém a ordem em que as cores já estavam no produto
    var anteriores = (p.variacoes && p.variacoes.Cor) || [];
    cores.sort(function (a, b) {
      var ia = anteriores.indexOf(a), ib = anteriores.indexOf(b);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
    if (cores.length) variacoes.Cor = cores;
    linhas(val("p-outras")).forEach(function (l) {
      var i = l.indexOf(":");
      if (i > 0 && lista(l.slice(i + 1)).length) variacoes[l.slice(0, i).trim()] = lista(l.slice(i + 1));
    });
    p.variacoes = variacoes;
    p.disponivel = $("#p-disponivel", form).checked;
    p.selos = $$("[data-selo]", form).filter(function (c) { return c.checked; }).map(function (c) { return c.dataset.selo; });
    return p;
  }

  function ligarEditor(raiz) {
    var form = $("#form-produto", raiz);
    var p = estado.rascunhoProduto;

    function desenharFotos() {
      $("#p-fotos", form).innerHTML = (p.imagens || []).length
        ? p.imagens.map(function (img, i) {
            return (
              '<figure class="adm-foto"><img src="' + esc(urlFoto(img)) + '" alt="Foto ' + (i + 1) + '">' +
              (i === 0 ? '<span class="adm-foto__capa">Capa</span>' : "") +
              '<div class="adm-foto__acoes">' +
              '<button type="button" class="btn-icone" data-foto-mover="' + i + '" data-dir="-1" aria-label="Mover para a esquerda"' + (i === 0 ? " disabled" : "") + ">" + icone("voltar") + "</button>" +
              '<button type="button" class="btn-icone" data-foto-remover="' + i + '" aria-label="Remover foto">' + icone("lixeira") + "</button>" +
              '<button type="button" class="btn-icone" data-foto-mover="' + i + '" data-dir="1" aria-label="Mover para a direita"' + (i === p.imagens.length - 1 ? " disabled" : "") + ">" + icone("seta") + "</button>" +
              "</div></figure>"
            );
          }).join("")
        : '<p class="dica">Nenhuma foto ainda.</p>';
    }

    function atualizarPrevia() {
      var atual = lerEditor(form);
      var desc = PD.descontoPercentual(atual);
      var pix = estado.loja.pedidos.descontoPix;
      $("#p-info-preco", form).textContent = atual.precoAntigo > atual.preco && atual.preco > 0
        ? "Promoção: -" + desc + "% (de " + R(atual.precoAntigo) + " por " + R(atual.preco) + ")." + (pix ? " No Pix: " + R(PD.precoPix(atual.preco, pix)) + "." : "")
        : atual.preco > 0 && pix ? "No Pix (" + pix + "% off): " + R(PD.precoPix(atual.preco, pix)) + "." : "";
      $("#p-previa", form).innerHTML =
        '<div class="card"><div class="card__midia">' + midiaMini(atual, (atual.variacoes.Cor || [])[0]) +
        (desc ? '<div class="selos"><span class="selo selo--oferta">-' + desc + "%</span></div>" : "") + "</div>" +
        '<div class="card__corpo"><span class="card__cat">' + esc(nomeSub(atual)) + "</span>" +
        '<h3 class="card__nome">' + esc(atual.nome || "Nome do produto") + "</h3>" +
        '<p class="card__resumo">' + esc(atual.resumo) + "</p>" +
        '<div class="preco">' + (desc ? '<s class="preco__antigo">' + R(atual.precoAntigo) + "</s>" : "") + '<strong class="preco__atual">' + R(atual.preco) + "</strong></div>" +
        "</div></div><p class=\"dica\">Prévia do card na loja</p>";
    }

    desenharFotos();
    atualizarPrevia();
    form.addEventListener("input", atualizarPrevia);
    form.addEventListener("change", atualizarPrevia);

    $("#p-categoria", form).addEventListener("change", function (e) {
      var cat = estado.loja.categorias.find(function (c) { return c.id === e.target.value; });
      $("#p-sub", form).innerHTML = opcoesSub(cat, "");
      if (estado.editando === "__novo__") $("#p-codigo", form).value = proximoCodigo(cat.id);
      atualizarPrevia();
    });

    $$("[data-tamanhos]", form).forEach(function (b) {
      b.addEventListener("click", function () { $("#p-tamanhos", form).value = b.dataset.tamanhos; atualizarPrevia(); });
    });
    $$("#p-cores [data-cor]", form).forEach(function (b) {
      b.addEventListener("click", function () {
        var on = !b.classList.contains("ativo");
        b.classList.toggle("ativo", on);
        b.setAttribute("aria-pressed", on);
        atualizarPrevia();
      });
    });

    $("#p-fotos", form).addEventListener("click", function (e) {
      var mover = e.target.closest("[data-foto-mover]");
      var remover = e.target.closest("[data-foto-remover]");
      if (mover) {
        var i = Number(mover.dataset.fotoMover), j = i + Number(mover.dataset.dir);
        var tmp = p.imagens[i]; p.imagens[i] = p.imagens[j]; p.imagens[j] = tmp;
      } else if (remover) {
        p.imagens.splice(Number(remover.dataset.fotoRemover), 1);
      } else return;
      desenharFotos();
      atualizarPrevia();
    });

    $("#p-arquivos", form).addEventListener("change", function (e) {
      var arquivos = Array.prototype.slice.call(e.target.files || []);
      e.target.value = "";
      if (!arquivos.length) return;
      var codigo = ($("#p-codigo", form).value.trim().toUpperCase() || "FOTO").replace(/[^A-Z0-9-]/g, "");
      aviso("Preparando " + arquivos.length + " foto(s)...");
      arquivos.reduce(function (cadeia, arq) {
        return cadeia.then(function () {
          return comprimir(arq, 1200, 0.82).then(function (r) {
            var rel = nomeLivre("img/produtos/" + codigo, r.ext);
            estado.novosArquivos[PASTA + "/" + rel] = { base64: r.base64, dataUrl: r.dataUrl };
            p.imagens = (p.imagens || []).concat(rel);
          });
        });
      }, Promise.resolve()).then(function () {
        desenharFotos();
        atualizarPrevia();
        aviso("Foto(s) adicionada(s). Clique em <b>Salvar produto</b>.");
      }).catch(function (err) { aviso(err.message, "erro"); });
    });

    $("#voltar-lista", raiz).addEventListener("click", sairDoEditor);
    $("#cancelar-produto", form).addEventListener("click", sairDoEditor);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var atual = lerEditor(form);
      var novo = estado.editando === "__novo__";
      if (novo) atual.id = idUnico(slug(atual.nome), estado.produtos.map(function (x) { return x.id; }));
      var outros = estado.produtos.filter(function (x) { return x.id !== estado.editando; });
      var problemas = V.validarCatalogo(estado.loja, outros.concat([atual]), IL.tipos)
        .filter(function (pr) { return pr.produto === atual.id; })
        .map(function (pr) { return pr.msg; });
      if (!atual.nome) problemas.unshift("Dê um nome ao produto.");
      var caixa = $("#p-erros", form);
      if (problemas.length) {
        caixa.innerHTML = problemas.map(esc).join("<br>");
        caixa.hidden = false;
        caixa.scrollIntoView({ block: "center", behavior: "smooth" });
        if (novo) atual.id = "";
        return;
      }
      if (atual.marca === "") delete atual.marca;
      if (novo) estado.produtos.push(atual);
      else estado.produtos = estado.produtos.map(function (x) { return x.id === estado.editando ? atual : x; });
      marcarMudanca((novo ? "Novo produto " : "Editou ") + atual.codigo + " " + atual.nome);
      estado.editando = null;
      estado.rascunhoProduto = null;
      renderizar();
      aviso("Produto salvo no rascunho. Clique em <b>Publicar no site</b> quando terminar.");
    });
  }

  function sairDoEditor() {
    estado.editando = null;
    estado.rascunhoProduto = null;
    renderizar();
  }

  function nomeLivre(baseSemExt, ext) {
    var usados = JSON.stringify(estado.produtos) + JSON.stringify(estado.loja.banners) + JSON.stringify(estado.rascunhoProduto || {}) + Object.keys(estado.novosArquivos).join("|");
    var nome = baseSemExt + "." + ext, n = 2;
    while (usados.indexOf(nome) !== -1) nome = baseSemExt + "-" + n++ + "." + ext;
    return nome;
  }

  function comprimir(arquivo, maximo, qualidade) {
    return new Promise(function (ok, falha) {
      if (!/^image\//.test(arquivo.type)) return falha(new Error("\"" + arquivo.name + "\" não é uma imagem."));
      var img = new Image();
      var url = URL.createObjectURL(arquivo);
      img.onload = function () {
        var escala = Math.min(1, maximo / Math.max(img.naturalWidth, img.naturalHeight));
        var c = document.createElement("canvas");
        c.width = Math.round(img.naturalWidth * escala);
        c.height = Math.round(img.naturalHeight * escala);
        var ctx = c.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        var dataUrl = c.toDataURL("image/webp", qualidade);
        var ext = "webp";
        if (dataUrl.indexOf("data:image/webp") !== 0) { dataUrl = c.toDataURL("image/jpeg", qualidade); ext = "jpg"; }
        ok({ dataUrl: dataUrl, base64: dataUrl.split(",")[1], ext: ext });
      };
      img.onerror = function () { URL.revokeObjectURL(url); falha(new Error("Não consegui abrir \"" + arquivo.name + "\". Tente JPG, PNG ou WebP.")); };
      img.src = url;
    });
  }

  /* =============================== BANNERS ================================ */
  function opcoesLink(atual) {
    var ops = [["#/", "Página inicial"], ["#/ofertas", "Ofertas"], ["#/lancamentos", "Lançamentos"], ["#/mais-vendidos", "Mais vendidos"], ["#/todos", "Todos os produtos"], ["#/loja", "Loja física"], ["#/contato", "Contato"]];
    estado.loja.categorias.forEach(function (c) { ops.push(["#/categoria/" + c.id, "Categoria: " + c.nome]); });
    var conhecido = ops.some(function (o) { return o[0] === atual; });
    return ops.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === atual ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") +
      '<option value="__outro"' + (conhecido ? "" : " selected") + ">Outro link…</option>";
  }

  function telaBanners() {
    var b = estado.loja.banners;
    return (
      cabecalho("Banners da página inicial", "Os banners trocam sozinhos no topo da home. Foto ideal: horizontal, 1600×700.",
        '<button type="button" class="btn btn--primario" id="novo-banner">' + icone("mais") + "Novo banner</button>") +
      b.map(function (bn, i) {
        var conhecido = /^#\/(|ofertas|lancamentos|mais-vendidos|todos|loja|contato|categoria\/.+)$/.test(bn.link);
        return (
          '<section class="bloco adm-item" data-i="' + i + '">' +
          '<div class="adm-item__topo"><h2>Banner ' + (i + 1) + "</h2><div>" +
          '<button type="button" class="btn-icone" data-mover="-1" aria-label="Subir"' + (i === 0 ? " disabled" : "") + ">" + icone("voltar", "icone--cima") + "</button>" +
          '<button type="button" class="btn-icone" data-mover="1" aria-label="Descer"' + (i === b.length - 1 ? " disabled" : "") + ">" + icone("seta", "icone--baixo") + "</button>" +
          '<button type="button" class="btn-icone" data-remover aria-label="Remover banner">' + icone("lixeira") + "</button></div></div>" +
          '<div class="adm-banner">' +
          '<div class="adm-banner__arte">' + (bn.imagem ? '<img src="' + esc(urlFoto(bn.imagem)) + '" alt="">' : IL.ilustracao(bn.ilustracao.tipo, bn.ilustracao.cor, "")) + "</div>" +
          '<div class="campos">' +
          campo("Título", "banners." + i + ".titulo", { largo: true, desc: "Banner " + (i + 1) }) +
          campo("Texto", "banners." + i + ".texto", { tipo: "area", linhas: 2, largo: true, desc: "Banner " + (i + 1) }) +
          campo("Texto do botão", "banners." + i + ".botao", { desc: "Banner " + (i + 1) }) +
          '<div class="campo"><label>Botão leva para</label><select data-link>' + opcoesLink(bn.link) + "</select>" +
          '<input data-link-outro value="' + esc(bn.link) + '"' + (conhecido ? " hidden" : "") + ' placeholder="#/produto/codigo ou https://..."></div>' +
          '<div class="campo campo--largo"><span class="adm-rotulo">Imagem</span><div class="adm-atalhos">' +
          '<label class="btn btn--secundario">' + icone("mais") + (bn.imagem ? "Trocar foto" : "Usar uma foto") + '<input type="file" accept="image/*" data-foto-banner hidden></label>' +
          (bn.imagem ? '<button type="button" class="btn btn--secundario" data-sem-foto>Usar desenho</button>' : "") +
          "</div></div>" +
          (bn.imagem ? "" :
            '<div class="campo"><label>Desenho</label><select data-il="tipo">' + IL.tipos.map(function (t) { return "<option" + (t === bn.ilustracao.tipo ? " selected" : "") + ">" + t + "</option>"; }).join("") + "</select></div>" +
            '<div class="campo"><label>Cor do desenho</label><select data-il="cor">' + Object.keys(estado.loja.cores).map(function (c) { return "<option" + (c === bn.ilustracao.cor ? " selected" : "") + ">" + esc(c) + "</option>"; }).join("") + "</select></div>") +
          "</div></div></section>"
        );
      }).join("")
    );
  }

  ligacoes.banners = function (raiz) {
    var bs = estado.loja.banners;
    $("#novo-banner", raiz).addEventListener("click", function () {
      bs.push({ titulo: "Novo banner", texto: "", botao: "Ver produtos", link: "#/todos", imagem: "", ilustracao: { tipo: "coturno", cor: "Preto" } });
      marcarMudanca("Novo banner");
      renderizar();
    });
    $$("[data-i]", raiz).forEach(function (sec) {
      var i = Number(sec.dataset.i);
      var bn = bs[i];
      var desc = "Banner " + (i + 1);
      $$("[data-mover]", sec).forEach(function (b) {
        b.addEventListener("click", function () {
          var j = i + Number(b.dataset.mover);
          bs.splice(j, 0, bs.splice(i, 1)[0]);
          marcarMudanca("Ordem dos banners");
          renderizar();
        });
      });
      $("[data-remover]", sec).addEventListener("click", function () {
        if (bs.length === 1) return aviso("Deixe pelo menos um banner.", "erro");
        if (!confirm("Remover o banner \"" + bn.titulo + "\"?")) return;
        bs.splice(i, 1);
        marcarMudanca("Removeu banner");
        renderizar();
      });
      var sel = $("[data-link]", sec), outro = $("[data-link-outro]", sec);
      sel.addEventListener("change", function () {
        outro.hidden = sel.value !== "__outro";
        if (sel.value !== "__outro") bn.link = sel.value;
        else outro.focus();
        marcarMudanca(desc);
      });
      outro.addEventListener("input", function () { bn.link = outro.value.trim(); marcarMudanca(desc); });
      $$("[data-il]", sec).forEach(function (s) {
        s.addEventListener("change", function () {
          bn.ilustracao[s.dataset.il] = s.value;
          $(".adm-banner__arte", sec).innerHTML = IL.ilustracao(bn.ilustracao.tipo, bn.ilustracao.cor, "");
          marcarMudanca(desc);
        });
      });
      var semFoto = $("[data-sem-foto]", sec);
      if (semFoto) semFoto.addEventListener("click", function () { bn.imagem = ""; marcarMudanca(desc); renderizar(); });
      $("[data-foto-banner]", sec).addEventListener("change", function (e) {
        var arq = e.target.files && e.target.files[0];
        if (!arq) return;
        comprimir(arq, 1800, 0.8).then(function (r) {
          var rel = nomeLivre("img/banners/banner-" + slug(bn.titulo), r.ext);
          estado.novosArquivos[PASTA + "/" + rel] = { base64: r.base64, dataUrl: r.dataUrl };
          bn.imagem = rel;
          marcarMudanca(desc + ": nova foto");
          renderizar();
        }).catch(function (err) { aviso(err.message, "erro"); });
      });
    });
  };

  /* ============================== CATEGORIAS ============================== */
  function contarProdutos(cat, sub) {
    return estado.produtos.filter(function (p) { return p.categoria === cat && (!sub || p.subcategoria === sub); }).length;
  }

  function telaCategorias() {
    var cs = estado.loja.categorias;
    return (
      cabecalho("Categorias do menu lateral", "A ordem aqui é a ordem do menu. Categorias e subcategorias com produtos não podem ser apagadas (mova os produtos antes).",
        '<button type="button" class="btn btn--primario" id="nova-categoria">' + icone("mais") + "Nova categoria</button>") +
      cs.map(function (c, i) {
        var qtd = contarProdutos(c.id);
        return (
          '<section class="bloco adm-item" data-i="' + i + '">' +
          '<div class="adm-item__topo"><h2>' + icone(c.icone || "patch") + esc(c.nome) + ' <small>' + qtd + " produtos</small></h2><div>" +
          '<button type="button" class="btn-icone" data-mover="-1" aria-label="Subir"' + (i === 0 ? " disabled" : "") + ">" + icone("voltar", "icone--cima") + "</button>" +
          '<button type="button" class="btn-icone" data-mover="1" aria-label="Descer"' + (i === cs.length - 1 ? " disabled" : "") + ">" + icone("seta", "icone--baixo") + "</button>" +
          '<button type="button" class="btn-icone" data-remover aria-label="Apagar categoria"' + (qtd ? ' disabled title="Tem produtos"' : "") + ">" + icone("lixeira") + "</button></div></div>" +
          '<div class="campos">' +
          campo("Nome no menu", "categorias." + i + ".nome", { desc: "Categoria " + c.nome }) +
          '<div class="campo"><label>Ícone</label><select data-icone>' + ICONES_CATEGORIA.map(function (n) { return "<option" + (n === c.icone ? " selected" : "") + ">" + n + "</option>"; }).join("") + "</select></div>" +
          campo("Descrição", "categorias." + i + ".descricao", { largo: true, desc: "Categoria " + c.nome }) +
          "</div>" +
          '<h3 class="adm-sub-titulo">Subcategorias</h3><ul class="adm-subs">' +
          (c.subcategorias || []).map(function (s, k) {
            var n = contarProdutos(c.id, s.id);
            return '<li data-k="' + k + '"><input value="' + esc(s.nome) + '" data-sub-nome aria-label="Nome da subcategoria"><span class="adm-tag">' + n + " produtos</span>" +
              '<button type="button" class="btn-icone" data-sub-remover aria-label="Apagar subcategoria"' + (n ? ' disabled title="Tem produtos"' : "") + ">" + icone("lixeira") + "</button></li>";
          }).join("") +
          "</ul>" +
          '<div class="adm-atalhos"><input data-sub-nova placeholder="Nova subcategoria"><button type="button" class="btn btn--secundario" data-sub-add>' + icone("mais") + "Adicionar</button></div>" +
          "</section>"
        );
      }).join("")
    );
  }

  ligacoes.categorias = function (raiz) {
    var cs = estado.loja.categorias;
    $("#nova-categoria", raiz).addEventListener("click", function () {
      var nome = prompt("Nome da nova categoria (ex.: Airsoft):");
      if (!nome || !nome.trim()) return;
      var id = idUnico(slug(nome), cs.map(function (c) { return c.id; }));
      cs.push({ id: id, nome: nome.trim(), icone: "patch", descricao: "", subcategorias: [{ id: "geral", nome: "Geral" }] });
      marcarMudanca("Nova categoria " + nome.trim());
      renderizar();
    });
    $$("[data-i]", raiz).forEach(function (sec) {
      var i = Number(sec.dataset.i);
      var c = cs[i];
      $$("[data-mover]", sec).forEach(function (b) {
        b.addEventListener("click", function () {
          cs.splice(i + Number(b.dataset.mover), 0, cs.splice(i, 1)[0]);
          marcarMudanca("Ordem das categorias");
          renderizar();
        });
      });
      $("[data-remover]", sec).addEventListener("click", function () {
        if (!confirm("Apagar a categoria \"" + c.nome + "\"?")) return;
        cs.splice(i, 1);
        marcarMudanca("Apagou categoria " + c.nome);
        renderizar();
      });
      $("[data-icone]", sec).addEventListener("change", function (e) { c.icone = e.target.value; marcarMudanca("Categoria " + c.nome); });
      $$("[data-k]", sec).forEach(function (li) {
        var s = c.subcategorias[Number(li.dataset.k)];
        $("[data-sub-nome]", li).addEventListener("input", function (e) { s.nome = e.target.value; marcarMudanca("Subcategorias de " + c.nome); });
        $("[data-sub-remover]", li).addEventListener("click", function () {
          if (!confirm("Apagar a subcategoria \"" + s.nome + "\"?")) return;
          c.subcategorias.splice(Number(li.dataset.k), 1);
          marcarMudanca("Subcategorias de " + c.nome);
          renderizar();
        });
      });
      $("[data-sub-add]", sec).addEventListener("click", function () {
        var nome = $("[data-sub-nova]", sec).value.trim();
        if (!nome) return aviso("Digite o nome da subcategoria.", "erro");
        c.subcategorias = c.subcategorias || [];
        c.subcategorias.push({ id: idUnico(slug(nome), c.subcategorias.map(function (x) { return x.id; })), nome: nome });
        marcarMudanca("Subcategorias de " + c.nome);
        renderizar();
      });
    });
  };

  /* ============================ LOJA E CONTATOS =========================== */
  function telaLoja() {
    var c = estado.loja.contato;
    var lj = estado.loja.lojaFisica;
    return (
      cabecalho("Loja e contatos", "O WhatsApp daqui recebe todos os pedidos e aparece em todos os botões do site.") +
      '<section class="bloco"><h2>' + icone("whatsapp") + "WhatsApp e telefone</h2><div class=\"campos\">" +
      '<div class="campo"><label for="l-whats">WhatsApp da loja (com DDD) *</label><input id="l-whats" inputmode="tel" value="' + esc(c.whatsappExibicao || formatarTelefone(c.whatsapp)) + '" placeholder="(11) 98765-4321">' +
      '<p class="dica"><a id="l-whats-teste" target="_blank" rel="noopener" href="' + esc(PD.linkWhatsApp(c.whatsapp, "Teste do painel")) + '">Testar: abrir conversa com este número</a></p></div>' +
      '<div class="campo"><label for="l-tel">Telefone fixo (opcional)</label><input id="l-tel" inputmode="tel" value="' + esc(c.telefoneExibicao || formatarTelefone(c.telefone)) + '" placeholder="(11) 3000-0000"></div>' +
      campo("E-mail", "contato.email") +
      campo("Instagram (link completo)", "contato.instagram", { placeholder: "https://instagram.com/..." }) +
      campo("Facebook (link)", "contato.facebook", { placeholder: "vazio = não mostra" }) +
      campo("TikTok (link)", "contato.tiktok", { placeholder: "vazio = não mostra" }) +
      "</div></section>" +
      '<section class="bloco"><h2>' + icone("mapa") + "Loja física</h2><div class=\"campos\">" +
      campo("Endereço (rua, número, bairro)", "lojaFisica.endereco", { largo: true }) +
      campo("Cidade — UF", "lojaFisica.cidade") +
      campo("CEP", "lojaFisica.cep") +
      campo("Endereço para o mapa (como você digitaria no Google Maps)", "lojaFisica.enderecoMapa", { largo: true, dica: '<a id="l-mapa-teste" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(lj.enderecoMapa) + '">Conferir no Google Maps</a>' }) +
      campo("Ponto de referência", "lojaFisica.referencia", { largo: true }) +
      "</div>" +
      '<h3 class="adm-sub-titulo">Horários</h3><ul class="adm-subs" id="horarios">' +
      lj.horarios.map(function (h, i) {
        return '<li data-h="' + i + '"><input value="' + esc(h.dias) + '" data-h-campo="dias" aria-label="Dias"><input value="' + esc(h.horas) + '" data-h-campo="horas" aria-label="Horário">' +
          '<button type="button" class="btn-icone" data-h-remover aria-label="Remover horário">' + icone("lixeira") + "</button></li>";
      }).join("") +
      '</ul><button type="button" class="btn btn--secundario" id="add-horario">' + icone("mais") + "Adicionar horário</button>" +
      "</section>"
    );
  }

  ligacoes.loja = function (raiz) {
    var c = estado.loja.contato;
    $("#l-whats", raiz).addEventListener("input", function (e) {
      var d = PD.somenteDigitos(e.target.value).replace(/^55(?=\d{10,11}$)/, "");
      c.whatsapp = "55" + d;
      c.whatsappExibicao = formatarTelefone(d);
      $("#l-whats-teste", raiz).href = PD.linkWhatsApp(c.whatsapp, "Teste do painel");
      marcarMudanca("WhatsApp da loja");
    });
    $("#l-tel", raiz).addEventListener("input", function (e) {
      var d = PD.somenteDigitos(e.target.value).replace(/^55(?=\d{10,11}$)/, "");
      c.telefone = d;
      c.telefoneExibicao = formatarTelefone(d);
      marcarMudanca("Telefone");
    });
    $("#c-lojaFisica-enderecoMapa", raiz).addEventListener("input", function (e) {
      $("#l-mapa-teste", raiz).href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(e.target.value);
    });
    var hs = estado.loja.lojaFisica.horarios;
    $$("[data-h]", raiz).forEach(function (li) {
      var h = hs[Number(li.dataset.h)];
      $$("[data-h-campo]", li).forEach(function (inp) {
        inp.addEventListener("input", function () { h[inp.dataset.hCampo] = inp.value; marcarMudanca("Horários"); });
      });
      $("[data-h-remover]", li).addEventListener("click", function () {
        hs.splice(Number(li.dataset.h), 1);
        marcarMudanca("Horários");
        renderizar();
      });
    });
    $("#add-horario", raiz).addEventListener("click", function () {
      hs.push({ dias: "Feriados", horas: "09h às 13h" });
      marcarMudanca("Horários");
      renderizar();
    });
  };

  /* ========================= PEDIDOS E PAGAMENTO ========================== */
  function telaPedidos() {
    var p = estado.loja.pedidos;
    return (
      cabecalho("Pedidos e pagamento", "Como o cliente recebe e paga. O pagamento é sempre combinado pelo WhatsApp.") +
      '<section class="bloco"><h2>' + icone("pix") + "Geral</h2><div class=\"campos\">" +
      campo("Desconto no Pix (%)", "pedidos.descontoPix", { tipo: "numero", dica: "0 = sem desconto" }) +
      campo("Prefixo do número do pedido", "pedidos.prefixo", { dica: "Ex.: AM011 → pedido AM011-261004-4821" }) +
      campo("Faixa de aviso no topo do site", "pedidos.avisoTopo", { largo: true, dica: "Deixe vazio para esconder" }) +
      '<label class="caixa campo--largo"><input type="checkbox" id="link-produtos"' + (p.linkDosProdutos ? " checked" : "") + "> Incluir o link de cada produto na mensagem do WhatsApp</label>" +
      '<label class="caixa campo--largo"><input type="checkbox" id="oferecer-nf"' + (p.notaFiscal === false ? "" : " checked") + "> Oferecer \"Quero nota fiscal\" no pedido (pede CPF/CNPJ e endereço)</label>" +
      '<p class="dica campo--largo">Deixe desligado enquanto o site estiver no endereço provisório. Ligue quando tiver um endereço próprio (ex.: artemilitar011.com.br). O código do produto (ex.: CAL-001) vai sempre.</p>' +
      "</div></section>" +
      '<section class="bloco"><h2>' + icone("caminhao") + "Formas de entrega</h2>" +
      '<p class="dica">"Retirar na loja" não pede endereço; as outras pedem (com CEP automático).</p><ul class="adm-subs adm-subs--largo">' +
      p.entregas.map(function (e, i) {
        return '<li data-e="' + i + '"><input value="' + esc(e.nome) + '" data-e-campo="nome" aria-label="Nome da entrega"><input value="' + esc(e.detalhe) + '" data-e-campo="detalhe" aria-label="Detalhe">' +
          (e.id === "retirada" ? '<span class="adm-tag">sem endereço</span>' : "") +
          '<button type="button" class="btn-icone" data-e-remover aria-label="Remover"' + (p.entregas.length === 1 ? " disabled" : "") + ">" + icone("lixeira") + "</button></li>";
      }).join("") +
      '</ul><button type="button" class="btn btn--secundario" id="add-entrega">' + icone("mais") + "Adicionar forma de entrega</button></section>" +
      '<section class="bloco"><h2>' + icone("tag") + "Formas de pagamento aceitas</h2><ul class=\"adm-subs\">" +
      p.pagamentos.map(function (pg, i) {
        return '<li data-pg="' + i + '"><input value="' + esc(pg) + '" aria-label="Forma de pagamento">' +
          '<button type="button" class="btn-icone" data-pg-remover aria-label="Remover"' + (p.pagamentos.length === 1 ? " disabled" : "") + ">" + icone("lixeira") + "</button></li>";
      }).join("") +
      '</ul><button type="button" class="btn btn--secundario" id="add-pagamento">' + icone("mais") + "Adicionar forma de pagamento</button></section>"
    );
  }

  ligacoes.pedidos = function (raiz) {
    var p = estado.loja.pedidos;
    $("#oferecer-nf", raiz).addEventListener("change", function (e) {
      p.notaFiscal = e.target.checked;
      marcarMudanca(e.target.checked ? "Nota fiscal no pedido: ligada" : "Nota fiscal no pedido: desligada");
    });
    $("#link-produtos", raiz).addEventListener("change", function (e) {
      p.linkDosProdutos = e.target.checked;
      marcarMudanca(e.target.checked ? "Links dos produtos na mensagem: ligado" : "Links dos produtos na mensagem: desligado");
    });
    $$("[data-e]", raiz).forEach(function (li) {
      var e = p.entregas[Number(li.dataset.e)];
      $$("[data-e-campo]", li).forEach(function (inp) {
        inp.addEventListener("input", function () { e[inp.dataset.eCampo] = inp.value; marcarMudanca("Formas de entrega"); });
      });
      $("[data-e-remover]", li).addEventListener("click", function () {
        p.entregas.splice(Number(li.dataset.e), 1);
        marcarMudanca("Formas de entrega");
        renderizar();
      });
    });
    $("#add-entrega", raiz).addEventListener("click", function () {
      var nome = prompt("Nome da forma de entrega (ex.: Transportadora expressa):");
      if (!nome || !nome.trim()) return;
      p.entregas.push({ id: idUnico(slug(nome), p.entregas.map(function (e) { return e.id; }).concat(["retirada"])), nome: nome.trim(), detalhe: "Valor combinado pelo WhatsApp." });
      marcarMudanca("Formas de entrega");
      renderizar();
    });
    $$("[data-pg]", raiz).forEach(function (li) {
      var i = Number(li.dataset.pg);
      $("input", li).addEventListener("input", function (e) { p.pagamentos[i] = e.target.value; marcarMudanca("Formas de pagamento"); });
      $("[data-pg-remover]", li).addEventListener("click", function () {
        p.pagamentos.splice(i, 1);
        marcarMudanca("Formas de pagamento");
        renderizar();
      });
    });
    $("#add-pagamento", raiz).addEventListener("click", function () {
      p.pagamentos.push("Nova forma de pagamento");
      marcarMudanca("Formas de pagamento");
      renderizar();
    });
  };

  /* ================================= CORES ================================ */
  function corEmUso(nome) {
    return estado.produtos.some(function (p) {
      return (p.ilustracao || {}).cor === nome || ((p.variacoes || {}).Cor || []).indexOf(nome) !== -1;
    }) || estado.loja.banners.some(function (b) { return (b.ilustracao || {}).cor === nome; });
  }

  function telaCores() {
    var cores = estado.loja.cores;
    return (
      cabecalho("Cores dos produtos", "Cores que você pode marcar nos produtos (ex.: coturno Preto ou Coyote). Os camuflados são desenhos especiais. Para mudar as cores do site, use <b>Cores do site</b>.",
        '<button type="button" class="btn btn--primario" id="nova-cor">' + icone("mais") + "Nova cor</button>") +
      '<section class="bloco"><ul class="adm-subs">' +
      Object.keys(cores).map(function (nome) {
        var camo = /^camo-/.test(cores[nome]);
        return '<li data-cor-nome="' + esc(nome) + '"><span class="bolinha bolinha--grande" style="background:' + amostra(nome) + '"></span><strong class="adm-cor-nome">' + esc(nome) + "</strong>" +
          (camo ? '<span class="adm-tag">camuflado</span>' : '<input type="color" value="' + esc(cores[nome]) + '" aria-label="Cor de ' + esc(nome) + '">') +
          '<button type="button" class="btn-icone" data-cor-remover aria-label="Apagar cor"' + (corEmUso(nome) ? ' disabled title="Em uso por algum produto"' : "") + ">" + icone("lixeira") + "</button></li>";
      }).join("") +
      "</ul></section>"
    );
  }

  ligacoes.cores = function (raiz) {
    var cores = estado.loja.cores;
    $("#nova-cor", raiz).addEventListener("click", function () {
      var nome = prompt("Nome da cor (ex.: Vinho):");
      if (!nome || !nome.trim()) return;
      nome = nome.trim();
      if (cores[nome]) return aviso("Essa cor já existe.", "erro");
      cores[nome] = "#5a1f2b";
      marcarMudanca("Nova cor " + nome);
      renderizar();
    });
    $$("[data-cor-nome]", raiz).forEach(function (li) {
      var nome = li.dataset.corNome;
      var inp = $('input[type="color"]', li);
      if (inp) inp.addEventListener("input", function () {
        cores[nome] = inp.value;
        $(".bolinha", li).style.background = inp.value;
        marcarMudanca("Cor " + nome);
      });
      $("[data-cor-remover]", li).addEventListener("click", function () {
        if (!confirm("Apagar a cor \"" + nome + "\"?")) return;
        delete cores[nome];
        marcarMudanca("Apagou cor " + nome);
        renderizar();
      });
    });
  };

  /* ============================= CORES DO SITE ============================ */
  function temaAtual() {
    if (!estado.loja.tema) estado.loja.tema = { paleta: TM.PALETAS[0].id, cores: clonar(TM.PALETAS[0].cores) };
    return estado.loja.tema;
  }

  /* Miniatura da loja pintada com o tema: menu, cartão de produto, selos e botão */
  function miniLoja(tema) {
    return (
      '<div class="mini" style="' + esc(TM.estiloInline(tema)) + '" aria-hidden="true">' +
      '<div class="mini__lateral"><span class="mini__logo">AM 011</span><i></i><i class="ativo"></i><i></i><i></i></div>' +
      '<div class="mini__principal">' +
      '<div class="mini__faixa">Envio para todo o Brasil</div>' +
      '<div class="mini__card">' +
      '<div class="mini__foto"><span class="mini__selo mini__selo--oferta">Oferta</span><span class="mini__selo mini__selo--novo">Novo</span></div>' +
      '<div class="mini__nome">Coturno Tático</div><div class="mini__desc">Couro e cano alto</div>' +
      '<div class="mini__preco">R$ 289,90</div><div class="mini__pix">5% off no Pix</div>' +
      '<div class="mini__btn">Adicionar</div>' +
      "</div></div></div>"
    );
  }

  function bolinhas(cores) {
    return '<span class="adm-paleta__cores">' + TM.CAMPOS.map(function (c) {
      return '<span style="background:' + esc(cores[c[0]]) + '" title="' + esc(c[1]) + '"></span>';
    }).join("") + "</span>";
  }

  function resultadoLeitura(tema) {
    var lista = TM.problemas(tema);
    return lista.length
      ? '<div class="alerta"><strong>Atenção, pode ficar difícil de ler:</strong><ul>' + lista.map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("") + "</ul>Dá para publicar assim, mas vale ajustar ou escolher uma paleta pronta.</div>"
      : '<p class="adm-leitura-ok">' + icone("check") + "Tudo legível: textos, botões, preços e selos com bom contraste.</p>";
  }

  function telaTema() {
    var tema = temaAtual();
    var atual = TM.paletaDasCores(tema.cores);
    return (
      cabecalho("Cores do site", "Escolha uma paleta pronta: o site inteiro muda junto (fundo, menu, botões, preços, selos e avisos) e tudo continua combinando. O cliente só vê depois de <b>Publicar no site</b>.") +
      '<section class="bloco"><h2>' + icone("paleta") + "Paletas prontas</h2>" +
      '<div class="adm-paletas">' +
      TM.PALETAS.map(function (p) {
        var emUso = atual && atual.id === p.id;
        return '<article class="adm-paleta' + (emUso ? " adm-paleta--ativa" : "") + '">' +
          miniLoja({ cores: p.cores }) +
          '<div class="adm-paleta__info"><div class="adm-paleta__titulo"><strong>' + esc(p.nome) + "</strong>" + bolinhas(p.cores) + "</div>" +
          "<p>" + esc(p.descricao) + "</p>" +
          (emUso
            ? '<span class="adm-tag adm-tag--ok">' + icone("check") + "Em uso</span>"
            : '<button type="button" class="btn btn--secundario" data-paleta="' + esc(p.id) + '">Usar esta paleta</button>') +
          "</div></article>";
      }).join("") +
      "</div></section>" +
      '<fieldset class="bloco"><legend>' + icone("filtro") + "Ajuste fino" + (atual ? "" : ' <span class="adm-tag">personalizada</span>') + "</legend>" +
      '<p class="dica">Quer mudar só uma cor (por exemplo, a cor principal para a cor da logo)? Mexa aqui. Os outros tons (bordas, textos suaves, letras dos botões) se ajustam sozinhos.</p>' +
      '<div class="adm-ajuste">' +
      '<div class="adm-ajuste__campos">' +
      TM.CAMPOS.map(function (c) {
        return '<label class="adm-cor-campo"><input type="color" data-tema-cor="' + c[0] + '" value="' + esc(tema.cores[c[0]]) + '">' +
          "<span><strong>" + esc(c[1]) + "</strong><small>" + esc(c[2]) + "</small></span></label>";
      }).join("") +
      "</div>" +
      '<div class="adm-ajuste__previa"><div id="tema-mini">' + miniLoja(tema) + '</div><div id="tema-leitura">' + resultadoLeitura(tema) + "</div>" +
      '<button type="button" class="btn btn--secundario btn--bloco" id="tema-previa">' + icone("busca") + "Ver no site inteiro (prévia)</button></div>" +
      "</div></fieldset>"
    );
  }

  ligacoes.tema = function (raiz) {
    var tema = temaAtual();
    $$("[data-paleta]", raiz).forEach(function (b) {
      b.addEventListener("click", function () {
        var p = TM.paleta(b.dataset.paleta);
        estado.loja.tema = { paleta: p.id, cores: clonar(p.cores) };
        marcarMudanca("Cores do site: " + p.nome);
        renderizarNoLugar();
        aviso("Paleta <b>" + esc(p.nome) + "</b> escolhida. Veja na prévia e depois publique.");
      });
    });
    $$("[data-tema-cor]", raiz).forEach(function (inp) {
      // "input" atualiza a miniatura enquanto arrasta; "change" grava no rascunho ao soltar
      inp.addEventListener("input", function () {
        tema.cores[inp.dataset.temaCor] = inp.value.toLowerCase();
        $("#tema-mini", raiz).innerHTML = miniLoja(tema);
        $("#tema-leitura", raiz).innerHTML = resultadoLeitura(tema);
      });
      inp.addEventListener("change", function () {
        var p = TM.paletaDasCores(tema.cores);
        tema.paleta = p ? p.id : "personalizada";
        marcarMudanca("Cores do site: ajuste fino");
        renderizarNoLugar();
      });
    });
    $("#tema-previa", raiz).addEventListener("click", abrirPrevia);
  };

  /* redesenha a tela sem pular para o topo */
  function renderizarNoLugar() {
    var y = window.scrollY;
    renderizar();
    window.scrollTo(0, y);
  }

  /* ================================= TEXTOS =============================== */
  function telaTextos() {
    return (
      cabecalho("Textos do site", "") +
      '<section class="bloco"><div class="campos">' +
      campo("Nome da loja", "nome") +
      campo("Slogan", "slogan") +
      campo("Descrição (aparece no rodapé e no Google)", "descricao", { tipo: "area", largo: true }) +
      campo("Sobre a loja", "sobre", { tipo: "area", linhas: 5, largo: true }) +
      campo("Política de trocas (um item por linha)", "politicaTrocas", { tipo: "linhas", linhas: 5, largo: true }) +
      campo("Privacidade", "privacidade", { tipo: "area", linhas: 4, largo: true }) +
      campo("Endereço do site (troque quando tiver domínio próprio)", "urlSite", { largo: true }) +
      "</div></section>"
    );
  }

  /* ============================ PRÉVIA E PUBLICAR ========================== */
  function abrirPrevia() {
    var dados = { loja: clonar(estado.loja), produtos: clonar(estado.produtos) };
    // fotos ainda não publicadas entram na prévia direto do navegador
    var trocar = function (rel) { var n = estado.novosArquivos[PASTA + "/" + rel]; return n ? n.dataUrl : rel; };
    dados.produtos.forEach(function (p) { p.imagens = (p.imagens || []).map(trocar); });
    dados.loja.banners.forEach(function (b) { if (b.imagem) b.imagem = trocar(b.imagem); });
    if (!guardar(CHAVE_PREVIA, dados, true)) {
      dados.produtos.forEach(function (p) { p.imagens = p.imagens.filter(function (i) { return i.indexOf("data:") !== 0; }); });
      dados.loja.banners.forEach(function (b) { if (/^data:/.test(b.imagem)) b.imagem = ""; });
      guardar(CHAVE_PREVIA, dados, true);
      aviso("Prévia aberta sem as fotos novas (muito grandes para a prévia). Elas aparecem depois de publicar.");
    }
    window.open("../?previa=1#/", "_blank");
  }

  function abrirPublicar() {
    if (estado.editando) return aviso("Salve ou cancele o produto que está editando antes de publicar.", "erro");
    var problemas = V.validarCatalogo(estado.loja, estado.produtos, IL.tipos);
    var main = $("#adm-principal");
    if (problemas.length) {
      main.innerHTML = cabecalho("Corrija antes de publicar", "Encontramos estes problemas. Nada foi enviado.") +
        '<section class="bloco"><ul class="adm-problemas">' + problemas.map(function (p) {
          return "<li><strong>" + esc(p.onde) + ":</strong> " + esc(p.msg) + "</li>";
        }).join("") + "</ul></section>";
      return;
    }
    var msg = "Painel: " + estado.mudancas.slice(0, 8).join("; ") + (estado.mudancas.length > 8 ? " (+" + (estado.mudancas.length - 8) + ")" : "");
    var btn = $("#btn-publicar");
    btn.disabled = true;
    btn.innerHTML = icone("relogio") + "Publicando...";
    var publicadas = estado.mudancas.slice();
    publicarNoGitHub(msg).then(function () {
      estado.mudancas = [];
      estado.novosArquivos = {};
      apagar(CHAVE_RASCUNHO);
      var c = estado.conexao;
      main.innerHTML = cabecalho("Publicado! ✅", "As alterações foram gravadas no GitHub.") +
        '<section class="bloco">' +
        '<ul class="lista-check">' + publicadas.map(function (m) { return "<li>" + icone("check") + esc(m) + "</li>"; }).join("") + "</ul>" +
        '<p class="adm-no-ar" id="no-ar">' + icone("relogio") + "O site está sendo atualizado (1 a 3 minutos)...</p>" +
        '<div class="hero__botoes"><a class="btn btn--primario" href="../" target="_blank" rel="noopener">Abrir o site</a>' +
        '<a class="btn btn--secundario" href="https://github.com/' + esc(c.dono + "/" + c.repo) + '/actions" target="_blank" rel="noopener">Acompanhar no GitHub</a>' +
        '<button type="button" class="btn btn--secundario" id="continuar">Continuar editando</button></div>' +
        "</section>";
      $("#continuar").addEventListener("click", renderizar);
      esperarNoAr(estado.base.produtos, estado.base.config);
    }).catch(function (e) {
      aviso(e.message, "erro");
    }).then(function () {
      btn.innerHTML = icone("check") + "Publicar no site";
      atualizarBarra();
    });
  }

  /* Confere de tempos em tempos se o site no ar já tem a versão nova */
  function esperarNoAr(produtosTexto, configTexto) {
    var tentativas = 0;
    var conferir = function () {
      var el = $("#no-ar");
      if (!el) return;
      tentativas++;
      Promise.all([
        fetch("../js/produtos.js?v=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.text(); }),
        fetch("../js/config.js?v=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.text(); })
      ]).then(function (t) {
        if (t[0] === produtosTexto && t[1] === configTexto) {
          el.innerHTML = icone("check") + "<b>Já está no ar!</b> Se ainda vir a versão antiga, recarregue o site com Ctrl+F5.";
          el.classList.add("adm-no-ar--ok");
        } else if (tentativas < 30) setTimeout(conferir, 10000);
        else el.innerHTML = icone("info") + "Está demorando mais que o normal. Confira em \"Acompanhar no GitHub\".";
      }).catch(function () { if (tentativas < 30) setTimeout(conferir, 10000); });
    };
    setTimeout(conferir, 15000);
  }

  /* ================================ início =============================== */
  function iniciar() {
    var c = ler(CHAVE_CONEXAO);
    if (c && c.token) {
      estado.conexao = c;
      iniciarPainel();
    } else telaEntrar();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
