/* ==========================================================================
   loader.js — tela de carregamento em video (loop) pro site.
   Uso minimo no <head> (o quanto antes possivel, para aparecer antes do body):

     <link rel="stylesheet" href="assets/loading/loader.css">
     <script src="assets/loading/loader.js" data-src="assets/loading/loader.mp4"></script>

   Opcoes via atributos data-* no mesmo <script>:
     data-src          video mp4            (obrigatorio)
     data-webm         video webm fallback  (opcional)
     data-poster       jpg/png exibido antes do primeiro frame
     data-gif          ultima alternativa, caso o navegador nao rode <video>
     data-min          ms minimos na tela   (padrao 900)
     data-max        ms maximos na tela       (padrao 6000, trava de seguranca)
     data-fit          cover | contain      (padrao cover)
     data-texto        rotulo ("Carregando…")
     data-full="true"  espera o video fechar 1 ciclo inteiro antes de sair
     data-skip="false" esconde o botao de pular
     data-once="true"  nao repete em navegacao interna (sessionStorage)

   Sem build, sem dependencia. Funciona em HTML puro, WordPress, Next etc.
   ========================================================================== */
(function () {
  'use strict';

  var script = document.currentScript || (function () {
    var all = document.getElementsByTagName('script');
    for (var i = all.length - 1; i >= 0; i--) {
      if (all[i].src && /loader\.js(\?|#|$)/.test(all[i].src)) return all[i];
    }
    return null;
  })();

  var d = (script && script.dataset) || {};

  var CFG = {
    src: d.src || 'assets/loading/loader.mp4',
    webm: d.webm || '',
    poster: d.poster || '',
    gif: d.gif || '',
    min: parseInt(d.min, 10) || 900,
    max: parseInt(d.max, 10) || 6000,
    fit: d.fit || 'cover',
    text: d.texto || d.text || 'Carregando',
    skip: String(d.skip) !== 'false',
    once: String(d.once) === 'true',
    full: String(d.full) === 'true',
    root: d.root || null           // ex.: '#app' — monta dentro do container
  };

  var FLAG = 'tlo-done';
  var startedAt = Date.now();
  var el = null, media = null, started = false, done = false, holdTimer = null, forceTimer = null;

  function reduced() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function alreadySeen() {
    try { return CFG.once && sessionStorage.getItem(FLAG) === '1'; } catch (e) { return false; }
  }

  function build() {
    el = document.createElement('div');
    el.className = 'tlo' + (CFG.fit === 'contain' ? ' tlo--contain' : '');
    el.setAttribute('role', 'progressbar');
    el.setAttribute('aria-label', CFG.text);
    el.setAttribute('aria-live', 'polite');

    if (CFG.poster) {
      var poster = document.createElement('img');
      poster.className = 'tlo__poster';
      poster.src = CFG.poster;
      poster.alt = '';
      poster.setAttribute('aria-hidden', 'true');
      if (poster.decode) poster.decode().catch(function () {});
      el.appendChild(poster);
    }

    if (!reduced()) {
      media = document.createElement('video');
      media.className = 'tlo__media';
      media.autoplay = true;
      media.muted = true;
      media.defaultMuted = true;
      media.loop = true;
      media.playsInline = true;
      media.setAttribute('muted', '');
      media.setAttribute('playsinline', '');
      media.setAttribute('autoplay', '');
      media.setAttribute('disablepictureinpicture', '');
      media.preload = 'auto';
      media.tabIndex = -1;
      if (CFG.poster) media.poster = CFG.poster;

      if (CFG.webm) {
        var s1 = document.createElement('source');
        s1.src = CFG.webm;
        s1.type = 'video/webm';
        media.appendChild(s1);
      }
      var s2 = document.createElement('source');
      s2.src = CFG.src;
      s2.type = 'video/mp4';
      media.appendChild(s2);

      if (CFG.gif) {
        var alt = document.createElement('img');
        alt.src = CFG.gif;
        alt.alt = '';
        media.appendChild(alt);
      }

      // alguns navegadores so deixam tocar depois de um play() explicito
      var p = media.play && media.play();
      if (p && p.catch) p.catch(function () {
        var retry = function () { media.play().catch(function () {}); };
        document.addEventListener('touchend', retry, { once: true });
        document.addEventListener('click', retry, { once: true });
      });
      el.appendChild(media);
    }

    var fb = document.createElement('div');
    fb.className = 'tlo__fallback';
    fb.innerHTML =
      '<div class="tlo__bar" aria-hidden="true"></div>';
    el.appendChild(fb);

    var label = document.createElement('p');
    label.className = 'tlo__label';
    label.textContent = CFG.text;
    el.appendChild(label);

    if (CFG.skip) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tlo__skip';
      btn.textContent = 'Pular ›';
      btn.addEventListener('click', skipNow);
      el.appendChild(btn);
    }

    var host = CFG.root ? document.querySelector(CFG.root) : null;
    (host || document.body).appendChild(el);
    document.documentElement.classList.add('tlo-lock');
  }

  function leave() {
    if (done) return;
    done = true;
    clearTimeout(forceTimer);
    clearTimeout(holdTimer);
    el.classList.add('is-leaving');
    if (media) { try { media.pause(); } catch (e) {} }
    document.documentElement.classList.remove('tlo-lock');
    try { sessionStorage.setItem(FLAG, '1'); } catch (e) {}
    setTimeout(function () { if (el && el.parentNode) el.parentNode.removeChild(el); }, 500);
  }

  // sair sozinho, mas nunca antes de data-min ...
  function hide() {
    if (!el || done || started === false) return;
    clearTimeout(holdTimer);
    var hold = Math.max(0, CFG.min - (Date.now() - startedAt));
    holdTimer = setTimeout(leave, hold);
  }

  // ... e sair na hora se o usuario clicar em "Pular" ou apertar Esc
  function skipNow() {
    if (!el) return;
    clearTimeout(holdTimer);
    leave();
  }

  function whenReady() {
    // "pronto" = window load OU primeiro frame do video, o que vier primeiro
    if (document.readyState === 'complete') return setTimeout(function () { hide(); }, 0);
    window.addEventListener('load', function () { hide(); }, { once: true });
  }

  function boot() {
    if (alreadySeen() || started) return;
    started = true;
    if (!document.body) { setTimeout(boot, 10); return; }

    build();
    whenReady();

    // trava de seguranca: se algo travar o "load", o loader nunca prende o site
    forceTimer = setTimeout(function () { hide(); }, CFG.max);

    if (media) {
      if (CFG.full) {
        // --full: segura o loader ate o video fechar um ciclo inteiro
        media.addEventListener('timeupdate', function () {
          if (!done && media.duration && media.currentTime >= media.duration - 0.12) hide();
        });
      }
      media.addEventListener('error', function () {
        // video nao tocou: mostra o GIF, e deixa o CSS fallback viver
        if (CFG.gif && el) {
          var img = document.createElement('img');
          img.className = 'tlo__media';
          img.src = CFG.gif;
          img.alt = '';
          el.appendChild(img);
          if (media.parentNode) media.parentNode.removeChild(media);
          media = null;
        }
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !done) skipNow();
    });
  }

  // API publica — util para SPA / Next: Loader.hide() quando a rota terminar
  window.Loader = {
    config: CFG,
    hide: skipNow,                     // chame quando a rota/SPA terminar
    skip: skipNow,
    show: function () { done = false; if (!el) boot(); }
  };

  if (document.body) {
    boot();                                  // loader pinta ja, antes do resto da pagina
  } else {
    document.addEventListener('readystatechange', function () {
      if (document.body && !el) boot();
    });
  }
})();
