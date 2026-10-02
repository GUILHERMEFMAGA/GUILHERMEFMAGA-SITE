// ============================================================
//  ENTRADA: teclado, mouse e controles de toque
// ============================================================
export class Input {
  constructor(canvas) {
    this.keys = Object.create(null);
    this.gas = this.brake = this.left = this.right = this.hand = false;
    this.touch = { gas: false, brake: false, left: false, right: false, hand: false };
    this.mouse = { down: false, dx: 0, dy: 0 };
    this.onAction = () => {};
    this.isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

    const map = {
      KeyW: 'gas', ArrowUp: 'gas',
      KeyS: 'brake', ArrowDown: 'brake',
      KeyA: 'left', ArrowLeft: 'left',
      KeyD: 'right', ArrowRight: 'right',
      Space: 'hand',
    };

    addEventListener('keydown', (e) => {
      if (e.repeat) {
        if (map[e.code] || e.code === 'Space') e.preventDefault();
        return;
      }
      this.keys[e.code] = true;
      if (map[e.code]) e.preventDefault();
      if (e.code === 'Space') e.preventDefault();
      const act = e.code;
      if (['KeyP', 'Escape', 'KeyC', 'KeyR', 'KeyM', 'KeyH', 'Enter'].includes(act)) {
        e.preventDefault();
        this.onAction(act);
      }
    }, { passive: false });

    addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    addEventListener('blur', () => { this.keys = Object.create(null); this.sync(); });

    // olhar com o mouse (botão direito / arrastar)
    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return;
      this.mouse.down = true;
      canvas.setPointerCapture?.(e.pointerId);
    });
    addEventListener('pointerup', () => { this.mouse.down = false; });
    addEventListener('pointermove', (e) => {
      if (!this.mouse.down) return;
      this.mouse.dx += e.movementX || 0;
      this.mouse.dy += e.movementY || 0;
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // botões de toque
    const bind = (el, key) => {
      const on = (e) => { e.preventDefault(); this.touch[key] = true; };
      const off = (e) => { e.preventDefault(); this.touch[key] = false; };
      el.addEventListener('pointerdown', on);
      el.addEventListener('pointerup', off);
      el.addEventListener('pointercancel', off);
      el.addEventListener('pointerleave', off);
    };
    document.querySelectorAll('#touch .tbtn').forEach(b => bind(b, b.dataset.k));

    this.sync();
  }

  sync() {
    const k = this.keys, t = this.touch;
    this.gas = !!(k.KeyW || k.ArrowUp) || t.gas;
    this.brake = !!(k.KeyS || k.ArrowDown) || t.brake;
    this.left = !!(k.KeyA || k.ArrowLeft) || t.left;
    this.right = !!(k.KeyD || k.ArrowRight) || t.right;
    this.hand = !!k.Space || t.hand;
  }

  takeMouse() {
    const d = { dx: this.mouse.dx, dy: this.mouse.dy, down: this.mouse.down };
    this.mouse.dx = 0; this.mouse.dy = 0;
    return d;
  }
}
