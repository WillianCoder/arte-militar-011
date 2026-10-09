/* =====================================================================
   ARTE MILITAR 011 — VALIDAÇÃO DO CATÁLOGO
   ---------------------------------------------------------------------
   Confere config + produtos antes de publicar. Usado pelo painel
   administrativo (bloqueia a publicação se houver erro) e pelos testes.
   ===================================================================== */
(function (raiz) {
  "use strict";

  var SELOS = ["destaque", "lancamento", "oferta", "mais-vendido"];
  var ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  var CODIGO_RE = /^[A-Z]{2,4}-\d{3}$/;

  /**
   * @returns {Array<{onde:string, msg:string, produto?:string}>} lista de problemas (vazia = tudo certo)
   */
  function validarCatalogo(loja, produtos, tiposIlustracao) {
    var erros = [];
    var erro = function (onde, msg, produto) { erros.push({ onde: onde, msg: msg, produto: produto }); };
    var tipos = tiposIlustracao || null;

    // loja
    var c = loja.contato || {};
    if (!/^55\d{10,11}$/.test(c.whatsapp || "")) erro("Contatos", "WhatsApp deve ter só números: 55 + DDD + número (ex.: 5511987654321).");
    if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) erro("Contatos", "E-mail inválido.");
    if (!(loja.lojaFisica || {}).enderecoMapa) erro("Loja física", "Preencha o endereço do mapa.");
    var ped = loja.pedidos || {};
    if (!(ped.entregas || []).length) erro("Pedidos", "Cadastre ao menos uma forma de entrega.");
    if (!(ped.pagamentos || []).length) erro("Pedidos", "Cadastre ao menos uma forma de pagamento.");
    if (typeof ped.descontoPix !== "number" || ped.descontoPix < 0 || ped.descontoPix > 90) erro("Pedidos", "Desconto Pix deve ser um número entre 0 e 90.");

    // cores do site (sem "tema" o site usa a paleta padrão)
    if (loja.tema) {
      var tc = loja.tema.cores || {};
      ["fundo", "superficie", "texto", "destaque", "apoio", "oferta"].forEach(function (k) {
        if (!/^#[0-9a-f]{6}$/i.test(tc[k] || "")) erro("Cores do site", "Cor \"" + k + "\" inválida: use o formato #RRGGBB.");
      });
    }

    // categorias
    var cats = {};
    (loja.categorias || []).forEach(function (cat) {
      if (!ID_RE.test(cat.id || "")) erro("Categorias", "Identificador inválido: \"" + cat.id + "\".");
      if (cats[cat.id]) erro("Categorias", "Categoria repetida: " + cat.id + ".");
      if (!cat.nome) erro("Categorias", "Categoria sem nome (" + cat.id + ").");
      var subs = {};
      (cat.subcategorias || []).forEach(function (s) {
        if (!ID_RE.test(s.id || "")) erro("Categorias", cat.nome + ": subcategoria com identificador inválido \"" + s.id + "\".");
        if (subs[s.id]) erro("Categorias", cat.nome + ": subcategoria repetida (" + s.id + ").");
        if (!s.nome) erro("Categorias", cat.nome + ": subcategoria sem nome.");
        subs[s.id] = true;
      });
      cats[cat.id] = subs;
    });

    // banners
    (loja.banners || []).forEach(function (b, i) {
      if (!b.titulo) erro("Banners", "Banner " + (i + 1) + " sem título.");
      if (!b.imagem && tipos && (!b.ilustracao || tipos.indexOf(b.ilustracao.tipo) === -1)) erro("Banners", "Banner " + (i + 1) + ": escolha uma imagem ou ilustração.");
    });

    // produtos
    var cores = loja.cores || {};
    var ids = {}, codigos = {};
    (produtos || []).forEach(function (p) {
      var nome = p.nome || p.id || "(sem nome)";
      if (!ID_RE.test(p.id || "")) erro("Produtos", "Identificador inválido: \"" + p.id + "\".", p.id);
      if (ids[p.id]) erro("Produtos", "Identificador repetido: " + p.id + ".", p.id);
      ids[p.id] = true;
      if (!CODIGO_RE.test(p.codigo || "")) erro("Produtos", nome + ": código inválido (use algo como CAL-001).", p.id);
      else if (codigos[p.codigo]) erro("Produtos", "Código repetido: " + p.codigo + " (" + nome + " e " + codigos[p.codigo] + ").", p.id);
      codigos[p.codigo] = nome;
      if (!p.nome || !String(p.nome).trim()) erro("Produtos", "Produto sem nome (" + p.id + ").", p.id);
      if (!cats[p.categoria]) erro("Produtos", nome + ": categoria \"" + p.categoria + "\" não existe.", p.id);
      else if (!cats[p.categoria][p.subcategoria]) erro("Produtos", nome + ": escolha uma subcategoria válida.", p.id);
      if (typeof p.preco !== "number" || !(p.preco > 0)) erro("Produtos", nome + ": preço deve ser maior que zero.", p.id);
      if (p.precoAntigo && !(p.precoAntigo > p.preco)) erro("Produtos", nome + ": o preço antigo (promoção) deve ser maior que o preço atual — ou 0.", p.id);
      if (tipos && (!p.ilustracao || tipos.indexOf(p.ilustracao.tipo) === -1)) erro("Produtos", nome + ": tipo de ilustração inválido.", p.id);
      var listaCores = [(p.ilustracao || {}).cor].concat((p.variacoes || {}).Cor || []);
      listaCores.forEach(function (cor) {
        if (cor && !cores[cor]) erro("Produtos", nome + ": a cor \"" + cor + "\" não está cadastrada em Cores.", p.id);
      });
      Object.keys(p.variacoes || {}).forEach(function (k) {
        var v = p.variacoes[k];
        if (!Array.isArray(v) || !v.length) erro("Produtos", nome + ": a variação \"" + k + "\" está sem opções.", p.id);
      });
      (p.selos || []).forEach(function (s) {
        if (SELOS.indexOf(s) === -1) erro("Produtos", nome + ": selo desconhecido \"" + s + "\".", p.id);
      });
    });
    return erros;
  }

  var API = { validarCatalogo: validarCatalogo, SELOS: SELOS, ID_RE: ID_RE, CODIGO_RE: CODIGO_RE };
  raiz.VALIDAR = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
