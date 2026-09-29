(function () {
  'use strict';

  /* ---------- Configuração ---------- */
  // Arquivo local (opcional: salve o GIF como preloader.gif na raiz do site) e, como reserva,
  // o mesmo GIF hospedado no GitHub.
  var FONTES = [
    'preloader.gif',
    'https://github.com/user-attachments/assets/a73e7bcd-c59c-463b-8b60-aae618b7e519'
  ];
  var DURACAO_FADE_MS = 800;   // precisa ser igual ao transition do #preloader no CSS
  var DURACAO_PADRAO_MS = 5000; // usada só se não der para ler a duração do GIF

  var preloader = document.getElementById('preloader');
  if (!preloader) return;

  /* ---------- Lê o GIF: soma dos tempos dos quadros e remove o loop ---------- */
  function processarGif(buffer) {
    var b = new Uint8Array(buffer);
    var txt = String.fromCharCode(b[0], b[1], b[2]);
    if (txt !== 'GIF') throw new Error('Arquivo não é um GIF');

    var pos = 13;
    if (b[10] & 0x80) pos += 3 * (1 << ((b[10] & 7) + 1)); // tabela de cores global

    var partes = [b.subarray(0, pos)]; // cabeçalho (sem alterações)
    var totalCs = 0;                   // duração em centésimos de segundo

    function pularSubBlocos(p) {
      while (b[p] !== 0) p += b[p] + 1;
      return p + 1;
    }

    while (pos < b.length) {
      var ini = pos;
      var tipo = b[pos];

      if (tipo === 0x3B) { partes.push(b.subarray(pos, pos + 1)); break; } // fim

      if (tipo === 0x21) { // extensão
        var rotulo = b[pos + 1];
        var fim = pularSubBlocos(pos + 2);
        if (rotulo === 0xF9) { // Graphic Control: tempo do quadro
          var d = b[pos + 4] | (b[pos + 5] << 8);
          totalCs += d <= 1 ? 10 : d; // navegadores tratam 0/1 como 10cs
        }
        var ehLoop = rotulo === 0xFF && b[pos + 2] === 11 &&
          String.fromCharCode.apply(null, b.subarray(pos + 3, pos + 14)).indexOf('NETSCAPE') === 0;
        if (!ehLoop) partes.push(b.subarray(ini, fim)); // descarta a extensão de loop
        pos = fim;
      } else if (tipo === 0x2C) { // quadro de imagem
        var p = pos + 10;
        if (b[pos + 9] & 0x80) p += 3 * (1 << ((b[pos + 9] & 7) + 1)); // tabela local
        p = pularSubBlocos(p + 1); // +1 = tamanho mínimo do LZW
        partes.push(b.subarray(ini, p));
        pos = p;
      } else {
        throw new Error('GIF inválido');
      }
    }

    // Sem a extensão NETSCAPE2.0 o GIF toca uma única vez e para no último quadro.
    return {
      blob: new Blob(partes, { type: 'image/gif' }),
      duracaoMs: totalCs ? totalCs * 10 : DURACAO_PADRAO_MS
    };
  }

  function carregarGif(i) {
    if (i >= FONTES.length) return Promise.reject(new Error('Nenhuma fonte disponível'));
    return fetch(FONTES[i])
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(processarGif)
      .catch(function () { return carregarGif(i + 1); });
  }

  /* ---------- Fade-out e limpeza ---------- */
  var encerrado = false;
  function encerrar() {
    if (encerrado) return;
    encerrado = true;
    preloader.classList.add('fade-out');
    setTimeout(function () {
      preloader.remove();               // tela totalmente branca e limpa
    }, DURACAO_FADE_MS + 50);
  }

  /* ---------- Execução ---------- */
  function iniciar(src, duracaoMs) {
    var img = new Image();
    img.alt = '';
    img.decoding = 'async';
    img.onload = function () {
      // A contagem começa quando o GIF já está na tela; ao terminar, faz o fade-out.
      setTimeout(encerrar, duracaoMs);
    };
    img.onerror = encerrar;
    img.src = src;
    preloader.appendChild(img);
  }

  carregarGif(0).then(
    function (gif) { iniciar(URL.createObjectURL(gif.blob), gif.duracaoMs); },
    // Reserva (ex.: aberto via file:// ou sem CORS): mostra o GIF direto.
    function () { iniciar(FONTES[FONTES.length - 1], DURACAO_PADRAO_MS); }
  );
})();
