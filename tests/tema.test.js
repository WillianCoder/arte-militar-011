// Cores do site (paletas). Rode: node --test tests/
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { carregarSite, PASTA_SITE } = require("./carregar");

const site = carregarSite();
const T = site.TEMA;
const CSS = fs.readFileSync(path.join(PASTA_SITE, "css", "estilo.css"), "utf8");

// variáveis do primeiro bloco :root do estilo.css
function variaveisDoCss() {
  const bloco = CSS.match(/:root\s*\{([\s\S]*?)\n\}/)[1];
  const vars = {};
  for (const m of bloco.matchAll(/(--[\w-]+):\s*([^;]+);/g)) vars[m[1]] = m[2].trim().toLowerCase();
  return vars;
}

test("todas as paletas prontas são legíveis (contraste de texto, botões, preços e selos)", () => {
  for (const p of T.PALETAS) {
    assert.deepEqual(Array.from(T.problemas({ cores: p.cores })), [], `paleta "${p.nome}"`);
  }
});

test("paletas têm id único e as 6 cores", () => {
  const ids = T.PALETAS.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const p of T.PALETAS) for (const [k] of T.CAMPOS) assert.ok(T.hexValido(p.cores[k]), `${p.id}.${k}`);
});

test("paleta Militar gera exatamente as cores escritas no estilo.css (site igual com ou sem JavaScript)", () => {
  const css = variaveisDoCss();
  const v = T.variaveis({ cores: T.PALETAS[0].cores });
  for (const k of Object.keys(v)) {
    assert.ok(k in css, `${k} falta no :root do estilo.css`);
    assert.equal(css[k], String(v[k]).toLowerCase(), k);
  }
});

test("config.js usa um tema válido", () => {
  assert.ok(site.LOJA.tema, "config.js sem tema");
  assert.deepEqual(Array.from(T.problemas(site.LOJA.tema)), []);
});

test("cor faltando ou errada volta para a paleta padrão", () => {
  const n = T.normalizar({ cores: { fundo: "azul", texto: "#ABCDEF" } });
  assert.equal(n.fundo, T.PALETAS[0].cores.fundo);
  assert.equal(n.texto, "#abcdef");
  assert.equal(T.normalizar(undefined).destaque, T.PALETAS[0].cores.destaque);
});

test("ajuste fino: mexer numa cor sai da paleta pronta e recalcula os tons", () => {
  const cores = Object.assign({}, T.PALETAS[0].cores, { destaque: "#3a7bd5" });
  assert.equal(T.paletaDasCores(cores), null);
  const v = T.variaveis({ cores });
  assert.equal(v["--coyote"], "#3a7bd5");
  assert.notEqual(v["--coyote-forte"], "#e0bd80");
  assert.equal(v["--destaque-rgb"], "58, 123, 213");
  assert.equal(T.paletaDasCores(T.PALETAS[3].cores).id, T.PALETAS[3].id);
});

test("paleta clara: tons fortes escurecem e letras dos botões ficam brancas", () => {
  const clara = T.PALETAS.find((p) => p.id === "areia-clara");
  const v = T.variaveis({ cores: clara.cores });
  assert.ok(T.contraste(v["--coyote-forte"], "#ffffff") > T.contraste(v["--coyote"], "#ffffff"));
  assert.equal(v["--sobre-destaque"], "#ffffff");
});

test("cores ilegíveis geram aviso no painel", () => {
  const ruim = { cores: { fundo: "#ffffff", superficie: "#ffffff", texto: "#dddddd", destaque: "#ffff66", apoio: "#eeeeee", oferta: "#ff9999" } };
  const msgs = T.problemas(ruim).join("\n");
  assert.match(msgs, /texto está pouco visível/);
  assert.match(msgs, /cor principal quase some/);
});

test("validação do painel recusa código de cor inválido", () => {
  const loja = JSON.parse(JSON.stringify(site.LOJA));
  loja.tema.cores.destaque = "dourado";
  const msgs = site.VALIDAR.validarCatalogo(loja, [], site.ILUSTRACOES.tipos).map((p) => p.msg).join("\n");
  assert.match(msgs, /Cor "destaque" inválida/);
});

test("estilo.css: cores fixas só onde não devem mudar com a paleta", () => {
  // WhatsApp (cor da marca), prévia do painel, prévia da mensagem, fundo branco das fotos, impressão
  const PERMITIDAS = ["#25d366", "#1ea952", "#3be07a", "#052b13", "#7a5b16", "#fff3cf", "#0b1410", "#1f3a2a", "#d6e8dc", "#fff", "#000"];
  const semRoot = CSS.replace(/:root\s*\{[\s\S]*?\n\}/, "");
  const fixas = (semRoot.match(/#[0-9a-f]{3,8}\b/gi) || []).map((c) => c.toLowerCase()).filter((c) => !PERMITIDAS.includes(c));
  assert.deepEqual(fixas, [], "use as variáveis do :root (var(--...)) para a cor acompanhar a paleta");
  const rgbaFixas = (semRoot.match(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+/g) || [])
    .filter((c) => !/rgba\(0, 0, 0|rgba\(37, 211, 102/.test(c));
  assert.deepEqual(rgbaFixas, [], "use rgba(var(--destaque-rgb), .x) e afins");
});
