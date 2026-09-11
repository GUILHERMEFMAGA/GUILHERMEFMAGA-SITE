# Catálogo 220 — caminho auditado até 700 ferramentas (r22)

Estado: **ferramentas 1–20 implementadas e publicadas no lote 1 (total 500)**; **21–220 são
propostas não implementadas (200 propostas)**. Cada proposta já foi comparada com o inventário de 500
ferramentas (nomes e escopos; "viz:" indica a ferramenta existente mais próxima e por que
é diferente). Ao implementar um lote, cada item passa de novo pela auditoria AST
(`scripts/auditar_ferramentas.py`) e por leitura dos vizinhos — propostas podem ser
ajustadas ou descartadas nessa hora. Nada é implementado sem a autorização do usuário.

**Status r23 (implementado, total 549):** itens **11–22, 29–45, 90, 93, 95, 99–102,
161, 162, 165, 166, 172–177 e 201–203** viraram ferramentas reais (49 no total, incluindo as
4 capacidades internas). Nomes ajustados na implementação quando o escopo pediu (ex.: 37 virou
`onda_periodo_frequencia_calcular`, 166 virou `fluxo_sugerido_tarefa`). **Restam 151 propostas**
para fechar 700. O item 163 foi entregue na r25 como comandos internos (fora da contagem de ferramentas).

**Status r26:** o comando `fabrica de ideias` (agente.py) lê este arquivo sozinho e cruza as
propostas com a telemetria de uso (r25), o filtro de ideias rejeitadas (r23) e uma
pré-checagem de colisão contra as 549 registradas — apenas para SUGERIR; implementar
continua exigindo auditoria AST e a autorização do usuário.

## G1. Matemática e estatística
1. ✅ `estatisticas_descritivas` — média/mediana/moda/desvio/variância/quartis de lista direta (viz: estatisticas_csv = coluna de arquivo).
2. ✅ `mmc_mdc_calcular` — MMC/MDC de 2–8 inteiros.
3. ✅ `fatorar_numero_primos` — fatoração, é-primo, nº de divisores.
4. ✅ `converter_base_numerica` — bases 2–36.
5. ✅ `resolver_segundo_grau` — Bhaskara, delta, vértice.
6. ✅ `resolver_sistema_linear_2x2` — solução exata com frações; impossível/infinitas.
7. ✅ `permutacoes_combinacoes_calcular` — nPk, nCk, n!.
8. ✅ `geometria_plana_calcular` — área/perímetro (círculo, quadrado, retângulo, triângulo, losango).
9. ✅ `teorema_pitagoras_resolver` — resolve o terceiro lado.
10. Proposta `gerar_tabuada` — tabuada com faixa e intervalo.
11. Proposta `listar_primos_intervalo` — primos até N por crivo (viz: fatorar = um número só).
12. Proposta `regressao_linear_simples` — y=ax+b por mínimos quadrados com r².
13. Proposta `correlacao_pearson_calcular` — correlação de duas séries.
14. Proposta `progressao_pa_pg_calcular` — termo geral e soma (PA/PG).
15. Proposta `calcular_trigonometria_basica` — seno/cosseno/tangente de ângulo.
16. Proposta `converter_angulos_graus_radianos`.
17. Proposta `logaritmo_exponencial_calcular` — log em qualquer base, e^x, 10^x.
18. Proposta `operacoes_bitwise_explicadas` — AND/OR/XOR/shifts com binário lado a lado.
19. Proposta `media_ponderada_calcular` — valores × pesos.
20. Proposta `simplificar_fracao` — fração irredutível + decimal exata.
21. Proposta `geometria_espacial_calcular` — volume/área de esfera, cilindro, cone, prisma.
22. Proposta `tabela_verdade_logica` — AND/OR/NOT/XOR para A,B.

## G2. Física e eletricidade
23. ✅ `lei_de_ohm_calcular` — V/I/R + potência.
24. ✅ `resistores_circuitos_calcular` — série/paralelo (aceita 1k, 2.2M).
25. ✅ `resistor_codigo_de_cores` — cores → ohms/tolerância.
26. ✅ `energia_mecanica_calcular` — cinética/potencial/mecânica.
27. ✅ `velocidade_media_calcular` — km/h e m/s.
28. ✅ `densidade_calcular` — com tabela de materiais comuns.
29. Proposta `queda_livre_calcular` — tempo/velocidade/final por altura.
30. Proposta `mru_mruv_calcular` — posição/velocidade no tempo.
31. Proposta `forca_newton_calcular` — F=ma, peso P=mg.
32. Proposta `trabalho_potencia_calcular` — W=F·d, P=W/t.
33. Proposta `calor_sensivel_calcular` — Q=m·c·ΔT (tabela de calor específico comum).
34. Proposta `dilatacao_termica_calcular` — linear ΔL=L·α·ΔT.
35. Proposta `pressao_hidrostatica_calcular` — P=ρ·g·h.
36. Proposta `empuxo_calcular` — princípio de Arquimedes.
37. Proposta `periodo_frequencia_onda_calcular` — v=λ·f, T=1/f.
38. Proposta `capacitor_carga_rc_calcular` — constante de tempo τ=RC.
39. Proposta `divisores_de_tensao_calcular` — dois resistores em série.
40. Proposta `consumo_energia_kwh_calcular` — W × horas × tarifa → R$ (conta de luz).
41. Proposta `rendimento_maquina_calcular` — η = útil/total.
42. Proposta `momento_torque_calcular` — τ=F·d.
43. Proposta `lei_coulomb_calcular` — força entre cargas.
44. Proposta `pressao_forca_area_calcular` — P=F/A.
45. Proposta `energia_potencial_elastica_calcular` — k·x²/2.

## G3. Texto e idioma PT
46. ✅ `contar_silabas_texto` — sílabas aproximadas por linha (métrica de poesia).
47. ✅ `cifra_de_cesar_converter` — cifrar/decifrar/força bruta.
48. ✅ `morse_converter` — texto ↔ Morse.
49. Proposta `anagrama_verificar` — duas palavras/frases são anagramas.
50. Proposta `palindromo_verificar` — ignora acento/espaço/pontuação.
51. Proposta `alfabeto_fonetico_ortografico` — "B de Bola" PT + NATO.
52. Proposta `cifra_vigenere_converter` — cifra por palavra-chave.
53. Proposta `xor_cifrar_texto` — com chave, saída hex.
54. Proposta `numerar_linhas_texto` — prefixo 1., 2., … configurável.
55. Proposta `quebrar_texto_largura` — wrap na coluna N.
56. Proposta `abreviar_nome_iniciais` — "Maria S. Silva".
57. Proposta `inverter_ordem_palavras` — última palavra primeiro.
58. Proposta `colunas_alinhar_texto` — linhas separadas por ; → colunas alinhadas.
59. Proposta `ordenar_linhas_pt` — ordenação com acentos PT correta (viz: central_texto ordena simples).
60. Proposta `contar_vogais_consoantes` — frequência de letras.
61. Proposta `caixa_alternada` — AuGuStO (viz: transformar_texto tem maiúsculas/título; alternada não).
62. Proposta `contar_repeticoes_palavra` — ocorrências de UMA palavra específica.
63. Proposta `remover_tags_html_para_texto` — HTML → texto puro.
64. Proposta `pluralizacao_simples_pt` — plural de palavras -ão/-al/-el/-ol/-ul com exceções marcadas.
65. Proposta `conjugacao_regular_pt` — presente/pretérito/futuro dos 3 grupos.
66. Proposta `ordinal_por_extenso` — 1º→primeiro… até 1000º.

## G4. Dev e referência técnica
67. ✅ `decodificar_jwt_token` — header/payload sem verificar assinatura (com avisos).
68. Proposta `explicar_cron_expressao` — "*/5 * * *" em português (viz: agendar_tarefa executa).
69. Proposta `consulta_codigo_http` — significado de status 100–511.
70. Proposta `consulta_mime_extensao` — extensão → MIME.
71. Proposta `comparar_semver_versoes` — maior/menor/compatível.
72. Proposta `contraste_cores_wcag` — razão de contraste e aprovação AA/AAA (viz: central_cores converte/paleta, não mede contraste).
73. Proposta `escapar_texto_programacao` — modos JSON/regex/HTML/cmd.
74. Proposta `comparar_json_valores` — diff profundo de valores com caminhos (viz: comparar_estrutura_json compara forma/estrutura).
75. Proposta `aplanar_json_dados` — flatten/unflatten por chaves pontuadas.
76. Proposta `testar_regex_padrao` — matches/grupos de um padrão sobre amostra (viz: achar_todos_no_codigo busca em arquivos).
77. Proposta `gerar_editorconfig` — conteúdo sugerido por linguagem.
78. Proposta `gerar_pre_commit_esqueleto` — hook básico comentado.
79. Proposta `gerar_licenca_texto` — MIT/Apache-2.0/ISC com ano/autor.
80. Proposta `gerar_changelog_esqueleto` — Keep a Changelog vazio.
81. Proposta `gerar_readme_esqueleto` — seções padrão (viz: gerar_documentacao_projeto documenta código existente).
82. Proposta `gerar_dotenv_exemplo` — .env.example com placeholders (nunca valores reais).
83. Proposta `ordenar_requirements_dedup` — sort/dedup/marcar duplicadas de requirements.txt.
84. Proposta `gerar_massa_dados_teste_ptbr` — N registros fake (nomes, CPFs válidos de teste, e-mails .test).
85. Proposta `url_encode_decode` — percent-encoding (viz: transformar_texto 'slug' é só slug).
86. Proposta `gerar_sumario_markdown` — índice a partir dos títulos # (viz: verificar_links_markdown_locais).
87. Proposta `tokens_estimativa_texto` — estimativa chars/4 com aviso (apoia o orçamento r20).
88. Proposta `markdown_tabela_gerar` — linhas → tabela MD alinhada.

## G5. Datas e hora
89. ✅ `feriados_brasil_ano` — nacionais fixos + móveis (Páscoa/Carnaval/Corpus Christi offline).
90. Proposta `semana_do_ano_info` — ISO week, trimestre, dias restantes.
91. Proposta `proximo_dia_util` — primeira data útil a partir de uma data (viz: dias_uteis_entre_datas conta intervalo).
92. Proposta `contagem_regressiva_data` — dias até evento anual (aniversário/vencimento).
93. Proposta `bissexto_dias_mes_info` — ano bissexto? dias do mês.
94. Proposta `fusos_brasil_referencia` — os 4 fusos e offsets (viz: relogio_mundial mostra hora agora).
95. Proposta `calendario_mes_console` — mês/ano em grade ASCII.
96. Proposta `proximo_feriado` — próximo nacionais a partir de hoje (usa lógica de feriados).
97. Proposta `soma_dias_uteis` — data + N dias úteis.
98. Proposta `texto_para_data_parse` — texto flexível → ISO (viz: calculadora_datas exige DD/MM/AAAA).
99. Proposta `dias_uteis_do_mes` — quantos dias úteis tem um mês.
100. Proposta `datas_recorrentes_lista` — "todo dia 5 por N meses".
101. Proposta `timestamp_converter_iso` — epoch ↔ ISO 8601 (viz: converter_tempo = unidades de duração).
102. Proposta `data_juliana_converter` — dia juliano ↔ calendário.

## G6. Brasil — documentos e dados estáticos
103. Proposta `consultar_ddd_estatico` — tabela offline DDD→UF/região (viz: central_dados_brasil valida/formata).
104. Proposta `validar_placa_veiculo` — formato antigo e Mercosul.
105. Proposta `validar_pis_pasep` — dígito verificador.
106. Proposta `validar_titulo_eleitor` — dígito verificador oficial.
107. Proposta `validar_cartao_luhn_aviso` — Luhn + bandeira; com aviso forte de privacidade.
108. Proposta `mascaras_documentos_br_extras` — CEP/PIS/título/placa (viz: central_dados_brasil formata cpf/cnpj/telefone).
109. Proposta `uf_info_estatica` — capital, região, vizinhos.
110. Proposta `cnpj_padrao_filial_info` — significado do sufixo matriz/0001-xx.
111. Proposta `cnh_categoria_referencia` — o que cada categoria A/B/C/D/E autoriza.
112. Proposta `moedas_iso_referencia` — códigos e símbolos estáticos (sem cotação).
113. Proposta `alfabeto_grego_referencia` — letras e nomes.
114. Proposta `capitais_brasil_lista` — UF→capital/região (uso geral offline).

## G7. Arquivos — leitura e análise
115. Proposta `contar_linhas_arquivo` — linhas/palavras/bytes de um arquivo (viz: central_texto 'contar' foca texto colado).
116. Proposta `detectar_tipo_magic_bytes` — png/jpg/pdf/zip/… pelo cabeçalho.
117. Proposta `sugerir_nome_seguro_windows` — sanitiza um NOME (viz: limpar_nomes_arquivos renomeia arquivos reais).
118. Proposta `somar_tamanho_por_padrao` — glob → contagem e bytes totais.
119. Proposta `arquivos_por_faixa_tamanho` — bucket <1MB, 1–100MB, >100MB.
120. Proposta `linhas_mais_longas_arquivo` — top N linhas por largura (limite de linter).
121. Proposta `palavras_frequentes_arquivo` — top N palavras de um arquivo (viz: resumir_arquivo resume conteúdo).
122. Proposta `linhas_aleatorias_amostra` — N linhas sem repetição (revisão de amostra).
123. Proposta `cabecalho_e_cauda_arquivo` — primeiras/últimas N linhas.
124. Proposta `encoding_bom_detectar` — BOM/heurística UTF (viz: converter_arquivo_para_utf8 converte).
125. Proposta `lista_para_csv_console` — texto colado → CSV com separador escolhido.
126. Proposta `sugerir_renomeacao_lote` — só SUGERE nomes sequenciais (viz: renomear_lote_avancado renomeia).

## G8. Rede — referência e cálculo offline
127. Proposta `consultar_porta_conhecida` — tabela 21/22/80/443/3389/5900/…
128. Proposta `calcular_tempo_download` — GB e Mbps → minutos (cálculo, não medição).
129. Proposta `tabela_ip_classes_referencia` — classes, RFC1918, loopback.

## G9. Console e visualização
130. Proposta `tabela_json_console` — array de objetos → tabela alinhada (viz: tabela_ascii = CSV).
131. Proposta `ascii_barras_grafico` — série → barras ▁▂▄▆█ (viz: criar_grafico_svg = SVG).
132. Proposta `histograma_frequencias_console` — contagens por categoria.
133. Proposta `progresso_barra_estatica` — porcentagem → barra [████░░].
134. Proposta `arvore_ascii_de_caminhos` — lista de caminhos → árvore └──.
135. Proposta `sparkline_numeros` — mini-gráfico de uma linha.
136. Proposta `destaque_diferencas_linhas` — marca os caracteres diferentes entre 2 linhas (viz: diff_arquivos_texto compara arquivos).

## G10. Vida diária
137. Proposta `converter_medidas_culinarias` — xícara/colher/ml (tabela BR), forno °C/gás.
138. Proposta `dividir_conta_restaurante` — total + gorjeta % + pessoas, arredondamentos justos.
139. Proposta `cafeina_meia_vida` — café às X → restante às Y (com avisos).
140. Proposta `tinta_parede_estimativa` — m², demãos, rendimento da lata → latas.
141. Proposta `combustivel_custo_viagem` — km/l, distância, preço → custo e litros.
142. Proposta `churrasco_calculadora` — pessoas → kg de carne, pães, carvão (padrões BR).
143. Proposta `festa_doces_salgados` — convidados → quantidades padrão de festa.
144. Proposta `pizza_tamanho_convidados` — área/fatias → quantas e quais tamanhos.
145. Proposta `gelo_bebidas_estimativa` — horas, pessoas, calor → kg de gelo.
146. Proposta `limpeza_diluicao` — proporção produto/água por volume final.
147. Proposta `arroz_panela_receita` — pessoas → arroz/água/sal/óleo padrão.
148. Proposta `ponto_da_carne_referencia` — temperaturas internas (malpassado a bem passado).

## G11. Saúde — cálculos com avisos
149. Proposta `taxa_metabolica_basal_mifflin` — Mifflin-St Jeor (viz: calculadora_saude tem IMC/água/frequência).
150. Proposta `gordura_navy_calcular` — método das dobras/circunferências.
151. Proposta `fc_maxima_zones` — FC máx e zonas Karvonen.
152. Proposta `proteina_diaria_sugestao` — g/kg por perfil (1,2–2,0) com aviso.
153. Proposta `macros_calculo_calorias` — calorias alvo → proteína/carbo/gordura por %.

## G12. Sorteios e lazer
154. Proposta `sortear_dado_rpg` — NdM+k, 4d6-descarta-menor (viz: sortear = escolher itens).
155. Proposta `sortear_amigo_secreto` — pareamento válido sem autopar, com seed opcional.
156. Proposta `sortear_cor_hex_acessivel` — cor aleatória com contraste de texto calculado.
157. Proposta `bingo_gerar_cartela` — cartela 5×5 com colunas B-I-N-G-O.
158. Proposta `lotofacil_sugestao` — 15 de 25, honesto: "mesma chance".
159. Proposta `megasena_sugestao` — 6 de 60, honesto: "mesma chance".
160. Proposta `cartas_mao_sortear` — 5 cartas de 52 + ranking da mão.

## G13. Meta — IA LOCAL e inventário
161. Proposta `resumo_ferramentas_por_tema` — contagem por grupos (navegar 500+).
162. Proposta `achar_ferramenta_para_tarefa` — busca lexical sobre nome+docstring (índice interno, offline).
163. ✅ **Entregue na r25 como comandos internos** (`estatisticas ferramentas`, `diagnostico ferramentas`, `velocidade ia local`) — observabilidade r20/r21; fora da contagem de ferramentas registradas.
164. Proposta `exportar_inventario_ferramentas_txt` — nome+docstring para revisão humana (sem segredos).
165. Proposta `comparar_ferramentas_similares` — quando usar A vs B (pares de maior sobreposição).
166. Proposta `fluxo_sugerido_tarefa` — roteiro determinístico com ferramentas existentes (ex.: "limpar disco").

## G14. Segurança pessoal — offline
167. Proposta `pin_numerico_gerar` — 4–8 dígitos com aviso de força baixa.
168. Proposta `passphrase_palavras_gerar` — diceware PT embutido + entropia calculada.
169. Proposta `checar_reuso_senha_local` — compara nova senha com lista fornecida no comando; nada gravado.
170. Proposta `verificar_forca_frase_senha` — entropia estimada (viz: avaliar_senha avalia padrões comuns).
171. Proposta `gerar_totp_codigo` — RFC6238 offline (segredo Base32 do usuário; hmac stdlib).

## G15. Números e formatação
172. Proposta `numero_brl_formatar` — R$ 1.234,56 (formatação, sem conversão).
173. Proposta `porcentagem_de_variacao` — a→b: aumento/redução %.
174. Proposta `algarismos_significativos_arredondar`.
175. Proposta `notacao_cientifica_converter` — a×10^n ↔ decimal.
176. Proposta `fracoes_decimais_converter` — 0,375 ↔ 3/8 exato.
177. Proposta `horario_decimal_converter` — 8h45 ↔ 8,75h (folha de ponto).

## G16. Geografia e astronomia
178. Proposta `distancia_coordenadas_haversine` — km entre dois pontos.
179. Proposta `rumo_entre_coordenadas` — azimute/ponto cardinal.
180. Proposta `fase_da_lua_aproximada` — algoritmo por data (aproximada).
181. Proposta `planetas_consulta` — tabela estática (distância, diâmetro, gravidade).
182. Proposta `coordenada_formato_converter` — graus decimais ↔ GMS D°M'S".
183. Proposta `elementos_consulta` — 118 elementos: símbolo/massa (viz: calculadora_quimica calcula reações/valores).

## G17. Windows — consultas de leitura
184. Proposta `listar_fontes_instaladas` — fontes do sistema (leitura).
185. Proposta `pastas_especiais_usuario` — caminhos Desktop/Downloads/Documentos.
186. Proposta `ps_build_consulta` — versão do PowerShell e do Windows (leitura).
187. Proposta `zona_horaria_detalhe` — fuso atual, DST, offset.
188. Proposta `codigos_erro_windows_consulta` — tabela dos erros comuns (0x80070005…).
189. Proposta `atalhos_win_referencia` — tabela Win+…/Ctrl+…
190. Proposta `where_comando_consulta` — qual executável resolve um comando (leitura via where).
191. Proposta `variaveis_ambiente_resumo` — listar/contar por grupo (viz: gerenciar_variavel_ambiente cria/altera).
192. Proposta `politica_execucao_atual` — consulta (viz: politica_execucao_powershell define).

## G18. Mídia — metadados
193. Proposta `duracao_audio_wav` — duração do cabeçalho WAV (stdlib).
194. Proposta `exif_resumo_imagem` — PIL opcional; sem a lib, aviso honesto.
195. Proposta `dimensoes_imagem_resumo` — largura×altura/formato (PIL opcional).

## G19. Educação
196. Proposta `gerar_exercicios_matematica` — operação, faixa, N questões + gabarito.
197. Proposta `ph_concentracao_calcular` — pH ↔ [H+].
198. Proposta `diluicao_c1v1c2v2_calcular` — diluição de soluções.
199. Proposta `massa_molar_simples` — tabela ~40 elementos, fórmulas simples (H2O, CO2, NaCl).
200. Proposta `mac_vendor_prefix_consulta` — fabricante por prefixo MAC (tabela estática comum).

## G20. Finanças — cálculo offline (sem cotação)
201. Proposta `converter_taxa_periodo` — mensal ↔ anual composta.
202. Proposta `meta_poupanca_aporte` — alvo → aporte mensal a juros i.
203. Proposta `preco_por_unidade_comparar` — produto A vs B: melhor compra.

## G21. Complementos diversos
204. Proposta `relacao_aspecto_calcular` — largura×altura → aspecto (16:9…) e diagonal.
205. Proposta `ppi_monitor_calcular` — densidade de pixels de um monitor.
206. Proposta `sortear_times_equilibrados` — 2 times aleatórios a partir de uma lista.
207. Proposta `decada_seculo_info` — 1929 → século XX, década de 20.
208. Proposta `padronizar_decimais_texto` — vírgula/ponto PT↔EN em um texto.
209. Proposta `extrair_chaves_valores_texto` — "chave: valor" colado → JSON.
210. Proposta `minutos_hhmm_converter` — 90 ↔ 01:30 (planilhas e pontos).
211. Proposta `lista_compras_consolidar` — várias listas → somadas por item.
212. Proposta `conversao_tamanhos_referencia` — roupa/calçado BR↔EU↔US (estático).
213. Proposta `idade_cachorro_aproximada` — porte × idade (estimativa, com aviso).
214. Proposta `qualidade_internet_referencia` — X Mbps dá para o quê (tabela honesta).
215. Proposta `bytes_bits_esclarecer` — MB vs Mb, bytes→bits (confusão comum em planos).
216. Proposta `cronograma_limpeza_gerar` — tarefas e frequências → semana tipo.
217. Proposta `duracao_bateria_estimativa` — Wh e consumo W → horas (com avisos).
218. Proposta `bitrate_video_tamanho` — bitrate × duração → tamanho do arquivo.
219. Proposta `unidades_tipografia_referencia` — px/pt/em/rem (front-end).
220. Proposta `gramas_xicara_por_ingrediente` — farinha/açúcar/água: xícara → gramas.

## Contagem e caminho para 700
- Implementadas no lote 1 (r22): itens 1–9, 23–28, 46–48, 67, 89 → **20 ferramentas** (total 500).
- Propostas pendentes: **200** (itens 21–220). Implementando todas com auditoria, o total fecha **700 exatamente**.
- Lotes sugeridos (cada um ~20–25 itens, com testes e auditoria): Lote 2 = G1/G2 restantes
  (matemática/física); Lote 3 = G4/G5 (dev/datas); Lote 4 = G6/G15/G20 (Brasil/números/finanças);
  Lote 5 = G3/G9/G19 (texto/console/educação); Lote 6 = G7/G8/G17/G18 (arquivos/rede/Windows/mídia);
  Lote 7 = G10/G11/G12 (vida diária/saúde/lazer); Lote 8 = G13/G14/G16 (meta/segurança/geo).
- Cada lote exige autorização do usuário e re-auditoria (nomes únicos, corpos distintos,
  vizinhos relidos — uma proposta pode ser descartada se o escopo real colidir).
