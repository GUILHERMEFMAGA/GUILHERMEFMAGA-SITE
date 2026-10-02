const MOVEMENT_KEYS = new Set([
  'w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright',
  'shift',
]);

export class InputController {
  constructor(canvas, onEscape = () => {}) {
    this.canvas = canvas;
    this.onEscape = onEscape;
    this.keys = new Set();
    this.touchActions = new Set();
    this.lookX = 0;
    this.lookY = 0;
    this.dragging = false;
    this.lastTouch = null;

    this.onKeyDown = (event) => {
      const key = event.key.toLowerCase();
      if (MOVEMENT_KEYS.has(key)) {
        event.preventDefault();
        this.keys.add(key);
      }
      if (key === 'escape') this.onEscape();
    };
    this.onKeyUp = (event) => this.keys.delete(event.key.toLowerCase());
    this.onBlur = () => {
      this.keys.clear();
      this.touchActions.clear();
      this.dragging = false;
    };
    this.onPointerMove = (event) => {
      if (!this.dragging && document.pointerLockElement !== this.canvas) return;
      let dx = event.movementX || 0;
      let dy = event.movementY || 0;
      if (this.dragging && event.pointerType !== 'mouse' && this.lastTouch) {
        dx = event.clientX - this.lastTouch.x;
        dy = event.clientY - this.lastTouch.y;
        this.lastTouch = { x: event.clientX, y: event.clientY };
      }
      this.lookX += dx;
      this.lookY += dy;
    };
    this.onPointerDown = (event) => {
      if (event.button !== 0 || document.pointerLockElement === this.canvas) return;
      this.dragging = true;
      this.lastTouch = { x: event.clientX, y: event.clientY };
      this.canvas.setPointerCapture?.(event.pointerId);
    };
    this.onPointerUp = () => {
      this.dragging = false;
      this.lastTouch = null;
    };
    this.onContextMenu = (event) => event.preventDefault();

    window.addEventListener('keydown', this.onKeyDown, { passive: false });
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerUp);
    this.canvas.addEventListener('contextmenu', this.onContextMenu);

    this.touchButtons = [...document.querySelectorAll('[data-action]')];
    for (const button of this.touchButtons) {
      const action = button.dataset.action;
      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        event.stopPropagation();
        button.setPointerCapture?.(event.pointerId);
        this.touchActions.add(action);
        button.classList.add('is-held');
      });
      const release = (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.touchActions.delete(action);
        button.classList.remove('is-held');
      };
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('lostpointercapture', release);
    }
  }

  movement() {
    const down = (...keys) => keys.some((key) => this.keys.has(key) || this.touchActions.has(key));
    return {
      forward: Number(down('w', 'arrowup', 'forward')) - Number(down('s', 'arrowdown', 'back')),
      strafe: Number(down('d', 'arrowright', 'right')) - Number(down('a', 'arrowleft', 'left')),
      sprint: down('shift', 'sprint'),
    };
  }

  consumeLook() {
    const look = { x: this.lookX, y: this.lookY };
    this.lookX = 0;
    this.lookY = 0;
    return look;
  }

  dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerUp);
    this.canvas.removeEventListener('contextmenu', this.onContextMenu);
  }
}
