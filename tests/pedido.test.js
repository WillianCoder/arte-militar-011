const test = require("node:test");
const assert = require("node:assert/strict");
const { carregarSite } = require("./carregar");

// objetos vindos do site são de outro "contexto" do Node: comparamos pelo conteúdo
const igual = (a, b, msg) => assert.equal(JSON.stringify(a), JSON.stringify(b), msg);

const site = carregarSite();
const PD = site.PEDIDO;
// Os cálculos são testados com um catálogo de exemplo FIXO: assim mudar preços,
// nomes ou categorias pelo painel nunca quebra estes testes (nem trava a publicação).
const LOJA = {
  nome: "Arte Militar 011",
  contato: { whatsapp: "5511900000000" },
  urlSite: "https://loja.exemplo/",
  pedidos: {
    prefixo: "AM011",
    descontoPix: 5,
    linkDosProdutos: true,
    entregas: [
      { id: "retirada", nome: "Retirar na loja física", detalhe: "" },
      { id: "envio", nome: "Envio pelos Correios / transportadora", detalhe: "" }
    ],
    pagamentos: ["Pix", "Cartão de crédito"]
  },
  categorias: [
    { id: "vestuario", nome: "Vestuário", subcategorias: [{ id: "calcas", nome: "Calças Táticas" }] },
    { id: "calcados", nome: "Calçados", subcategorias: [{ id: "coturnos", nome: "Coturnos" }] },
    { id: "camping", nome: "Camping e Sobrevivência", subcategorias: [{ id: "lanternas", nome: "Lanternas" }] }
  ]
};
const PRODUTOS = [
  { id: "coturno-tatico-cano-alto", codigo: "CAL-001", nome: "Coturno Tático Cano Alto", categoria: "calcados", subcategoria: "coturnos", preco: 289.9, precoAntigo: 349.9, resumo: "Couro e nylon.", variacoes: {} },
  { id: "calca-tatica-ripstop", codigo: "VES-007", nome: "Calça Tática Rip-Stop", categoria: "vestuario", subcategoria: "calcas", preco: 169.9, precoAntigo: 199.9, resumo: "8 bolsos.", variacoes: {} },
  { id: "lanterna-tatica-led", codigo: "CAM-003", nome: "Lanterna Tática LED Recarregável", categoria: "camping", subcategoria: "lanternas", preco: 129.9, precoAntigo: 159.9, resumo: "Recarregável.", variacoes: {} }
];
// catálogo real (só para testes que não dependem de preços)
const LOJA_REAL = site.LOJA;
const PRODUTOS_REAL = site.PRODUTOS;

test("formata preço em reais", () => {
  assert.equal(PD.formatarPreco(0), "R$ 0,00");
  assert.equal(PD.formatarPreco(89.9), "R$ 89,90");
  assert.equal(PD.formatarPreco(1234.5), "R$ 1.234,50");
  assert.equal(PD.formatarPreco(1234567.891), "R$ 1.234.567,89");
});

test("normaliza acentos para a busca", () => {
  assert.equal(PD.normalizar("  Calçados Táticos "), "calcados taticos");
});

test("mesmo produto com mesmas variações soma a quantidade", () => {
  let c = [];
  c = PD.adicionarItem(c, { id: "a", variacoes: { Tamanho: "42", Cor: "Preto" }, qtd: 1 });
  c = PD.adicionarItem(c, { id: "a", variacoes: { Cor: "Preto", Tamanho: "42" }, qtd: 2 });
  c = PD.adicionarItem(c, { id: "a", variacoes: { Tamanho: "43", Cor: "Preto" }, qtd: 1 });
  assert.equal(c.length, 2);
  assert.equal(c[0].qtd, 3);
});

test("quantidade tem limite e zero remove o item", () => {
  let c = PD.adicionarItem([], { id: "a", variacoes: {}, qtd: 500 });
  assert.equal(c[0].qtd, PD.QTD_MAX);
  const chave = PD.chaveItem("a", {});
  igual(PD.alterarQuantidade(c, chave, 0), []);
  igual(PD.removerItem(c, chave), []);
});

test("carrinho ignora produto que saiu do catálogo e usa o preço atual", () => {
  const p = PRODUTOS[0];
  const linhas = PD.linhasDoCarrinho([{ id: p.id, variacoes: {}, qtd: 2 }, { id: "nao-existe", variacoes: {}, qtd: 1 }], PRODUTOS);
  assert.equal(linhas.length, 1);
  assert.equal(linhas[0].total, Math.round(p.preco * 2 * 100) / 100);
});

test("número do pedido segue o padrão PREFIXO-AAMMDD-NNNN", () => {
  assert.equal(PD.gerarNumero("AM011", new Date(2026, 9, 4), 0.0547), "AM011-261004-0547");
});

test("desconto Pix: tela e mensagem batem centavo a centavo", () => {
  const t = PD.calcularTotais(469.7, "Pix", 5);
  assert.equal(t.descontoPix, 23.49);
  assert.equal(t.total, 446.21);
  assert.equal(PD.calcularTotais(469.7, "Cartão de crédito", 5).total, 469.7);
});

const dadosValidos = () => ({
  itens: [{ id: "calca-tatica-ripstop", variacoes: { Tamanho: "42", Cor: "Caqui" }, qtd: 2 }],
  cliente: { nome: "Fulano de Tal", telefone: "(11) 98765-4321", email: "" },
  entrega: "envio",
  pagamento: "Pix",
  endereco: { cep: "01001-000", rua: "Praça da Sé", numero: "100", complemento: "", bairro: "Sé", cidade: "São Paulo", uf: "SP" },
  observacoes: "Entregar à tarde",
  numero: "AM011-261004-0001",
  data: new Date(2026, 9, 4, 14, 30)
});

test("validação aponta campos obrigatórios", () => {
  const e = PD.validarPedido({ itens: [], cliente: {}, endereco: {}, entrega: "envio" }, LOJA);
  for (const campo of ["nome", "telefone", "itens", "pagamento", "cep", "rua", "numero", "bairro", "cidade", "uf"]) {
    assert.ok(e[campo], `deveria acusar "${campo}"`);
  }
  igual(PD.validarPedido(dadosValidos(), LOJA), {});
});

test("retirada na loja não exige endereço", () => {
  const d = dadosValidos();
  d.entrega = "retirada";
  d.endereco = {};
  igual(PD.validarPedido(d, LOJA), {});
  assert.equal(PD.montarPedido(d, PRODUTOS, LOJA).endereco, null);
});

test("mensagem do WhatsApp: resumo, produtos detalhados, valores, cliente e entrega", () => {
  const d = dadosValidos();
  d.itens.push({ id: "lanterna-tatica-led", variacoes: {}, qtd: 1 });
  d.urlBase = "https://loja.exemplo/";
  const pedido = PD.montarPedido(d, PRODUTOS, LOJA);
  const msg = PD.mensagemPedido(pedido, LOJA);
  // cabeçalho e resumo
  assert.match(msg, /^\*PEDIDO AM011-261004-0001\*\nArte Militar 011 \| 04\/10\/2026 14:30/);
  assert.match(msg, /2 produtos diferentes \| 3 unidades/);
  assert.match(msg, /Entrega: Envio pelos Correios/);
  // cada produto: código, categoria, variações, conta, preço "de", resumo e link
  assert.match(msg, /\*1\. Calça Tática Rip-Stop\*\nCód\. VES-\d{3} \| Vestuário > Calças Táticas\nTamanho: 42 \| Cor: Caqui\n2 un\. x R\$ 169,90 = \*R\$ 339,80\* \(de R\$ 199,90 cada\)/);
  assert.match(msg, /https:\/\/loja\.exemplo\/#\/produto\/calca-tatica-ripstop/);
  assert.match(msg, /\*2\. Lanterna Tática LED Recarregável\*/);
  // valores
  assert.match(msg, /Produtos \(3 unidades\): R\$ 469,70/);
  assert.match(msg, /Economia nas promoções: R\$ 90,00/);
  assert.match(msg, /Desconto Pix \(5%\): -R\$ 23,49/);
  assert.match(msg, /\*TOTAL DOS PRODUTOS: R\$ 446,21\* \+ frete/);
  // cliente e entrega
  assert.match(msg, /WhatsApp: \(11\) 98765-4321/);
  assert.match(msg, /Praça da Sé, 100\nSé - São Paulo\/SP\nCEP 01001-000/);
  assert.match(msg, /\*OBSERVAÇÕES\*\nEntregar à tarde/);
  assert.equal(pedido.produtosDiferentes, 2);
  assert.equal(pedido.quantidade, 3);
});

test("retirada na loja: total sem frete", () => {
  const d = dadosValidos();
  d.entrega = "retirada";
  const msg = PD.mensagemPedido(PD.montarPedido(d, PRODUTOS, LOJA), LOJA);
  assert.match(msg, /\*TOTAL: R\$ 322,81\*\n/);
  assert.match(msg, /Frete: sem custo \(retirada na loja\)/);
  assert.doesNotMatch(msg, /CEP /);
});

test("pedido grande vira mensagem compacta e continua com todos os itens", () => {
  const d = dadosValidos();
  d.urlBase = "https://loja.exemplo/";
  d.itens = PRODUTOS_REAL.map((p) => ({ id: p.id, variacoes: {}, qtd: 1 }));
  const pedido = PD.montarPedido(d, PRODUTOS_REAL, LOJA_REAL);
  const url = PD.FINALIZADORES.whatsapp(pedido, LOJA_REAL).url;
  const texto = decodeURIComponent(url.split("?text=")[1]);
  assert.ok(url.length < 20000, "link muito grande: " + url.length);
  assert.match(texto, new RegExp(PRODUTOS_REAL.length + " produtos diferentes"));
  for (const p of PRODUTOS_REAL) assert.ok(texto.includes(p.codigo), "faltou " + p.codigo);
  assert.doesNotMatch(texto, /https:\/\/loja\.exemplo/, "versão compacta não leva links");
});

test("mensagem de um produto só (Comprar agora) traz código e conta", () => {
  const p = PRODUTOS.find((x) => x.id === "coturno-tatico-cano-alto");
  const msg = PD.mensagemProduto(p, { Tamanho: "42", Cor: "Preto" }, 2, LOJA, "https://loja.exemplo/#/produto/" + p.id);
  assert.match(msg, /Cód\. CAL-001 \| Calçados > Coturnos/);
  const conta = "2 un. x " + PD.formatarPreco(p.preco) + " = *" + PD.formatarPreco(p.preco * 2) + "*";
  assert.ok(msg.includes(conta), "faltou a conta: " + conta);
});

test("link do WhatsApp usa só os números e codifica o texto", () => {
  const url = PD.linkWhatsApp("+55 (11) 90000-0000", "Olá & tchau");
  assert.equal(url, "https://wa.me/5511900000000?text=Ol%C3%A1%20%26%20tchau");
  const fin = PD.FINALIZADORES.whatsapp(PD.montarPedido(dadosValidos(), PRODUTOS, LOJA), LOJA);
  assert.equal(fin.tipo, "redirecionar");
  assert.ok(fin.url.startsWith("https://wa.me/" + LOJA.contato.whatsapp + "?text="));
});

test("sem a opção linkDosProdutos, a mensagem não leva nenhum link do site", () => {
  const loja = JSON.parse(JSON.stringify(LOJA));
  loja.pedidos.linkDosProdutos = false;
  const d = dadosValidos();
  d.urlBase = "https://williancoder.github.io/arte-militar-011/";
  const msg = PD.mensagemPedido(PD.montarPedido(d, PRODUTOS, loja), loja);
  assert.doesNotMatch(msg, /https?:\/\//);
  assert.match(msg, /Cód\. VES-007/);
  const unico = PD.mensagemProduto(PRODUTOS[0], {}, 1, loja, "https://williancoder.github.io/x");
  assert.doesNotMatch(unico, /https?:\/\//);
});

test("catálogo real: mensagem não expõe o endereço provisório do GitHub", () => {
  if (LOJA_REAL.pedidos.linkDosProdutos) return; // loja ligou os links de propósito
  const d = dadosValidos();
  d.urlBase = "https://williancoder.github.io/arte-militar-011/";
  d.itens = [{ id: PRODUTOS_REAL[0].id, variacoes: {}, qtd: 1 }];
  const msg = PD.mensagemPedido(PD.montarPedido(d, PRODUTOS_REAL, LOJA_REAL), LOJA_REAL);
  assert.doesNotMatch(msg, /github/i);
});

test("CPF e CNPJ: confere dígitos verificadores e formata", () => {
  assert.equal(PD.validarDocumento("529.982.247-25"), true);
  assert.equal(PD.validarDocumento("529.982.247-24"), false);
  assert.equal(PD.validarDocumento("111.111.111-11"), false);
  assert.equal(PD.validarDocumento("11.222.333/0001-81"), true);
  assert.equal(PD.validarDocumento("11.222.333/0001-80"), false);
  assert.equal(PD.validarDocumento("123"), false);
  assert.equal(PD.formatarDocumento("52998224725"), "529.982.247-25");
  assert.equal(PD.formatarDocumento("11222333000181"), "11.222.333/0001-81");
});

test("nota fiscal: pede documento válido, razão social (CNPJ) e endereço mesmo na retirada", () => {
  const d = dadosValidos();
  d.entrega = "retirada";
  d.endereco = {};
  d.notaFiscal = { quer: true, documento: "123", razaoSocial: "" };
  let e = PD.validarPedido(d, LOJA);
  assert.ok(e.nf_doc && e.cep && e.rua, JSON.stringify(e));
  d.notaFiscal.documento = "11222333000181";
  e = PD.validarPedido(d, LOJA);
  assert.ok(e.nf_razao);
  d.notaFiscal.razaoSocial = "Empresa Exemplo LTDA";
  d.endereco = dadosValidos().endereco;
  igual(PD.validarPedido(d, LOJA), {});
});

test("nota fiscal: bloco pronto na mensagem do WhatsApp", () => {
  const d = dadosValidos();
  d.entrega = "retirada";
  d.notaFiscal = { quer: true, documento: "52998224725", razaoSocial: "" };
  const msg = PD.mensagemPedido(PD.montarPedido(d, PRODUTOS, LOJA), LOJA);
  assert.match(msg, /\*NOTA FISCAL: SIM\*\nCPF: 529\.982\.247-25\nNome: Fulano de Tal\nPraça da Sé, 100\nSé - São Paulo\/SP\nCEP 01001-000\nValor dos produtos na nota: R\$ 322,81 \(já com desconto Pix\)/);
  // retirada: o endereço vai só no bloco da nota, não na entrega
  assert.match(msg, /\*ENTREGA\*\nRetirar na loja física\n\n\*PAGAMENTO\*/);
});

test("nota fiscal: sem pedido de nota, a mensagem avisa e não pede documento", () => {
  const msg = PD.mensagemPedido(PD.montarPedido(dadosValidos(), PRODUTOS, LOJA), LOJA);
  assert.match(msg, /Nota fiscal: não solicitada/);
  const loja = JSON.parse(JSON.stringify(LOJA));
  loja.pedidos.notaFiscal = false;
  const d = dadosValidos();
  d.notaFiscal = { quer: true, documento: "123" };
  igual(PD.validarPedido(d, loja), {});
  assert.doesNotMatch(PD.mensagemPedido(PD.montarPedido(d, PRODUTOS, loja), loja), /Nota fiscal/i);
});
