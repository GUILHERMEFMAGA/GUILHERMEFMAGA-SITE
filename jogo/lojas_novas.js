/* =====================================================================
   LOJAS_NOVAS.JS — as 14 lojas por dentro, cada uma com a sua cara:
   lanchonete (mesas xadrez e banquetas), sorveteria (vitrines rosa), açougue (ganchos e
   vitrine de carne), floricultura (baldes de flores), pet shop (aquário e gaiolas),
   livraria (estantes altas e cantinho de leitura), eletrônicos (parede de TVs), ótica,
   ferragem (painel de ferramentas e sacos de cimento), lotérica (guichê de vidro e fila),
   mercadinho (corredores), loja de roupas (araras, manequins e provadores), bar e café.
   Os objetos com AÇÃO da loja antiga (sinuca, jukebox, troca de roupa...) continuam:
   só mudam de lugar e de desenho. Tamanho da sala e chão também mudam por loja.
   ===================================================================== */
(function (G) {
  'use strict';
  const L = G.lugares, K = L.kit, D = G.deco, TAU = Math.PI * 2;
  const O = K.O, pick = K.pick;
  const LAY = {};

  // ---------- ajudantes ----------
  // sobra de parede dos dois lados do letreiro (para quadros, janelas, TVs...)
  const margens = (R, pl) => {
    const cx = (R.x0 + R.x1) / 2, n = pl.nome.length, tam = Math.max(16, Math.min(30, 420 / (0.64 * n)));
    const meio = Math.min(470, 0.64 * n * tam + 36) / 2 + 14;
    return { esq: [R.x0 + 14, cx - meio], dir: [cx + meio, R.x1 - 14], cx };
  };
  const larg = m => m[1] - m[0];
  const reusa = (o, p) => o && Object.assign(o, p);                       // objeto da loja antiga, em outro lugar/desenho
  const copia = (o, p) => o && Object.assign({}, o, p);
  // mesa redonda com 2 cadeiras (uma de cada lado)
  const conjunto = (add, x, y, est, cadEst, corW, corE, mw) => {
    add(O('mesa', x, y, mw || 54, 44, { e: 18, estilo: est }));
    add(O('cadeira', x - 29, y + 8, 26, 26, { dir: 'w', estilo: cadEst, cor: corW, solid: false, k: y + 8 }));
    add(O('cadeira', x + (mw || 54) + 3, y + 8, 26, 26, { dir: 'e', estilo: cadEst, cor: corE, solid: false, k: y + 8 }));
    return { w: { x: x - 16, y: y + 24, h: Math.PI / 2 }, e: { x: x + (mw || 54) + 16, y: y + 24, h: -Math.PI / 2 } };
  };
  const planta = (add, x, y, v) => add(O('planta', x, y, 40, 50, v ? { variante: v } : {}));
  const banquetas = (add, xs, y, cor) => xs.forEach(bx => add(O('banqueta', bx, y, 26, 26, { cor })));
  const janela = (x, a, b, py, vista, o) => { if (larg([a, b]) >= 56) K.janela(x, a + (b - a) / 2 - 32, py, 64, 46, Object.assign({ vista, semLuz: false }, o || {})); };

  // =====================================================================
  //  LANCHONETE
  // =====================================================================
  LAY.lanchonete = {
    sala: { w: 680, h: 400, piso: 'xadrez', pisoCores: ['#f4ead2', '#c8402a'] },
    criar(R, add, pl, c, X) {
      const x0 = R.x0, x1 = R.x1, y1 = R.y1, cx = X.cx;
      add(reusa(X.pegaOrig('jukebox'), { x: x0 + 22, y: 190, w: 56, h: 30, e: 50 }));
      add(O('prateleira', x1 - 132, 188, 112, 36, { e: 50, tema: 'bebidas', front: '#2a58b8', nome: 'BEBIDAS' }));
      banquetas(add, [cx - 118, cx - 80, cx + 56, cx + 94], 246, '#c8302a');
      conjunto(add, x0 + 40, 330, 'lanche', 'plastico', '#e8402a', '#f2c82a');
      const cl = conjunto(add, x0 + 40, 430, 'lanche', 'plastico', '#f2c82a', '#e8402a');
      conjunto(add, x0 + 190, 440, 'lanche', 'plastico', '#2a7ad8', '#e8402a');
      conjunto(add, x1 - 250, 440, 'lanche', 'plastico', '#e8402a', '#2a7ad8');
      conjunto(add, x1 - 150, 330, 'lanche', 'plastico', '#f2c82a', '#e8402a');
      conjunto(add, x1 - 150, 430, 'lanche', 'plastico', '#e8402a', '#f2c82a');
      planta(add, x0 + 6, 270); planta(add, x1 - 44, 270, 'folhagem');
      R.cliente = { x: cl.e.x, y: cl.e.y, h: cl.e.h, sentado: true, falas: ['Esse X-Tudo não tem igual!', 'Estou de folga, vim lanchar.'] };
      return (x, pl2) => {
        const m = margens(R, pl2);
        D.cartazLoja(x, m.esq[0] + 10, 80, 66, 52, '#ffe04a', ['PROMOÇÃO', 'X-TUDO', '$22'], '#c8302a');
        janela(x, m.esq[0] + 80, m.esq[1], 80, 'cidade', { cor: '#f4ead2' });
        if (larg(m.dir) >= 120) D.quadroNegro(x, m.dir[0] + 12, 76, Math.min(120, larg(m.dir) - 24), 48, [['X-Burger', '$14'], ['Hot-dog', '$10'], ['Batata', '$9'], ['Guaraná', '$5']], 'CARDÁPIO');
        else janela(x, m.dir[0], m.dir[1], 80, 'cidade', { cor: '#f4ead2' });
        D.relogio(x, cx - 150, 134, 9, '#f4ead2');
      };
    }
  };

  // =====================================================================
  //  SORVETERIA
  // =====================================================================
  LAY.sorveteria = {
    sala: { w: 620, h: 380 },
    criar(R, add, pl, c, X) {
      const x0 = R.x0, x1 = R.x1, cx = X.cx;
      add(reusa(X.pegaOrig('freezer', 0), { t: 'vitrine', tema: 'sorvete', x: x0 + 20, y: 188, w: 128, h: 44, e: 38, front: '#e8a0c0', top: '#fdeef4' }));
      add(reusa(X.pegaOrig('freezer', 1), { t: 'vitrine', tema: 'sorvete', x: x1 - 148, y: 188, w: 128, h: 44, e: 38, front: '#e8a0c0', top: '#fdeef4' }));
      banquetas(add, [cx - 118, cx - 80, cx + 56, cx + 94], 246, '#f08ab8');
      add(O('tapete', cx - 90, 380, 180, 100, { solid: false, k: -50, cor: '#f8c8e0', cor2: '#c8f0c8', padrao: 'listras' }));
      const cl = conjunto(add, x0 + 40, 320, 'sorvete', 'plastico', '#f8a8c8', '#a8e8c8');
      conjunto(add, x0 + 40, 420, 'sorvete', 'plastico', '#f8e8a0', '#a8d0f8');
      conjunto(add, x1 - 134, 320, 'sorvete', 'plastico', '#a8d0f8', '#f8a8c8');
      conjunto(add, x1 - 134, 420, 'sorvete', 'plastico', '#a8e8c8', '#f8e8a0');
      planta(add, x0 + 6, 270); planta(add, x1 - 44, 270);
      R.cliente = { x: cl.e.x, y: cl.e.y, h: cl.e.h, sentado: true, falas: ['Hoje eu peço duas bolas!', 'Com este calor, só sorvete salva.'] };
      return (x, pl2) => {
        const m = margens(R, pl2);
        D.toldo(x, x0 + 8, 60, x1 - x0 - 16, 24, '#f08ab8', '#fdeef4');
        D.cartazLoja(x, m.esq[0] + 8, 92, 70, 40, '#f8c8e0', ['SORVETE', '2 BOLAS $7'], '#c8306a');
        if (larg(m.dir) >= 100) D.quadroNegro(x, m.dir[0] + 8, 92, Math.min(110, larg(m.dir) - 16), 40, [['Morango', '$7'], ['Chocolate', '$6']], 'SABORES');
      };
    }
  };

  // =====================================================================
  //  AÇOUGUE
  // =====================================================================
  LAY.acougue = {
    sala: { w: 620, h: 380, parede: '#eee6dc' },
    criar(R, add, pl, c, X) {
      const x0 = R.x0, x1 = R.x1, cx = X.cx;
      R.estiloParede = 'azulejo'; R.lambri = '#b04040'; R.lambriAlt = 34;
      add(reusa(X.pegaOrig('freezer', 0), { t: 'vitrine', tema: 'carne', x: x0 + 20, y: 188, w: 132, h: 44, e: 38 }));
      add(reusa(X.pegaOrig('freezer', 1), { t: 'vitrine', tema: 'carne', x: x1 - 152, y: 188, w: 132, h: 44, e: 38 }));
      add(reusa(X.pegaOrig('bancada'), { x: cx - 120, y: 330, w: 240, h: 50, e: 26 }));
      add(O('cepo', x1 - 100, 340, 50, 46, { e: 26 }));
      add(O('geladeira', x1 - 100, 232, 76, 46, { e: 74, cor: '#c3c8cf' }));
      add(O('pilha_caixas', x0 + 24, 330, 76, 44, { e: 30 }));
      add(O('pilha_caixas', x0 + 24, 430, 64, 40, { e: 24 }));
      add(O('balanca', x0 + 120, 440, 40, 40, { e: 10 }));
      planta(add, x1 - 50, 440, 'espada');
      R.cliente = { x: cx - 78, y: 288, h: 0, falas: ['Põe uns dois quilos de picanha.', 'Esse corte está bonito!'] };
      return (x, pl2) => {
        const m = margens(R, pl2);
        if (larg(m.esq) >= 60) D.ganchos(x, m.esq[0], 72, larg(m.esq));
        if (larg(m.dir) >= 60) D.ganchos(x, m.dir[0], 72, larg(m.dir));
        D.cartazLoja(x, cx - 60, 124, 120, 18, '#b04040', ['PREÇO DO DIA'], '#f2e84a');
      };
    }
  };

  // =====================================================================
  //  FLORICULTURA
  // =====================================================================
  LAY.floricultura = {
    sala: { w: 640, h: 400 },
    criar(R, add, pl, c, X) {
      const x0 = R.x0, x1 = R.x1, cx = X.cx;
      const e1 = X.pegaOrig('estante', 0), e2 = X.pegaOrig('estante', 1);
      add(reusa(e1, { t: 'balde_flores', x: x0 + 20, y: 186, w: 128, h: 40, e: 40 }));
      add(e2 ? reusa(e2, { t: 'balde_flores', x: x1 - 148, y: 186, w: 128, h: 40, e: 40 }) : O('balde_flores', x1 - 148, 186, 128, 40, { e: 40 }));
      add(O('prateleira', x0 + 30, 290, 112, 36, { e: 54, tema: 'vasos', front: '#8a6a40', nome: 'VASOS' }), O('prateleira', x1 - 142, 290, 112, 36, { e: 54, tema: 'vasos', front: '#8a6a40', nome: 'VASOS' }));
      add(O('tapete', cx - 70, 370, 140, 110, { solid: false, k: -50, cor: '#4a8a4a', cor2: '#e8f0d0', forma: 'redondo', padrao: 'listras' }));
      add(O('balde_flores', x0 + 30, 410, 128, 40, { e: 40 }), O('balde_flores', x1 - 158, 410, 128, 40, { e: 40 }));
      add(O('planta', x0 + 4, 330, 44, 56, { variante: 'palmeira' }), O('planta', x1 - 48, 330, 44, 56, { variante: 'palmeira' }));
      add(O('planta', cx - 150, 300, 40, 50, { variante: 'samambaia' }), O('planta', cx + 112, 300, 40, 50, { variante: 'folhagem' }));
      add(O('planta', cx - 140, 440, 40, 50, { variante: 'suculenta' }), O('planta', cx + 100, 440, 40, 50, { variante: 'espada' }));
      R.cliente = { x: cx + 62, y: 320, h: -Math.PI / 2, falas: ['Quero um buquê de girassóis.', 'Essas rosas estão lindas!'] };
      return (x, pl2) => {
        const m = margens(R, pl2);
        janela(x, m.esq[0], m.esq[1], 80, 'jardim', { cor: '#f4f0e0', flores: true, cortina: '#8ac88a' });
        janela(x, m.dir[0], m.dir[1], 80, 'jardim', { cor: '#f4f0e0', flores: true, cortina: '#8ac88a' });
        D.quadroNegro(x, cx - 52, 126, 104, 18, [], 'FLORES DO DIA');
      };
    }
  };

  // =====================================================================
  //  PET SHOP
  // =====================================================================
  LAY.petshop = {
    sala: { w: 640, h: 400, piso: 'ladrilho', pisoCores: ['#e8f0f8', '#c8dcec'] },
    criar(R, add, pl, c, X) {
      const x0 = R.x0, x1 = R.x1, cx = X.cx;
      add(O('prateleira', x0 + 20, 188, 114, 36, { e: 58, tema: 'racao', nome: 'RAÇÃO', front: '#c8702a' }), O('prateleira', x1 - 134, 188, 114, 36, { e: 58, tema: 'pet', nome: 'BRINQUEDOS', front: '#4ab0e8' }));
      add(reusa(X.pegaOrig('bloco', 0), { t: 'aquario', x: x0 + 24, y: 290, w: 132, h: 52, e: 46, top: undefined, front: undefined }));
      add(reusa(X.pegaOrig('bloco', 1), { t: 'cama_pet', x: x1 - 150, y: 340, w: 104, h: 54, e: 0, top: undefined, front: undefined }));
      add(O('gaiola', x0 + 24, 412, 76, 48, { bicho: 'cao', cor: '#c89858' }), O('gaiola', x0 + 108, 412, 76, 48, { bicho: 'gato', cor: '#a8a8a8' }), O('gaiola', x0 + 192, 412, 76, 48, { bicho: 'cao', cor: '#e8d8b8' }));
      add(O('pilha_sacos', x1 - 170, 270, 76, 46, { tipo: 'racao', e: 34 }), O('pilha_sacos', x1 - 90, 270, 76, 46, { tipo: 'racao', e: 34 }));
      add(O('tapete', cx - 60, 380, 130, 90, { solid: false, k: -50, cor: '#4a90e0', cor2: '#e8f0f8', forma: 'redondo' }));
      planta(add, x1 - 50, 440, 'folhagem'); planta(add, x0 + 290, 300, 'samambaia');
      R.cliente = { x: cx + 100, y: 330, h: Math.PI * 0.5, falas: ['Meu cachorro adora esse osso.', 'Quanto custa a ração premium?'] };
      return (x, pl2) => {
        const m = margens(R, pl2);
        D.cartazLoja(x, m.esq[0] + 6, 84, Math.min(80, larg(m.esq) - 12), 46, '#4ab0e8', ['PET SHOP', 'BANHO & TOSA'], '#fff');
        if (larg(m.dir) >= 80) D.cartazLoja(x, m.dir[0] + 6, 84, Math.min(80, larg(m.dir) - 12), 46, '#e8a02a', ['ADOTE', 'UM AMIGO'], '#fff');
        x.fillStyle = 'rgba(255,255,255,0.8)'; for (let k = 0; k < 5; k++) { const px = cx - 80 + k * 40, py = 138; x.beginPath(); x.ellipse(px, py, 3.2, 2.6, 0, 0, TAU); x.fill(); [[-4, -4], [0, -5.6], [4, -4]].forEach(([a, b]) => { x.beginPath(); x.arc(px + a, py + b, 1.3, 0, TAU); x.fill(); }); }
      };
    }
  };

  // =====================================================================
  //  LIVRARIA
  // =====================================================================
  LAY.livraria = {
    sala: { w: 680, h: 400 },
    criar(R, add, pl, c, X) {
      const x0 = R.x0, x1 = R.x1, cx = X.cx;
      add(O('estante', x0 + 20, 184, 136, 36, { e: 72 }), O('estante', x1 - 156, 184, 136, 36, { e: 72 }));
      add(O('estante', x0 + 40, 290, 150, 36, { e: 64 }), O('estante', x1 - 190, 290, 150, 36, { e: 64 }));
      add(O('mesa_expo', x0 + 30, 400, 132, 50, { e: 26, tema: 'livros', top: '#b88a58', front: '#6a4a2a' }), O('mesa_expo', x1 - 162, 400, 132, 50, { e: 26, tema: 'livros', top: '#b88a58', front: '#6a4a2a' }));
      add(O('tapete', cx - 120, 360, 170, 100, { solid: false, k: -50, cor: '#6a2a5a', cor2: '#e8d8a0', padrao: 'persa' }));
      const p1 = X.pegaOrig('poltrona');
      add(reusa(p1, { x: cx - 112, y: 384, w: 60, h: 56, e: 22, dir: 's', cor: '#8a3a3a', almofadas: false }));
      add(copia(p1, { x: cx - 8, y: 384, w: 60, h: 56, e: 22, dir: 's', cor: '#8a3a3a', almofadas: false }));
      add(O('mesa_centro', cx - 52, 440, 52, 36, { e: 12 }));
      add(O('luminaria', cx + 70, 400, 20, 16));
      planta(add, x0 + 4, 330, 'palmeira'); planta(add, x1 - 48, 330, 'folhagem'); planta(add, x1 - 50, 440, 'samambaia');
      R.cliente = { x: cx - 215, y: 360, h: Math.PI * 0.5, falas: ['Estou procurando um policial antigo.', 'Esse livro eu ainda não li.'] };
      return (x, pl2) => {
        const m = margens(R, pl2);
        if (larg(m.esq) >= 56) D.quadro(x, m.esq[0] + 8, 82, Math.min(46, larg(m.esq) - 16), 52, 'retrato', '#c8a24a');
        if (larg(m.dir) >= 56) D.quadro(x, m.dir[0] + 8, 82, Math.min(46, larg(m.dir) - 16), 52, 'paisagem', '#c8a24a');
        D.relogio(x, cx - 175, 130, 11, '#c8a24a');
      };
    }
  };

  // =====================================================================
  //  ELETRÔNICOS
  // =====================================================================
  LAY.eletronicos = {
    sala: { w: 680, h: 400 },
    criar(R, add, pl, c, X) {
      const x0 = R.x0, x1 = R.x1, cx = X.cx;
      add(reusa(X.pegaOrig('tv', 0), { x: x0 + 20, y: 188, w: 124, h: 36, e: 58 }), reusa(X.pegaOrig('tv', 1), { x: x1 - 144, y: 188, w: 124, h: 36, e: 58 }));
      add(O('prateleira', x0 + 40, 290, 144, 36, { e: 60, tema: 'celulares', nome: 'CELULARES', front: '#3a3e48' }), O('prateleira', x1 - 184, 290, 144, 36, { e: 60, tema: 'fones', nome: 'FONES', front: '#e8e8f0' }));
      add(O('mesa_expo', x0 + 30, 400, 132, 50, { e: 26, tema: 'eletronicos' }), O('mesa_expo', x1 - 162, 400, 132, 50, { e: 26, tema: 'eletronicos' }));
      add(O('vitrine', x0 + 180, 440, 120, 44, { e: 38, tema: 'celular', front: '#3a3e48' }));
      add(reusa(X.pegaOrig('jukebox'), { x: x1 - 76, y: 340, w: 56, h: 30, e: 50 }));
      add(O('pilha_caixas', x1 - 160, 460, 70, 40, { e: 28 }), O('pilha_caixas', x1 - 84, 460, 56, 40, { e: 22 }));
      planta(add, x0 + 6, 480);
      R.cliente = { x: cx + 100, y: 300, h: 0, falas: ['Esse celular tem boa câmera?', 'Quero uma TV maior.'] };
      return (x, pl2) => {
        const m = margens(R, pl2);
        [m.esq, m.dir].forEach((mm, k) => { const w = larg(mm); if (w >= 64) { const n = w >= 150 ? 2 : 1; for (let i = 0; i < n; i++) D.tvParede(x, mm[0] + 8 + i * 74, 82, 64, 40, ['futebol', 'noticia', 'desenho'][(k * 2 + i) % 3]); } });
        x.fillStyle = 'rgba(80,160,255,0.55)'; x.fillRect(R.x0 + 8, 142, R.x1 - R.x0 - 16, 2.4); x.fillStyle = 'rgba(80,160,255,0.2)'; x.fillRect(R.x0 + 8, 144, R.x1 - R.x0 - 16, 6);
      };
    }
  };

  // =====================================================================
  //  ÓTICA
  // =====================================================================
  LAY.otica = {
    sala: { w: 620, h: 380 },
    criar(R, add, pl, c, X) {
      const x0 = R.x0, x1 = R.x1, cx = X.cx;
      add(O('vitrine', x0 + 20, 188, 128, 44, { e: 38, tema: 'oculos', front: '#2a2d36' }), O('vitrine', x1 - 148, 188, 128, 44, { e: 38, tema: 'oculos', front: '#2a2d36' }));
      add(O('prateleira', x0 + 40, 290, 132, 36, { e: 60, tema: 'oculos', front: '#2a2d36', nome: 'ARMAÇÕES' }), O('prateleira', x1 - 172, 290, 132, 36, { e: 60, tema: 'oculos', front: '#2a2d36', nome: 'ARMAÇÕES' }));
      const esp = X.pegaOrig('espelho');
      add(reusa(esp, { t: 'espelho_pe', x: x0 + 30, y: 396, w: 62, h: 18, e: 74, solid: true, invisivel: false, r: 46 }));
      add(O('vitrine', x1 - 190, 400, 150, 44, { e: 38, tema: 'oculos', front: '#2a2d36' }));
      add(O('cadeira_b', cx - 130, 380, 50, 50, { e: 20 }));
      add(O('mesa_expo', cx + 70, 440, 100, 44, { e: 24, tema: 'eletronicos' }));
      add(O('tapete', cx - 150, 350, 180, 120, { solid: false, k: -50, cor: '#2f5a7a', cor2: '#e8e0c8', padrao: 'geometrico' }));
      planta(add, x0 + 6, 270); planta(add, x1 - 46, 460, 'folhagem');
      R.cliente = { x: cx + 100, y: 330, h: Math.PI * 0.5, falas: ['Preciso trocar o grau da lente.', 'Será que esse aro me cai bem?'] };
      return (x, pl2) => {
        const m = margens(R, pl2);
        if (larg(m.esq) >= 60) D.espelhoParede(x, m.esq[0] + 8, 82, Math.min(70, larg(m.esq) - 16), 50, '#c8a24a');
        if (larg(m.dir) >= 60) D.optotipo(x, m.dir[0] + 12, 80, Math.min(52, larg(m.dir) - 24), 60);
        D.relogio(x, cx - 170, 130, 10, '#c8a24a');
      };
    }
  };

  // =====================================================================
  //  FERRAGEM
  // =====================================================================
  LAY.ferragem = {
    sala: { w: 680, h: 400, piso: 'cimento', pisoCores: ['#a8a8a0', '#85857f'] },
    criar(R, add, pl, c, X) {
      const x0 = R.x0, x1 = R.x1, cx = X.cx;
      add(O('prateleira', x0 + 20, 188, 116, 36, { e: 62, tema: 'parafusos', nome: 'PARAFUSOS', front: '#7a8088' }), O('prateleira', x1 - 136, 188, 116, 36, { e: 62, tema: 'tintas', nome: 'TINTAS', front: '#c8a02a' }));
      add(O('prateleira', x0 + 40, 290, 150, 36, { e: 62, tema: 'ferramentas', nome: 'FERRAMENTAS', front: '#c8302a' }), O('prateleira', x1 - 190, 290, 150, 36, { e: 62, tema: 'tintas', nome: 'TINTAS', front: '#2a58b8' }));
      add(O('pilha_sacos', x0 + 30, 390, 76, 46, { tipo: 'cimento', e: 34 }), O('pilha_sacos', x0 + 116, 390, 76, 46, { tipo: 'cimento', e: 34 }), O('pilha_sacos', x0 + 30, 460, 76, 46, { tipo: 'cimento', e: 34 }));
      add(O('pilha_caixas', x1 - 150, 400, 90, 50, { e: 38 }), O('pilha_caixas', x1 - 150, 470, 70, 40, { e: 26 }), O('pilha_caixas', x1 - 70, 440, 50, 40, { e: 24 }));
      add(O('escada', x1 - 64, 330, 36, 10, { e: 76 }));
      add(O('bancada', cx - 70, 440, 140, 40, { e: 26 }));
      R.cliente = { x: cx + 80, y: 330, h: 0, falas: ['Preciso de uns pregos grandes.', 'Esse martelo é bom?'] };
      return (x, pl2) => {
        const m = margens(R, pl2);
        if (larg(m.esq) >= 60) D.pegboard(x, m.esq[0] + 6, 74, larg(m.esq) - 12, 62);
        if (larg(m.dir) >= 60) D.pegboard(x, m.dir[0] + 6, 74, larg(m.dir) - 12, 62);
        x.fillStyle = '#e8a02a'; for (let k = 0; k < 14; k++) x.fillRect(R.x0 + 8 + k * 46, 140, 22, 4);
      };
    }
  };

  // =====================================================================
  //  LOTÉRICA
  // =====================================================================
  LAY.loteria = {
    sala: { w: 600, h: 380 },
    criar(R, add, pl, c, X) {
      const x0 = R.x0, x1 = R.x1, cx = X.cx;
      add(reusa(X.pegaOrig('caixa_reg', 0), { x: x0 + 20, y: 188, w: 100, h: 40, e: 0 }), reusa(X.pegaOrig('caixa_reg', 1), { x: x1 - 120, y: 188, w: 100, h: 40, e: 0 }));
      add(O('vidro_guiche', cx - 130, 232, 260, 6, { e: 54, solid: false, k: 236 }));
      add(O('fila', cx - 118, 296, 86, 12, { e: 26, solid: false }), O('fila', cx + 30, 296, 86, 12, { e: 26, solid: false }));
      add(reusa(X.pegaOrig('bloco'), { t: 'mesa_expo', tema: 'volantes', x: x0 + 30, y: 350, w: 130, h: 50, e: 26, top: '#d8c8a0', front: '#a88a58' }));
      add(O('mesa_expo', x1 - 160, 350, 130, 50, { e: 26, tema: 'volantes', top: '#d8c8a0', front: '#a88a58' }));
      add(O('banco_espera', x0 + 30, 450, 150, 28, { e: 14, cor: '#2f6a4a' }), O('banco_espera', x1 - 180, 450, 150, 28, { e: 14, cor: '#2f6a4a' }));
      planta(add, x0 + 6, 270); planta(add, x1 - 46, 270, 'folhagem');
      R.cliente = { x: cx + 50, y: 330, h: 0, falas: ['Hoje eu ganho, tenho certeza.', 'Já marquei meus números da sorte.'] };
      return (x, pl2) => {
        const m = margens(R, pl2);
        D.cartazLoja(x, m.esq[0] + 6, 82, Math.min(76, larg(m.esq) - 12), 50, '#ffe04a', ['MEGA-SENA', 'ACUMULOU!'], '#2a8a4a');
        if (larg(m.dir) >= 70) D.cartazLoja(x, m.dir[0] + 6, 82, Math.min(76, larg(m.dir) - 12), 50, '#2a8a4a', ['LOTOFÁCIL', 'TODO DIA'], '#ffe04a');
        x.fillStyle = '#ffe04a'; x.font = 'bold 15px Arial'; x.textAlign = 'center'; x.fillText('★ PRÊMIO ACUMULADO ★', cx, 140); x.textAlign = 'left';
      };
    }
  };

  // =====================================================================
  //  MERCADINHO
  // =====================================================================
  LAY.mercadinho = {
    sala: { w: 720, h: 420 },
    criar(R, add, pl, c, X) {
      const x0 = R.x0, x1 = R.x1, cx = X.cx, T = ['graos', 'caixas', 'bebidas', 'doces', 'graos', 'caixas', 'bebidas', 'doces'];
      add(O('prateleira', x0 + 20, 188, 120, 36, { e: 60, tema: 'bebidas', nome: 'BEBIDAS', front: '#2a58b8' }), O('caixote_frutas', x1 - 170, 192, 150, 34, { e: 22 }));
      [[x0 + 30, 296], [x0 + 166, 296], [cx + 66, 296], [cx + 202, 296], [x0 + 30, 392], [x0 + 166, 392], [cx + 66, 392], [cx + 202, 392]].forEach(([sx, sy], i) => {
        add(O('prateleira', sx, sy, 122, 36, { e: 58, tema: T[i], nome: ['GRÃOS', 'MASSAS', 'BEBIDAS', 'DOCES', 'ARROZ', 'CEREAIS', 'SUCOS', 'BISCOITOS'][i], front: ['#c8a02a', '#c8302a', '#2a58b8', '#e84a8a'][i % 4] }));
      });
      add(O('pilha_carrinhos', x0 + 24, 500, 72, 40, {}), O('cesto', x0 + 110, 506, 26, 26, {}));
      add(reusa(X.pegaOrig('freezer'), { x: x1 - 136, y: 470, w: 116, h: 42, e: 26 }));
      planta(add, x1 - 50, 300, 'palmeira');
      R.cliente = { x: cx - 30, y: 450, h: Math.PI, falas: ['Achei o arroz, falta o feijão.', 'Tudo mais caro de novo...'] };
      return (x, pl2) => {
        const m = margens(R, pl2);
        if (larg(m.esq) >= 60) D.cartazLoja(x, m.esq[0] + 6, 82, Math.min(80, larg(m.esq) - 12), 46, '#e8402a', ['OFERTAS', 'DA SEMANA'], '#ffe04a');
        if (larg(m.dir) >= 60) D.cartazLoja(x, m.dir[0] + 6, 82, Math.min(80, larg(m.dir) - 12), 46, '#ffe04a', ['LEVE 3', 'PAGUE 2'], '#c8302a');
      };
    }
  };

  // =====================================================================
  //  LOJA DE ROUPAS
  // =====================================================================
  LAY.roupas = {
    sala: { w: 700, h: 420 },
    criar(R, add, pl, c, X) {
      const x0 = R.x0, x1 = R.x1, cx = X.cx;
      add(reusa(X.pegaOrig('arara', 0), { x: x0 + 20, y: 186, w: 128, h: 34, e: 42, tema: 'camisa' }), reusa(X.pegaOrig('arara', 1), { x: x1 - 148, y: 186, w: 128, h: 34, e: 42, tema: 'calca' }));
      add(reusa(X.pegaOrig('estante'), { t: 'prateleira', tema: 'tenis', front: '#c8c8d0', nome: 'TÊNIS', x: x0 + 30, y: 296, w: 136, h: 36, e: 62 }));
      add(O('prateleira', x1 - 166, 296, 136, 36, { e: 62, tema: 'roupas', front: '#f0a0c0', nome: 'MODA' }));
      add(O('tapete', cx - 100, 340, 200, 120, { solid: false, k: -50, cor: '#8a2a6a', cor2: '#f0d8e8', padrao: 'persa' }));
      add(O('mesa_expo', x0 + 190, 396, 132, 50, { e: 26, tema: 'roupas', top: '#f4ecd8', front: '#c04a8a' }), O('mesa_expo', x1 - 330, 396, 132, 50, { e: 26, tema: 'roupas', top: '#f4ecd8', front: '#c04a8a' }));
      add(O('manequim', x0 + 30, 400, 30, 30, { e: 66, cor: '#e84a8a', cor2: '#3a4a6a' }), O('manequim', x0 + 86, 412, 30, 30, { e: 66, cor: '#4ab0e8', cor2: '#16181e' }), O('manequim', x0 + 140, 400, 30, 30, { e: 66, cor: '#f2c82a', cor2: '#8a4fc2' }));
      add(reusa(X.pegaOrig('provador'), { t: 'cabine_prova', x: x1 - 160, y: 424, w: 72, h: 40, e: 70, solid: true, invisivel: false, cor: '#c04a8a' }), O('cabine_prova', x1 - 84, 424, 72, 40, { e: 70, cor: '#4a78c8' }));
      add(O('arara', x0 + 40, 490, 120, 32, { e: 40, tema: 'camisa' }), O('arara', x1 - 168, 490, 120, 32, { e: 40, tema: 'calca' }));
      R.cliente = { x: cx + 118, y: 330, h: Math.PI * 0.5, falas: ['Essa camisa vem em azul?', 'Vou provar este vestido.'] };
      return (x, pl2) => {
        const m = margens(R, pl2);
        if (larg(m.esq) >= 60) D.espelhoParede(x, m.esq[0] + 8, 80, Math.min(64, larg(m.esq) - 16), 54, '#c8a24a');
        if (larg(m.dir) >= 60) D.cartazLoja(x, m.dir[0] + 6, 82, Math.min(84, larg(m.dir) - 12), 50, '#c04a8a', ['LIQUIDAÇÃO', '50% OFF'], '#ffe04a');
      };
    }
  };

  // =====================================================================
  //  BAR
  // =====================================================================
  LAY.bar = {
    sala: { w: 720, h: 420, piso: 'madeira', pisoCores: ['#6a4a2a', '#5a3a1e'] },
    criar(R, add, pl, c, X) {
      const x0 = R.x0, x1 = R.x1, cx = X.cx;
      add(reusa(X.pegaOrig('jukebox'), { x: x0 + 22, y: 190, w: 56, h: 30, e: 50 }));
      add(O('prateleira', x1 - 142, 188, 122, 36, { e: 58, tema: 'bebidas', nome: 'CERVEJA', front: '#5a3a22' }));
      banquetas(add, [cx - 126, cx - 88, cx + 62, cx + 100], 246, '#7a2a1a');
      add(reusa(X.pegaOrig('sinuca'), { x: x1 - 230, y: 340, w: 180, h: 96, e: 16 }));
      add(O('pendente', x1 - 160, 390, 40, 10, { e: 112, solid: false, k: 600, cor: '#c89a50' }));
      const cl = conjunto(add, x0 + 40, 330, 'bar', 'madeira', '#6a4a2a', '#6a4a2a');
      conjunto(add, x0 + 40, 430, 'bar', 'madeira', '#6a4a2a', '#6a4a2a');
      conjunto(add, x0 + 200, 440, 'bar', 'madeira', '#6a4a2a', '#6a4a2a');
      add(O('pilha_caixas', x1 - 92, 460, 70, 44, { e: 34 }));
      add(O('pendente', x0 + 70, 380, 40, 10, { e: 112, solid: false, k: 600, cor: '#c89a50' }), O('pendente', x0 + 70, 480, 40, 10, { e: 112, solid: false, k: 600, cor: '#c89a50' }));
      planta(add, x1 - 50, 280, 'folhagem');
      R.cliente = { x: cl.e.x, y: cl.e.y, h: cl.e.h, sentado: true, falas: ['Mais uma gelada, por favor!', 'O time perdeu de novo...'] };
      return (x, pl2) => {
        const m = margens(R, pl2);
        K.prateleiraParede(x, cx - 120, 112, 240, ['#2f8a3c', '#c8302a', '#d8a82a', '#4aa0e0']);
        if (larg(m.esq) >= 60) D.alvo(x, m.esq[0] + Math.min(40, larg(m.esq) / 2), 100, 22);
        if (larg(m.dir) >= 90) D.tvParede(x, m.dir[0] + 10, 82, Math.min(84, larg(m.dir) - 20), 46, 'futebol');
        D.neonPlaca(x, m.esq[0] + 4, 130, 54, 18, 'CHOPP', '#ffb84a');
        if (larg(m.esq) >= 120) D.bandeira(x, m.esq[1] - 56, 84, 44, 30, '#c8302a', '#f2f2f2');
      };
    }
  };

  // =====================================================================
  //  CAFÉ
  // =====================================================================
  LAY.cafe = {
    sala: { w: 680, h: 400, piso: 'madeira', pisoCores: ['#5a3a28', '#4a2e1e'] },
    criar(R, add, pl, c, X) {
      const x0 = R.x0, x1 = R.x1, cx = X.cx;
      add(O('vitrine', x0 + 20, 188, 132, 44, { e: 38, tema: 'doces' }), O('prateleira', x1 - 132, 188, 112, 36, { e: 60, tema: 'cafe', nome: 'CAFÉ', front: '#6a4a2a' }));
      banquetas(add, [cx - 118, cx - 80, cx + 56, cx + 94], 246, '#5a3220');
      const cl = conjunto(add, x0 + 40, 330, 'cafe', 'madeira', '#6a4a2a', '#6a4a2a');
      conjunto(add, x0 + 40, 430, 'cafe', 'madeira', '#6a4a2a', '#6a4a2a');
      conjunto(add, x0 + 190, 440, 'cafe', 'madeira', '#6a4a2a', '#6a4a2a');
      add(O('pendente', x0 + 70, 380, 40, 10, { e: 112, solid: false, k: 600 }), O('pendente', x0 + 70, 480, 40, 10, { e: 112, solid: false, k: 600 }), O('pendente', x0 + 220, 490, 40, 10, { e: 112, solid: false, k: 600 }));
      // cantinho do sofá
      add(O('tapete', x1 - 250, 340, 220, 130, { solid: false, k: -50, cor: '#8a4a2a', cor2: '#e8d0a0', padrao: 'geometrico' }));
      add(O('mesa_centro', x1 - 190, 380, 96, 44, { e: 12 }));
      add(O('sofa', x1 - 240, 452, 190, 48, { e: 20, dir: 'n', cor: '#a8483a', cor2: '#e8c870', label: 'SENTAR NO SOFÁ', r: 30, act: S => { K.cura(S, 5); G.say('Você relaxou no sofá do café. (+5 vida)', 2.5); } }));
      add(O('poltrona', x1 - 76, 360, 54, 52, { e: 20, dir: 's', cor: '#4f7a5a', almofadas: false }));
      add(O('prateleira', x1 - 132, 284, 112, 36, { e: 60, tema: 'livros', front: '#5a3c24' }));
      planta(add, x1 - 50, 470, 'palmeira'); planta(add, x0 + 6, 270);
      R.cliente = { x: cl.e.x, y: cl.e.y, h: cl.e.h, sentado: true, falas: ['Esse café me acorda para tudo.', 'Estou esperando um amigo.'] };
      return (x, pl2) => {
        const m = margens(R, pl2);
        if (larg(m.esq) >= 100) D.quadroNegro(x, m.esq[0] + 8, 82, Math.min(110, larg(m.esq) - 16), 52, [['Espresso', '$4'], ['Pingado', '$9'], ['Brownie', '$7'], ['Bolo', '$8']], 'CARDÁPIO');
        if (larg(m.dir) >= 60) { D.quadro(x, m.dir[0] + 8, 84, 36, 46, 'abstrato', '#6a4a2a'); }
        D.relogio(x, cx - 190, 128, 10, '#c8a24a');
        [0, 1, 2].forEach(k => { x.fillStyle = '#f2ecdc'; x.fillRect(cx + 80 + k * 24, 128, 14, 10); x.fillStyle = '#4a2a18'; x.fillRect(cx + 82 + k * 24, 130, 10, 3); });
      };
    }
  };

  L.lojaLay = LAY;
})(window.G = window.G || {});
