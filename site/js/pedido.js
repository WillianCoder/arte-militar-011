/* =====================================================================
   ARTE MILITAR 011 — LÓGICA DO PEDIDO
   ---------------------------------------------------------------------
   Monta o pedido (itens, valores, dados do cliente) e gera a mensagem
   enviada para o WhatsApp. Não mexe na tela: só calcula. Por isso é
   testado automaticamente (tests/pedido.test.js).

   PAGAMENTO NO SITE (futuro): o pedido já sai num formato estruturado
   (função montarPedido). Para cobrar pelo site, basta criar um novo
   "finalizador" em FINALIZADORES (ex.: mercadopago) que receba esse
   pedido. Passo a passo em docs/PAGAMENTOS-FUTURO.md.
   ===================================================================== */

(function (raiz) {
  "use strict";

  /* ---------------------------- utilidades ---------------------------- */
  function formatarPreco(valor) {
    var n = Math.round((Number(valor) || 0) * 100) / 100;
    var partes = n.toFixed(2).split(".");
    partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return "R$ " + partes[0] + "," + partes[1];
  }

  function normalizar(texto) {
    return String(texto || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim();
  }

  function somenteDigitos(texto) {
    return String(texto || "").replace(/\D/g, "");
  }

  function arred(n) {
    return Math.round(n * 100) / 100;
  }

  function descontoPercentual(produto) {
    if (!produto.precoAntigo || produto.precoAntigo <= produto.preco) return 0;
    return Math.round((1 - produto.preco / produto.precoAntigo) * 100);
  }

  function precoPix(preco, descontoPix) {
    return arred(preco * (1 - (descontoPix || 0) / 100));
  }

  /* Valores do pedido. Usado na tela e na mensagem, para os dois baterem centavo a centavo. */
  function calcularTotais(subtotal, pagamento, descontoPix) {
    var sub = arred(subtotal);
    var pct = normalizar(pagamento) === "pix" ? descontoPix || 0 : 0;
    var desconto = arred(sub * pct / 100);
    return { subtotal: sub, percentualPix: pct, descontoPix: desconto, total: arred(sub - desconto) };
  }

  /* Ordem estável das variações para que {Cor, Tamanho} e {Tamanho, Cor} sejam o mesmo item */
  function chaveItem(id, variacoes) {
    var v = variacoes || {};
    return id + "|" + Object.keys(v).sort().map(function (k) { return k + "=" + v[k]; }).join(";");
  }

  function textoVariacoes(variacoes) {
    var v = variacoes || {};
    return Object.keys(v).map(function (k) { return k + ": " + v[k]; }).join(" | ");
  }

  /* ------------------------------ carrinho ----------------------------
     Itens: [{ id, variacoes: {Tamanho:"42"}, qtd: 1 }]. Funções puras:
     sempre devolvem uma lista nova. */
  var QTD_MAX = 99;

  function adicionarItem(lista, item) {
    var chave = chaveItem(item.id, item.variacoes);
    var nova = lista.map(function (i) { return Object.assign({}, i); });
    var existente = nova.find(function (i) { return chaveItem(i.id, i.variacoes) === chave; });
    if (existente) existente.qtd = Math.min(QTD_MAX, existente.qtd + (item.qtd || 1));
    else nova.push({ id: item.id, variacoes: item.variacoes || {}, qtd: Math.min(QTD_MAX, item.qtd || 1) });
    return nova;
  }

  function alterarQuantidade(lista, chave, qtd) {
    return lista
      .map(function (i) {
        return chaveItem(i.id, i.variacoes) === chave ? Object.assign({}, i, { qtd: Math.min(QTD_MAX, qtd) }) : i;
      })
      .filter(function (i) { return i.qtd > 0; });
  }

  function removerItem(lista, chave) {
    return lista.filter(function (i) { return chaveItem(i.id, i.variacoes) !== chave; });
  }

  /* Junta os itens do carrinho com os dados atuais do catálogo (preço sempre do catálogo) */
  function linhasDoCarrinho(lista, produtos) {
    var porId = {};
    produtos.forEach(function (p) { porId[p.id] = p; });
    return lista
      .filter(function (i) { return porId[i.id]; })
      .map(function (i) {
        var p = porId[i.id];
        return {
          chave: chaveItem(i.id, i.variacoes),
          id: p.id,
          nome: p.nome,
          variacoes: i.variacoes || {},
          qtd: i.qtd,
          precoUnitario: p.preco,
          total: arred(p.preco * i.qtd),
          disponivel: p.disponivel !== false,
          produto: p
        };
      });
  }

  function totalItens(lista) {
    return lista.reduce(function (s, i) { return s + i.qtd; }, 0);
  }

  /* ------------------------------ pedido ------------------------------ */
  function gerarNumero(prefixo, data, aleatorio) {
    var d = data || new Date();
    var r = aleatorio === undefined ? Math.random() : aleatorio;
    var aa = String(d.getFullYear()).slice(-2);
    var mm = ("0" + (d.getMonth() + 1)).slice(-2);
    var dd = ("0" + d.getDate()).slice(-2);
    var sufixo = ("000" + Math.floor(r * 10000)).slice(-4);
    return (prefixo || "PED") + "-" + aa + mm + dd + "-" + sufixo;
  }

  function dataHora(d) {
    var p = function (n) { return ("0" + n).slice(-2); };
    return p(d.getDate()) + "/" + p(d.getMonth() + 1) + "/" + d.getFullYear() + " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }

  /**
   * Monta o pedido completo e estruturado.
   * dados = { itens, cliente:{nome,telefone,email}, entrega:"envio", endereco:{...},
   *           pagamento:"Pix", observacoes, numero?, data? }
   */
  function caminhoCategoria(produto, config) {
    var cat = ((config && config.categorias) || []).find(function (c) { return c.id === produto.categoria; });
    if (!cat) return "";
    var sub = (cat.subcategorias || []).find(function (x) { return x.id === produto.subcategoria; });
    return cat.nome + (sub ? " > " + sub.nome : "");
  }

  function urlDoProduto(base, id) {
    return base ? String(base).split("#")[0] + "#/produto/" + id : "";
  }

  /**
   * Monta o pedido completo e estruturado.
   * dados = { itens, cliente:{nome,telefone,email}, entrega:"envio", endereco:{...},
   *           pagamento:"Pix", observacoes, numero?, data?, urlBase? }
   */
  function montarPedido(dados, produtos, config) {
    var linhas = linhasDoCarrinho(dados.itens || [], produtos);
    var totais = calcularTotais(
      linhas.reduce(function (s, l) { return s + l.total; }, 0),
      dados.pagamento,
      config.pedidos && config.pedidos.descontoPix
    );
    var economia = arred(linhas.reduce(function (s, l) {
      var antigo = l.produto.precoAntigo;
      return s + (antigo && antigo > l.precoUnitario ? (antigo - l.precoUnitario) * l.qtd : 0);
    }, 0));
    var entrega = ((config.pedidos && config.pedidos.entregas) || []).find(function (e) { return e.id === dados.entrega; }) || null;
    var data = dados.data || new Date();
    // link de cada produto na mensagem: só quando a loja ligar a opção (ex.: com domínio próprio)
    var base = config.pedidos && config.pedidos.linkDosProdutos ? dados.urlBase || config.urlSite || "" : "";
    return {
      numero: dados.numero || gerarNumero(config.pedidos && config.pedidos.prefixo, data),
      data: data.toISOString(),
      dataTexto: dataHora(data),
      linhas: linhas.map(function (l) {
        return {
          id: l.id,
          codigo: l.produto.codigo || l.id,
          nome: l.nome,
          categoria: caminhoCategoria(l.produto, config),
          resumo: l.produto.resumo || "",
          variacoes: l.variacoes,
          qtd: l.qtd,
          precoUnitario: l.precoUnitario,
          precoAntigo: l.produto.precoAntigo > l.precoUnitario ? l.produto.precoAntigo : 0,
          total: l.total,
          disponivel: l.disponivel,
          url: urlDoProduto(base, l.id)
        };
      }),
      produtosDiferentes: linhas.length,
      quantidade: totalItens(linhas),
      subtotal: totais.subtotal,
      economia: economia,
      percentualPix: totais.percentualPix,
      descontoPix: totais.descontoPix,
      total: totais.total,
      frete: null, // a combinar — futuramente calculado aqui
      cliente: dados.cliente || {},
      entrega: entrega,
      endereco: entrega && entrega.id !== "retirada" ? dados.endereco || {} : null,
      pagamento: dados.pagamento || "",
      observacoes: (dados.observacoes || "").trim()
    };
  }

  function validarPedido(dados, config) {
    var erros = {};
    var c = dados.cliente || {};
    if (!c.nome || c.nome.trim().length < 3) erros.nome = "Informe seu nome completo.";
    var tel = somenteDigitos(c.telefone);
    if (tel.length < 10 || tel.length > 13) erros.telefone = "Informe um telefone com DDD.";
    if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) erros.email = "E-mail inválido.";
    if (!dados.itens || !dados.itens.length) erros.itens = "Seu pedido está vazio.";
    if (!dados.entrega) erros.entrega = "Escolha a forma de entrega.";
    if (!dados.pagamento) erros.pagamento = "Escolha a forma de pagamento.";
    if (dados.entrega && dados.entrega !== "retirada") {
      var e = dados.endereco || {};
      if (somenteDigitos(e.cep).length !== 8) erros.cep = "CEP deve ter 8 números.";
      if (!e.rua) erros.rua = "Informe a rua.";
      if (!e.numero) erros.numero = "Informe o número (ou S/N).";
      if (!e.bairro) erros.bairro = "Informe o bairro.";
      if (!e.cidade) erros.cidade = "Informe a cidade.";
      if (!/^[A-Za-z]{2}$/.test(e.uf || "")) erros.uf = "UF com 2 letras.";
    }
    return erros;
  }

  /* --------------------------- mensagens ------------------------------
     Sem emojis de propósito: alguns aparelhos trocam emojis por "?"
     quando a mensagem vem de um link. *texto* = negrito no WhatsApp.
     Pedido grande (muitos itens) sai em versão compacta, sem a frase de
     resumo e o link de cada produto, para caber no WhatsApp. */
  var SEPARADOR = "------------------------------";
  var LIMITE_LINK = 6000; // tamanho máximo do link do WhatsApp antes de compactar

  function plural(n, um, varios) { return n + " " + (n === 1 ? um : varios); }

  function mensagemPedido(pedido, config, compacta) {
    var L = [];
    var linhas = pedido.linhas || [];
    var qtd = pedido.quantidade || 0;
    var diferentes = pedido.produtosDiferentes || linhas.length;
    var retirada = pedido.entrega && pedido.entrega.id === "retirada";

    L.push("*PEDIDO " + pedido.numero + "*");
    L.push(config.nome + " | " + pedido.dataTexto);
    L.push("");
    L.push("*RESUMO*");
    L.push(plural(diferentes, "produto", "produtos diferentes") + " | " + plural(qtd, "unidade", "unidades"));
    L.push("Total: *" + formatarPreco(pedido.total) + "*" + (retirada ? "" : " + frete"));
    L.push("Entrega: " + (pedido.entrega ? pedido.entrega.nome : "-"));
    L.push("Pagamento: " + (pedido.pagamento || "-"));

    L.push("", SEPARADOR, "*PRODUTOS*");
    linhas.forEach(function (l, i) {
      L.push("");
      L.push("*" + (i + 1) + ". " + l.nome + "*");
      L.push("Cód. " + (l.codigo || l.id) + (l.categoria ? " | " + l.categoria : ""));
      var v = textoVariacoes(l.variacoes);
      if (v) L.push(v);
      L.push(l.qtd + " un. x " + formatarPreco(l.precoUnitario) + " = *" + formatarPreco(l.total) + "*" +
        (l.precoAntigo ? " (de " + formatarPreco(l.precoAntigo) + " cada)" : ""));
      if (l.disponivel === false) L.push("ATENÇÃO: produto marcado como esgotado no site");
      if (!compacta && l.resumo) L.push(l.resumo);
      if (!compacta && l.url) L.push(l.url);
    });

    L.push("", SEPARADOR, "*VALORES*");
    L.push("Produtos (" + plural(qtd, "unidade", "unidades") + "): " + formatarPreco(pedido.subtotal));
    if (pedido.economia) L.push("Economia nas promoções: " + formatarPreco(pedido.economia));
    if (pedido.descontoPix) L.push("Desconto Pix (" + pedido.percentualPix + "%): -" + formatarPreco(pedido.descontoPix));
    L.push("Frete: " + (retirada ? "sem custo (retirada na loja)" : "a combinar"));
    L.push("*TOTAL" + (retirada ? "" : " DOS PRODUTOS") + ": " + formatarPreco(pedido.total) + "*" + (retirada ? "" : " + frete"));

    L.push("", SEPARADOR, "*CLIENTE*");
    var c = pedido.cliente || {};
    L.push("Nome: " + (c.nome || "-"));
    L.push("WhatsApp: " + (c.telefone || "-"));
    if (c.email) L.push("E-mail: " + c.email);

    L.push("", "*ENTREGA*");
    L.push(pedido.entrega ? pedido.entrega.nome : "-");
    if (pedido.endereco) {
      var e = pedido.endereco;
      L.push(e.rua + ", " + e.numero + (e.complemento ? " - " + e.complemento : ""));
      L.push(e.bairro + " - " + e.cidade + "/" + String(e.uf || "").toUpperCase());
      L.push("CEP " + e.cep);
    }

    L.push("", "*PAGAMENTO*", pedido.pagamento || "-");
    if (pedido.observacoes) L.push("", "*OBSERVAÇÕES*", pedido.observacoes);

    L.push("", SEPARADOR);
    L.push("Próximo passo: a loja confirma o estoque" + (retirada ? "" : ", o frete") + " e o pagamento por aqui.");
    return L.join("\n");
  }

  function mensagemProduto(produto, variacoes, qtd, config, urlProduto) {
    var n = qtd || 1;
    var L = ["Olá, " + config.nome + "! Tenho interesse neste produto:", ""];
    L.push("*" + produto.nome + "*");
    L.push("Cód. " + (produto.codigo || produto.id) + (caminhoCategoria(produto, config) ? " | " + caminhoCategoria(produto, config) : ""));
    var v = textoVariacoes(variacoes);
    if (v) L.push(v);
    L.push(n + " un. x " + formatarPreco(produto.preco) + " = *" + formatarPreco(produto.preco * n) + "*");
    if (urlProduto && config.pedidos && config.pedidos.linkDosProdutos) L.push(urlProduto);
    L.push("", "Está disponível? Qual o frete para o meu CEP?");
    return L.join("\n");
  }

  function linkWhatsApp(numero, texto) {
    return "https://wa.me/" + somenteDigitos(numero) + (texto ? "?text=" + encodeURIComponent(texto) : "");
  }

  /* ---------------------------- finalizadores -------------------------
     Cada finalizador recebe o pedido montado e devolve o que fazer.
     Hoje: WhatsApp. Futuro: adicionar "mercadopago", "pagseguro"... */
  var FINALIZADORES = {
    whatsapp: function (pedido, config) {
      var url = linkWhatsApp(config.contato.whatsapp, mensagemPedido(pedido, config));
      if (url.length > LIMITE_LINK) url = linkWhatsApp(config.contato.whatsapp, mensagemPedido(pedido, config, true));
      return { tipo: "redirecionar", url: url };
    }
  };

  var API = {
    formatarPreco: formatarPreco,
    normalizar: normalizar,
    somenteDigitos: somenteDigitos,
    descontoPercentual: descontoPercentual,
    precoPix: precoPix,
    calcularTotais: calcularTotais,
    chaveItem: chaveItem,
    textoVariacoes: textoVariacoes,
    adicionarItem: adicionarItem,
    alterarQuantidade: alterarQuantidade,
    removerItem: removerItem,
    linhasDoCarrinho: linhasDoCarrinho,
    totalItens: totalItens,
    gerarNumero: gerarNumero,
    montarPedido: montarPedido,
    validarPedido: validarPedido,
    mensagemPedido: mensagemPedido,
    mensagemProduto: mensagemProduto,
    linkWhatsApp: linkWhatsApp,
    FINALIZADORES: FINALIZADORES,
    QTD_MAX: QTD_MAX
  };

  raiz.PEDIDO = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
