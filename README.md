# TopTeam App

Primeira versão da aplicação privada TopTeam, independente dos simuladores de encomendas e das tabelas de preços.

## Inclui
- Ecrã de configuração da ligação ao Supabase com URL e chave **pública**.
- Login por email/palavra-passe via Supabase Auth.
- Leitura do perfil autenticado, sujeita às políticas RLS existentes.
- Painel inicial com módulos planeados (ainda não implementados).

## Publicação
Publicar os ficheiros `index.html`, `style.css` e `app.js` na raiz de um site estático (por exemplo Netlify). Para carregar no GitHub, extrair o ZIP e enviar os três ficheiros, não o ZIP como ficheiro único.

## Segurança
Nunca publicar a chave `service_role`, `sb_secret_...`, passwords ou outros segredos. A chave pública e o URL não substituem RLS corretamente configurado. Esta versão não persiste sessões após atualizar a página e não implementa ainda as funcionalidades de gestão de clientes/programas.
