/* =====================================================================
   MOVEIS.JS — móveis e objetos novos para as salas (casas, hotéis, mercados, academia)
   Cada "tipo" é uma função que desenha o objeto: (ctx, o, t)
     o.x, o.y = canto de cima/esquerda   o.w, o.h = tamanho no chão   o.e = altura
   Eles são registrados em G.lugares.kit.tipos e o motor das salas usa quando precisa.
   ===================================================================== */
(function (G) {
  'use strict';
  const L = G.lugares, K = L.kit, T = K.tipos, caixa = K.caixa, TAU = Math.PI * 2, shade = K.shade;
  const sombra = (ctx, x, y, w, h) => { ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(x + 4, y + 6, w, h); };

  // bloco genérico (caixa colorida)
  T.bloco = (ctx, o) => caixa(ctx, o.x, o.y, o.w, o.h, o.e || 0, o.top || '#8a6a46', o.front || '#5a3a22');

  T.fogao = (ctx, o, t) => {
    caixa(ctx, o.x, o.y, o.w, o.h, o.e, '#c8ccd4', '#8a8e98');
    const ty = o.y - o.e;
    [[0.28, 0.3], [0.72, 0.3], [0.28, 0.72], [0.72, 0.72]].forEach(([a, b], i) => {
      ctx.fillStyle = '#16181e'; ctx.beginPath(); ctx.arc(o.x + o.w * a, ty + o.h * b, 6, 0, TAU); ctx.fill();
      if (o.ligado && i < 3) { ctx.fillStyle = 'rgba(80,160,255,' + (0.6 + 0.3 * Math.sin(t * 9 + i)) + ')'; ctx.beginPath(); ctx.arc(o.x + o.w * a, ty + o.h * b, 3.4, 0, TAU); ctx.fill(); }
    });
    ctx.fillStyle = '#2a2d36'; ctx.fillRect(o.x + 6, o.y + o.h - o.e + 6, o.w - 12, o.e * 0.55);
  };
  T.pia = (ctx, o) => {
    caixa(ctx, o.x, o.y, o.w, o.h, o.e, '#e8e4dc', '#b8b4aa');
    const ty = o.y - o.e; ctx.fillStyle = '#9aa4ae'; ctx.fillRect(o.x + 6, ty + 5, o.w * 0.5, o.h - 10); ctx.fillStyle = '#6a7480'; ctx.fillRect(o.x + 8, ty + 7, o.w * 0.5 - 4, o.h - 14);
    ctx.fillStyle = '#ccd'; ctx.fillRect(o.x + o.w * 0.72, ty + 3, 3, 8);
  };
  T.armario = (ctx, o) => {
    caixa(ctx, o.x, o.y, o.w, o.h, o.e, o.top || '#6a4a2e', o.front || '#8a5e3a');
    const fy = o.y + o.h - o.e; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(o.x + o.w / 2, fy + 3); ctx.lineTo(o.x + o.w / 2, o.y + o.h - 2); ctx.stroke();
    ctx.fillStyle = '#e8d8a0'; ctx.fillRect(o.x + o.w / 2 - 6, fy + o.e * 0.45, 3, 8); ctx.fillRect(o.x + o.w / 2 + 3, fy + o.e * 0.45, 3, 8);
  };
  T.cofre = (ctx, o) => {
    caixa(ctx, o.x, o.y, o.w, o.h, o.e, '#3a3e48', '#22252c');
    const cx = o.x + o.w / 2, cy = o.y + o.h - o.e / 2; ctx.fillStyle = '#c8ccd4'; ctx.beginPath(); ctx.arc(cx, cy, 8, 0, TAU); ctx.fill(); ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#111'; ctx.fillRect(cx - 1, cy - 6, 2, 6);
    if (o.aberto) { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(o.x + 3, o.y + o.h - o.e + 3, o.w - 6, o.e - 6); }
  };
  T.cama2 = (ctx, o) => {
    // cama dupla / solteiro (cor do edredom em o.cor)
    sombra(ctx, o.x, o.y, o.w, o.h);
    ctx.fillStyle = '#5a3a22'; ctx.fillRect(o.x - 2, o.y - 14, o.w + 4, o.h + 16);
    ctx.fillStyle = '#f0ece4'; ctx.fillRect(o.x, o.y - 8, o.w, o.h + 6);
    ctx.fillStyle = o.cor || '#4a78c8'; ctx.fillRect(o.x, o.y + o.h * 0.34, o.w, o.h * 0.68);
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(o.x, o.y + o.h * 0.34, o.w, 3);
    ctx.fillStyle = '#fff'; const n = o.w > 100 ? 2 : 1; for (let i = 0; i < n; i++) { ctx.fillRect(o.x + 6 + i * (o.w / n), o.y - 4, o.w / n - 12, 16); }
    ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 1; ctx.strokeRect(o.x + 0.5, o.y - 7.5, o.w - 1, o.h + 5);
  };
  T.berco = (ctx, o) => { sombra(ctx, o.x, o.y, o.w, o.h); ctx.fillStyle = '#e8d8f0'; ctx.fillRect(o.x, o.y - 6, o.w, o.h + 6); ctx.fillStyle = '#c8a8e0'; ctx.fillRect(o.x + 3, o.y, o.w - 6, o.h - 6); ctx.strokeStyle = '#8a6aa8'; ctx.lineWidth = 1; for (let k = o.x + 4; k < o.x + o.w; k += 6) { ctx.beginPath(); ctx.moveTo(k, o.y - 6); ctx.lineTo(k, o.y + o.h); ctx.stroke(); } };
  T.bancada = (ctx, o) => { caixa(ctx, o.x, o.y, o.w, o.h, o.e || 22, '#d4d8de', '#8a909a'); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(o.x + 4, o.y - (o.e || 22) + 3, o.w - 8, 2); const my = o.y - (o.e || 22) + o.h * 0.5; for (let k = o.x + 14; k < o.x + o.w - 10; k += 34) { ctx.fillStyle = '#b0b6bf'; ctx.beginPath(); ctx.ellipse(k, my, 8, 5, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.stroke(); } };
  T.panelao = (ctx, o, t) => { caixa(ctx, o.x, o.y, o.w, o.h, o.e || 18, '#9aa0aa', '#5a606a'); const ty = o.y - (o.e || 18); ctx.fillStyle = '#16181e'; ctx.beginPath(); ctx.ellipse(o.x + o.w / 2, ty + o.h / 2, o.w * 0.38, o.h * 0.36, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(o.x + o.w / 2 + Math.sin(t * 3) * 6, ty + o.h / 2 - 2, 3, 0, TAU); ctx.fill(); };

  T.recepcao = (ctx, o) => {
    caixa(ctx, o.x, o.y, o.w, o.h, o.e || 30, '#e8e0d0', '#b8a888');
    const fy = o.y + o.h - (o.e || 30); ctx.fillStyle = 'rgba(0,0,0,0.18)'; for (let k = o.x + 10; k < o.x + o.w - 20; k += 44) ctx.fillRect(k, fy + 5, 34, (o.e || 30) - 10);
    ctx.fillStyle = '#c8a24a'; ctx.fillRect(o.x, o.y + o.h - 4, o.w, 3);
    const my = o.y - (o.e || 30) + 8; ctx.fillStyle = '#2a2d36'; ctx.fillRect(o.x + o.w - 40, my - 6, 22, 12); ctx.fillStyle = '#6fe0a0'; ctx.fillRect(o.x + o.w - 37, my - 4, 16, 5);
    ctx.fillStyle = '#e8c850'; ctx.beginPath(); ctx.arc(o.x + 30, my, 4, 0, TAU); ctx.fill(); ctx.fillStyle = '#c8302a'; ctx.fillRect(o.x + 30 - 1, my - 1, 2, 5);
  };
  T.mesa_rest = (ctx, o) => {
    const cx = o.x + o.w / 2, cy = o.y + o.h / 2, e = o.e || 16;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(cx + 4, cy + 7, o.w / 2, o.h / 2.2, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2a2018'; ctx.fillRect(cx - 3, cy - 2, 6, e);
    ctx.fillStyle = o.toalha || '#f4f0e8'; ctx.beginPath(); ctx.ellipse(cx, cy - e, o.w / 2, o.h / 2.2, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.stroke();
    ctx.fillStyle = o.cor || '#c8302a'; ctx.beginPath(); ctx.ellipse(cx, cy - e, o.w / 5, o.h / 5.5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e8e8f0'; ctx.fillRect(cx - 8, cy - e - 10, 3, 7); ctx.fillStyle = '#ffd89a'; ctx.beginPath(); ctx.arc(cx + 8, cy - e - 3, 2.4, 0, TAU); ctx.fill();
    if (o.prato) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(cx, cy - e + 7, 9, 4.5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = o.prato; ctx.beginPath(); ctx.ellipse(cx, cy - e + 6, 5.5, 2.8, 0, 0, TAU); ctx.fill(); }
  };
  T.cadeira_rest = (ctx, o) => {
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(o.x + o.w / 2 + 2, o.y + o.h / 2 + 4, o.w / 2, o.h / 2, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = o.cor || '#7a2a3a'; ctx.beginPath(); ctx.ellipse(o.x + o.w / 2, o.y + o.h / 2 - 3, o.w / 2, o.h / 2.2, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.stroke();
  };
  T.piscina = (ctx, o, t) => {
    ctx.fillStyle = '#e8e4d8'; ctx.fillRect(o.x - 8, o.y - 8, o.w + 16, o.h + 16);
    ctx.fillStyle = '#b8b0a0'; ctx.fillRect(o.x - 8, o.y + o.h + 4, o.w + 16, 4);
    const g = ctx.createLinearGradient(o.x, o.y, o.x + o.w, o.y + o.h); g.addColorStop(0, '#2ec8f0'); g.addColorStop(1, '#1a78c8'); ctx.fillStyle = g; ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5;
    for (let k = 0; k < 7; k++) { ctx.beginPath(); const yy = o.y + 10 + k * (o.h - 20) / 6; for (let xx = o.x; xx <= o.x + o.w; xx += 8) { const wy = yy + Math.sin(xx * 0.09 + t * 1.8 + k) * 2.5; xx === o.x ? ctx.moveTo(xx, wy) : ctx.lineTo(xx, wy); } ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; for (let k = 0; k < 5; k++) { const px = o.x + ((k * 97 + t * 14) % o.w); ctx.fillRect(px, o.y + 8 + k * 14, 14, 2); }
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(o.x, o.y, o.w, o.h);
    ctx.fillStyle = '#c8302a'; for (let k = 0; k < 3; k++) { ctx.fillRect(o.x + 10 + k * 24, o.y - 6, 6, 3); }
  };
  T.espreguicadeira = (ctx, o) => {
    sombra(ctx, o.x, o.y, o.w, o.h); ctx.fillStyle = o.cor || '#f0f0f0'; ctx.fillRect(o.x, o.y, o.w, o.h); ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let k = 4; k < o.h; k += 5) ctx.fillRect(o.x, o.y + k, o.w, 1);
    ctx.fillStyle = shade(o.cor || '#f0f0f0', -0.15); ctx.fillRect(o.x, o.y, o.w, 9); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.strokeRect(o.x + 0.5, o.y + 0.5, o.w - 1, o.h - 1);
  };
  T.guarda_sol = (ctx, o) => { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(o.x + 6, o.y + 6, 26, 14, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#5a3a22'; ctx.fillRect(o.x - 2, o.y - 32, 4, 34); ctx.fillStyle = o.cor || '#e8402a'; ctx.beginPath(); ctx.ellipse(o.x, o.y - 34, 30, 15, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let k = -2; k <= 2; k += 2) { ctx.beginPath(); ctx.ellipse(o.x, o.y - 34, 30 - Math.abs(k) * 4, 15, 0, 0, TAU); ctx.fill(); } };

  // porta na parede (elevador, quarto, cozinha...). Fica na parede de trás; zona de uso é o chão na frente
  T.porta = (ctx, o, t) => {
    const x = o.x, y = o.y, w = o.w, h = o.h;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x - 5, y - 5, w + 10, h + 8);
    if (o.estilo === 'elevador') {
      ctx.fillStyle = '#b8bcc4'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#8a8e98'; ctx.fillRect(x + w / 2 - 1, y, 2, h);
      const aberta = o.aberta ? 10 : 0; ctx.fillStyle = '#d8dce4'; ctx.fillRect(x + 2, y + 2, w / 2 - 3 - aberta, h - 3); ctx.fillRect(x + w / 2 + 1 + aberta, y + 2, w / 2 - 3 - aberta, h - 3);
      ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.moveTo(x + w / 2, y - 12); ctx.lineTo(x + w / 2 + 5, y - 6); ctx.lineTo(x + w / 2 - 5, y - 6); ctx.fill();
    } else if (o.estilo === 'vai-vem') {
      ctx.fillStyle = '#9aa0aa'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#c8ccd4'; ctx.fillRect(x + 3, y + 4, w / 2 - 4, h - 4); ctx.fillRect(x + w / 2 + 1, y + 4, w / 2 - 4, h - 4); ctx.fillStyle = '#6a7a8a'; ctx.fillRect(x + 8, y + 10, w / 2 - 14, 14); ctx.fillRect(x + w / 2 + 6, y + 10, w / 2 - 14, 14);
    } else {
      ctx.fillStyle = o.cor || '#5a3a22'; ctx.fillRect(x, y, w, h); ctx.fillStyle = shade(o.cor || '#5a3a22', 0.12); ctx.fillRect(x + 4, y + 4, w - 8, h * 0.4); ctx.fillRect(x + 4, y + h * 0.5, w - 8, h * 0.45);
      ctx.fillStyle = '#e8c850'; ctx.beginPath(); ctx.arc(x + w - 8, y + h * 0.55, 3, 0, TAU); ctx.fill();
    }
    if (o.placa) { ctx.fillStyle = '#e8c850'; ctx.fillRect(x + w / 2 - 14, y - 20, 28, 12); ctx.fillStyle = '#222'; ctx.font = 'bold 8px Arial'; ctx.textAlign = 'center'; ctx.fillText(o.placa, x + w / 2, y - 11); ctx.textAlign = 'left'; }
  };

  // ---------- supermercado ----------
  // gôndola: prateleira alta com produtos coloridos (o.cores = lista de cores)
  T.gondola = (ctx, o, t) => {
    const e = o.e || 34;
    caixa(ctx, o.x, o.y, o.w, o.h, e, '#d8dce4', '#aab0ba');
    const cs = o.cores || ['#e8402a', '#2a58b8', '#f2d02a', '#2f8a3c'], ty = o.y - e, fy = o.y + o.h - e;
    // 3 prateleiras de produtos na frente
    for (let r = 0; r < 3; r++) {
      const yy = fy + 5 + r * ((e - 8) / 3);
      ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(o.x + 2, yy + (e - 8) / 3 - 2, o.w - 4, 2);
      for (let k = 0; k < o.w - 6; k += 7) { ctx.fillStyle = cs[(k / 7 + r * 2 + (o.x / 9 | 0)) % cs.length | 0]; ctx.fillRect(o.x + 3 + k, yy, 5.5, (e - 8) / 3 - 3); }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(o.x, ty, o.w, 2);
    // topo com produtos vistos de cima
    for (let k = 0; k < o.w - 6; k += 9) { ctx.fillStyle = cs[(k / 9 + 1) % cs.length | 0]; ctx.fillRect(o.x + 4 + k, ty + 3, 6, o.h - 6); }
    ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.strokeRect(o.x + 0.5, ty + 0.5, o.w - 1, o.h + e - 1);
    if (o.nome) { ctx.fillStyle = 'rgba(0,0,0,0.65)'; const ww = Math.min(o.w, 70); ctx.fillRect(o.x + o.w / 2 - ww / 2, ty - 11, ww, 11); ctx.fillStyle = '#fff'; ctx.font = 'bold 8px Arial'; ctx.textAlign = 'center'; ctx.fillText(o.nome, o.x + o.w / 2, ty - 3); ctx.textAlign = 'left'; }
  };
  T.freezer = (ctx, o) => { caixa(ctx, o.x, o.y, o.w, o.h, o.e || 22, '#eaf6ff', '#8ab0c8'); const ty = o.y - (o.e || 22); ctx.fillStyle = 'rgba(140,200,255,0.5)'; ctx.fillRect(o.x + 4, ty + 4, o.w - 8, o.h - 8); const cs = ['#f8c8e0', '#c8f0c8', '#fff0a0', '#a8d0f8']; for (let k = 0; k < o.w - 14; k += 12) { ctx.fillStyle = cs[(k / 12) % 4 | 0]; ctx.fillRect(o.x + 7 + k, ty + 8, 9, o.h - 16); } ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(o.x + 4, ty + 4, o.w - 8, 3); };
  T.caixa_reg = (ctx, o, t) => {
    caixa(ctx, o.x, o.y, o.w, o.h, 20, '#6a707a', '#3a3e48');
    const ty = o.y - 20; ctx.fillStyle = '#16181e'; ctx.fillRect(o.x + 6, ty + 6, o.w - 30, o.h - 12); ctx.fillStyle = 'rgba(255,255,255,0.08)'; for (let k = 0; k < o.w - 30; k += 10) ctx.fillRect(o.x + 6 + ((k + t * 12) % (o.w - 30)), ty + 6, 2, o.h - 12);
    ctx.fillStyle = '#2a2d36'; ctx.fillRect(o.x + o.w - 20, ty + 4, 16, o.h - 8); ctx.fillStyle = '#6fe0a0'; ctx.fillRect(o.x + o.w - 18, ty + 7, 12, 5);
    ctx.fillStyle = o.aberto ? '#3fdc4a' : '#e8402a'; ctx.beginPath(); ctx.arc(o.x + o.w - 12, ty - 4, 3, 0, TAU); ctx.fill();
  };
  T.pilha_carrinhos = (ctx, o) => { sombra(ctx, o.x, o.y, o.w, o.h); for (let k = 0; k < 5; k++) { ctx.fillStyle = k % 2 ? '#b8bec8' : '#9aa0aa'; ctx.fillRect(o.x + k * 4, o.y - k * 2, o.w - 14, o.h - 4); ctx.strokeStyle = '#555'; ctx.strokeRect(o.x + k * 4 + 0.5, o.y - k * 2 + 0.5, o.w - 15, o.h - 5); } ctx.fillStyle = '#d33a3a'; ctx.fillRect(o.x + 16, o.y - 11, o.w - 14, 3); };
  T.pilha_caixas = (ctx, o) => { caixa(ctx, o.x, o.y, o.w, o.h, o.e || 30, '#c8a060', '#8a6a3a'); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.moveTo(o.x, o.y - (o.e || 30) / 2); ctx.lineTo(o.x + o.w, o.y - (o.e || 30) / 2); ctx.stroke(); };
  T.balcao_padaria = (ctx, o) => { caixa(ctx, o.x, o.y, o.w, o.h, o.e || 28, '#f0e6d0', '#a88a58'); const ty = o.y - (o.e || 28); for (let k = o.x + 10; k < o.x + o.w - 8; k += 22) { ctx.fillStyle = '#d8a060'; ctx.beginPath(); ctx.ellipse(k, ty + o.h / 2, 8, 5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#e8b878'; ctx.beginPath(); ctx.ellipse(k - 1, ty + o.h / 2 - 1, 5, 3, 0, 0, TAU); ctx.fill(); } ctx.fillStyle = 'rgba(180,230,255,0.25)'; ctx.fillRect(o.x + 2, ty - 8, o.w - 4, 10); };
  // legenda de seção no teto do mercado (placa pendurada)
  T.placa_secao = (ctx, o) => { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(o.x + 3, o.y + 5, o.w, o.h); ctx.fillStyle = o.cor || '#2e8b3e'; ctx.fillRect(o.x, o.y, o.w, o.h); ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center'; ctx.fillText(o.texto, o.x + o.w / 2, o.y + o.h / 2 + 4); ctx.textAlign = 'left'; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.strokeRect(o.x + 0.5, o.y + 0.5, o.w - 1, o.h - 1); };
  T.estrela = (ctx, o) => {}; // reservado
})(window.G = window.G || {});
