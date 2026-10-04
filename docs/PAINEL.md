# Painel administrativo

O painel é onde você edita **tudo** do site sem mexer em código:

**https://williancoder.github.io/arte-militar-011/admin/**

(guarde nos favoritos; ele não aparece em nenhum link da loja e o Google não o lista)

| Seção | O que dá para fazer |
|---|---|
| **Produtos** | criar, editar, duplicar, excluir; preço e promoção; **fotos** (o painel reduz e comprime sozinho); tamanhos, cores e outras opções; descrição; marcar **esgotado** com um clique; selos (destaque, lançamento, mais vendido, oferta) |
| **Banners da home** | título, texto, botão, para onde o botão leva, foto ou desenho, ordem |
| **Categorias** | renomear, mudar ícone e ordem do menu lateral, criar categorias e subcategorias |
| **Loja e contatos** | **WhatsApp que recebe os pedidos**, telefone, e-mail, redes sociais, endereço, mapa e horários |
| **Pedidos e pagamento** | desconto no Pix, faixa de aviso do topo, formas de entrega e de pagamento |
| **Cores** | cores que você pode marcar nos produtos |
| **Textos** | sobre a loja, política de trocas, privacidade, descrição para o Google |

## Primeiro acesso: a chave (uma vez só)
O painel grava direto no GitHub, então precisa de uma **chave de acesso** sua. Ela só consegue mexer no repositório da loja.

1. Na tela de entrada do painel, toque em **Criar minha chave no GitHub** — abre o formulário já preenchido. (Ou entre em **https://github.com/settings/personal-access-tokens/new**, logado na sua conta.)
2. **Token name:** `Painel Arte Militar 011` · **Expiration:** 1 ano (ou o prazo que preferir).
3. **Repository access:** *Only select repositories* → escolha **arte-militar-011**.
4. **Permissions** → *Repository permissions* → **Contents** → *Read and write*.
5. Clique em **Generate token** e copie a chave (começa com `github_pat_`).
6. Abra o painel, cole a chave e clique em **Entrar no painel**. Marque *Lembrar neste aparelho* só no seu computador ou celular pessoal.

> Guarde a chave como uma senha. Se perder o aparelho ou achar que alguém viu a chave, apague-a em **github.com/settings/personal-access-tokens** e gere outra. Quando ela vencer, o painel avisa: é só gerar uma nova do mesmo jeito.

## Como funciona o dia a dia
1. **Edite** o que quiser. Tudo fica num **rascunho** guardado no seu navegador. Se fechar a aba sem querer, ao voltar o painel pergunta se quer continuar de onde parou.
2. **Ver prévia** abre o site com as suas mudanças (com uma faixa amarela "PRÉVIA"). Só você vê.
3. **Publicar no site** grava tudo de uma vez no GitHub. Em **1 a 3 minutos** o site se atualiza, e o próprio painel avisa quando já estiver no ar.

O painel **não deixa publicar com erro** (preço vazio, código repetido, WhatsApp incompleto...): ele mostra a lista do que corrigir. E se alguém mudar o site por outro caminho enquanto você editava, ele avisa em vez de apagar a mudança da outra pessoa.

## Dicas
- **Fotos:** a primeira é a capa; use as setas para mudar a ordem. Formato ideal: quadrada, fundo claro. Pode mandar a foto direto do celular, porque o painel reduz para ~1200 px e comprime em WebP.
- **Promoção:** preencha "Preço antigo" com um valor **maior** que o preço de venda. O selo "-15%" e a página Ofertas são automáticos.
- **Código do produto** (`CAL-001`...): é sugerido automaticamente por categoria. Ele aparece em cada item do pedido no WhatsApp.
- **Duplicar** é o jeito mais rápido de cadastrar produtos parecidos (outra cor, outro modelo).
- **Excluir** tira o produto do site. As fotos dele continuam guardadas no GitHub, caso precise de novo.
- Categoria ou cor **em uso** por algum produto não pode ser apagada (o botão fica desativado). Mude os produtos antes.
- O histórico de tudo que foi publicado fica no GitHub (aba *Commits*), com a lista das mudanças. Dá para desfazer qualquer publicação por lá.

## Pelo celular
Funciona no navegador do celular. O menu fica no topo; role para baixo para editar. Para fotos, **Adicionar fotos** abre a câmera ou a galeria.

## Problemas comuns
| Mensagem | O que fazer |
|---|---|
| "Chave de acesso inválida ou vencida" | gere uma chave nova (passos acima) |
| "A chave não tem permissão de gravar" | a chave precisa de **Contents: Read and write** |
| "Repositório não encontrado" | confira, na chave, se o repositório **arte-militar-011** está selecionado |
| "O site foi alterado em outro lugar" | recarregue a página do painel e refaça a última mudança |
| Publiquei e o site não mudou | espere 3 minutos e recarregue com **Ctrl + F5**. Veja a aba **Actions** do repositório: ❌ vermelho mostra o motivo |
