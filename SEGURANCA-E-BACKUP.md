# Plano de segurança e recuperação — Lúcia Jacinta Crochê

## O que foi preparado
- `_headers`: cabeçalhos de segurança para páginas estáticas no Cloudflare Pages. Não substituem firewall, WAF, autenticação nem RLS.
- `.github/workflows/backup-supabase.yml`: exportação diária do banco PostgreSQL em formato custom, criptografia AES-256-CBC com PBKDF2 e artefato retido por 14 dias.
- O backup automático **não funciona** até configurar os dois secrets do GitHub Actions. Confirmar a primeira execução e baixar/testar uma cópia.
- O fluxo exporta o banco, **não os arquivos de imagens do Supabase Storage**, nem segredos, nem configurações do Cloudflare.

## Ativar o backup (não cole credenciais em arquivos, mensagens ou commits)
No repositório GitHub: Settings > Secrets and variables > Actions > New repository secret:
1. `SUPABASE_DB_URL`: string de conexão PostgreSQL do Supabase (Database > Connect). Usar usuário com permissão de leitura suficiente, conexão SSL, e verificar compatibilidade do cliente pg_dump com a versão do servidor. A URL deve ficar apenas no Secret.
2. `BACKUP_ENCRYPTION_PASSPHRASE`: senha longa, exclusiva e aleatória; guardar em gerenciador de senhas **fora do GitHub**. Sem ela, não é possível descriptografar os backups.

Acesse Actions > Backup criptografado do Supabase > Run workflow. Verifique o resultado e o artefato. Só depois disso considerar backup ativo. O cron roda aproximadamente diariamente e pode atrasar.

**Atenção:** o backup armazenado em Actions fica disponível a quem tiver permissões para artefatos do repositório; é criptografado. Para proteção contra perda/comprometimento da conta GitHub, copie periodicamente o arquivo criptografado para local independente. Os artefatos são eliminados após 14 dias.

## Recuperação — realizar primeiro em banco de teste
1. Baixe `backup-supabase.dump.enc` no histórico da execução.
2. Descriptografe localmente: `openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -in backup-supabase.dump.enc -out backup.dump` (será solicitada a senha).
3. Valide o conteúdo com `pg_restore -l backup.dump`.
4. Crie um projeto Supabase **de teste** e restaure com ferramenta PostgreSQL compatível, avaliando dependências, políticas, funções, extensões, Auth e Storage antes de qualquer restauração de produção. Não executar `--clean` nem sobrescrever produção sem plano de reversão.
5. Recupere também os arquivos de imagem do Storage a partir de backup independente; os metadados do banco sozinhos não restauram imagens.

## Itens a configurar no painel (ainda não verificados)
- Cloudflare: WAF, proteção contra bots e rate limiting com regras testadas; evitar bloquear clientes e o painel.
- Supabase: revisar RLS de `produtos`, `admins`, `pedidos` e políticas do bucket `produtos`. Permitir escrita somente a admins autenticados; leitura pública apenas do catálogo necessário.
- Habilitar MFA nas contas GitHub, Cloudflare e Supabase, preferencialmente com chaves de segurança/passkeys.
- Backups de imagens do Storage em destino separado e teste periódico de recuperação.
- Confirmar que o recurso de backups nativos/PITR do plano Supabase atende à necessidade. O fluxo do GitHub é complementar, não substitui PITR.
- Rever endpoint de diagnóstico protegido por token e rotacionar segredos caso tenham sido expostos.

## Critério de pronto
Backup diário executado com sucesso + artefato criptografado disponível + cópia independente + teste de restauração + cópia das imagens + RLS/WAF auditados.
