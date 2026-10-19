# Lúcia Jacinta Crochê V3.0

## Instalação
1. Guarde uma cópia dos dados locais da V2.1 (exportação JSON, se houver), pois esta V3 usa banco online e **não importa automaticamente** os produtos locais.
2. Edite `config.js` e substitua `COLE_AQUI_SUA_PUBLISHABLE_KEY` pela **Publishable key** do projeto Supabase. Confirme também a URL do projeto no dashboard.
3. Substitua na raiz do repositório GitHub estes arquivos: `index.html`, `admin.html`, `app.js`, `admin.js`, `config.js`, `style.css`. Não envie uma subpasta. O deploy do Cloudflare Pages deve apontar para a raiz.
4. Abra `/admin.html`, entre com a conta autorizada na tabela `public.admins` e cadastre produtos reais. A loja `/` mostra apenas produtos ativos.
5. `data.js`, `painel.html` e ZIPs antigos podem permanecer temporariamente, mas **painel.html** antigo é público e não deve ser usado. Depois verifique referências e remova os obsoletos.

## Segurança
A proteção real depende das políticas RLS já criadas no Supabase. Jamais use chave `service_role`, secret key ou senha do banco em `config.js`. A chave publicável pode ficar no navegador. O carrinho envia pedido ao WhatsApp, **não processa pagamento** nem reserva estoque. Preços/estoques são exemplos até cadastrados no Supabase.

## Diagnóstico
Se não carregar, confirme o projeto URL e chave, a rede/CDN do Supabase, políticas RLS e a publicação do Cloudflare. Se o painel disser que a conta não é admin, confirme que o UID autenticado está em `public.admins`.
