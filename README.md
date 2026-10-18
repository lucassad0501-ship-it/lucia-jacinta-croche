# Lúcia Jacinta Crochê — V2 demonstrativa

Arquivos estáticos para Cloudflare Pages. Produtos, preços e estoque são **demonstrativos**.

## Instalação

1. Extraia o ZIP e envie `index.html`, `admin.html`, `style.css`, `data.js`, `app.js`, `admin.js`, `config.js` para a raiz do repositório GitHub `lucia-jacinta-croche`.
2. Faça commit na branch `main`. O Cloudflare Pages deve publicar automaticamente se a integração estiver ativa.
3. Abra a loja na raiz do domínio e o painel em `/admin.html`.
4. Em `config.js`, configure o número comercial com DDI e DDD, apenas dígitos, para ativar o botão de WhatsApp.

## Importante

O painel é **apenas um protótipo local**: usa `localStorage`, portanto alterações não aparecem em outros dispositivos e podem desaparecer ao limpar os dados do navegador. Não há login real, pedidos persistidos ou pagamentos. **Não use como painel administrativo de produção.** Para a versão funcional online, integrar banco de dados, autenticação e permissões no servidor (ex.: Supabase ou Cloudflare D1 + Workers). Nunca incluir senhas ou chaves privadas no JavaScript público.
