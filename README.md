# PLACAR DE JOGOS — FAMÍLIA SOUZA 🎮

Placar de jogos da Família Souza com visual de arena de videogame, fotos de Ariane, Jonatan e Nicolas, dominó, xadrez e outras modalidades que você adicionar. Criado para funcionar em celular e computador, sem necessidade de servidor próprio.

## Placar inicial

**Dominó:** Ariane 2, Jonatan 1, Nicolas 0.

**Xadrez:** Jonatan 2, Nicolas 1.

## Instalar/publicar no GitHub Pages

1. Crie um **repositório público** chamado `placar-familia-souza` em sua conta GitHub: <https://github.com/new?name=placar-familia-souza&description=Placar%20de%20Jogos%20da%20Familia%20Souza>.
2. Envie **todos os arquivos e pastas** deste projeto para a raiz do repositório (ou peça ao ChatGPT, após criar o repositório, para enviá-los). Não envie somente o arquivo ZIP.
3. No GitHub: **Settings → Pages → Build and deployment → Deploy from a branch**. Escolha a branch `main` e a pasta `/ (root)`. Salve.
4. Após a publicação, acesse: <https://jonatanoficial-bit.github.io/placar-familia-souza/>.

O endereço acima funcionará **após** o repositório e o GitHub Pages estarem configurados.

## Atualizar placar pelo celular

1. Abra o site.
2. Toque em **ATUALIZAR PLACAR**.
3. Toque em **+** para acrescentar uma vitória/ponto, ou **−** para corrigir.
4. As mudanças aparecem na mesma hora e são guardadas no **dispositivo atual**.
5. Para publicar a atualização para toda a família, use **SALVAR ONLINE** com um token configurado (instruções abaixo).

Sem publicar online, os pontos alterados em um dispositivo **não** aparecem automaticamente em outros. As alterações locais ficam salvas no navegador, mas podem ser perdidas se limpar os dados do site; é possível exportar backup JSON.

## Permitir publicações no placar online

O site é estático e **não tem senha administrativa própria**. Para publicar pontos no arquivo `data/placar.json`, o editor utiliza a API oficial do GitHub com um **fine-grained Personal Access Token**.

1. No GitHub, abra <https://github.com/settings/personal-access-tokens/new>.
2. Crie um token **fine-grained**, de curta duração, restrito **somente** ao repositório `placar-familia-souza` e com permissão **Contents: Read and write**. Não compartilhe esse token com ninguém.
3. No site, clique na **engrenagem** e cole o token no campo solicitado. O token não é salvo no armazenamento local nem incluído no repositório; é usado apenas enquanto a aba estiver aberta. Se fechar/atualizar a aba, será necessário informá-lo novamente.
4. Use **PUBLICAR PLACAR**. O site atualiza o JSON do GitHub. Para ver as alterações em outro dispositivo, basta atualizar a página ou usar o botão de sincronização.

**Importante:** qualquer pessoa que obtenha o token poderá editar conteúdos autorizados no repositório. Use sempre token com permissão mínima e revogue imediatamente se suspeitar de exposição. O sistema não substitui autenticação de usuário de um backend. Para edição compartilhada com login e sincronização automática em tempo real, a evolução recomendada é integrar Supabase com autenticação e políticas de acesso.

## Arquivos

- `index.html`: interface do placar.
- `styles.css`: visual console de jogos, responsivo.
- `app.js`: lógica, histórico, backup, atualização e sincronização com GitHub.
- `data/placar.json`: placar público inicial, lido pelos visitantes.
- `assets/`: fotos dos jogadores e favicon.
- `404.html`: redirecionamento para a página principal.

## Ajustes e expansão

- **Novo jogo**: após entrar em modo edição, use `+ NOVO JOGO` e escolha os participantes.
- **Novo jogador**: em modo edição, clique no cartão `NOVO JOGADOR`. A foto será compactada; fotos enviadas ao placar online ficarão públicas.
- **Histórico**: registra as últimas 50 mudanças de pontuação. O botão **DESFAZER ÚLTIMA** desfaz a última mudança de ponto.
- **Backup**: use **EXPORTAR JSON** e **IMPORTAR JSON** nas configurações.

## Privacidade

Este repositório, quando público, inclui as fotos e os nomes dos integrantes da família; confira se todos concordam com essa publicação. O site não coleta analytics e não envia dados para terceiros, com exceção das chamadas explícitas à API do GitHub (para carregamento/publicação). Fontes visuais usam Google Fonts.

**Projeto independente**, inspirado no estilo visual de placares de videogame de esportes. Sem associação a marcas de games.
