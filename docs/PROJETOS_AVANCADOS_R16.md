# Projetos avançados — r16

## Comandos locais (sem usar o modelo)

- `menu avancado`
- `mapa de imports: C:\Users\voce\meu_projeto`
- `conferir dependencias: C:\Users\voce\meu_projeto`

As ferramentas `mapa_imports_projeto` e `conferir_dependencias_projeto` também
estão registradas em tools, para o agente com ferramentas da nuvem quando
habilitado. Isso não garante que todo provedor consiga selecioná-las corretamente.
Nenhuma delas precisa chamar uma API de IA, executar o projeto ou instalar pacotes.

## Diferença das ferramentas anteriores

Já existiam metricas_codigo (contagem de linhas/funções), gerar_testes,
rodar_testes_python (executa código), comandos Git e operações pip/venv.
As adições têm outro escopo: relações estáticas entre módulos e confronto de
requisitos declarados com metadados instalados. Não substituem essas ferramentas.
As 463 ferramentas anteriores foram mantidas; registro atual: 465.

## Mapa de imports

Usa AST e leitura de arquivos Python com reconhecimento do encoding. Resolve
imports internos absolutos/relativos e layout src. Identifica grupos fortemente
conexos com mais de um módulo. Não executa imports nem setup.py.

Limites: 200 arquivos, 512 KB por arquivo, 8 MB no total, 8 níveis. Exclui links,
ambientes, modelos, backups e nomes de arquivos sensíveis por heurística.
Use a raiz do projeto (que contém os pacotes), não a pasta interna de um pacote.
Nomes ambíguos são excluídos com aviso. Erros de sintaxe são reportados.

Não resolve importlib, imports montados em strings, sys.path customizado nem
condições de runtime/TYPE_CHECKING. Um ciclo pode ser inofensivo. A ausência de
ciclos não é certificado de arquitetura saudável. Saída limitada a 60 módulos,
15 grupos circulares e 20 avisos. Não analisa todos os arquivos de um projeto grande.

## Dependências declaradas

Lê requirements.txt e project.dependencies de pyproject.toml na raiz. Até 256 KB
por manifesto e 200 declarações. Usa packaging para interpretar PEP 440/508 e
importlib.metadata para consultar versões sem importar os pacotes do projeto.

Importante: compara com o **Python do agente**, indicado no relatório, não entra
silenciosamente no venv do projeto. Requisitos transitivos, extras, Poetry,
lockfiles, grupos e build-system não são verificados. Não segue -r, URLs,
continuações ou diretivas pip, e não imprime seu conteúdo potencialmente sensível.
Não consulta vulnerabilidades, repositórios de pacotes ou atualizações na rede.

pyproject.toml requer Python 3.11+ para tomllib. Se packaging não existir no
ambiente do agente, a ferramenta informa a limitação; não instala automaticamente.

## Referências primárias consultadas no GitHub (10/09/2026)

- https://github.com/tox-dev/pipdeptree — README: árvore de pacotes instalados,
  conflitos e ciclos; licença MIT indicada pelo projeto. Referência para a
  separação entre declarações e ambiente instalado, não implementação equivalente.
- https://github.com/seddonym/import-linter — README: restrições de imports e
  arquitetura Python; licença BSD-2-Clause indicada pelo projeto. Referência
  para análise estática de dependências internas.

Código próprio. Nenhum código desses projetos foi copiado e nenhum deles foi
instalado ou incorporado ao agente. Não afirmamos ser os “melhores” universalmente.

## Testes

Foi criado um venv de testes separado no sandbox e instalado somente packaging.
Para reproduzir em um ambiente de testes:

    python -m venv .venv
    .venv/bin/python -m pip install -r requirements-tests.txt
    .venv/bin/python -m unittest discover -s tests -v

No Windows use .venv\Scripts\python.exe. Não execute agente.py só para importar testes.
84 testes isolados passaram, incluindo ciclos, imports relativos, erros de sintaxe,
limites, nomes ambíguos, URLs sensíveis, marcadores/extras, manifestos e atalhos.
Não houve teste com o Windows real, o GGUF ou provedores da nuvem.

Se SEM_ATUALIZAR.txt protege autoedições locais, preserve/reconcilie essas mudanças
antes de reativar downloads. A atualização da branch não mescla automaticamente
suas ferramentas criadas no PC.
