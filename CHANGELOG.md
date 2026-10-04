# Changelog — Arte Militar 011

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) · Versões: [SemVer](https://semver.org/lang/pt-BR/)

## [Não lançado]

## [1.3.0] - 2026-10-04
### Adicionado
- Opção "Quero nota fiscal" no pedido: CPF/CNPJ com verificação dos dígitos, razão social para CNPJ e endereço obrigatório; bloco **NOTA FISCAL** pronto na mensagem do WhatsApp. Liga/desliga no painel.
- `docs/NOTA-FISCAL.md`: o que é preciso para emitir nota e o caminho para emissão automática.

### Alterado
- A mensagem do WhatsApp não leva mais links do site (o endereço provisório não aparece para o cliente). Opção `linkDosProdutos` no painel para religar com domínio próprio.
- Texto de privacidade menciona CPF/CNPJ.

## [1.2.0] - 2026-10-04
### Adicionado
- **Painel administrativo** em `site/admin/`: produtos (com upload e compressão de fotos), banners, categorias, contatos/WhatsApp, loja física, entregas e pagamentos, cores e textos. Rascunho automático, prévia do site, validação antes de publicar, publicação em um único commit pelo GitHub e aviso quando já está no ar.
- `site/js/validar.js` (regras do catálogo) e `site/js/serializar.js` (gravação padronizada de `config.js`/`produtos.js`).
- Modo prévia na loja (`?previa=1`).

### Alterado
- `config.js` e `produtos.js` passam a ser gravados em formato JSON (o mesmo que o painel usa); nenhum dado mudou.
- Testes de cálculo do pedido usam um catálogo de exemplo fixo, para que mudar preços pelo painel nunca trave a publicação.
- `ferramentas/fotos.js` grava pelo mesmo módulo do painel.

## [1.1.0] - 2026-10-04
### Adicionado
- Código curto em cada produto (`CAL-001`, `VES-007`...), exibido no pedido do WhatsApp.
- Mensagem do pedido reorganizada em blocos: resumo (produtos diferentes, unidades, total), produtos detalhados (código, categoria, variações, conta, preço antigo, descrição e link), valores (subtotal, economia, desconto Pix, frete, total), cliente, entrega, pagamento e observações. Pedidos grandes saem em versão compacta.
- Prévia da mensagem do WhatsApp na página do pedido e resumo completo na tela de confirmação.
- Resumo do carrinho com produtos diferentes, unidades e economia nas promoções.
- `ferramentas/fotos.js`: liga as fotos de `site/img/produtos/` aos produtos pelo código e gera `docs/FOTOS.md`.

### Corrigido
- Aviso "foi adicionado ao pedido" não fica mais por cima da página seguinte.

## [1.0.0] - 2026-10-04
### Adicionado
- Site da loja com **painel lateral à esquerda**: busca, "Meu pedido", categorias que abrem no clique, vitrines e atendimento.
- Página inicial com banners rotativos, benefícios, categorias, destaques, ofertas, lançamentos, faixa da loja física e "como comprar".
- Categorias com filtros por subcategoria, cor, disponibilidade e ordenação; busca sem acento.
- Página de produto com variações (tamanho, cor, lado...), quantidade, "Adicionar ao pedido", "Comprar agora pelo WhatsApp" e compartilhamento.
- Pedido com dados do cliente, entrega (retirada, envio, motoboy), CEP automático (ViaCEP), pagamento preferido, desconto Pix e envio da mensagem pronta para o WhatsApp.
- Histórico "Meus pedidos" no aparelho, com "pedir de novo" e "reenviar".
- Loja física com mapa do Google, botões Google Maps/Waze e horários; página de contato com formulário para o WhatsApp; FAQ, trocas, sobre e privacidade.
- 51 produtos de exemplo em 6 categorias e 38 ilustrações SVG que mudam de cor conforme a variação.
- Dados estruturados (Loja e Produto), Open Graph com imagem de compartilhamento e manifest.
- Testes automáticos do catálogo e do pedido (`node --test`), rodando no CI.
- Documentação: guia de edição, produtos e fotos, publicação/domínio, pagamentos futuros e pesquisa de referências.
