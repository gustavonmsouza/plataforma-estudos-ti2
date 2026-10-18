# Quorbe — Loja de Cosméticos (adaptada ao projeto)

Esta versão foi ajustada para a estrutura existente em `codigo/`, preservando a página e a barra lateral da loja.

## Arquivos usados
- `public/assets/js/servidor.js`: servidor Express e API da loja. O arquivo usa caminhos relativos à pasta do projeto, então continua encontrando `public/` e `db/db.json` após a mudança.
- `db/db.json`: banco de dados utilizado pelo servidor.
- `public/loja.html`: interface da loja.
- `public/assets/js/loja.js`: pesquisa, filtro, seleção de usuário, CRUD e resgate.
- `public/assets/css/tokens.css` e `public/assets/css/style.css`: estilos existentes.
- `public/assets/images/cosmeticos/`: imagens locais referenciadas pelo banco.

Os arquivos antigos e duplicados foram preservados em `legacy/PaginaL/` e `legacy/db-public/`, fora da pasta pública do servidor. Eles são arquivos de referência e não são usados na execução principal.

## Como executar no Windows
1. Extraia o ZIP.
2. Abra o terminal na pasta `codigo` (a pasta que contém `package.json`). O servidor está organizado em `codigo/public/assets/js/servidor.js`.
3. Execute `npm install` (necessário apenas na primeira vez).
4. Execute `npm start`.
5. Abra `http://localhost:3000/loja.html`.

Não abra `loja.html` com duplo clique nem use o Live Server: a página precisa ser servida pelo Express para que as chamadas `/api/...` funcionem.

## Funcionalidades
- Exibe os cosméticos cadastrados no `db/db.json`.
- Pesquisa e filtro de itens disponíveis/resgatados.
- Alunos podem resgatar itens; o servidor confere o saldo, desconta os Orbes e registra a posse.
- Professores e administradores têm as mesmas funções na loja: adicionar, editar e excluir cosméticos.
- O CRUD utiliza o `id` de cada cosmético, não a posição dele no array.
- As imagens de `Mochila` e `Boné escolar` foram colocadas em `public/assets/images/cosmeticos/` e os caminhos foram corrigidos no JSON.

## Login e troca de usuário
A loja tenta primeiro identificar o usuário autenticado em `sessionStorage.usuarioCorrente`, se existir um usuário correspondente no banco. Se não houver sessão compatível, usa o usuário de demonstração escolhido e salvo no `localStorage`. No menu de usuário, clique em **Trocar usuário de teste** para testar os perfis cadastrados no JSON.

Para testar o gerenciamento, selecione `Fernanda Alves Martins`, cuja função no banco é `professor`. A interface e o servidor autorizam `professor`, `administrador` e `admin` a gerenciar cosméticos.

## Observação de segurança
A seleção via `localStorage` e o cabeçalho `x-usuario-id` são mecanismos de demonstração para trabalho acadêmico, não autenticação de produção: alguém pode alterar esses valores no navegador. Em produção, o servidor deve obter o usuário de uma sessão/token validado, sem confiar no ID enviado pelo cliente.


Observação: embora o servidor esteja dentro de `public/assets/js` conforme a organização solicitada, a rota HTTP que corresponderia ao arquivo do servidor retorna 404 para não expor seu código-fonte. O servidor calcula os caminhos do banco e da pasta pública a partir do local do arquivo.
