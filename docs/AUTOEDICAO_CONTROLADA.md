# Autoedição revisável — r14

## Escopo e autorização

O agente pode preparar código usando o modelo local, criar propostas de arquivos
.txt/.md na própria pasta e aplicar uma proposta **somente após confirmação
explícita**, inclusive em modo admin. Não há nova elevação Windows nem acesso
irrestrito a arquivos. Modo básico não permite aplicar. Ferramentas existentes
continuam registradas; criar_ferramenta_nova e as operações editar_seguro /
inserir_ferramenta da central_auto_codigo agora preparam propostas em vez de
alterar diretamente o fonte. As outras ferramentas antigas não foram
transformadas numa sandbox por esta mudança.

## Como usar

1. `mapear pasta do agente`: mapa limitado, sem executar código; exclui nomes
   sensíveis, dados de memória, backups, modelos e diretórios de dependências.
   Até 60 arquivos, 3 níveis, Python até 2 MB e 20 nomes de função por arquivo.
   Outros formatos permitidos têm somente metadados. Não é leitura integral.
2. `preparar adicoes: criar uma ferramenta que conte linhas de um arquivo`
   pede até 5 novas funções completas. Ou `implemente todas as ideias` para
   propor um lote a partir da última lista fundamentada no histórico.
   Listas longas não são implementadas integralmente de uma só vez.
3. `propor correcao nome_da_funcao: descreva o erro e o resultado esperado`
   restringe a proposta a uma função (até 7.000 caracteres de contexto).
4. `criar nota minhas_ideias.txt: texto da nota` prepara arquivo novo, sem
   sobrescrever um existente. Não permite chaves.txt, .env, .bat ou caminhos.
5. `ver alteracao`: mostra diff. O diff completo fica em
   autoedicao_pendente/diff.txt. Nova proposta substitui a pendente.
6. `aplicar alteracao`: mostra diff e exige digitar **APLICAR**.
7. `reverter autoedicao`: restaura a última aplicação, exige **DESFAZER** e
   recusa se o destino foi alterado depois. Para uma nota criada, a reversão
   remove somente aquela nota se ainda tem exatamente o conteúdo aplicado.

## Proteções implementadas

- Proposta e diff separados do código ativo; geração nunca executada como teste.
- Compilação e análise AST; registro original de ferramentas preservado em ordem.
- Adições não alteram funções existentes, configuração ou inicialização.
- Correção pontual preserva parâmetros, anotações de retorno e decoradores.
- Validadores e algumas funções de confirmação não podem ser alvos de autocorreção.
- Rejeita nomes duplicados, imports/comandos no topo, defaults/anotações
  executáveis e esqueletos triviais. Isso não prova implementação completa.
- Verifica conteúdo/hash antes de aplicar e reconfere destino após confirmação.
- Backup único antes de sobrescrever, gravação temporária e substituição,
  manifesto para reverter a última alteração.
- Ao editar agente.py, cria SEM_ATUALIZAR.txt **antes** da substituição. O BAT
  existente respeita esse marcador; atualizações ficam pausadas até remoção
  manual. Faça backup e reconcilie suas alterações ANTES de removê-lo, pois
  o download seguinte pode substituir a versão local. Reverter mantém o marcador.
- Propostas/backups excluídos do Git. Não enviar esses arquivos indiscriminadamente.

## Limites importantes

Não é uma sandbox nem um sistema de verificação formal. Código sintaticamente
válido pode estar errado ou ser perigoso; funções adicionadas passam a poder
rodar com as permissões do agente quando chamadas após reiniciar. Nenhum teste
gerado por IA é executado automaticamente. Revise o diff e teste num ambiente
separado antes de usar no PC principal. A confirmação é por lote, não cheque em branco.

Não protege contra um invasor com os mesmos privilégios alterando simultaneamente
arquivos locais; hashes são verificações de consistência, não assinaturas de origem.
Não é atualização transacional de múltiplos arquivos. O rollback cobre a última
aplicação; backups anteriores permanecem, sem exclusão automática nesta versão.
Falha de disco/energia/Windows pode exigir recuperação manual pelo backup.

## Referência e validação

Referência consultada: https://github.com/Aider-AI/aider (README, em 10/09/2026),
para fluxos de revisão, integração com diffs e distinção entre edição e testes.
Implementação própria: sem cópia de código, instalação do Aider ou dependência nova.

71 testes isolados passaram: adição/correção em arquivos temporários, preservação,
recusa, conflito de versão, aplicação/rollback, bloqueio do atualizador, validação
de cabeçalhos e manifestos, mapa sem segredos e geração simulada. As mesmas 463
ferramentas mantêm nomes e assinaturas. Não houve autoedição do agente real durante
os testes. Modelo GGUF real e execução completa no Windows ainda não testados.
