(() => {
  const burgerStage = document.querySelector('[data-burger-stage]');
  const burgerToggle = document.querySelector('[data-burger-toggle]');
  const explodeLabel = document.querySelector('[data-explode-label]');
  let burgerIsPinned = false;

  function setBurgerExploded(isExploded) {
    if (!burgerStage || !burgerToggle) return;
    burgerStage.classList.toggle('is-exploded', isExploded);
    burgerToggle.setAttribute('aria-pressed', String(isExploded));
    if (explodeLabel) {
      explodeLabel.textContent = isExploded
        ? 'Montar o burger novamente'
        : 'Ver o burger se desmontar';
    }
  }

  if (burgerStage) {
    burgerStage.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;

      const bounds = burgerStage.getBoundingClientRect();
      const relativeX = (event.clientX - bounds.left) / bounds.width;
      const relativeY = (event.clientY - bounds.top) / bounds.height;
      const tiltY = ((relativeX - 0.5) * 5).toFixed(2);
      const tiltX = ((0.5 - relativeY) * 3).toFixed(2);

      burgerStage.style.setProperty('--tilt-x', `${tiltX}deg`);
      burgerStage.style.setProperty('--tilt-y', `${tiltY}deg`);

      if (!burgerIsPinned) setBurgerExploded(true);
    });

    burgerStage.addEventListener('pointerleave', () => {
      burgerStage.style.setProperty('--tilt-x', '0deg');
      burgerStage.style.setProperty('--tilt-y', '0deg');
      if (!burgerIsPinned) setBurgerExploded(false);
    });
  }

  if (burgerToggle) {
    burgerToggle.addEventListener('click', () => {
      burgerIsPinned = !burgerIsPinned;
      setBurgerExploded(burgerIsPinned);
    });
  }

  const menuToggle = document.querySelector('[data-menu-toggle]');
  const mobileMenu = document.getElementById('mobile-menu');

  function closeMobileMenu() {
    if (!menuToggle || !mobileMenu) return;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menu');
    mobileMenu.hidden = true;
  }

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', String(!isOpen));
      menuToggle.setAttribute('aria-label', isOpen ? 'Abrir menu' : 'Fechar menu');
      mobileMenu.hidden = isOpen;
    });

    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMobileMenu);
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 780) closeMobileMenu();
    });
  }

  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  const menuCards = [...document.querySelectorAll('.menu-card[data-category]')];

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const selectedFilter = button.dataset.filter;
      filterButtons.forEach((filterButton) => {
        const isSelected = filterButton === button;
        filterButton.classList.toggle('is-active', isSelected);
        filterButton.setAttribute('aria-pressed', String(isSelected));
      });

      menuCards.forEach((card) => {
        card.hidden = selectedFilter !== 'all' && card.dataset.category !== selectedFilter;
      });
    });
  });

  const cart = new Map();
  const cartDrawer = document.getElementById('cart-drawer');
  const cartOverlay = document.querySelector('.cart-overlay');
  const cartLines = document.getElementById('cart-lines');
  const cartEmpty = document.getElementById('cart-empty');
  const cartFooter = document.getElementById('cart-footer');
  const cartCount = document.getElementById('cart-count');
  const cartHeadingCount = document.getElementById('cart-heading-count');
  const cartTotal = document.getElementById('cart-total');
  const toast = document.getElementById('toast');
  let lastCartOpener = null;
  let toastTimer = 0;
  let closeTimer = 0;

  const currency = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  function showToast(message) {
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2700);
  }

  function cartQuantity() {
    let quantity = 0;
    cart.forEach((item) => { quantity += item.quantity; });
    return quantity;
  }

  function cartSubtotal() {
    let subtotal = 0;
    cart.forEach((item) => { subtotal += item.price * item.quantity; });
    return subtotal;
  }

  function renderCart() {
    const quantity = cartQuantity();
    if (cartCount) cartCount.textContent = String(quantity);
    if (cartHeadingCount) cartHeadingCount.textContent = `(${quantity})`;
    document.querySelectorAll('[data-cart-open]').forEach((button) => {
      button.setAttribute('aria-label', `Abrir sacola, ${quantity} ${quantity === 1 ? 'item' : 'itens'}`);
    });

    if (cartEmpty) cartEmpty.hidden = quantity > 0;
    if (cartFooter) cartFooter.hidden = quantity === 0;
    if (cartTotal) cartTotal.textContent = currency.format(cartSubtotal());
    if (!cartLines) return;

    cartLines.replaceChildren();
    cart.forEach((item, key) => {
      const line = document.createElement('div');
      line.className = 'cart-line';
      line.dataset.key = key;

      const info = document.createElement('div');
      info.className = 'cart-line__info';
      const name = document.createElement('strong');
      name.textContent = item.name;
      const price = document.createElement('span');
      price.textContent = `${currency.format(item.price)} cada`;
      info.append(name, price);

      const controls = document.createElement('div');
      controls.className = 'cart-line__controls';
      controls.setAttribute('aria-label', `Quantidade de ${item.name}`);

      const decrease = document.createElement('button');
      decrease.className = 'cart-qty-button';
      decrease.type = 'button';
      decrease.dataset.cartAction = 'decrease';
      decrease.setAttribute('aria-label', `Remover uma unidade de ${item.name}`);
      decrease.textContent = '−';

      const amount = document.createElement('span');
      amount.className = 'cart-line__qty';
      amount.textContent = String(item.quantity);
      amount.setAttribute('aria-label', `${item.quantity} unidades`);

      const increase = document.createElement('button');
      increase.className = 'cart-qty-button';
      increase.type = 'button';
      increase.dataset.cartAction = 'increase';
      increase.setAttribute('aria-label', `Adicionar uma unidade de ${item.name}`);
      increase.textContent = '+';

      controls.append(decrease, amount, increase);
      line.append(info, controls);
      cartLines.append(line);
    });
  }

  function addToCart(name, price) {
    const item = cart.get(name);
    if (item) {
      item.quantity += 1;
    } else {
      cart.set(name, { name, price, quantity: 1 });
    }
    renderCart();
    showToast(`${name} entrou na sacola.`);
  }

  document.querySelectorAll('[data-add-to-cart]').forEach((button) => {
    button.addEventListener('click', () => {
      addToCart(button.dataset.name, Number(button.dataset.price));
    });
  });

  if (cartLines) {
    cartLines.addEventListener('click', (event) => {
      const button = event.target.closest('[data-cart-action]');
      if (!button) return;
      const line = button.closest('.cart-line');
      const item = line && cart.get(line.dataset.key);
      if (!item) return;

      if (button.dataset.cartAction === 'increase') {
        item.quantity += 1;
      } else {
        item.quantity -= 1;
        if (item.quantity <= 0) cart.delete(item.name);
      }
      renderCart();
    });
  }

  function openCart(opener) {
    if (!cartDrawer || !cartOverlay) return;
    window.clearTimeout(closeTimer);
    lastCartOpener = opener && opener.closest('.mobile-menu')
      ? document.querySelector('.cart-trigger')
      : opener || document.activeElement;

    cartDrawer.hidden = false;
    cartOverlay.hidden = false;
    cartDrawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('cart-is-open');
    window.requestAnimationFrame(() => {
      cartDrawer.classList.add('is-open');
      cartOverlay.classList.add('is-visible');
    });
    window.setTimeout(() => {
      const closeButton = cartDrawer.querySelector('[data-cart-close]');
      if (closeButton) closeButton.focus();
    }, 80);
  }

  function closeCart() {
    if (!cartDrawer || !cartOverlay || cartDrawer.hidden) return;
    cartDrawer.classList.remove('is-open');
    cartOverlay.classList.remove('is-visible');
    cartDrawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('cart-is-open');
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      cartDrawer.hidden = true;
      cartOverlay.hidden = true;
    }, 380);

    if (lastCartOpener && !lastCartOpener.closest('[hidden]')) {
      window.setTimeout(() => lastCartOpener.focus(), 0);
    }
  }

  document.querySelectorAll('[data-cart-open]').forEach((button) => {
    button.addEventListener('click', () => {
      closeMobileMenu();
      openCart(button);
    });
  });

  document.querySelectorAll('[data-cart-close]').forEach((element) => {
    element.addEventListener('click', closeCart);
  });

  document.querySelectorAll('[data-cart-continue]').forEach((link) => {
    link.addEventListener('click', closeCart);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMobileMenu();
      closeCart();
    }

    if (event.key !== 'Tab' || !cartDrawer || cartDrawer.hidden) return;
    const focusable = [...cartDrawer.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')]
      .filter((element) => !element.closest('[hidden]'));
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  const shareButton = document.getElementById('share-order');
  if (shareButton) {
    shareButton.addEventListener('click', async () => {
      const orderLines = [...cart.values()].map((item) => `${item.quantity} × ${item.name} — ${currency.format(item.price * item.quantity)}`);
      const message = `Oi! Quero pedir:\n${orderLines.join('\n')}\n\nTotal parcial: ${currency.format(cartSubtotal())}`;

      if (navigator.share) {
        try {
          await navigator.share({ title: 'Meu pedido Brasa', text: message });
        } catch (error) {
          if (error.name !== 'AbortError') showToast('Não foi possível abrir o compartilhamento agora.');
        }
        return;
      }

      try {
        await navigator.clipboard.writeText(message);
        showToast('Resumo copiado. É só colar na conversa do pedido.');
      } catch {
        showToast('Seu pedido está pronto para compartilhar.');
      }
    });
  }

  const year = document.querySelector('[data-current-year]');
  if (year) year.textContent = String(new Date().getFullYear());

  renderCart();
})();
