# Lúcia Jacinta Crochê

Primeira versão estática da loja, pronta para Cloudflare Pages. Inclui catálogo de exemplo, pesquisa, filtros, carrinho e encomendas pelo WhatsApp.

## Publicação

1. Extraia o ZIP.
2. Envie `index.html`, `style.css` e `app.js` para a raiz do repositório GitHub `lucia-jacinta-croche` (não envie o ZIP como único arquivo).
3. No Cloudflare Pages, escolha **Import an existing Git repository**, selecione o repositório e configure **Framework preset: None**, **Build command: (vazio)**, **Build output directory: /** (raiz do projeto).
4. Publique e teste o endereço `.pages.dev`.
5. Em **Custom domains**, conecte `luciajacintacroche.com.br` após a ativação DNS.

## Atenção antes de vender

- Os quatro produtos e preços são **exemplos**. Substitua-os pelos itens reais em `app.js` e use fotos autorizadas.
- O carrinho apenas gera uma mensagem de WhatsApp. Não existe checkout Pix, cadastro, banco de dados nem painel administrativo nesta versão.
- Para Pix real: integrar provedor de pagamentos no backend, armazenar credenciais apenas em secrets, validar assinatura/webhook e confirmar pagamento no servidor.
- Para painel administrativo: autenticação forte, autorização por função, regras de banco e logs.
- Configurar política de privacidade, trocas/devoluções, frete, dados comerciais obrigatórios e testar em produção antes de anunciar a loja como pronta para pagamentos.

Não coloque senhas, tokens ou chaves privadas no GitHub nem em JavaScript do navegador.
