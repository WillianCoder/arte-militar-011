# Nota fiscal — guia simples

> ⚠️ Isto é uma orientação geral para você entender o assunto, **não é consultoria contábil**. As regras mudam conforme o tipo de empresa (MEI, ME...), a atividade e o estado. Antes de começar a vender, confirme com um **contador** ou com o **Sebrae** (atendimento gratuito: 0800 570 0800 · sebrae.com.br).

## O que o site já faz por você
No pedido, o cliente pode marcar **"Quero nota fiscal desta compra"**. Aí o site:
- pede **CPF ou CNPJ** e confere se o número é válido (não aceita número inventado);
- pede a **razão social** quando é CNPJ (empresa);
- pede o **endereço completo**, mesmo se ele for retirar na loja (a nota precisa);
- manda tudo na mensagem do WhatsApp, num bloco pronto:

```
*NOTA FISCAL: SIM*
CPF: 529.982.247-25
Nome: Fulano de Tal
Praça da Sé, 100
Sé - São Paulo/SP
CEP 01001-000
Valor dos produtos na nota: R$ 322,81 (já com desconto Pix)
```

Os produtos (nome, código, quantidade e preço) já vêm logo acima na mesma mensagem. Para emitir, é só **copiar esses dados para o emissor de nota**.

Quando o cliente não pede, a mensagem diz "Nota fiscal: não solicitada". Para tirar a opção do site, desligue em **Painel → Pedidos e pagamento → Oferecer "Quero nota fiscal"**.

## O que você precisa para emitir nota de venda de produtos
1. **CNPJ.** O mais comum para começar é o **MEI** (abertura grátis no portal gov.br/mei), desde que a sua atividade e o faturamento caibam no MEI (limite anual definido em lei).
2. **Inscrição estadual** na Secretaria da Fazenda de SP (vender mercadoria é atividade de comércio, ligada ao ICMS). O contador ou o Sebrae verifica se a sua já sai junto com o CNPJ.
3. **Certificado digital** (tipo A1, arquivo instalado no computador), em geral entre R$ 150 e R$ 250 por ano. É a "assinatura" da nota.
4. **Um sistema emissor de nota**, onde você digita (ou cola) os dados e ele gera a nota. Exemplos conhecidos: Bling, Tiny/Olist, eNotas, Nuvem Fiscal. A maioria tem plano pago mensal e alguns têm teste grátis.
5. O **código fiscal (NCM)** de cada tipo de produto (coturno, mochila, faca...). O contador te passa a lista uma vez e você reaproveita.

## Pontos que valem perguntar ao contador
- Sendo MEI, em quais vendas sou **obrigado** a emitir nota? (É comum a regra mudar entre vender para pessoa física e para empresa.)
- Para enviar pelos **Correios**, preciso da nota ou posso usar **declaração de conteúdo**?
- Qual emissor ele recomenda e quais **NCM** usar para cada categoria da loja.

## Dá para emitir sozinho, automático?
Dá, mas é um passo **pago** e para mais adiante (ele combina com o "pagamento pelo site", veja [PAGAMENTOS-FUTURO.md](PAGAMENTOS-FUTURO.md)). Funciona assim:
- você contrata um emissor que tenha **integração (API)**, por exemplo Bling, Nuvem Fiscal ou Focus NFe;
- criamos um pequeno serviço que, quando o pedido é **confirmado e pago**, manda os dados que o site já coleta para o emissor;
- a nota sai sozinha e o PDF/XML vai para o cliente por e-mail ou WhatsApp.

Por segurança, a nota **não deve** ser emitida no instante em que o cliente envia o pedido pelo WhatsApp. Nessa hora ainda falta você confirmar estoque, frete e pagamento, e uma nota emitida errada precisa ser cancelada.
