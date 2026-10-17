'use strict';
/* ============================================================
   car.js — física arcade de carro (derrapagem, dano, combustível)
   e desenho top-down com brilho/sombra como na referência.
   ============================================================ */
const KINDS = {
  coupe:  { hl: 20, hw: 11, max: 300, acc: 240, turn: 2.7 },
  sedan:  { hl: 21, hw: 11, max: 260, acc: 200, turn: 2.4 },
  taxi:   { hl: 21, hw: 11, max: 270, acc: 210, turn: 2.5 },
  police: { hl: 21, hw: 11, max: 315, acc: 260, turn: 2.9 },
  truck:  { hl: 26, hw: 13, max: 215, acc: 150, turn: 2.0 },
};
const CAR_COLORS = ['#3f7a3a', '#d8b71a', '#3f6fb5', '#e8e8e8', '#7a4fa0', '#b5502a'];

class Car {
  constructor(x, y, angle, kind, color) {
    const k = KINDS[kind] || KINDS.sedan;
    Object.assign(this, { x, y, angle, kind, color: color || '#c8c8c8' });
    this.hl = k.hl; this.hw = k.hw; this.max = k.max; this.acc = k.acc; this.turn = k.turn;
    this.vx = 0; this.vy = 0;
    this.hp = 100; this.fuel = 100;
    this.wreck = false; this.fire = false;
    this.driver = null;          // 'player' | 'ai' | null
    this.steer = 0; this.throttle = 0; this.hand = false; this.braking = false;
    this.spin = 0;               // impulso de giro (PIT)
    this.drift = 0;              // |vel lateral| p/ som/marcas
  }
  get speed() { return Math.hypot(this.vx, this.vy); }
  forwardSpeed() { const f = this.heading(); return this.vx * f.x + this.vy * f.y; }
  heading() { return { x: Math.cos(this.angle), y: Math.sin(this.angle) }; }

  update(dt) {
    if (this.wreck) { this.vx *= 1 - 2 * dt; this.vy *= 1 - 2 * dt; this.x += this.vx * dt; this.y += this.vy * dt; return; }
    const f = this.heading(), left = { x: -f.y, y: f.x };
    let vF = this.vx * f.x + this.vy * f.y;
    let vL = this.vx * left.x + this.vy * left.y;

    const gas = this.fuel > 0 ? this.throttle : Math.min(0, this.throttle);
    if (gas > 0) vF += this.acc * gas * dt;
    else if (gas < 0) {
      if (vF > 10) { vF -= 420 * dt; this.braking = true; }
      else { vF -= this.acc * .5 * dt; this.braking = false; } // ré
    } else this.braking = false;
    if (this.hand && vF > 0) vF -= 300 * dt;

    vF *= 1 - .5 * dt;                                   // arrasto
    vF = Math.max(-this.max * .35, Math.min(this.max, vF));

    const onGrass = WORLD.tileAt(this.x, this.y) === TY.GRASS || WORLD.tileAt(this.x, this.y) === TY.PATH;
    const grip = this.hand ? 2.1 : (onGrass ? 3.2 : 8.5);
    vL *= Math.max(0, 1 - grip * dt);

    const sf = Math.max(-1.3, Math.min(1.3, vF / 140));
    this.angle += (this.steer * this.turn * sf + this.spin) * dt * (this.hand ? 1.25 : 1);
    this.spin *= 1 - 4 * dt;
    this.drift = Math.abs(vL);
    if (onGrass) vF *= 1 - 1.2 * dt;                     // grama segura o carro

    const nf = this.heading(), nl = { x: -nf.y, y: nf.x };
    this.vx = nf.x * vF + nl.x * vL;
    this.vy = nf.y * vF + nl.y * vL;

    // colisão com o mundo (eixos separados -> desliza na parede)
    const impact = this.collideAxis('x', this.vx * dt);
    if (impact) this.vx *= -0.25;
    const impact2 = this.collideAxis('y', this.vy * dt);
    if (impact2) this.vy *= -0.25;
    const hit = Math.max(impact, impact2);
    if (hit > 150) this.damage((hit - 140) / 12);
    if (this.fuel > 0 && (gas !== 0 || this.speed > 5)) this.fuel = Math.max(0, this.fuel - dt * (0.35 + this.speed / 900));
  }

  corners() {
    const f = this.heading(), l = { x: -f.y, y: f.x }, out = [];
    for (const [a, b] of [[1, 1], [1, -1], [-1, 1], [-1, -1]])
      out.push({ x: this.x + f.x * this.hl * a + l.x * this.hw * b, y: this.y + f.y * this.hl * a + l.y * this.hw * b });
    return out;
  }
  collideAxis(axis, d) {
    if (d === 0) return 0;
    this[axis] += d;
    for (const c of this.corners()) if (WORLD.solidAt(c.x, c.y)) { this[axis] -= d; return Math.abs(d) / (1 / 60); }
    return 0;
  }
  damage(n) {
    if (this.wreck) return;
    this.hp -= n;
    if (this.hp <= 0) { this.hp = 0; this.wreck = true; this.fire = true; }
    else if (this.hp < 25) this.fire = true;
  }

  /* ------------------------- desenho ------------------------- */
  draw(ctx, cam, clock, night) {
    const px = this.x - cam.x, py = this.y - cam.y;
    if (px < -60 || py < -60 || px > 860 || py > 660) return;
    ctx.save();
    ctx.translate(px, py);
    ctx.scale(.78, .78); // sprites maiores no mapa, sem carros gigantes no viewport ampliado
    // sombra projetada
    ctx.save(); ctx.rotate(this.angle);
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.beginPath(); ctx.ellipse(2, 3, this.hl + 2, this.hw + 2, 0, 0, 7); ctx.fill();
    ctx.restore();

    ctx.rotate(this.angle);
    const base = this.wreck ? '#36363a' : this.color;
    // Pneus, vistos em planta, aparecem ligeiramente para fora da carroceria.
    ctx.fillStyle = '#17191d';
    for (const wx of [-this.hl * .57, this.hl * .57]) for (const wy of [-this.hw - 1, this.hw - 3]) {
      roundRect(ctx, wx - 4, wy, 9, 5, 2); ctx.fill();
      ctx.fillStyle = '#55585d'; ctx.fillRect(wx - 2, wy + 1, 5, 1); ctx.fillStyle = '#17191d';
    }
    // Silhueta com capô, cabine, porta-malas e para-choques separados.
    const body = ctx.createLinearGradient(0, -this.hw, 0, this.hw);
    body.addColorStop(0, shade(base, 36)); body.addColorStop(.25, shade(base, 18));
    body.addColorStop(.55, base); body.addColorStop(1, shade(base, -42));
    ctx.fillStyle = body;
    roundRect(ctx, -this.hl - 2, -this.hw, this.hl * 2 + 4, this.hw * 2, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(12,13,17,.9)'; ctx.lineWidth = 2; ctx.stroke();
    // borda brilhante e vinco longo do capô
    ctx.strokeStyle = 'rgba(255,255,255,.33)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-this.hl + 4, -this.hw + 2); ctx.lineTo(this.hl - 6, -this.hw + 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.16)';
    roundRect(ctx, 2, -this.hw + 2, this.hl - 8, this.hw * 2 - 4, 4); ctx.fill(); // capô
    ctx.fillStyle = shade(base, -12);
    roundRect(ctx, -this.hl + 3, -this.hw + 3, this.hl * .42, this.hw * 2 - 6, 3); ctx.fill(); // porta-malas
    // cabine e vidros com moldura escura
    if (!this.wreck) {
      ctx.fillStyle = '#121c25';
      roundRect(ctx, -this.hl * .40, -this.hw + 2, this.hl * .83, this.hw * 2 - 4, 5); ctx.fill();
      ctx.fillStyle = '#202f3a';
      ctx.beginPath(); ctx.moveTo(this.hl * .16, -this.hw + 4); ctx.lineTo(this.hl * .32, -this.hw + 4);
      ctx.lineTo(this.hl * .42, -this.hw + 6); ctx.lineTo(this.hl * .42, this.hw - 6);
      ctx.lineTo(this.hl * .32, this.hw - 4); ctx.lineTo(this.hl * .16, this.hw - 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#18252e';
      ctx.beginPath(); ctx.moveTo(-this.hl * .31, -this.hw + 5); ctx.lineTo(-this.hl * .18, -this.hw + 4);
      ctx.lineTo(-this.hl * .18, this.hw - 4); ctx.lineTo(-this.hl * .31, this.hw - 5); ctx.closePath(); ctx.fill();
      // teto metálico, duas janelas laterais e reflexo em faixa
      const roof = ctx.createLinearGradient(0, -this.hw, 0, this.hw);
      roof.addColorStop(0, shade(base, 22)); roof.addColorStop(.5, shade(base, 9)); roof.addColorStop(1, shade(base, -19));
      ctx.fillStyle = roof; roundRect(ctx, -this.hl * .17, -this.hw + 3, this.hl * .43, this.hw * 2 - 6, 3); ctx.fill();
      ctx.fillStyle = '#20303a'; ctx.fillRect(-this.hl * .12, -this.hw + 4, this.hl * .08, this.hw * 2 - 8);
      ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(-this.hl * .08, -this.hw + 4, this.hl * .04, this.hw * 2 - 8);
    }
    // faixas de serviço/polícia e letreiro do táxi no teto
    if (this.kind === 'police' && !this.wreck) {
      ctx.fillStyle = '#263e89'; ctx.fillRect(-this.hl + 4, -this.hw + 2, 5, this.hw * 2 - 4);
      ctx.fillStyle = '#f4f2ea'; ctx.fillRect(-this.hl + 9, -this.hw + 2, 3, this.hw * 2 - 4);
    }
    if (this.kind === 'taxi' && !this.wreck) {
      ctx.fillStyle = '#222'; roundRect(ctx, -3, -4, 9, 8, 2); ctx.fill();
      ctx.fillStyle = '#ffe34d'; ctx.font = 'bold 5px monospace'; ctx.textAlign = 'center'; ctx.fillText('TAXI', 1, 2);
    }
    // para-choques, faróis quentes e lanternas vermelhas
    ctx.fillStyle = '#27292e'; ctx.fillRect(this.hl - 3, -this.hw + 2, 4, this.hw * 2 - 4);
    ctx.fillRect(-this.hl - 1, -this.hw + 2, 4, this.hw * 2 - 4);
    ctx.fillStyle = this.wreck ? '#666' : '#fff1b4';
    ctx.fillRect(this.hl - 1, -this.hw + 3, 2, 4); ctx.fillRect(this.hl - 1, this.hw - 7, 2, 4);
    ctx.fillStyle = this.braking || this.hand ? '#ff3737' : '#b33438';
    ctx.fillRect(-this.hl - 1, -this.hw + 3, 2, 4); ctx.fillRect(-this.hl - 1, this.hw - 7, 2, 4);
    // giroflex
    if (this.kind === 'police' && !this.wreck) {
      ctx.fillStyle = Math.floor(clock * 6) % 2 ? '#ff3b3b' : '#3b6bff';
      ctx.fillRect(-3, -4, 6, 8);
    }
    ctx.restore();

    // cone de farol à noite
    if (night > 0.25 && !this.wreck && this.driver) {
      ctx.save(); ctx.translate(px, py); ctx.scale(.78, .78); ctx.rotate(this.angle);
      ctx.globalCompositeOperation = 'lighter';
      const lg = ctx.createLinearGradient(this.hl, 0, this.hl + 110, 0);
      lg.addColorStop(0, `rgba(255,240,170,${.28 * night})`); lg.addColorStop(1, 'rgba(255,240,170,0)');
      ctx.fillStyle = lg;
      ctx.beginPath(); ctx.moveTo(this.hl, -4); ctx.lineTo(this.hl + 110, -34); ctx.lineTo(this.hl + 110, 34); ctx.lineTo(this.hl, 4); ctx.fill();
      ctx.restore();
    }
  }
}

/* utilidades de desenho */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt)), g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt)), b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `rgb(${r},${g},${b})`;
}
