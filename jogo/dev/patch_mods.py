def patch(f, pairs):
    s = open(f, encoding='utf-8').read()
    for old, new in pairs:
        assert s.count(old) == 1, (f, s.count(old), old[:80])
        s = s.replace(old, new)
    open(f, 'w', encoding='utf-8').write(s); print(f, 'ok')

# ---- luz.js: janelas acesas de verdade (as do arte.js) e prédios de várias partes
patch('v2/luz.js', [
 ("W.buildings.forEach(b => { if (b.x < vx1 && b.x + b.w > vx0 && b.y < vy1 && b.y + b.h > vy0 && ((b.x * 7 + b.y * 3) % 10) < 7) janelas.push(b); });",
  "W.buildings.forEach(b => { const bb = b.box || b; if (bb.x < vx1 && bb.x + bb.w > vx0 && bb.y < vy1 && bb.y + bb.h > vy0 && ((b.x * 7 + b.y * 3) % 10) < 8) janelas.push(b); });"),
 ("janelas.forEach(b => { const fh = W.fachada(b); lx.fillRect(b.x + 4, b.y + b.h - fh + 3, b.w - 8, fh - 6); });",
  "janelas.forEach(b => {\n        if (b.jl && b.jl.length) { b.jl.forEach(j => lx.fillRect(j.x, j.y, j.w, j.h)); return; }   // só as janelas que o arte.js deixou acesas\n        const fh = W.fachada(b); lx.fillRect(b.x + 4, b.y + b.h - fh + 3, b.w - 8, fh - 6);\n      });"),
])

# ---- pedagio.js: pedágios do mapa novo
s = open('v2/pedagio.js', encoding='utf-8').read()
a = s.index("  const DEFS = ["); b = s.index("  DEFS.forEach(d => {")
s = s[:a] + '''  const DEFS = [
    { rio: 9, j: 5, valor: 20, nome: 'PEDÁGIO SANTA RITA' },
    { rio: 34, j: 5, valor: 30, nome: 'PEDÁGIO NOVO HORIZONTE' },
    { rio: 49, j: 5, valor: 35, nome: 'PEDÁGIO VALE VERDE' },
    { rio: 59, j: 5, valor: 40, nome: 'PEDÁGIO PORTO DO SOL' },
    { rio: 34, j: 2, valor: 30, nome: 'PEDÁGIO PONTE NOVA ERA', ponteObra: 'PONTE NOVA ERA' },
    { rio: 9, j: 7, valor: 20, nome: 'PEDÁGIO PONTE DO PROGRESSO', ponteObra: 'PONTE DO PROGRESSO' },
    { rio: 59, j: 7, valor: 40, nome: 'PEDÁGIO PONTE DO LITORAL', ponteObra: 'PONTE DO LITORAL' }
  ];
''' + s[b:]
open('v2/pedagio.js', 'w', encoding='utf-8').write(s); print('pedagio ok')

# ---- fbi.js: 8 agentes, um por região do mapa novo
s = open('v2/fbi.js', encoding='utf-8').read()
a = s.index("  const REGIOES = ["); b = s.index("  const caminhavel =")
s = s[:a] + '''  const REGIOES = [
    { b0: 0, b1: 2, nome: 'Agente Cruz', id: 'F1', setor: 'Ribeirão Oeste' },
    { b0: 4, b1: 8, nome: 'Agente Lima', id: 'F2', setor: 'Ribeirão Leste' },
    { b0: 10, b1: 13, nome: 'Agente Dias', id: 'F5', setor: 'Fazendas Santa Rita' },
    { b0: 14, b1: 33, nome: 'Agente Melo', id: 'F7', setor: 'Mata Escura' },
    { b0: 35, b1: 40, nome: 'Agente Rocha', id: 'F3', setor: 'Novo Horizonte' },
    { b0: 41, b1: 48, nome: 'Agente Pires', id: 'F8', setor: 'Mata do Gavião' },
    { b0: 50, b1: 56, nome: 'Agente Duarte', id: 'F4', setor: 'Vale Verde' },
    { b0: 60, b1: 64, nome: 'Agente Sá', id: 'F6', setor: 'Porto do Sol' }
  ];
''' + s[b:]
open('v2/fbi.js', 'w', encoding='utf-8').write(s); print('fbi ok')
