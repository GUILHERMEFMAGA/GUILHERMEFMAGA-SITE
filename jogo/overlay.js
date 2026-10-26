/* ============================================================
   overlay.js — telas por cima do jogo (Central de Câmeras, painel do Olho de Deus...)
   Qualquer arquivo pode registrar uma tela e um atalho de teclado.
   O game.js chama G.overlay.quadro() uma vez por quadro.
   ============================================================ */
(function (G) {
  'use strict';
  const O = G.overlay = {
    atual: null,          // a tela aberta agora (ou null)
    atalhos: {},          // 'KeyC' -> função(S) que abre uma tela
    teclas: null          // o game.js coloca aqui o objeto das teclas apertadas neste quadro
  };
  O.abrir = function (tela) { if (O.atual && O.atual.fecha) O.atual.fecha(); O.atual = tela; if (tela && tela.abre) tela.abre(G.S); };
  O.fechar = function () { const t = O.atual; O.atual = null; if (t && t.fecha) t.fecha(); };
  // o jogo fica bloqueado (sem teclas) enquanto uma tela está aberta
  O.bloqueado = () => !!O.atual;
  // pode abrir telas agora? (não no título, nem no meio de uma transição, nem com menu aberto)
  O.podeAbrir = function (S) {
    if (!S || S.trans) return false;
    if (S.mode === 'play') return true;
    if (S.mode === 'inside') { const R = S.inside; return !!R && !R.menu && !R.mini && !R.sentado; }
    return false;
  };
  // chamado pelo game.js no começo de cada quadro (depois do título)
  O.entrada = function (S, pressed) {
    if (O.atual) {
      for (const k in pressed) { if (O.atual.tecla) O.atual.tecla(k, S); if (!O.atual) break; }
      for (const k in pressed) delete pressed[k];   // o jogo não vê essas teclas
      return;
    }
    for (const k in pressed) {
      if (O.atalhos[k] && O.podeAbrir(S)) { O.atalhos[k](S); delete pressed[k]; }
    }
  };
  // chamado pelo game.js no fim do quadro, desenha por cima de tudo
  O.desenhar = function (ctx, S, dt) {
    if (O.atual && O.atual.desenha) O.atual.desenha(ctx, S, dt);
    else if (O.hudFns) for (const f of O.hudFns) f(ctx, S);
  };
  // lista de rotinas que rodam todo quadro (jogando ou dentro de lugares): pedágio, câmeras, Olho, FBI...
  G.extras = {
    lista: [],
    add(f) { this.lista.push(f); },
    atualizar(S, dt) { for (const f of this.lista) { try { f(S, dt); } catch (e) { if (G.olho && G.olho.erro) G.olho.erro(e, 'extras'); else throw e; } } }
  };
})(window.G = window.G || {});
