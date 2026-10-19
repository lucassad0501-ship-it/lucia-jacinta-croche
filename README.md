# Lúcia Jacinta Crochê — V3.1 Profissional

## Instalação sem apagar configuração

1. No Supabase > SQL Editor, execute **supabase-storage.sql** UMA VEZ (somente se ainda não houver as políticas com esses nomes).
2. Mantenha o `config.js` que já funciona no seu GitHub, com `window.SUPABASE_CONFIG = {url, anonKey}` e `window.LUCIA_WHATSAPP`. **Não o substitua**: ele contém sua chave pública.
3. No GitHub, substitua na raiz os arquivos **index.html, admin.html, style.css, app.js, admin.js** pelos arquivos deste pacote.
4. Crie a pasta `assets` e envie `assets/logo.jpg`. No GitHub você pode usar **Add file > Upload files** e arrastar a pasta inteira no computador; no celular, crie `assets` e envie a foto dentro dela, preservando o caminho `assets/logo.jpg`.
5. Cloudflare Pages deve publicar automaticamente após os commits. Abra `admin.html?v=310` e faça login; teste com um produto e foto real da galeria. Abra a loja `/?v=310` para confirmar.
6. Mantenha arquivos antigos por enquanto; os arquivos substituídos devem manter **o mesmo nome**, sem duplicatas. A pasta antiga/ZIP antigo pode ser removida depois de validar o funcionamento.

## Segurança e limites

- Somente contas autorizadas na tabela `public.admins` podem alterar produtos, protegidos por RLS.
- Fotos enviadas ao bucket público `produtos` podem ser vistas por qualquer pessoa com o link; não envie documentos pessoais.
- Fotos: JPEG/PNG/WEBP até 5 MB; uma foto principal por produto nesta versão.
- Ao substituir fotos ou excluir produtos, arquivos antigos no Storage não são removidos automaticamente. É possível removê-los pelo painel Storage do Supabase.
- Pedidos são encaminhados ao WhatsApp, sem cobrança automática ou reserva de estoque. Ainda não é checkout Pix.
- Se a chave estiver correta e a página não atualizar, confira a publicação no Cloudflare Pages e limpe cache; as URLs usam `v=310`.
- **Nunca** coloque `service_role`, `sb_secret_` ou senha do banco no GitHub.
