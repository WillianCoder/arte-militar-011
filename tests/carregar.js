// Carrega os arquivos do site (feitos para o navegador) dentro do Node, sem dependências.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const PASTA_SITE = path.join(__dirname, "..", "site");

function carregarSite() {
  const contexto = { console };
  contexto.window = contexto;
  contexto.globalThis = contexto;
  vm.createContext(contexto);
  for (const arquivo of ["config.js", "tema.js", "produtos.js", "ilustracoes.js", "pedido.js", "validar.js", "serializar.js"]) {
    const codigo = fs.readFileSync(path.join(PASTA_SITE, "js", arquivo), "utf8");
    vm.runInContext(codigo, contexto, { filename: arquivo });
  }
  return contexto;
}

module.exports = { carregarSite, PASTA_SITE };
