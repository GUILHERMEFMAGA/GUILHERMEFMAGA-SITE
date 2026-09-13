# Oficina local r18 — primeiro lote da expansão

## Progresso real (não confundir meta com entrega)

- Base r17: 465 ferramentas.
- Este lote: **14 capacidades implementadas / 14 ferramentas novas**.
- Total registrado: **479**, faltam **221** para a meta de 700.
- Pedido de 100 ideias implementadas: 14 neste lote; as outras 86 ainda não
  foram implementadas nem certificadas como inéditas. Não há 100 implementações.
- Código/projetos primeiro, com distribuição também para documentos/dados.
- Alterações confirmadas foram autorizadas, mas este primeiro lote é somente
  leitura. Não altera as permissões das ferramentas existentes.

Cada linha abaixo corresponde a uma capacidade funcional distinta, não a uma
variante artificial de nome/parâmetro. Regras internas e helpers não são contados
como ferramentas extras. Para continuar, comparar propostas com o catálogo
**atualizado**, não apenas com as 465 da base original.

## Uso local sem depender do modelo

Digite `oficina local` para ver a lista e os parâmetros. Também aparece em
`menu avancado`. Formato exato:

```text
oficina local auditar_armadilhas_python: {"caminho":"C:/projetos/app.py"}
oficina local comparar_api_python: {"antes":"C:/projetos/antigo.py","depois":"C:/projetos/novo.py"}
oficina local verificar_chaves_csv: {"caminho":"C:/dados/vendas.csv","colunas":"id,loja","delimitador":";"}
oficina local conferir_relacao_csv: {"pai":"C:/dados/clientes.csv","filho":"C:/dados/pedidos.csv","coluna_pai":"id","coluna_filho":"cliente_id","delimitador":";"}
```

Use `/` nos caminhos Windows, ou escape cada `\` como `\\` no JSON. Os campos
são strings. A allowlist aceita somente as 14 ferramentas deste lote: não é
um atalho para executar comandos arbitrários. Pedidos malformados são rejeitados,
não encaminhados para uma IA tentar adivinhar.

As ferramentas estão no catálogo compartilhado do agente, para preservar a
arquitetura de seleção existente. A implementação e os atalhos são offline;
nenhuma mudança no rodízio de provedores, GGUF, treinamento ou seleção de modelo.
Isso não torna a conversa do GGUF intrinsecamente mais inteligente: acrescenta
operações verificáveis que o agente pode usar. A seleção por linguagem natural
continua heurística e não é garantida; os atalhos são a opção inequívoca.

## Matriz de novidade e escopo

Os recursos próximos foram inspecionados no código, não só pelos nomes. Não é
prova matemática de ausência de toda equivalência semântica.

| ID | Ferramenta nova | Recurso anterior próximo | Diferença implementada |
|---|---|---|---|
| I001 | `auditar_armadilhas_python` | `revisar_codigo`, `verificar_sintaxe_python` | Regras AST deterministas para defaults mutáveis literais, except amplo/silencioso e `is` com literal; não consulta modelo, não se limita à sintaxe. |
| I002 | `comparar_api_python` | `comparar_arquivos`, `diff_arquivos_texto` | Compara contratos públicos de topo via AST, não linhas/corpos; sinaliza parâmetros, async, annotations e decorators. |
| I003 | `inventariar_testes_python` | `rodar_testes_python`, `metricas_codigo` | Inventário estático de candidatos test_*, inclusive TestCase; não executa testes nem fornece cobertura. |
| I004 | `validar_notebook_local` | `central_json` | Verificações específicas de células v4, outputs, contadores e IDs; não é somente sintaxe JSON. |
| I005 | `auditar_dockerfile_local` | `revisar_codigo` | Heurísticas explícitas de Dockerfile sem modelo, build ou instalação; estado do USER no estágio final. |
| I006 | `verificar_links_markdown_locais` | `checar_links` | Destinos inline locais dentro da pasta do documento, sem HTTP nem leitura do conteúdo de destino. |
| I007 | `comparar_estrutura_json` | `central_json`, `comparar_arquivos` | Diferenças de caminhos e conjuntos de tipos observados, não diferenças de valores/texto. |
| I008 | `validar_jsonl_local` | `validar_json_texto`, `central_json` | Um JSON por linha, diagnóstico por registro, duplicação de chaves e NaN/Infinity recusados. |
| I009 | `verificar_chaves_csv` | `remover_linhas_duplicadas`, `estatisticas_csv` | Valida identidade por chave composta selecionada, mesmo se os demais campos diferirem; não modifica. |
| I010 | `conferir_relacao_csv` | `mesclar_csvs`, `central_planilha` | Integridade referencial pai/filho, chaves órfãs, duplicadas e vazias; não faz merge/soma. |
| I011 | `auditar_zip_local` | `central_arquivos`, `verificar_integridade_pasta` | Metadados de ZIP, traversal, links e expansão declarada, sem extrair nem criar manifesto. |
| I012 | `validar_legendas_srt` | `central_texto`, `transformar_texto` | Validação de sequência, timestamps, duração e sobreposição de legendas. |
| I013 | `validar_xml_local` | `central_json`, leitores genéricos | XML bem formado, posição de erro e contagem estrutural; recusa DTD/entidades, não XSD. |
| I014 | `inspecionar_sqlite_local` | `ler_e_analisar_arquivos_dados` | Catálogo de snapshot SQLite em memória sem consultar registros, executar SQL do usuário ou abrir o banco em disco via SQLite. |

## Limites, privacidade e interpretação

- Entrada: arquivo explícito regular de até **1.000.000 bytes** cada. Nada é
  varrido automaticamente. Texto UTF-8/BOM; Python respeita declaração de encoding.
- Bloqueia URLs, UNC, symlinks/junctions e alguns nomes/pastas sensíveis. É uma
  heurística, não DLP, sandbox ou proteção contra troca concorrente do arquivo.
  Unidade já mapeada em rede não é identificada como tal: escolha arquivos em
  disco local. Não analise arquivos não confiáveis sob processo elevado.
- Não usa subprocessos, APIs de IA, rede HTTP, execução/imports do projeto,
  descompactação, instalação ou escrita dos documentos analisados.
- Não imprime código, linhas CSV, valores JSON/XML, células/outputs ou registros
  SQLite. Pode exibir nomes de objetos/chaves; revise antes de compartilhar.
- Saída limitada a 80 itens; identificadores escapados e truncados em 120 caracteres.
  Arquivo/encoding/formato não suportado pode produzir erro tratado pelo invocador,
  sem repetir a ação e sem exibir conteúdo da exceção.
- Python: AST até 50.000 nós; assinatura pública só no topo. Não interpreta classes,
  exports dinâmicos, resolução de símbolos ou compatibilidade de comportamento.
- Testes: candidatos, não coleta pytest real nem quantidade de casos parametrizados.
- Notebook: até 2.000 células, verificações **parciais**, não schema nbformat completo.
- Dockerfile: análise lexical simplificada; heredocs/escape personalizado recusados.
  USER herdado não é conhecido. Tags, estágios e variáveis exigem revisão.
- Markdown: até 500 links inline simples; não resolve referências, HTML, títulos,
  parênteses complexos ou âncoras. Links externos e fragmentos são ignorados.
- JSON estrutural: 30 níveis/10.000 nós; arrays agregados sem ordem. Não infere
  campos obrigatórios nem contrato de uma API a partir de duas amostras.
- JSONL: 10.000 linhas; vazias são inválidas; não valida schema por registro.
- CSV: 10.000 registros por arquivo; delimitador explícito, cabeçalho único e
  quantidade de campos consistente. Comparação textual exata, sem conversão de
  tipos ou espaços. Nomes de colunas com vírgulas não são suportados na seleção
  de chave composta. Numeração de registros não é linha física de CSV multiline.
- ZIP: até 5.000 entradas; expansão só declarada, CRC/malware não avaliados. Não
  garante detectar todos os caminhos inválidos em todos os sistemas operacionais.
- SRT: até 5.000 blocos; sobreposição pode ser intencional.
- XML: não processa XInclude, DTD ou entidades declaradas; não valida XSD.
- SQLite: precisa de `Connection.deserialize`. Usa cópia em memória e SQL fixo
  somente sobre sqlite_master, query_only/trusted_schema. Não considera WAL externo:
  use snapshot consistente, não banco em uso. Não verifica integridade dos dados.
- Ausência de avisos **não certifica** correção, segurança ou qualidade.

## Referências GitHub consultadas em 10/09/2026

- https://github.com/astral-sh/ruff — organização de verificações estáticas Python.
- https://github.com/jupyter/nbformat — formato de notebook e distinção de schema.
- https://github.com/hadolint/hadolint — lint específico de Dockerfile e limites da
  análise lexical em comparação com um linter completo.

Implementação própria e pequena com stdlib. Não copia, instala ou incorpora esses
projetos e não alega equivalência à cobertura, qualidade ou desempenho deles.

## Validação

113 testes isolados passaram (20 novos), com fixtures pequenas reais. Cobrem cada
uma das 14 ferramentas, parâmetros e allowlist, privacidade de valores, entradas
malformadas, links, limites, efeitos de leitura e ausência de execução do projeto.
Auditoria confirmou 465 ferramentas anteriores preservadas, mesmas assinaturas e
ordem relativa; registro total 479, sem corpos @tool AST idênticos. Sintaxe validada.
Não foi testado no Windows do usuário, GGUF real ou provedores de nuvem.

```text
/home/user/.venv/bin/python -m unittest discover -s tests -q
python -m py_compile agente.py
```

O venv de testes existente usa requirements-tests.txt; este lote não adiciona
novas dependências. SEM_ATUALIZAR.txt continua protegendo as autoedições locais:
preserve/reconcilie-as antes de retomar downloads. Não remova o marcador às cegas.
