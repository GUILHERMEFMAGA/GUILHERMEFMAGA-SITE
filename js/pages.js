export const pages = {
"01": {
  chapter:"Capítulo 1 — Origens e História",
  title:"Bem-vindo ao Coração do Café Brasileiro",
  subtitle:"Do cerrado à xícara. Uma história de paixão.",
  hero:"https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1600&q=80&auto=format&fit=crop",
  badge:"Página 01 — Entrada Imersiva",
  content: `
  <section class="hero" data-parallax>
    <div class="hero-bg"><img src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1600&q=80&auto=format&fit=crop" alt="Plantação ao nascer do sol"><div class="hero-overlay"></div><div class="hero-grain"></div></div>
    <div class="hero-parallax"><span style="width:120px;height:120px;left:12%;top:18%"></span><span style="width:80px;height:80px;right:14%;top:26%"></span><span style="width:160px;height:160px;left:50%;bottom:10%"></span></div>
    <div class="hero-content">
      <div class="eyebrow"><i></i> Experiência Imersiva • 30 Páginas • Brasil</div>
      <h1>TERRA <span style="color:var(--gold);font-style:italic">&</span> GRÃO <em>A Arte Brasileira do Café</em></h1>
      <p class="lead" id="typewriter"></p>
      <div class="hero-actions">
        <a href="#/02" class="btn-primary" data-magnetic><span>Iniciar a Jornada — 15 min</span><i class="btn-shine"></i></a>
        <a href="#/04" class="btn-ghost">Explorar o Mapa</a>
      </div>
      <div class="hero-stats">
        <div class="stat-card"><strong data-count="3558000">0</strong><span>toneladas / ano</span></div>
        <div class="stat-card"><strong data-count="300000">0</strong><span>propriedades rurais</span></div>
        <div class="stat-card"><strong data-count="14">0</strong><span>estados produtores</span></div>
        <div class="stat-card"><strong data-count="8000000">0</strong><span>empregos gerados</span></div>
      </div>
      <div style="margin-top:26px" class="btn-scroll-indicator">
        <div class="scroll-ring"><span class="scroll-arrow">↓</span></div>
        <span>Role para descobrir</span>
      </div>
    </div>
  </section>
  <section class="page-section" style="padding:28px 22px">
    <div class="grid-2">
      <div class="glass-card card-pad reveal">
        <div class="kicker">Manifesto Sensorial</div>
        <h3 class="section-title">Uma obra de arte digital sobre o café</h3>
        <p style="line-height:1.75;opacity:0.78">Este não é um site. É um cafezal digital. Cada rolagem revela camadas de terroir, história e ciência — com luz do cerrado, textura de grãos e o vapor que sobe da xícara. Navegue pelos 30 capítulos como quem caminha entre ruas de café ao amanhecer.</p>
        <div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap">
          <span class="pill">Luxo rústico</span><span class="pill">Parallax 3D</span><span class="pill">GSAP + Canvas</span><span class="pill">Glassmorphism</span>
        </div>
      </div>
      <div class="glass-card reveal" style="padding:0;overflow:hidden">
        <div style="display:grid;grid-template-columns:1fr 1fr;height:100%">
          <div style="padding:18px">
            <div class="badge">Som ambiente</div>
            <h4 style="font-family:var(--font-display);margin:10px 0 6px">Chuva na plantação</h4>
            <p style="font-size:13px;opacity:0.7;line-height:1.6">Ative o áudio no header para ouvir a chuva fina caindo sobre as folhas do cafeeiro. O som acompanha seu scroll.</p>
            <button class="btn-primary small" onclick="document.getElementById('soundToggle').click()"><span>Ativar áudio</span></button>
          </div>
          <div style="background:url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80&auto=format&fit=crop') center/cover;min-height:220px"></div>
        </div>
      </div>
    </div>
  </section>
  `
},
"02": {
  chapter:"Capítulo 1 — Origens e História",
  title:"1727 — A Semente que Mudou o País",
  subtitle:"A saga de Palheta, o contrabando e o ciclo que ergueu o Brasil.",
  hero:"https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?w=1600&q=80&auto=format&fit=crop",
  badge:"Página 02 — História",
  content: `
  <div class="page-header page-section">
    <div class="chapter-label">Capítulo 1 — Origens e História</div>
    <h2>1727 — <em>A Semente que Mudou o País</em></h2>
    <p>Como um buquê de flores escondendo sementes mudou para sempre a economia, a cultura e a paisagem do Brasil.</p>
  </div>
  <section class="page-section" style="padding-bottom:12px">
    <div class="glass-card" style="padding:0;overflow:hidden">
      <div style="display:flex;overflow:auto;scroll-snap-type:x mandatory;scrollbar-width:none" id="timelineScroll">
        ${[
          {year:"1727", title:"O Furto Perfumado", text:"Francisco de Melo Palheta recebe sementes escondidas num buquê da esposa do governador de Caiena, Guiana Francesa. Nasce o café no Pará.", img:"https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?w=800&q=80&auto=format&fit=crop"},
          {year:"1820", title:"Vale do Paraíba", text:"O café domina o Vale, financia ferrovias e faz o Rio de Janeiro brilhar. Barões do café erguem palacetes.", img:"https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80&auto=format&fit=crop"},
          {year:"1880", title:"Oeste Paulista", text:"A mancha cafeeira avança para São Paulo. Imigração, ferrovias e a cidade de São Paulo nasce moderna.", img:"https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80&auto=format&fit=crop"},
          {year:"1930", title:"Crise e Queima", text:"Crise de 1929: sacas queimadas para segurar preço. O Estado regula o mercado e nasce o IBC.", img:"https://images.unsplash.com/photo-1498804103079-a6351b050096?w=800&q=80&auto=format&fit=crop"},
          {year:"Hoje", title:"Brasil Specialty", text:"Liderança mundial há 150 anos, agora com cafés especiais premiados e rastreabilidade total.", img:"https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&q=80&auto=format&fit=crop"},
        ].map(c=>`
        <div style="min-width:320px;flex:1;scroll-snap-align:start;border-right:1px solid rgba(44,26,14,0.06);background:white">
          <div style="height:190px;overflow:hidden"><img src="${c.img}" style="width:100%;height:100%;object-fit:cover"></div>
          <div style="padding:16px">
            <div class="badge">${c.year}</div>
            <h4 style="font-family:var(--font-display);margin:8px 0 6px">${c.title}</h4>
            <p style="font-size:13px;opacity:0.72;line-height:1.6">${c.text}</p>
          </div>
        </div>`).join('')}
      </div>
      <div style="padding:10px 14px;background:var(--cream);display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
        <span style="font-family:var(--font-mono);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.7">↔ Arraste para navegar na linha do tempo • Scroll lateral</span>
        <span class="pill">5 épocas • Parallax • Sépia → Cor no hover</span>
      </div>
    </div>
    <div class="grid-2" style="margin-top:18px">
      <div class="glass-card card-pad reveal hover-zoom" style="padding:0">
        <div style="height:280px;overflow:hidden;position:relative"><img src="https://images.unsplash.com/photo-1524350876685-274059332603?w=900&q=80&auto=format&fit=crop" style="width:100%;height:100%;object-fit:cover;filter:sepia(0.35)"><div style="position:absolute;inset:0;background:linear-gradient(to top, rgba(44,26,14,0.55), transparent)"></div><div style="position:absolute;left:14px;bottom:14px;color:white"><div class="badge" style="background:var(--gold);color:var(--brown-deep)">Retrato 1870</div><p style="margin:6px 0 0;font-family:var(--font-script);font-size:18px">“O café civilizou o Brasil.”</p></div></div>
        <div style="padding:14px"><p style="font-size:13px;opacity:0.72;line-height:1.6">Passe o mouse para colorir: técnica de colorização histórica recria tons quentes do século XIX. Ao fundo, mapa animado mostra a expansão das manchas cafeeiras.</p></div>
      </div>
      <div class="glass-card card-pad reveal">
        <h3 class="section-title" style="font-size:22px">O ciclo que ergueu um país</h3>
        <p style="opacity:0.76;line-height:1.7;font-size:14px">Entre 1800 e 1930, o café representou até 70% das exportações brasileiras. Financiou portos, ferrovias, imigração europeia e a urbanização do Sudeste. A “política do café com leite” definiu a República.</p>
        <div class="timeline" style="margin-top:14px">
          <div class="timeline-item"><strong>Pará → Maranhão → Rio → São Paulo → Paraná → Cerrado</strong><div style="opacity:0.6;font-size:12px">Rota de expansão em 200 anos</div></div>
          <div class="timeline-item"><strong>Imigração: 4 milhões de europeus</strong><div style="opacity:0.6;font-size:12px">Mão de obra e cultura cafeeira</div></div>
          <div class="timeline-item"><strong>Ferrovias: 9.000 km até 1910</strong><div style="opacity:0.6;font-size:12px">Café sobre trilhos até Santos</div></div>
        </div>
        <div class="quote">“Cada grão carrega trem, navio e esperança.”</div>
      </div>
    </div>
  </section>
  `
},
"03": {
  chapter:"Capítulo 1 — Origens e História",
  title:"Maior Produtor do Mundo Há Mais de 150 Anos",
  subtitle:"Números, globo 3D e o peso do Brasil na xícara global.",
  hero:"https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1600&q=80&auto=format&fit=crop",
  badge:"Página 03 — Liderança Mundial",
  content: `
  <div class="page-header page-section">
    <div class="chapter-label">Liderança Global</div>
    <h2>Maior Produtor <em>do Mundo</em> Há 150 Anos</h2>
    <p>O Brasil não só produz mais — produz melhor, mais diverso e mais sustentável a cada safra.</p>
  </div>
  <section class="page-section">
    <div class="grid-2">
      <div class="glass-card card-pad reveal" style="display:grid;place-items:center;min-height:380px;position:relative;overflow:hidden">
        <canvas id="globeCanvas" width="360" height="360" style="max-width:100%"></canvas>
        <div style="position:absolute;left:14px;bottom:14px;background:var(--brown-deep);color:var(--cream);padding:8px 12px;border-radius:999px;font-family:var(--font-mono);font-size:11px;letter-spacing:0.1em">● BRASIL • 38% da produção mundial</div>
      </div>
      <div style="display:grid;gap:14px">
        <div class="grid-2" style="grid-template-columns:1fr 1fr">
          <div class="glass-card card-pad reveal" style="text-align:center"><strong style="font-family:var(--font-mono);font-size:28px;color:var(--caramel)" data-count="3580000">0</strong><div style="font-family:var(--font-display);font-weight:600">toneladas / ano</div><small style="opacity:0.6">Safra 2024/25</small></div>
          <div class="glass-card card-pad reveal" style="text-align:center"><strong style="font-family:var(--font-mono);font-size:28px;color:var(--forest)" data-count="300000">0</strong><div style="font-family:var(--font-display);font-weight:600">propriedades</div><small style="opacity:0.6">Agricultura familiar</small></div>
          <div class="glass-card card-pad reveal" style="text-align:center"><strong style="font-family:var(--font-mono);font-size:28px" data-count="14">0</strong><div style="font-family:var(--font-display);font-weight:600">estados</div><small style="opacity:0.6">Do Acre à Bahia</small></div>
          <div class="glass-card card-pad reveal" style="text-align:center"><strong style="font-family:var(--font-mono);font-size:28px" data-count="8">0</strong><div style="font-family:var(--font-display);font-weight:600">milhões empregos</div><small style="opacity:0.6">Cadeia completa</small></div>
        </div>
        <div class="glass-card card-pad reveal">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><h4 style="margin:0;font-family:var(--font-display)">Exportações por país (sacas 60kg)</h4><span class="kicker">2024</span></div>
          <div style="display:grid;gap:10px">
            ${[
              {c:"Brasil", v:92, col:"var(--caramel)"},{c:"Vietnã", v:52, col:"#2D5A27"},{c:"Colômbia", v:28, col:"#6b3a1f"},{c:"Indonésia", v:18, col:"#D4AF37"}
            ].map(r=>`<div><div style="display:flex;justify-content:space-between;font-size:12px;opacity:0.7"><span>${r.c}</span><span>${r.v}M</span></div><div style="height:8px;background:rgba(44,26,14,0.08);border-radius:999px;overflow:hidden;margin-top:4px"><div style="height:100%;width:${r.v}%;background:${r.col};border-radius:999px;transition:width 1.2s"></div></div></div>`).join('')}
          </div>
        </div>
      </div>
    </div>
  </section>
  `
},
"04": {
  chapter:"Capítulo 2 — As Regiões Produtoras",
  title:"Os Territórios do Café: Do Cerrado à Serra",
  subtitle:"Clique no mapa e viaje por altitude, clima e solo.",
  hero:"https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=1600&q=80&auto=format&fit=crop",
  badge:"Página 04 — Mapa Interativo",
  content: `
  <div class="page-header page-section">
    <div class="chapter-label">Capítulo 2 — Regiões Produtoras</div>
    <h2>Os Territórios <em>do Café</em></h2>
    <p>Do Cerrado à Serra, cada terroir escreve uma caligrafia de sabor diferente na xícara.</p>
  </div>
  <section class="page-section">
    <div class="glass-card card-pad reveal" style="padding:0;overflow:hidden">
      <div style="display:grid;grid-template-columns:1.3fr 0.85fr">
        <div style="padding:14px;background:#fbf6ea">
          <svg viewBox="0 0 520 520" class="map-svg" id="brazilMap">
            <!-- Simplified Brazil shape with regions -->
            <rect width="520" height="520" rx="22" fill="#fff"/>
            <!-- Regions as abstract blocks -->
            <g id="regions">
              <path class="region" data-region="mg" d="M230 180 L340 180 L340 300 L230 300 Z" fill="#C68642" stroke="white" stroke-width="3"/>
              <path class="region" data-region="sp" d="M230 300 L320 300 L320 360 L230 360 Z" fill="#2D5A27" stroke="white" stroke-width="3"/>
              <path class="region" data-region="es" d="M340 260 L380 260 L380 320 L340 320 Z" fill="#D4AF37" stroke="white" stroke-width="3"/>
              <path class="region" data-region="ba" d="M300 120 L380 120 L380 200 L300 200 Z" fill="#6b3a1f" stroke="white" stroke-width="3"/>
              <path class="region" data-region="pr" d="M210 360 L310 360 L310 420 L210 420 Z" fill="#8b5a2b" stroke="white" stroke-width="3"/>
              <path class="region" data-region="cerrado" d="M180 200 L230 200 L230 300 L180 300 Z" fill="#EDE0C3" stroke="#C68642" stroke-width="2" stroke-dasharray="6 4"/>
            </g>
            <text x="285" y="242" text-anchor="middle" font-family="Space Mono" font-size="10" fill="white" font-weight="700">MINAS</text>
            <text x="275" y="333" text-anchor="middle" font-family="Space Mono" font-size="9" fill="white">SÃO PAULO</text>
            <text x="360" y="295" text-anchor="middle" font-size="8" fill="#2C1A0E" font-weight="700">ES</text>
            <text x="340" y="164" text-anchor="middle" font-size="9" fill="white" font-weight="700">BAHIA</text>
          </svg>
          <div style="display:flex;gap:8px;flex-wrap:wrap;padding:0 6px 6px">
            <span class="pill">Altitude 600-1.400m</span><span class="pill">14 estados</span><span class="pill">Radar comparativo</span>
          </div>
        </div>
        <div id="regionPanel" style="padding:18px;background:white;border-left:1px solid rgba(44,26,14,0.06)">
          <div class="badge">Selecione uma região</div>
          <h3 style="font-family:var(--font-display);margin:10px 0 6px">Toque no mapa</h3>
          <p style="opacity:0.68;line-height:1.65;font-size:13px">Cada região tem altitude, solo e clima únicos. Clique para ver fichas técnicas com radar de sabor, fotos aéreas e temperatura média.</p>
          <div class="divider"></div>
          <div style="display:grid;gap:8px;font-size:13px">
            <div style="display:flex;justify-content:space-between"><span>Temperatura ideal</span><strong>18°–24°C</strong></div>
            <div style="display:flex;justify-content:space-between"><span>Chuva anual</span><strong>1.200–1.800mm</strong></div>
            <div style="display:flex;justify-content:space-between"><span>Solo predominante</span><strong>Latossolo vermelho</strong></div>
          </div>
          <img src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80&auto=format&fit=crop" style="width:100%;height:140px;object-fit:cover;border-radius:12px;margin-top:12px">
        </div>
      </div>
    </div>
  </section>
  `
},
"05": {
  chapter:"Capítulo 2 — As Regiões Produtoras",
  title:"Minas Gerais — O Coração Cafeeiro",
  subtitle:"Sul de Minas, Cerrado e Chapada: três mundos, um estado.",
  hero:"https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1600&q=80&auto=format&fit=crop",
  badge:"Página 05 — Minas Gerais",
  content: `
  <div class="page-header page-section">
    <div class="chapter-label">Minas Gerais • 52% da produção nacional</div>
    <h2>Minas — <em>O Coração Cafeeiro</em></h2>
    <p>Três terroirs, três personalidades: do suave do Sul às notas achocolatadas do Cerrado.</p>
  </div>
  <section class="page-section">
    <div class="grid-3">
      ${[
        {t:"Sul de Minas", alt:"950-1.250m", nota:"Doce, caramelo, nozes, acidez cítrica", img:"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80&auto=format&fit=crop", temp:"19°C"},
        {t:"Cerrado Mineiro", alt:"800-1.100m", nota:"Chocolate, corpo aveludado, baixa acidez", img:"https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&q=80&auto=format&fit=crop", temp:"22°C"},
        {t:"Chapada de Minas", alt:"1.000-1.400m", nota:"Floral, frutado, complexo, vinhosidade", img:"https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&q=80&auto=format&fit=crop", temp:"18°C"},
      ].map(c=>`
      <div class="glass-card reveal" style="overflow:hidden">
        <div style="height:180px;overflow:hidden" class="hover-zoom"><img src="${c.img}" style="width:100%;height:100%;object-fit:cover"></div>
        <div style="padding:16px">
          <div style="display:flex;justify-content:space-between;align-items:center"><span class="badge">${c.alt}</span><span style="font-family:var(--font-mono);font-size:11px;opacity:0.6">${c.temp} média</span></div>
          <h4 style="font-family:var(--font-display);margin:10px 0 6px">${c.t}</h4>
          <p style="font-size:12px;opacity:0.7;line-height:1.6">${c.nota}</p>
          <div style="display:flex;gap:6px;margin-top:10px"><span class="pill">Denominação de Origem</span></div>
        </div>
      </div>`).join('')}
    </div>
    <div class="glass-card card-pad reveal" style="margin-top:18px;display:grid;grid-template-columns:1.1fr 0.9fr;gap:18px;align-items:center">
      <div>
        <div class="kicker">Voz do Produtor</div>
        <h3 style="font-family:var(--font-script);font-size:26px;color:var(--caramel);margin:6px 0">“Aqui o frio da serra faz o café dormir mais. E quem dorme bem, acorda com mais açúcar.”</h3>
        <p style="opacity:0.7;line-height:1.7;font-size:13px">— Dona Ilda, 62 anos, 3ª geração, Carmo de Minas. 1.180m de altitude, colheita seletiva, 87 pontos SCA.</p>
        <div style="display:flex;gap:8px;margin-top:10px"><span class="pill">Sul de Minas</span><span class="pill">Specialty</span><span class="pill">Fazenda Santa Inês</span></div>
      </div>
      <div style="border-radius:16px;overflow:hidden;position:relative;height:220px"><img src="https://images.unsplash.com/photo-1524350876685-274059332603?w=800&q=80&auto=format&fit=crop" style="width:100%;height:100%;object-fit:cover"><div style="position:absolute;inset:0;display:grid;place-items:center"><span class="btn-circle" style="width:64px;height:64px;background:white">▶</span></div></div>
    </div>
  </section>
  `
},
"06": {
  chapter:"Capítulo 2 — As Regiões Produtoras",
  title:"Diversidade de Terroir: Do Litoral ao Sertão",
  subtitle:"Mogiana, Conilon capixaba e Chapada Diamantina — extremos que se complementam.",
  hero:"https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1600&q=80&auto=format&fit=crop",
  badge:"Página 06 — SP • ES • BA",
  content: `
  <div class="page-header page-section">
    <div class="chapter-label">São Paulo • Espírito Santo • Bahia</div>
    <h2>Diversidade <em>de Terroir</em></h2>
    <p>Do litoral úmido do ES ao sertão de altitude da Bahia: o Brasil cabe em três xícaras.</p>
  </div>
  <section class="page-section">
    <div class="flip-grid">
      ${[
        {f:"Mogiana (SP)", b:"Corpo encorpado, doce, notas de nozes e caramelo.Altitude 700-1.000m. Berço do café paulista.", img:"https://images.unsplash.com/photo-1498804103079-a6351b050096?w=800&q=80&auto=format&fit=crop"},
        {f:"Conilon Capixaba (ES)", b:"Intenso, amendoado, crema espessa. Base de blends e espresso. 2º maior produtor nacional.", img:"https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?w=800&q=80&auto=format&fit=crop"},
        {f:"Chapada Diamantina (BA)", b:"1.100-1.400m, cafés de altitude especiais. Floral, frutado, acidez brilhante. Novo luxo brasileiro.", img:"https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&q=80&auto=format&fit=crop"},
      ].map(c=>`
      <div class="flip-card reveal">
        <div class="flip-inner">
          <div class="flip-front"><img src="${c.img}"><span class="label">${c.f}</span></div>
          <div class="flip-back"><h4 style="font-family:var(--font-display);margin:0 0 8px">${c.f}</h4><p style="font-size:13px;opacity:0.72;line-height:1.6">${c.b}</p><div style="margin-top:auto;display:flex;gap:6px"><span class="pill">Radar de sabor</span></div></div>
        </div>
      </div>`).join('')}
    </div>
    <div class="glass-card card-pad reveal" style="margin-top:18px">
      <h4 style="font-family:var(--font-display);margin:0 0 10px">Comparativo sensorial — radar animado</h4>
      <div style="display:grid;grid-template-columns:340px 1fr;gap:18px;align-items:center">
        <div class="radar-wrap"><svg viewBox="0 0 200 200" class="radar-svg"><g fill="none" stroke="rgba(44,26,14,0.08)" stroke-width="1"><polygon points="100,20 180,70 155,155 45,155 20,70"/><polygon points="100,45 160,80 142,135 58,135 40,80"/><polygon points="100,70 140,90 130,115 70,115 60,90"/></g><polygon points="100,35 162,78 138,128 78,142 42,78" fill="rgba(198,134,66,0.22)" stroke="#C68642" stroke-width="2"/><polygon points="100,55 145,85 128,122 68,118 52,88" fill="rgba(45,90,39,0.18)" stroke="#2D5A27" stroke-width="2" stroke-dasharray="6 4"/></svg><div style="position:absolute;left:50%;top:14px;transform:translateX(-50%);font-family:var(--font-mono);font-size:9px;opacity:0.5">ACIDEZ</div></div>
        <div style="display:grid;gap:10px">
          <div style="display:flex;align-items:center;gap:8px"><span style="width:12px;height:12px;background:var(--caramel);border-radius:2px"></span><span style="font-size:13px">Mogiana — equilíbrio e doçura</span></div>
          <div style="display:flex;align-items:center;gap:8px"><span style="width:12px;height:12px;background:var(--forest);border-radius:2px"></span><span style="font-size:13px">Conilon — corpo e intensidade</span></div>
          <p style="font-size:13px;opacity:0.68;line-height:1.6;margin-top:6px">Cada eixo representa corpo, acidez, doçura, aroma e finalização. O desenho do radar é a assinatura do território.</p>
        </div>
      </div>
    </div>
  </section>
  `
},
"07": {
  chapter:"Capítulo 3 — As Variedades do Café",
  title:"Duas Almas, Infinitas Possibilidades",
  subtitle:"Arábica vs Robusta (Conilon) — o dueto que move o mundo.",
  hero:"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=80&auto=format&fit=crop",
  badge:"Página 07 — Arábica × Conilon",
  content: `
  <div class="page-header page-section">
    <div class="chapter-label">Variedades • Café verde</div>
    <h2>Duas Almas, <em>Infinitas Possibilidades</em></h2>
    <p>Arábica: altitude, doçura e acidez. Conilon: força, crema e cafeína. O Brasil domina ambos.</p>
  </div>
  <section class="page-section">
    <div class="split-screen reveal">
      <div class="split-half" style="background:#2C1A0E">
        <img src="https://images.unsplash.com/photo-1511920170033-f8396924c348?w=900&q=80&auto=format&fit=crop" alt="Arábica">
        <div class="badge" style="background:var(--cream);color:var(--brown-deep);width:max-content">Arábica • 70% da produção</div>
        <h3 style="font-family:var(--font-display);font-size:28px;margin:12px 0 6px">Arábica</h3>
        <p style="opacity:0.92;line-height:1.6;font-size:14px">Grão oval, fenda em S. 0,8–1,4% cafeína. Cultivo acima de 600m. Aroma fino, acidez brilhante, doçura natural.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><span class="pill" style="background:rgba(255,255,255,0.14);color:white;border-color:rgba(255,255,255,0.2)">Bourbon • Catuaí</span><span class="pill" style="background:rgba(255,255,255,0.14);color:white">Mundo Novo</span></div>
      </div>
      <div class="split-half" style="background:#0D0A08">
        <img src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=900&q=80&auto=format&fit=crop" alt="Conilon">
        <div class="badge" style="background:var(--gold);color:var(--brown-deep);width:max-content">Robusta / Conilon • 30%</div>
        <h3 style="font-family:var(--font-display);font-size:28px;margin:12px 0 6px">Conilon</h3>
        <p style="opacity:0.92;line-height:1.6;font-size:14px">Grão redondo, fenda reta. 1,7–4% cafeína. Resistente, intenso, crema generosa. Base de espresso e solúvel.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><span class="pill" style="background:rgba(255,255,255,0.14);color:white">ES • Rondônia</span><span class="pill" style="background:rgba(255,255,255,0.14);color:white">Bahia</span></div>
      </div>
    </div>
    <div class="grid-2" style="margin-top:18px">
      <div class="glass-card card-pad reveal">
        <h4 style="font-family:var(--font-display);margin:0 0 8px">Diferenças visuais — zoom microscópico</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div style="text-align:center"><div style="height:120px;border-radius:14px;background:radial-gradient(circle at 30% 30%, #EDE0C3, #C68642);display:grid;place-items:center;font-size:42px">⟡</div><small style="font-family:var(--font-mono);opacity:0.6">Arábica • oval + S</small></div>
          <div style="text-align:center"><div style="height:120px;border-radius:14px;background:radial-gradient(circle at 30% 30%, #6b3a1f, #2C1A0E);display:grid;place-items:center;color:white;font-size:42px">●</div><small style="font-family:var(--font-mono);opacity:0.6">Conilon • redondo</small></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px;font-size:12px">
          <div style="background:var(--cream);padding:10px;border-radius:12px"><strong>Cafeína</strong><div>Arábica 1,1% • Conilon 2,4%</div></div>
          <div style="background:var(--cream);padding:10px;border-radius:12px"><strong>Altitude</strong><div>600–1.400m vs 0–700m</div></div>
        </div>
      </div>
      <div class="glass-card card-pad reveal">
        <h4 style="font-family:var(--font-display);margin:0 0 8px">Radar comparativo</h4>
        <div style="display:flex;gap:12px;align-items:center">
          <div style="flex:1"><svg viewBox="0 0 200 200" style="width:100%;height:220px"><g fill="none" stroke="rgba(44,26,14,0.08)"><polygon points="100,20 180,70 155,155 45,155 20,70"/><polygon points="100,45 160,80 142,135 58,135 40,80"/></g><polygon points="100,30 165,72 140,130 70,148 38,78" fill="rgba(198,134,66,0.22)" stroke="#C68642" stroke-width="2"/><polygon points="100,60 150,78 135,118 72,118 58,82" fill="rgba(13,10,8,0.12)" stroke="#0D0A08" stroke-width="2" stroke-dasharray="5 4"/></svg></div>
          <div style="flex:1;display:grid;gap:8px;font-size:12px"><div><strong>Arábica</strong> — acidez, aroma, doçura elevados</div><div><strong>Conilon</strong> — corpo, amargor e cafeína superiores</div><span class="pill">SCA: arábica 80+ specialty</span></div>
        </div>
      </div>
    </div>
  </section>
  `
},
"08": {
  chapter:"Capítulo 3 — As Variedades do Café",
  title:"Bourbon, Catuaí, Mundo Novo e Além",
  subtitle:"A árvore genealógica que o Brasil desenhou com ciência e paciência.",
  hero:"https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?w=1600&q=80&auto=format&fit=crop",
  badge:"Página 08 — Cultivares Brasileiras",
  content: `
  <div class="page-header page-section">
    <div class="chapter-label">Cultivares • Herança Genética</div>
    <h2>Bourbon, Catuaí, <em>Mundo Novo</em> e Além</h2>
    <p>Cinco estrelas nascidas do cruzamento entre produtividade e xícara inesquecível.</p>
  </div>
  <section class="page-section">
    <div class="grid-3">
      ${[
        {t:"Bourbon Vermelho", d:"Ilha Bourbon, 1700s. Doçura extrema, acidez cítrica, corpo sedoso. Pai de muitos.", img:"https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&q=80&auto=format&fit=crop"},
        {t:"Bourbon Amarelo", d:"Mutação natural brasileira. Notas de mel, caramelo, baixa acidez. Queridinho do specialty.", img:"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80&auto=format&fit=crop"},
        {t:"Mundo Novo", d:"Bourbon x Sumatra. Porte alto, resistente, produtivo. Base da cafeicultura nacional.", img:"https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80&auto=format&fit=crop"},
        {t:"Catuaí Vermelho/Amarelo", d:"Mundo Novo x Caturra. Mais plantada do Brasil. Equilíbrio total e maturação uniforme.", img:"https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&q=80&auto=format&fit=crop"},
        {t:"Gesha / Geisha", d:"Panamá → Brasil. Floral intenso, jasmim, bergamota. Raridade vendida a US$ 10.000/saca.", img:"https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80&auto=format&fit=crop"},
        {t:"Catucaí", d:"Icatu x Catuaí. Híbrido resistente à ferrugem. Produtivo e de ótima bebida.", img:"https://images.unsplash.com/photo-1524350876685-274059332603?w=800&q=80&auto=format&fit=crop"},
      ].map(c=>`
      <div class="glass-card reveal" style="overflow:hidden">
        <div style="height:150px;overflow:hidden" class="hover-zoom"><img src="${c.img}" style="width:100%;height:100%;object-fit:cover"></div>
        <div style="padding:14px"><h4 style="font-family:var(--font-display);margin:0 0 6px">${c.t}</h4><p style="font-size:12px;opacity:0.68;line-height:1.6">${c.d}</p></div>
      </div>`).join('')}
    </div>
    <div class="glass-card card-pad reveal" style="margin-top:18px">
      <h4 style="font-family:var(--font-display);margin:0 0 10px">Árvore genealógica • animação de crescimento</h4>
      <div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap;font-family:var(--font-mono);font-size:11px;align-items:center">
        <span class="pill">Typica</span> → <span class="pill">Bourbon</span> ↔ <span class="pill">Sumatra</span> → <span class="pill" style="background:var(--caramel);color:white">Mundo Novo</span> → <span class="pill">Caturra</span> → <span class="pill" style="background:var(--brown-deep);color:white">Catuaí</span> → <span class="pill">Icatu</span> → <span class="pill" style="background:var(--gold)">Catucaí</span>
      </div>
      <div style="height:1px;background:linear-gradient(to right, transparent, var(--gold), transparent);margin:12px 0"></div>
      <p style="text-align:center;opacity:0.6;font-size:12px">Cada cruzamento busca resistência + qualidade. O Brasil é laboratório genético a céu aberto.</p>
    </div>
  </section>
  `
},
"09": {
  chapter:"Capítulo 4 — O Cultivo",
  title:"Antes do Grão, Vem a Terra",
  subtitle:"Preparo de solo, viveiro e o primeiro suspiro da muda.",
  hero:"https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1600&q=80&auto=format&fit=crop",
  badge:"Página 09 — Solo e Plantio",
  content: `
  <div class="page-header page-section">
    <div class="chapter-label">Cultivo • Raízes</div>
    <h2>Antes do Grão, <em>Vem a Terra</em></h2>
    <p>Análise de solo, pH e espaçamento definem se o cafezal viverá 20 ou 30 anos produtivos.</p>
  </div>
  <section class="page-section">
    <div class="grid-2">
      <div class="glass-card card-pad reveal">
        <h3 class="section-title" style="font-size:20px">Análise de solo — infográfico</h3>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:12px 0">
          <div style="text-align:center;background:var(--cream);padding:12px;border-radius:14px"><strong style="font-size:22px">5,5</strong><div style="font-size:11px;opacity:0.6;letter-spacing:0.08em;text-transform:uppercase">pH ideal</div></div>
          <div style="text-align:center;background:var(--cream);padding:12px;border-radius:14px"><strong style="font-size:22px">3%</strong><div style="font-size:11px;opacity:0.6;letter-spacing:0.08em;text-transform:uppercase">Matéria orgânica</div></div>
          <div style="text-align:center;background:var(--cream);padding:12px;border-radius:14px"><strong style="font-size:22px">2,0×0,6</strong><div style="font-size:11px;opacity:0.6;letter-spacing:0.08em;text-transform:uppercase">Espaçamento (m)</div></div>
        </div>
        <div style="position:relative;height:180px;background:linear-gradient(to bottom, #EDE0C3 0%, #8b5a2b 60%, #2C1A0E 100%);border-radius:16px;overflow:hidden;display:grid;place-items:center">
          <svg width="120" height="150" viewBox="0 0 120 150"><path d="M60 10 Q58 40 60 70 Q62 100 60 130" stroke="#2D5A27" stroke-width="3" fill="none"/><g fill="#2D5A27" opacity="0.9"><circle cx="60" cy="18" r="10"/><circle cx="48" cy="26" r="8"/><circle cx="72" cy="24" r="7"/></g><g stroke="#C68642" stroke-width="1.2" opacity="0.8"><path d="M60 70 L46 92"/><path d="M60 80 L74 100"/><path d="M60 95 L44 118"/><path d="M60 105 L76 128"/></g></svg>
          <div style="position:absolute;left:12px;bottom:10px;background:rgba(255,255,255,0.92);padding:6px 10px;border-radius:999px;font-family:var(--font-mono);font-size:10px">Raiz pivotante • até 2m</div>
        </div>
      </div>
      <div class="glass-card card-pad reveal">
        <h3 class="section-title" style="font-size:20px">Viveiro — timeline animada</h3>
        <div class="timeline" style="margin-top:12px">
          <div class="timeline-item"><strong>Semente → Tubete (0-30 dias)</strong><div style="opacity:0.6;font-size:12px">Germinação a 25°C, sombreamento 50%</div></div>
          <div class="timeline-item"><strong>Viveiro (30-150 dias)</strong><div style="opacity:0.6;font-size:12px">Mudas seminais vs clonais (estacas)</div></div>
          <div class="timeline-item"><strong>Campo (150 dias+)</strong><div style="opacity:0.6;font-size:12px">Coveamento 40×40×40cm, adubação de base</div></div>
          <div class="timeline-item"><strong>Adensado vs Tradicional</strong><div style="opacity:0.6;font-size:12px">2.500 a 6.000 plantas / ha</div></div>
        </div>
        <div style="margin-top:14px;border-radius:14px;overflow:hidden;height:140px"><img src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=900&q=80&auto=format&fit=crop" style="width:100%;height:100%;object-fit:cover"></div>
      </div>
    </div>
  </section>
  `
},
"10": {
  chapter:"Capítulo 4 — O Cultivo",
  title:"A Santíssima Trindade do Café de Qualidade",
  subtitle:"Clima, altitude e solo — o terroir em três dimensões.",
  hero:"https://images.unsplash.com/photo-1464822759844-d150baec0494?w=1600&q=80&auto=format&fit=crop",
  badge:"Página 10 — Terroir",
  content: `
  <div class="page-header page-section">
    <div class="chapter-label">Terroir • Santíssima Trindade</div>
    <h2>A Santíssima Trindade <em>da Qualidade</em></h2>
    <p>18°–24°C, 1.200–1.800mm de chuva e o latossolo vermelho: a fórmula da doçura.</p>
  </div>
  <section class="page-section">
    <div class="glass-card card-pad reveal" style="padding:0;overflow:hidden">
      <div style="display:grid;grid-template-columns:1fr 380px">
        <div style="height:380px;position:relative;background:linear-gradient(to top, #2D5A27 0%, #8b9a5b 30%, #EDE0C3 60%, #a8c6e0 100%);display:grid;place-items:center;overflow:hidden">
          <svg width="260" height="320" viewBox="0 0 260 320"><path d="M10 300 L130 60 L250 300 Z" fill="rgba(44,26,14,0.08)" stroke="white" stroke-width="2"/><path d="M60 300 L130 140 L200 300 Z" fill="rgba(255,255,255,0.5)"/><text x="130" y="90" text-anchor="middle" font-family="Space Mono" font-size="10" fill="#2C1A0E">1.400m • Chapada</text><text x="130" y="150" text-anchor="middle" font-family="Space Mono" font-size="10" fill="#2C1A0E">1.000m • Sul de Minas</text><text x="130" y="220" text-anchor="middle" font-family="Space Mono" font-size="10" fill="#2C1A0E">600m • Mogiana</text><text x="130" y="270" text-anchor="middle" font-family="Space Mono" font-size="9" fill="white">Conilon • 0-700m</text></svg>
          <div style="position:absolute;right:14px;top:14px;background:rgba(250,247,242,0.92);padding:8px 10px;border-radius:12px;font-size:11px">Cada 100m ↑ = -0,6°C</div>
        </div>
        <div style="padding:16px;background:white">
          <h4 style="font-family:var(--font-display);margin:0 0 8px">Como cada fator molda o sabor</h4>
          <div style="display:grid;gap:10px">
            <div style="background:var(--cream);padding:12px;border-radius:12px"><strong>Altitude ↑</strong><div style="opacity:0.7;font-size:12px">Maturação lenta → mais açúcares → acidez brilhante</div></div>
            <div style="background:var(--cream);padding:12px;border-radius:12px"><strong>Chuva bem distribuída</strong><div style="opacity:0.7;font-size:12px">Florada uniforme → cerejas no mesmo ponto → lote homogêneo</div></div>
            <div style="background:var(--cream);padding:12px;border-radius:12px"><strong>Latossolo drenado</strong><div style="opacity:0.7;font-size:12px">Raiz respira, nutriente circula, planta não encharca</div></div>
          </div>
          <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><span class="pill">Mapa de calor interativo</span><span class="pill">18–24°C</span></div>
        </div>
      </div>
    </div>
  </section>
  `
},
"11": {
  chapter:"Capítulo 4 — O Cultivo",
  title:"O Cuidado Diário Que Está na Sua Xícara",
  subtitle:"Podas, adubação, irrigação e manejo integrado — o calendário que não para.",
  hero:"https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1600&q=80&auto=format&fit=crop",
  badge:"Página 11 — Manejo",
  content: `
  <div class="page-header page-section">
    <div class="chapter-label">Manejo • Tratos Culturais</div>
    <h2>O Cuidado Diário <em>na Sua Xícara</em></h2>
    <p>Podar, nutrir, irrigar e proteger — 365 dias de zêlo para 30 segundos de extração.</p>
  </div>
  <section class="page-section">
    <div class="grid-2">
      <div class="glass-card card-pad reveal">
        <h3 class="section-title" style="font-size:20px">Calendário agrícola rotativo</h3>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0">
          ${["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"].map((m,i)=>`<div style="text-align:center;padding:10px 4px;border-radius:12px;background:${i>=4 && i<=7 ? 'var(--caramel)' : i>=9 && i<=10 ? 'var(--forest)' : 'white'};color:${i>=4 && i<=7 || i>=9 && i<=10 ? 'white' : 'inherit'};border:1px solid rgba(44,26,14,0.06)"><div style="font-family:var(--font-mono);font-size:11px">${m}</div><div style="font-size:10px;opacity:0.7">${i>=4 && i<=7 ? 'Colheita' : i>=9 && i<=10 ? 'Florada' : 'Manejo'}</div></div>`).join('')}
        </div>
        <div style="display:grid;gap:8px;font-size:13px">
          <div style="display:flex;gap:10px;align-items:center"><span style="width:28px;height:28px;display:grid;place-items:center;background:var(--cream);border-radius:50%">✂</span><span><strong>Podas:</strong> esqueletamento, recepa, desponte</span></div>
          <div style="display:flex;gap:10px;align-items:center"><span style="width:28px;height:28px;display:grid;place-items:center;background:var(--cream);border-radius:50%">💧</span><span><strong>Irrigação:</strong> gotejo, pivot, aspersão</span></div>
          <div style="display:flex;gap:10px;align-items:center"><span style="width:28px;height:28px;display:grid;place-items:center;background:var(--cream);border-radius:50%">🛡</span><span><strong>MIP:</strong> broca e ferrugem com controle biológico</span></div>
        </div>
      </div>
      <div class="glass-card card-pad reveal" style="padding:0;overflow:hidden">
        <img src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=900&q=80&auto=format&fit=crop" style="width:100%;height:220px;object-fit:cover">
        <div style="padding:14px"><h4 style="font-family:var(--font-display);margin:0 0 6px">Crescimento por ano</h4><div style="height:8px;background:rgba(44,26,14,0.08);border-radius:999px;overflow:hidden;display:flex"><span style="flex:1;background:var(--caramel)"></span><span style="flex:1.6;background:var(--forest)"></span><span style="flex:2.2;background:var(--brown-deep)"></span></div><div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:10px;opacity:0.6;margin-top:4px"><span>Ano 1 • Formação</span><span>Ano 2 • 1ª carga</span><span>Ano 3+ • Plena</span></div></div>
      </div>
    </div>
  </section>
  `
},
"12": {
  chapter:"Capítulo 5 — A Florada e o Fruto",
  title:"Quando o Cafezal Vira Neve: A Florada Brasileira",
  subtitle:"2 a 3 dias de branco perfumado que decidem a safra inteira.",
  hero:"https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1600&q=80&auto=format&fit=crop",
  badge:"Página 12 — Florada",
  content: `
  <div class="page-header page-section">
    <div class="chapter-label">Florada • Espetáculo Branco</div>
    <h2>Quando o Cafezal <em>Vira Neve</em></h2>
    <p>Flores de jasmim que abrem ao amanhecer e perfumam quilômetros de cerrado.</p>
  </div>
  <section class="page-section">
    <div class="glass-card reveal" style="padding:0;overflow:hidden;position:relative;height:420px;display:grid;place-items:center;color:white">
      <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=80&auto=format&fit=crop" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
      <div style="position:absolute;inset:0;background:linear-gradient(to top, rgba(13,10,8,0.55), rgba(13,10,8,0.15))"></div>
      <div style="position:relative;text-align:center;padding:18px;max-width:760px">
        <div class="badge" style="background:rgba(255,255,255,0.18);backdrop-filter:blur(8px)">Duração: 2–3 dias • Gatilho: chuva após seca</div>
        <h3 style="font-family:var(--font-script);font-size:32px;margin:12px 0 8px">“Branco que cheira a jasmim, branco que promete cereja.”</h3>
        <p style="opacity:0.9;line-height:1.6">A florada uniforme garante maturação uniforme. Sem chuva na hora certa, a flor aborta e a safra sente.</p>
        <div style="margin-top:14px;display:flex;justify-content:center;gap:8px;flex-wrap:wrap"><span class="pill" style="background:rgba(255,255,255,0.14);color:white">Time-lapse SVG</span><span class="pill" style="background:rgba(255,255,255,0.14);color:white">Aroma: jasmim</span></div>
      </div>
      <div style="position:absolute;left:50%;bottom:18px;transform:translateX(-50%);display:flex;gap:6px">
        <span style="width:40px;height:4px;background:white;border-radius:999px;opacity:0.9"></span><span style="width:12px;height:4px;background:white;border-radius:999px;opacity:0.5"></span><span style="width:12px;height:4px;background:white;border-radius:999px;opacity:0.5"></span>
      </div>
    </div>
    <div class="grid-3" style="margin-top:18px">
      <div class="glass-card card-pad reveal"><h4 style="font-family:var(--font-display);margin:0 0 6px">Condição de gatilho</h4><p style="font-size:13px;opacity:0.68;line-height:1.6">20–30 dias de déficit hídrico + chuva de 10–15mm + queda de temperatura noturna.</p></div>
      <div class="glass-card card-pad reveal"><h4 style="font-family:var(--font-display);margin:0 0 6px">Polinização</h4><p style="font-size:13px;opacity:0.68;line-height:1.6">Abelhas fazem 40% do trabalho. Cafezal com mata nativa produz 20% mais.</p></div>
      <div class="glass-card card-pad reveal" style="background:var(--brown-deep);color:var(--cream)"><h4 style="font-family:var(--font-display);margin:0 0 6px;color:var(--gold)">Poema da florada</h4><p style="font-family:var(--font-script);font-size:16px;line-height:1.5;margin:0">“Num só amanhecer, o verde se rende ao branco — e o futuro da xícara se decide em silêncio.”</p></div>
    </div>
  </section>
  `
},
"13": {
  chapter:"Capítulo 5 — A Florada e o Fruto",
  title:"Do Botão Verde à Cereja Vermelha: 8 Meses de Paciência",
  subtitle:"A metamorfose química que cria açúcares, ácidos e perfume.",
  hero:"https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1600&q=80&auto=format&fit=crop",
  badge:"Página 13 — Maturação",
  content: `
  <div class="page-header page-section">
    <div class="chapter-label">Fruto • 8 Meses</div>
    <h2>Do Botão Verde <em>à Cereja Vermelha</em></h2>
    <p>Verde → amarelo → laranja → vermelho cereja → passa. Cada cor, um sabor diferente.</p>
  </div>
  <section class="page-section">
    <div class="glass-card card-pad reveal">
      <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px">
        ${[
          {c:"#7a9a3a", l:"Chumbinho", t:"2 meses"},
          {c:"#b8c76a", l:"Verde claro", t:"3 meses"},
          {c:"#e8d84a", l:"Amarelo", t:"5 meses"},
          {c:"#e08a3a", l:"Laranja", t:"6 meses"},
          {c:"#c0392b", l:"Cereja", t:"7-8 meses"},
          {c:"#4a1e12", l:"Passa", t:"9 meses"},
        ].map(s=>`
        <div style="text-align:center">
          <div style="height:86px;border-radius:16px;background:${s.c};display:grid;place-items:center;position:relative;overflow:hidden"><span style="width:44px;height:52px;background:rgba(255,255,255,0.18);border-radius:50% / 60%;display:block;border:1px solid rgba(255,255,255,0.3)"></span></div>
          <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:0.08em;text-transform:uppercase;margin-top:6px;opacity:0.7">${s.l}</div>
          <div style="font-size:11px;opacity:0.6">${s.t}</div>
        </div>`).join('')}
      </div>
      <div style="height:6px;background:linear-gradient(to right, #7a9a3a, #e8d84a, #c0392b, #4a1e12);border-radius:999px;margin:16px 0"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
        <div style="background:var(--cream);padding:12px;border-radius:14px"><strong>Química em evolução</strong><div style="opacity:0.68;font-size:12px;line-height:1.6;margin-top:4px">Açúcares de 6% → 12%, acidez málica cai, compostos aromáticos (furano, pirazina) se formam. Altitude fria = evolução mais lenta = mais complexidade.</div></div>
        <div style="background:var(--brown-deep);color:var(--cream);padding:12px;border-radius:14px"><strong style="color:var(--gold)">Ponto ideal de colheita</strong><div style="opacity:0.82;font-size:12px;line-height:1.6;margin-top:4px">Cereja: máximo de açúcar e mucilagem doce. Verde = adstringente. Passa = fermentado. O specialty colhe só cereja.</div></div>
      </div>
    </div>
  </section>
  `
},
"14": {
  chapter:"Capítulo 6 — A Colheita",
  title:"Derriça, Repasse e Seletiva: A Arte de Colher o Momento Certo",
  subtitle:"Três métodos, três destinos para a xícara.",
  hero:"https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1600&q=80&auto=format&fit=crop",
  badge:"Página 14 — Colheita",
  content: `
  <div class="page-header page-section">
    <div class="chapter-label">Colheita • Métodos</div>
    <h2>Derriça, Repasse <em>e Seletiva</em></h2>
    <p>A mão que colhe decide a nota que você vai provar.</p>
  </div>
  <section class="page-section">
    <div class="grid-3">
      ${[
        {t:"Derriça Manual", d:"Pano no chão, ramos puxados. Colhe tudo de uma vez: verde, cereja e passa. Rápido e barato.", img:"https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80&auto=format&fit=crop", pros:"Custo baixo", cons:"Qualidade mista"},
        {t:"Seletiva (Specialty)", d:"Apenas cerejas maduras, colhidas a dedo ou com derriçadeira seletiva. Até 5 passadas por safra.", img:"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80&auto=format&fit=crop", pros:"Nota 85+ SCA", cons:"Mão de obra intensiva"},
        {t:"Mecanizada", d:"Colhedora vibra o ramo lateralmente. 3 ha/hora. Ideal para Cerrado plano.", img:"https://images.unsplash.com/photo-1524350876685-274059332603?w=800&q=80&auto=format&fit=crop", pros:"80-100 trabalhadores/dia", cons:"Requer terreno plano"},
      ].map(c=>`
      <div class="glass-card reveal" style="overflow:hidden;display:flex;flex-direction:column">
        <div style="height:160px;overflow:hidden"><img src="${c.img}" style="width:100%;height:100%;object-fit:cover"></div>
        <div style="padding:14px;flex:1">
          <h4 style="font-family:var(--font-display);margin:0 0 6px">${c.t}</h4>
          <p style="font-size:12px;opacity:0.68;line-height:1.6">${c.d}</p>
          <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap"><span class="pill">✓ ${c.pros}</span><span class="pill">• ${c.cons}</span></div>
        </div>
      </div>`).join('')}
    </div>
    <div class="glass-card card-pad reveal" style="margin-top:18px">
      <h4 style="font-family:var(--font-display);margin:0 0 8px">Impacto na xícara — gráfico custo × qualidade</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;text-align:center">
        <div style="background:var(--cream);padding:14px;border-radius:14px"><div style="font-family:var(--font-mono);font-size:22px">R$</div><div style="font-size:11px;opacity:0.6">Derriça • menor custo</div><div style="height:6px;background:var(--caramel);border-radius:999px;margin-top:8px;width:40%"></div></div>
        <div style="background:var(--brown-deep);color:white;padding:14px;border-radius:14px"><div style="font-family:var(--font-mono);font-size:22px">R$$$</div><div style="font-size:11px;opacity:0.7">Seletiva • maior valor</div><div style="height:6px;background:var(--gold);border-radius:999px;margin-top:8px;width:92%"></div></div>
        <div style="background:var(--forest);color:white;padding:14px;border-radius:14px"><div style="font-family:var(--font-mono);font-size:22px">R$$</div><div style="font-size:11px;opacity:0.7">Mecanizada • eficiência</div><div style="height:6px;background:white;border-radius:999px;margin-top:8px;width:68%"></div></div>
      </div>
    </div>
  </section>
  `
},
"15": {
  chapter:"Capítulo 6 — A Colheita",
  title:"Tecnologia Brasileira: Colhendo 3 Hectares por Hora",
  subtitle:"A colhedora que vibra e a precisão que só o Cerrado permite.",
  hero:"https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1600&q=80&auto=format&fit=crop",
  badge:"Página 15 — Mecanização",
  content: `
  <div class="page-header page-section">
    <div class="chapter-label">Mecanizada • 80-100 trabalhadores/dia</div>
    <h2>Tecnologia Brasileira <em>3 ha/hora</em></h2>
    <p>Vibração lateral, recolhimento a vácuo e seleção a laser — a fábrica sobre rodas.</p>
  </div>
  <section class="page-section">
    <div class="grid-2">
      <div class="glass-card card-pad reveal" style="padding:0;overflow:hidden">
        <div style="height:240px;background:var(--black-coffee);position:relative;display:grid;place-items:center;overflow:hidden">
          <img src="https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=900&q=80&auto=format&fit=crop" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.55">
          <div style="position:relative;background:rgba(250,247,242,0.92);padding:14px;border-radius:14px;display:flex;gap:10px;align-items:center">
            <span class="btn-circle" style="width:44px;height:44px;background:var(--caramel);color:white">⚙</span>
            <div><strong style="font-family:var(--font-display)">Colhedora automotriz</strong><div style="font-size:11px;opacity:0.6">Vibração 16–20 Hz • Hastes de fibra</div></div>
          </div>
        </div>
        <div style="padding:14px">
          <h4 style="font-family:var(--font-display);margin:0 0 6px">Como funciona</h4>
          <p style="font-size:13px;opacity:0.68;line-height:1.6">Cilindros com varetas vibram o ramo lateralmente. O fruto maduro se desprende por inércia; o verde permanece. Recolhimento por esteiras e ventiladores separa folhas.</p>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><span class="pill">Cerrado plano</span><span class="pill">Eficiência 92%</span><span class="pill">GPS + piloto automático</span></div>
        </div>
      </div>
      <div class="glass-card card-pad reveal">
        <h4 style="font-family:var(--font-display);margin:0 0 8px">Linha do tempo da mecanização</h4>
        <div class="timeline">
          <div class="timeline-item"><strong>1974 — Primeira derriçadeira</strong><div style="opacity:0.6;font-size:12px">Jacto inicia testes no Paraná</div></div>
          <div class="timeline-item"><strong>1990 — Colhedora automotriz</strong><div style="opacity:0.6;font-size:12px">Massey e John Deere chegam ao Cerrado</div></div>
          <div class="timeline-item"><strong>Hoje — Agricultura 4.0</strong><div style="opacity:0.6;font-size:12px">Sensores de maturação, mapeamento por talhão</div></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px">
          <div style="text-align:center;background:var(--cream);padding:12px;border-radius:12px"><strong style="font-family:var(--font-mono);font-size:18px">1 ↔ 90</strong><div style="font-size:11px;opacity:0.6">1 máquina = 90 pessoas/dia</div></div>
          <div style="text-align:center;background:var(--brown-deep);color:white;padding:12px;border-radius:12px"><strong style="font-family:var(--font-mono);font-size:18px">3 ha/h</strong><div style="font-size:11px;opacity:0.7">Produtividade média</div></div>
        </div>
      </div>
    </div>
  </section>
  `
},
"16": {
  chapter:"Capítulo 7 — O Processamento",
  title:"O Método Mais Antigo: O Sol Como Secador",
  subtitle:"Via seca — café natural: terreiro, tempo e paciência ancestral.",
  hero:"https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1600&q=80&auto=format&fit=crop",
  badge:"Página 16 — Via Seca • Natural",
  content: `
  <div class="page-header page-section">
    <div class="chapter-label">Processamento • Via Seca</div>
    <h2>O Sol <em>Como Secador</em></h2>
    <p>20 a 40 dias de sol, revolvimento e o perfume de fruta seca que só o natural tem.</p>
  </div>
  <section class="page-section">
    <div class="grid-2">
      <div class="glass-card card-pad reveal">
        <h4 style="font-family:var(--font-display);margin:0 0 8px">Passo a passo animado</h4>
        <div style="display:flex;align-items:center;gap:8px;overflow:auto;padding:8px 0">
          ${["Colheita","Limpeza","Terreiro","Secagem","Descasque"].map((s,i)=>`<div style="text-align:center;min-width:90px"><div style="width:54px;height:54px;border-radius:50%;background:${i===2?'var(--caramel)':'var(--cream)'};color:${i===2?'white':'inherit'};display:grid;place-items:center;margin:0 auto;font-weight:700">${i+1}</div><div style="font-family:var(--font-mono);font-size:10px;margin-top:6px">${s}</div></div>${i<4?'<span style="opacity:0.3">→</span>':''}`).join('')}
        </div>
        <div style="background:var(--cream);padding:12px;border-radius:12px;margin-top:10px;display:grid;gap:6px;font-size:13px">
          <div style="display:flex;justify-content:space-between"><span>Umidade inicial</span><strong>60–70%</strong></div>
          <div style="display:flex;justify-content:space-between"><span>Umidade final</span><strong>11–12%</strong></div>
          <div style="display:flex;justify-content:space-between"><span>Tempo</span><strong>20–40 dias</strong></div>
        </div>
        <p style="font-size:12px;opacity:0.68;line-height:1.6;margin-top:10px">Perfil: frutado, doce, encorpado, notas de vinho. Terreiros: cimento, terra batida, suspenso (africano) e mecânico.</p>
      </div>
      <div class="glass-card reveal" style="padding:0;overflow:hidden">
        <img src="https://images.unsplash.com/photo-1498804103079-a6351b050096?w=900&q=80&auto=format&fit=crop" style="width:100%;height:240px;object-fit:cover">
        <div style="padding:12px"><div class="kicker">Galeria • Parallax</div><h4 style="font-family:var(--font-display);margin:4px 0 6px">Terreiros ao pôr do sol — Cerrado Mineiro</h4><p style="font-size:12px;opacity:0.68">O café revolvido a cada 30 minutos para secar por igual. Se secar rápido demais, “queima”.</p></div>
      </div>
    </div>
  </section>
  `
},
"17": {
  chapter:"Capítulo 7 — O Processamento",
  title:"Precisão e Clareza: A Pureza do Café Lavado",
  subtitle:"Via úmida — fermentação, lavagem e acidez cintilante.",
  hero:"https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1600&q=80&auto=format&fit=crop",
  badge:"Página 17 — Via Úmida • Lavado",
  content: `
  <div class="page-header page-section">
    <div class="chapter-label">Via Úmida • Lavado</div>
    <h2>Precisão e Clareza <em>do Café Lavado</em></h2>
    <p>12–48h de fermentação em tanques: limpo, floral, acidez elevada e final delicado.</p>
  </div>
  <section class="page-section">
    <div class="grid-2">
      <div class="glass-card card-pad reveal">
        <h4 style="font-family:var(--font-display);margin:0 0 8px">Fluxo com animação de setas</h4>
        <div style="display:grid;gap:8px">
          ${[
            {s:"Descascamento", d:"Retira casca e parte da mucilagem"},
            {s:"Fermentação", d:"12–48h em tanques com água"},
            {s:"Lavagem", d:"Remove mucilagem restante"},
            {s:"Secagem", d:"Terreiro ou secador até 11%"},
          ].map((x,i)=>`<div style="display:flex;gap:10px;align-items:center;background:${i===1?'var(--forest)':'white'};color:${i===1?'white':'inherit'};padding:10px;border-radius:12px;border:1px solid rgba(44,26,14,0.06)"><span style="width:28px;height:28px;border-radius:50%;background:${i===1?'var(--gold)':'var(--cream)'};color:${i===1?'var(--brown-deep)':'inherit'};display:grid;place-items:center;font-family:var(--font-mono);font-size:12px">${i+1}</span><div><strong style="font-size:13px">${x.s}</strong><div style="font-size:11px;opacity:0.7">${x.d}</div></div></div>`).join('')}
        </div>
        <div style="margin-top:12px;padding:10px;background:var(--cream);border-radius:12px;font-size:12px;line-height:1.6"><strong>Fermentação natural vs inoculada:</strong> leveduras selecionadas criam notas de frutas tropicais e vinhosidade controlada.</div>
      </div>
      <div class="glass-card card-pad reveal">
        <h4 style="font-family:var(--font-display);margin:0 0 8px">Comparativo visual</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div style="text-align:center;background:white;padding:12px;border-radius:14px;border:1px solid rgba(44,26,14,0.06)"><div style="width:100%;height:90px;border-radius:10px;background:linear-gradient(135deg, #6b3a1f, #C68642)"></div><strong style="display:block;margin-top:6px;font-size:13px">Lavado</strong><small style="opacity:0.6">Verde-azulado • limpo</small></div>
          <div style="text-align:center;background:white;padding:12px;border-radius:14px;border:1px solid rgba(44,26,14,0.06)"><div style="width:100%;height:90px;border-radius:10px;background:linear-gradient(135deg, #8b5a2b, #EDE0C3)"></div><strong style="display:block;margin-top:6px;font-size:13px">Natural</strong><small style="opacity:0.6">Amarelado • frutado</small></div>
        </div>
        <p style="font-size:12px;opacity:0.68;line-height:1.6;margin-top:10px">Impacto ambiental: via úmida consome mais água, mas novas desmuciladoras mecânicas reduzem em 60%.</p>
      </div>
    </div>
  </section>
  `
},
"18": {
  chapter:"Capítulo 7 — O Processamento",
  title:"Yellow, Red e Black Honey: O Meio-Termo Perfeito",
  subtitle:"Honey process e fermentações especiais — o espectro entre seco e lavado.",
  hero:"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=80&auto=format&fit=crop",
  badge:"Página 18 — Honey & Especiais",
  content: `
  <div class="page-header page-section">
    <div class="chapter-label">Honey • Anaeróbico • Carbonic</div>
    <h2>Yellow, Red e <em>Black Honey</em></h2>
    <p>O “mel” é mucilagem deixada no grão. Quanto mais, mais doce e mais risco.</p>
  </div>
  <section class="page-section">
    <div class="glass-card card-pad reveal" style="padding:0;overflow:hidden">
      <table class="honey-table">
        <thead><tr><th>Tipo</th><th>Mucilagem</th><th>Secagem</th><th>Perfil</th></tr></thead>
        <tbody>
          <tr><td><strong>Yellow Honey</strong></td><td>25%</td><td>Rápida, mais sol</td><td>Suave, caramelo claro</td></tr>
          <tr><td><strong>Red Honey</strong></td><td>50%</td><td>Média, sombreada</td><td>Doce, frutado, corpo médio</td></tr>
          <tr><td><strong>Black Honey</strong></td><td>90-100%</td><td>Lenta, coberta</td><td>Intenso, vinho, fermentado</td></tr>
        </tbody>
      </table>
      <div style="padding:12px;background:var(--cream);display:flex;gap:8px;flex-wrap:wrap"><span class="pill">Espectro: Seco → Honey → Lavado</span><span class="pill">Brasil é referência em Honey</span></div>
    </div>
    <div class="grid-3" style="margin-top:18px">
      ${[
        {t:"Anaeróbico", d:"Fermentação sem oxigênio em tanques selados. Notas de frutas tropicais e vinho."},
        {t:"Carbonic Maceration", d:"Grãos inteiros em CO₂. Inspiração do vinho. Corpo licoroso."},
        {t:"Double Fermentation", d:"Duas fermentações sequenciais. Complexidade extrema. 90+ pontos."},
      ].map(c=>`
      <div class="flip-card reveal" style="height:220px">
        <div class="flip-inner">
          <div class="flip-front" style="display:grid;place-items:center;background:var(--brown-deep);color:white;padding:16px;text-align:center"><h4 style="font-family:var(--font-display);margin:0">${c.t}</h4><small style="opacity:0.7">Passe o mouse</small></div>
          <div class="flip-back"><p style="font-size:13px;opacity:0.72;line-height:1.6">${c.d}</p><span class="pill" style="margin-top:auto;width:max-content">Método especial</span></div>
        </div>
      </div>`).join('')}
    </div>
  </section>
  `
},
"19": {
  chapter:"Capítulo 8 — Secagem e Beneficiamento",
  title:"Da Umidade à Perfeição: 11% é o Número Mágico",
  subtitle:"Terreiro e secador — a corrida contra fungos e defeitos.",
  hero:"https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1600&q=80&auto=format&fit=crop",
  badge:"Página 19 — Secagem",
  content: `
  <div class="page-header page-section">
    <div class="chapter-label">Secagem • 11–12% umidade</div>
    <h2>Da Umidade à Perfeição <em>11% é o Número Mágico</em></h2>
    <p>Acima de 12% mofa. Abaixo de 10% quebra. O equilíbrio é ciência.</p>
  </div>
  <section class="page-section">
    <div class="grid-2">
      <div class="glass-card card-pad reveal">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${[
            {t:"Terreiro de cimento", d:"Tradicional, barato, exige revolvimento"},
            {t:"Terreiro suspenso", d:"Africano, ventilado, bebida mais limpa"},
            {t:"Secador rotativo", d:"Tulha, 40–45°C, 24–36h"},
            {t:"Estacionário", d:"Leito fixo, ar quente controlado"},
          ].map(c=>`<div style="background:white;padding:12px;border-radius:14px;border:1px solid rgba(44,26,14,0.06)"><strong style="font-size:13px">${c.t}</strong><div style="font-size:11px;opacity:0.6;line-height:1.5">${c.d}</div></div>`).join('')}
        </div>
        <div style="margin-top:12px;background:var(--cream);padding:12px;border-radius:14px;display:flex;align-items:center;gap:12px">
          <div style="flex:1"><div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:11px"><span>Umidade</span><span>11%</span></div><div style="height:8px;background:rgba(44,26,14,0.08);border-radius:999px;overflow:hidden;margin-top:6px"><div style="width:11%;height:100%;background:var(--caramel)"></div></div></div>
          <div style="text-align:center"><div style="width:44px;height:44px;border-radius:50%;border:3px solid var(--caramel);display:grid;place-items:center;font-family:var(--font-mono);font-size:12px">45°C</div><small style="font-size:10px;opacity:0.6">máx. secagem</small></div>
        </div>
      </div>
      <div class="glass-card reveal" style="padding:0;overflow:hidden">
        <img src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=900&q=80&auto=format&fit=crop" style="width:100%;height:200px;object-fit:cover">
        <div style="padding:14px"><h4 style="font-family:var(--font-display);margin:0 0 6px">Revolvimento a cada 30 min</h4><p style="font-size:12px;opacity:0.68;line-height:1.6">Secagem rápida demais “queima” o grão e traz gosto de queimado. Secagem lenta demais fermenta. O mestre de terreiro lê o grão com a mão.</p></div>
      </div>
    </div>
  </section>
  `
},
"20": {
  chapter:"Capítulo 8 — Secagem e Beneficiamento",
  title:"Da Cereja ao Grão Verde: A Transformação Final",
  subtitle:"Beneficiamento e classificação — onde o café vira mercadoria e arte.",
  hero:"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=80&auto=format&fit=crop",
  badge:"Página 20 — Beneficiamento",
  content: `
  <div class="page-header page-section">
    <div class="chapter-label">Beneficiamento • Classificação</div>
    <h2>Da Cereja <em>ao Grão Verde</em></h2>
    <p>Pré-limpeza, descasque, peneiras 13 a 19, mesa densimétrica e laser.</p>
  </div>
  <section class="page-section">
    <div class="glass-card card-pad reveal">
      <div style="display:flex;gap:8px;overflow:auto;padding-bottom:8px">
        ${["Pré-limpeza","Descascamento","Polimento","Peneiras 13-19","Mesa densimétrica","Catação laser","Tipo 2-8"].map((s,i)=>`<div style="min-width:110px;text-align:center"><div style="width:56px;height:56px;border-radius:14px;background:${i===5?'var(--brown-deep)':'var(--cream)'};color:${i===5?'white':'inherit'};display:grid;place-items:center;margin:0 auto;font-weight:700">${i+1}</div><div style="font-family:var(--font-mono);font-size:10px;margin-top:6px">${s}</div></div>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px">
        <div style="background:var(--cream);padding:12px;border-radius:14px"><strong>Peneira 16+</strong><div style="opacity:0.68;font-size:12px;line-height:1.6">Grãos grandes, valorização no mercado. Cada peneira = 1/64 polegada.</div></div>
        <div style="background:white;border:1px solid rgba(44,26,14,0.08);padding:12px;border-radius:14px"><strong>Classificação brasileira</strong><div style="opacity:0.68;font-size:12px;line-height:1.6">Tipo 2 (mínimo defeitos) ao Tipo 8. Bebida: mole, dura, rio.</div></div>
      </div>
    </div>
    <div style="margin-top:18px;border-radius:18px;overflow:hidden;height:220px;position:relative">
      <img src="https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?w=1600&q=80&auto=format&fit=crop" style="width:100%;height:100%;object-fit:cover">
      <div style="position:absolute;inset:0;background:linear-gradient(to right, rgba(44,26,14,0.65), transparent)"></div>
      <div style="position:absolute;left:18px;top:50%;transform:translateY(-50%);color:white;max-width:520px"><h4 style="font-family:var(--font-display);margin:0 0 6px">Fluxo fabril isométrico</h4><p style="opacity:0.9;line-height:1.6;font-size:13px">Do terreiro ao big bag: 7 etapas que separam o verde perfeito do defeito que estraga a xícara.</p></div>
    </div>
  </section>
  `
},
"21": {
  chapter:"Capítulo 9 — Qualidade e Specialty",
  title:"Quando o Café Vira Arte: O Universo Specialty",
  subtitle:"Acima de 80 pontos SCA, cada xícara é uma assinatura.",
  hero:"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=80&auto=format&fit=crop",
  badge:"Página 21 — Commodity vs Specialty",
  content: `
  <div class="page-header page-section">
    <div class="chapter-label">Specialty • 80+ pontos</div>
    <h2>Quando o Café <em>Vira Arte</em></h2>
    <p>Commodity é preço. Specialty é história, origem e emoção em 10 atributos.</p>
  </div>
  <section class="page-section">
    <div class="grid-2">
      <div class="glass-card card-pad reveal" style="text-align:center">
        <div style="display:flex;gap:10px;justify-content:center;margin-bottom:12px"><span class="pill">Commodity • Tipo 6–8 • R$ 600/saca</span><span class="pill" style="background:var(--brown-deep);color:white">Specialty 85+ • R$ 2.000–10.000/saca</span></div>
        <div style="width:180px;height:180px;border-radius:50%;margin:0 auto;display:grid;place-items:center;background:conic-gradient(from 0deg, var(--caramel) 0% 88%, rgba(44,26,14,0.08) 88% 100%);position:relative"><div style="width:132px;height:132px;background:white;border-radius:50%;display:grid;place-items:center"><strong style="font-family:var(--font-display);font-size:32px">88</strong><small style="font-family:var(--font-mono);opacity:0.6">pontos SCA</small></div></div>
        <p style="font-size:12px;opacity:0.6;margin-top:10px">Roda de sabores clicável • 10 atributos avaliados</p>
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:12px">
          ${["Fragrância","Sabor","Finalização","Acidez","Corpo","Balanço","Uniformidade","Ausência defeitos","Doçura","Impressão geral"].map(a=>`<span class="pill" style="font-size:10px;justify-content:center">${a}</span>`).join('')}
        </div>
      </div>
      <div class="glass-card card-pad reveal">
        <h4 style="font-family:var(--font-display);margin:0 0 8px">Protocolo de avaliação</h4>
        <p style="font-size:13px;opacity:0.68;line-height:1.6">Q-Graders provam às cegas, 5 xícaras por amostra, água a 93°C, moagem grossa. Cada atributo de 6 a 10 pontos.</p>
        <div style="display:grid;gap:8px;margin-top:12px">
          <div style="display:flex;justify-content:space-between;align-items:center;background:var(--cream);padding:10px;border-radius:12px"><span>Commodity</span><strong> &lt; 80 pontos</strong></div>
          <div style="display:flex;justify-content:space-between;align-items:center;background:var(--forest);color:white;padding:10px;border-radius:12px"><span>Specialty</span><strong>80–89,9</strong></div>
          <div style="display:flex;justify-content:space-between;align-items:center;background:var(--brown-deep);color:white;padding:10px;border-radius:12px"><span>Excepcional</span><strong>90+</strong></div>
        </div>
        <div style="margin-top:12px;height:120px;border-radius:12px;overflow:hidden"><img src="https://images.unsplash.com/photo-1524350876685-274059332603?w=800&q=80&auto=format&fit=crop" style="width:100%;height:100%;object-fit:cover"></div>
      </div>
    </div>
  </section>
  `
},
"22": {
  chapter:"Capítulo 9 — Qualidade e Specialty",
  title:"Sorver para Sentir: O Ritual dos Juízes do Café",
  subtitle:"Cupping — o protocolo SCA que separa o bom do inesquecível.",
  hero:"https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1600&q=80&auto=format&fit=crop",
  badge:"Página 22 — Cupping",
  content: `
  <div class="page-header page-section">
    <div class="chapter-label">Cupping • Ritual Sensorial</div>
    <h2>Sorver para Sentir <em>o Ritual dos Juízes</em></h2>
    <p>8,25g/150ml, 93°C, quebra da crosta aos 4 minutos — e o slurp que espalha o café pelo palato.</p>
  </div>
  <section class="page-section">
    <div class="cupping-steps">
      ${[
        {n:"01", t:"Pesagem", d:"8,25g café / 150ml água"},
        {n:"02", t:"Moagem grossa", d:"Sal grosso • 70% passa peneira 20"},
        {n:"03", t:"Infusão 93°C", d:"Água filtrada, TDS 125ppm"},
        {n:"04", t:"Quebra da crosta", d:"4 min • avaliar aroma úmido"},
        {n:"05", t:"Resfriamento", d:"11 min • sorver forte"},
        {n:"06", t:"Notas", d:"10 atributos • 6 a 10 pontos"},
        {n:"07", t:"Discussão", d:"Calibração entre juízes"},
        {n:"08", t:"Resultado", d:"Laudo + preço + destino"},
      ].map(c=>`<div class="step reveal"><strong>${c.n}</strong><h4 style="font-family:var(--font-display);margin:6px 0 4px">${c.t}</h4><small style="opacity:0.6;line-height:1.5">${c.d}</small></div>`).join('')}
    </div>
    <div class="glass-card card-pad reveal" style="margin-top:18px;display:grid;grid-template-columns:1fr 320px;gap:18px;align-items:center">
      <div>
        <h3 style="font-family:var(--font-display);margin:0 0 6px">O que cada nota significa?</h3>
        <p style="opacity:0.68;line-height:1.7;font-size:13px">Fragrância já diz se houve fermentação indesejada. Acidez brilhante indica altitude. Corpo sedoso fala de óleos preservados. E a nota final? É a memória que o café deixa 30 segundos depois.</p>
        <div style="display:flex;gap:8px;margin-top:10px"><span class="pill">Colher de cupping</span><span class="pill">Bowls de porcelana</span><span class="pill">Slurp sonoro</span></div>
      </div>
      <div style="border-radius:16px;overflow:hidden;height:200px"><img src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80&auto=format&fit=crop" style="width:100%;height:100%;object-fit:cover"></div>
    </div>
  </section>
  `
},
"23": {
  chapter:"Capítulo 10 — A Torra",
  title:"Calor, Tempo e Maestria: Onde a Magia Acontece",
  subtitle:"Reação de Maillard, caramelização e o estalo que muda tudo.",
  hero:"https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?w=1600&q=80&auto=format&fit=crop",
  badge:"Página 23 — Ciência da Torra",
  content: `
  <div class="page-header page-section">
    <div class="chapter-label">Torra • Ciência Térmica</div>
    <h2>Calor, Tempo e Maestria <em>Onde a Magia Acontece</em></h2>
    <p>150°C → 230°C: o verde vira âmbar, o açúcar canta e o first crack anuncia o ponto.</p>
  </div>
  <section class="page-section">
    <div class="glass-card card-pad reveal">
      <div style="display:flex;gap:8px;overflow:auto;padding-bottom:8px">
        ${[
          {t:"Verde", c:"#7a9a3a", temp:"25°C"},
          {t:"Amarelo", c:"#e8d84a", temp:"150°C"},
          {t:"Marrom claro", c:"#b86a2b", temp:"180°C"},
          {t:"First crack", c:"#8b3a1a", temp:"196°C"},
          {t:"City", c:"#5a1f0f", temp:"210°C"},
          {t:"Full City", c:"#2C1A0E", temp:"220°C"},
          {t:"Second crack", c:"#0D0A08", temp:"225°C"},
          {t:"French", c:"#0D0A08", temp:"230°C"},
        ].map(s=>`<div style="min-width:90px;text-align:center"><div style="width:56px;height:56px;border-radius:50%;background:${s.c};margin:0 auto;border:2px solid rgba(44,26,14,0.08)"></div><div style="font-family:var(--font-mono);font-size:10px;margin-top:6px">${s.t}</div><div style="font-size:11px;opacity:0.6">${s.temp}</div></div>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px">
        <div style="background:var(--cream);padding:12px;border-radius:14px"><strong>Reação de Maillard (140–180°C)</strong><div style="opacity:0.68;font-size:12px;line-height:1.6">Açúcares + aminoácidos criam melanoidinas: cor, aroma e corpo.</div></div>
        <div style="background:var(--brown-deep);color:white;padding:12px;border-radius:14px"><strong style="color:var(--gold)">Caramelização (170–200°C)</strong><div style="opacity:0.78;font-size:12px;line-height:1.6">Sacarose vira caramelo: notas de nozes, chocolate e toffee.</div></div>
      </div>
      <div style="margin-top:14px;height:180px;background:white;border:1px solid rgba(44,26,14,0.06);border-radius:14px;display:grid;place-items:center;padding:10px">
        <svg viewBox="0 0 520 160" style="width:100%;height:100%"><path d="M20 140 C120 20, 220 140, 320 60 C400 20, 480 30, 500 20" fill="none" stroke="#C68642" stroke-width="3"/><path d="M20 140 L500 140" stroke="rgba(44,26,14,0.08)"/><text x="20" y="20" font-family="Space Mono" font-size="10" fill="#2C1A0E">Temperatura °C</text><circle cx="320" cy="60" r="6" fill="#C68642"/><text x="320" y="48" text-anchor="middle" font-family="Space Mono" font-size="9" fill="#2C1A0E">First crack</text></svg>
      </div>
      <p style="text-align:center;opacity:0.6;font-size:11px;margin-top:6px">Roast curve — temperatura × tempo • Perda de peso 15–20% • Drum vs Fluid Bed</p>
    </div>
  </section>
  `
},
"24": {
  chapter:"Capítulo 10 — A Torra",
  title:"Clara, Média ou Escura: Qual é a Sua?",
  subtitle:"Três temperaturas, três personalidades — e o método que cada uma pede.",
  hero:"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=80&auto=format&fit=crop",
  badge:"Página 24 — Perfis de Torra",
  content: `
  <div class="page-header page-section">
    <div class="chapter-label">Torra • Clara • Média • Escura</div>
    <h2>Clara, Média <em>ou Escura?</em></h2>
    <p>196°C floral, 215°C equilibrado, 228°C intenso. Deslize e veja o grão transformar.</p>
  </div>
  <section class="page-section">
    <div class="roast-slider reveal">
      <img src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1600&q=80&auto=format&fit=crop" alt="Grãos">
      <div class="roast-control">
        <div style="display:flex;justify-content:space-between;align-items:center"><h4 style="margin:0;font-family:var(--font-display)" id="roastLabel">Torra Média • 215°C</h4><span class="badge" id="roastBadge">Equilibrada</span></div>
        <div class="bean-demo" id="beanDemo">
          <span class="bean" style="background:#b86a2b"></span><span class="bean" style="background:#8b3a1a"></span><span class="bean" style="background:#5a1f0f"></span>
        </div>
        <input type="range" min="0" max="100" value="50" class="range" id="roastRange">
        <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:10px;opacity:0.6"><span>Clara 196°C</span><span>Média 215°C</span><span>Escura 228°C</span></div>
        <p style="font-size:12px;opacity:0.68;line-height:1.6;margin:8px 0 0" id="roastText">Equilibrada: caramelo, nozes, chocolate. Ideal para espresso e coado. Acidez moderada, corpo aveludado.</p>
      </div>
    </div>
    <div class="grid-3" style="margin-top:18px">
      <div class="glass-card card-pad reveal" style="border-top:4px solid #e8d84a"><h4 style="font-family:var(--font-display);margin:0 0 6px">Clara • 196–205°C</h4><p style="font-size:12px;opacity:0.68;line-height:1.6">Ácida, floral, frutada, terrosa. Ideal: pour over, Aeropress.</p><span class="pill">Preserva origem</span></div>
      <div class="glass-card card-pad reveal" style="border-top:4px solid #8b3a1a"><h4 style="font-family:var(--font-display);margin:0 0 6px">Média • 210–220°C</h4><p style="font-size:12px;opacity:0.68;line-height:1.6">Equilíbrio, caramelo, nozes. Ideal: espresso, coado.</p><span class="pill">Mais popular no Brasil</span></div>
      <div class="glass-card card-pad reveal" style="border-top:4px solid #0D0A08"><h4 style="font-family:var(--font-display);margin:0 0 6px;color:var(--brown-deep)">Escura • 225–230°C</h4><p style="font-size:12px;opacity:0.68;line-height:1.6">Intensa, amarga, defumada, corpo pleno. Ideal: moka, espresso intenso.</p><span class="pill">Second crack</span></div>
    </div>
  </section>
  `
},
"25": {
  chapter:"Capítulo 11 — Métodos de Preparo",
  title:"Do Coado da Vovó ao Espresso Perfeito",
  subtitle:"Moagem, temperatura e tempo — a trindade da extração.",
  hero:"https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1600&q=80&auto=format&fit=crop",
  badge:"Página 25 — Métodos Tradicionais",
  content: `
  <div class="page-header page-section">
    <div class="chapter-label">Preparo • Tradição Brasileira</div>
    <h2>Do Coado da Vovó <em>ao Espresso Perfeito</em></h2>
    <p>O Brasil é o país do coado — e do espresso de 9 bar em 25 segundos.</p>
  </div>
  <section class="page-section">
    <div class="grid-2">
      <div class="glass-card card-pad reveal" style="display:flex;gap:14px;align-items:center">
        <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80&auto=format&fit=crop" style="width:120px;height:120px;object-fit:cover;border-radius:14px">
        <div><h4 style="font-family:var(--font-display);margin:0 0 4px">Coador de pano / Papel</h4><p style="font-size:13px;opacity:0.68;line-height:1.5">Moagem média, 92–96°C, 3–4 min. Doce, limpo, familiar. O método que atravessa gerações.</p><div style="display:flex;gap:6px;margin-top:6px"><span class="pill">92°C</span><span class="pill">3:30</span><span class="pill">Média</span></div></div>
      </div>
      <div class="glass-card card-pad reveal" style="display:flex;gap:14px;align-items:center">
        <img src="https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400&q=80&auto=format&fit=crop" style="width:120px;height:120px;object-fit:cover;border-radius:14px">
        <div><h4 style="font-family:var(--font-display);margin:0 0 4px">Espresso • 9 bar</h4><p style="font-size:13px;opacity:0.68;line-height:1.5">30ml em 25–30s, moagem fina, 93°C. Corpo, crema e intensidade.</p><div style="display:flex;gap:6px;margin-top:6px"><span class="pill">9 bar</span><span class="pill">25s</span><span class="pill">Fina</span></div></div>
      </div>
      <div class="glass-card card-pad reveal" style="display:flex;gap:14px;align-items:center">
        <img src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80&auto=format&fit=crop" style="width:120px;height:120px;object-fit:cover;border-radius:14px">
        <div><h4 style="font-family:var(--font-display);margin:0 0 4px">Café de panela</h4><p style="font-size:13px;opacity:0.68;line-height:1.5">O mais antigo. Café fervido com açúcar, coado no pano. Sabor de infância.</p><div style="display:flex;gap:6px;margin-top:6px"><span class="pill">100°C</span><span class="pill">Fervido</span></div></div>
      </div>
      <div class="glass-card card-pad reveal" style="background:var(--cream)">
        <h4 style="font-family:var(--font-display);margin:0 0 6px">Moagem — guia visual</h4>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;text-align:center">
          ${[
            {l:"Grossa", d:"French Press"},
            {l:"Média", d:"Coado"},
            {l:"Fina", d:"Espresso"},
            {l:"Extra fina", d:"Turco"},
          ].map(m=>`<div style="background:white;padding:10px;border-radius:12px;border:1px solid rgba(44,26,14,0.06)"><div style="font-family:var(--font-mono);font-size:11px">${m.l}</div><small style="opacity:0.6">${m.d}</small></div>`).join('')}
        </div>
        <p style="font-size:11px;opacity:0.6;margin-top:8px;text-align:center">Ajuste fino muda tudo: grossa demais = aguado. Fina demais = amargo.</p>
      </div>
    </div>
  </section>
  `
},
"26": {
  chapter:"Capítulo 11 — Métodos de Preparo",
  title:"Pour Over, Aeropress e Cold Brew: A Nova Era do Café",
  subtitle:"A precisão manual que revela notas escondidas.",
  hero:"https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=1600&q=80&auto=format&fit=crop",
  badge:"Página 26 — Métodos Modernos",
  content: `
  <div class="page-header page-section">
    <div class="chapter-label">Métodos Especiais • Terceira Onda</div>
    <h2>Pour Over, Aeropress <em>e Cold Brew</em></h2>
    <p>Bloom, espiral e 12 horas de frio: a nova liturgia do café.</p>
  </div>
  <section class="page-section">
    <div class="grid-3">
      ${[
        {t:"V60 / Chemex", d:"Derramamento em espiral, bloom 30s. Clareza máxima, acidez brilhante.", img:"https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80&auto=format&fit=crop", tag:"92°C • 3:30"},
        {t:"Aeropress", d:"Pressão manual, versátil. Do espresso ao coado em 2 minutos. Favorita de campeões.", img:"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80&auto=format&fit=crop", tag:"85°C • 1:30"},
        {t:"French Press", d:"Imersão total, corpo pleno, óleos preservados. Prensa 4 min.", img:"https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80&auto=format&fit=crop", tag:"96°C • 4:00"},
        {t:"Cold Brew", d:"Extração fria 12–24h. Doce, baixa acidez, refrescante. Perfeito para o calor brasileiro.", img:"https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&q=80&auto=format&fit=crop", tag:"Gelada • 18h"},
        {t:"Moka (Italiana)", d:"Pressão de vapor, intenso, encorpado. O espresso caseiro.", img:"https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?w=800&q=80&auto=format&fit=crop", tag:"Vapor • 4 min"},
        {t:"Sifão (Syphon)", d:"Vácuo e chama. Espetáculo visual, bebida limpa e aromática.", img:"https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&q=80&auto=format&fit=crop", tag:"Vácuo • 2:00"},
      ].map(c=>`
      <div class="glass-card reveal" style="overflow:hidden">
        <div style="height:140px;overflow:hidden" class="hover-zoom"><img src="${c.img}" style="width:100%;height:100%;object-fit:cover"></div>
        <div style="padding:12px"><h4 style="font-family:var(--font-display);margin:0 0 4px">${c.t}</h4><p style="font-size:12px;opacity:0.68;line-height:1.5">${c.d}</p><span class="pill" style="margin-top:8px">${c.tag}</span></div>
      </div>`).join('')}
    </div>
    <div class="glass-card card-pad reveal" style="margin-top:18px">
      <h4 style="font-family:var(--font-display);margin:0 0 8px">Comparativo em radar — corpo × acidez × clareza × intensidade</h4>
      <div style="display:grid;grid-template-columns:340px 1fr;gap:18px;align-items:center">
        <div class="radar-wrap"><svg viewBox="0 0 200 200" class="radar-svg"><g fill="none" stroke="rgba(44,26,14,0.08)"><polygon points="100,20 180,70 155,155 45,155 20,70"/></g><polygon points="100,35 160,75 145,135 62,145 38,78" fill="rgba(198,134,66,0.2)" stroke="#C68642" stroke-width="2"/><polygon points="100,55 145,82 132,118 78,122 62,82" fill="rgba(45,90,39,0.18)" stroke="#2D5A27" stroke-width="2" stroke-dasharray="5 4"/></svg></div>
        <div style="display:grid;gap:8px;font-size:13px"><div><strong>V60</strong> — clareza e acidez máximas</div><div><strong>French Press</strong> — corpo e óleos</div><div><strong>Cold Brew</strong> — doçura e baixa acidez</div><p style="opacity:0.6;line-height:1.6">Mova o radar mentalmente: cada método desenha um polígono diferente na xícara.</p></div>
      </div>
    </div>
  </section>
  `
},
"27": {
  chapter:"Capítulo 12 — Sustentabilidade e Futuro",
  title:"Cultivar com Responsabilidade: O Futuro do Café Brasileiro",
  subtitle:"Certificações, carbono e a fazenda que regenera o solo.",
  hero:"https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1600&q=80&auto=format&fit=crop",
  badge:"Página 27 — Sustentável",
  content: `
  <div class="page-header page-section">
    <div class="chapter-label">Capítulo 12 — Sustentabilidade</div>
    <h2>Cultivar com <em>Responsabilidade</em></h2>
    <p>O futuro do café é regenerativo: sombra, água e gente no centro.</p>
  </div>
  <section class="page-section">
    <div class="grid-3">
      ${[
        {t:"Rainforest Alliance", d:"Biodiversidade, bem-estar e rastreabilidade. Selo verde da floresta.", col:"var(--forest)", icon:"🌿"},
        {t:"UTZ / Fair Trade", d:"Preço justo, cooperativas fortes e trabalho digno.", col:"var(--caramel)", icon:"🤝"},
        {t:"Orgânico Brasil", d:"Sem agrotóxico, compostagem e manejo biológico.", col:"var(--gold)", icon:"♻"},
        {t:"Certifica Minas", d:"Programa estadual pioneiro. Boas práticas e origem controlada.", col:"#6b3a1f", icon:"⛰"},
        {t:"Carbon Neutral", d:"Fazendas que sequestram mais carbono do que emitem. Café carbono negativo.", col:"#2C1A0E", icon:"🌎"},
        {t:"Regenerativo", d:"Solo vivo, cobertura verde, infiltração de água. O próximo selo.", col:"#8b5a2b", icon:"🌱"},
      ].map(c=>`
      <div class="glass-card card-pad reveal" style="text-align:center;border-top:4px solid ${c.col}">
        <div style="width:48px;height:48px;border-radius:50%;background:${c.col};color:white;display:grid;place-items:center;margin:0 auto 8px;font-size:20px">${c.icon}</div>
        <h4 style="font-family:var(--font-display);margin:0 0 6px">${c.t}</h4>
        <p style="font-size:12px;opacity:0.68;line-height:1.6">${c.d}</p>
      </div>`).join('')}
    </div>
    <div class="glass-card card-pad reveal" style="margin-top:18px;display:grid;grid-template-columns:1fr 380px;gap:18px;align-items:center">
      <div>
        <h3 style="font-family:var(--font-display);margin:0 0 6px">Manejo integrado que encanta</h3>
        <p style="opacity:0.68;line-height:1.7;font-size:13px">Sombra de ingá, barraginhas para infiltrar chuva, compostagem de palha de café e controle biológico com vespa parasitoide da broca. Resultado: solo com 4% de matéria orgânica, nascente perene e café 88 pontos.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><span class="pill">Água de reuso</span><span class="pill">Energia solar</span><span class="pill">Compostagem</span></div>
      </div>
      <div style="border-radius:16px;overflow:hidden;height:220px"><img src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80&auto=format&fit=crop" style="width:100%;height:100%;object-fit:cover"></div>
    </div>
  </section>
  `
},
"28": {
  chapter:"Capítulo 12 — Sustentabilidade e Futuro",
  title:"A Cultura que Nasce da Xícara",
  subtitle:"Cafeterias, arte urbana e o design brasileiro que gira em torno do café.",
  hero:"https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=1600&q=80&auto=format&fit=crop",
  badge:"Página 28 — Cultura & Arte",
  content: `
  <div class="page-header page-section">
    <div class="chapter-label">Cultura • Arte • Cidade</div>
    <h2>A Cultura que Nasce <em>da Xícara</em></h2>
    <p>Da esquina da Vila Madalena ao Pelourinho: o café como galeria, palco e ponto de encontro.</p>
  </div>
  <section class="page-section">
    <div class="grid-2">
      <div class="glass-card reveal" style="padding:0;overflow:hidden">
        <img src="https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=900&q=80&auto=format&fit=crop" style="width:100%;height:260px;object-fit:cover">
        <div style="padding:14px"><h4 style="font-family:var(--font-display);margin:0 0 6px">Cafeterias de terceira onda</h4><p style="font-size:13px;opacity:0.68;line-height:1.6">São Paulo, Curitiba, Belo Horizonte e Recife lideram com torras próprias, latte art e origem única na lousa.</p><span class="pill">+4.500 cafeterias especiais</span></div>
      </div>
      <div class="glass-card card-pad reveal">
        <h3 style="font-family:var(--font-display);margin:0 0 6px">Design brasileiro</h3>
        <p style="opacity:0.68;line-height:1.7;font-size:13px">Mobiliário de madeira de demolição, azulejo pintado à mão, luminária de palha e o balcão de cimento queimado: o luxo rústico que o mundo copia.</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px">
          <div style="border-radius:12px;overflow:hidden;height:120px"><img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80&auto=format&fit=crop" style="width:100%;height:100%;object-fit:cover"></div>
          <div style="border-radius:12px;overflow:hidden;height:120px"><img src="https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400&q=80&auto=format&fit=crop" style="width:100%;height:100%;object-fit:cover"></div>
        </div>
        <div class="quote" style="font-size:18px">“Cafeteria é a nova praça.”</div>
      </div>
    </div>
  </section>
  `
},
"29": {
  chapter:"Capítulo 12 — Sustentabilidade e Futuro",
  title:"Economia, Turismo e o Caminho do Café",
  subtitle:"Da saca à experiência: roteiros, fazendas e o enoturismo do café.",
  hero:"https://images.unsplash.com/photo-1524350876685-274059332603?w=1600&q=80&auto=format&fit=crop",
  badge:"Página 29 — Economia & Turismo",
  content: `
  <div class="page-header page-section">
    <div class="chapter-label">Economia • Turismo</div>
    <h2>Economia, Turismo <em>e o Caminho do Café</em></h2>
    <p>US$ 7 bi em exportações, 8 milhões de empregos e um novo turismo: dormir no cafezal.</p>
  </div>
  <section class="page-section">
    <div class="grid-3">
      <div class="glass-card card-pad reveal" style="text-align:center"><strong style="font-family:var(--font-mono);font-size:28px;color:var(--caramel)">US$ 7bi</strong><div style="font-family:var(--font-display);font-weight:600">Exportações 2024</div><small style="opacity:0.6">2,1 milhões de sacas/mês</small></div>
      <div class="glass-card card-pad reveal" style="text-align:center"><strong style="font-family:var(--font-mono);font-size:28px;color:var(--forest)">2.200</strong><div style="font-family:var(--font-display);font-weight:600">Municípios produtores</div><small style="opacity:0.6">Em 14 estados</small></div>
      <div class="glass-card card-pad reveal" style="text-align:center"><strong style="font-family:var(--font-mono);font-size:28px">+35%</strong><div style="font-family:var(--font-display);font-weight:600">Turismo cafeeiro</div><small style="opacity:0.6">Crescimento anual</small></div>
    </div>
    <div class="grid-2" style="margin-top:18px">
      <div class="glass-card card-pad reveal">
        <h4 style="font-family:var(--font-display);margin:0 0 8px">Roteiros imperdíveis</h4>
        <div style="display:grid;gap:8px">
          ${[
            {t:"Caminho do Café — Sul de Minas", d:"Fazendas centenárias, cupping ao pôr do sol e hospedagem na colônia."},
            {t:"Cerrado Mineiro — Patrocínio", d:"Talhões mecanizados, picape 4x4 e churrasco de fim de colheita."},
            {t:"Chapada Diamantina — BA", d:"Café de altitude, cachoeiras e noite estrelada a 1.300m."},
          ].map(r=>`<div style="background:white;padding:10px;border-radius:12px;border:1px solid rgba(44,26,14,0.06)"><strong style="font-size:13px">${r.t}</strong><div style="font-size:12px;opacity:0.6;line-height:1.5">${r.d}</div></div>`).join('')}
        </div>
      </div>
      <div class="glass-card reveal" style="padding:0;overflow:hidden">
        <img src="https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=900&q=80&auto=format&fit=crop" style="width:100%;height:240px;object-fit:cover">
        <div style="padding:12px"><span class="pill">Experiência • 2 dias • 5 fazendas</span><h4 style="font-family:var(--font-display);margin:8px 0 6px">Dormir entre cafeeiros</h4><p style="font-size:12px;opacity:0.68;line-height:1.6">Acordar com névoa, colher cerejas ao lado do produtor e provar seu lote na mesma tarde.</p></div>
      </div>
    </div>
  </section>
  `
},
"30": {
  chapter:"Epílogo — Sua Jornada",
  title:"Sua Jornada do Grão à Xícara Começa Agora",
  subtitle:"Leve o terroir para casa e compartilhe o aroma.",
  hero:"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=80&auto=format&fit=crop",
  badge:"Página 30 — Epílogo & Loja",
  content: `
  <div class="page-header page-section">
    <div class="chapter-label">Epílogo • 30 de 30</div>
    <h2>Sua Jornada <em>do Grão à Xícara</em> Começa Agora</h2>
    <p>Você percorreu semente, flor, cereja, terreiro, torra e xícara. Agora é sua vez de extrair.</p>
  </div>
  <section class="page-section">
    <div class="glass-card card-pad reveal" style="text-align:center;background:radial-gradient(800px 400px at 50% 0%, rgba(212,175,55,0.16), transparent), white">
      <div class="badge" style="background:var(--gold)">Coleção Terra & Grão • Edição Limitada</div>
      <h3 style="font-family:var(--font-display);font-size:28px;margin:12px 0 6px">Leve o terroir para casa</h3>
      <p style="opacity:0.68;max-width:620px;margin:0 auto;line-height:1.7">Três lotes premiados, torrados na semana do envio, com cartão de origem, altitude e notas sensoriais. Assinatura mensal com cupping guiado por Q-Grader.</p>
      <div class="grid-3" style="margin:18px 0;text-align:left">
        ${[
          {t:"Sul de Minas • Bourbon Amarelo", n:"87,5 pts • melaço, laranja bahia", p:"R$ 68", img:"https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600&q=80&auto=format&fit=crop"},
          {t:"Chapada Diamantina • Catuaí 144", n:"90 pts • jasmim, damasco", p:"R$ 92", img:"https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?w=600&q=80&auto=format&fit=crop"},
          {t:"Cerrado • Mundo Novo Honey", n:"88,5 pts • chocolate, caramelo", p:"R$ 74", img:"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80&auto=format&fit=crop"},
        ].map(c=>`
        <div style="background:white;border:1px solid rgba(44,26,14,0.06);border-radius:16px;overflow:hidden">
          <div style="height:140px;overflow:hidden"><img src="${c.img}" style="width:100%;height:100%;object-fit:cover"></div>
          <div style="padding:12px"><h4 style="font-family:var(--font-display);margin:0 0 4px;font-size:14px">${c.t}</h4><small style="opacity:0.6">${c.n}</small><div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px"><strong style="font-family:var(--font-mono)">${c.p}</strong><button class="btn-primary small" style="padding:8px 14px"><span>Adicionar</span></button></div></div>
        </div>`).join('')}
      </div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <a href="#/01" class="btn-primary" data-magnetic><span>Recomeçar a Jornada</span><i class="btn-shine"></i></a>
        <button class="btn-ghost" onclick="alert('Assinatura confirmada! Bem-vindo à família Terra & Grão.')">Assinar Clube • R$ 89/mês</button>
      </div>
      <p style="font-family:var(--font-script);font-size:20px;color:var(--caramel);margin-top:16px">“O café é a desculpa. O encontro é o destino.”</p>
    </div>
    <div class="grid-2" style="margin-top:18px">
      <div class="glass-card card-pad reveal">
        <h4 style="font-family:var(--font-display);margin:0 0 8px">Compartilhe sua xícara</h4>
        <p style="font-size:13px;opacity:0.68;line-height:1.6">Marque #TerraEGrao e apareça na galeria viva do site. As melhores fotos ganham lote premiado.</p>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px">
          <div style="height:80px;border-radius:10px;overflow:hidden"><img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&q=80&auto=format&fit=crop" style="width:100%;height:100%;object-fit:cover"></div>
          <div style="height:80px;border-radius:10px;overflow:hidden"><img src="https://images.unsplash.com/photo-1511920170033-f8396924c348?w=300&q=80&auto=format&fit=crop" style="width:100%;height:100%;object-fit:cover"></div>
          <div style="height:80px;border-radius:10px;overflow:hidden"><img src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=300&q=80&auto=format&fit=crop" style="width:100%;height:100%;object-fit:cover"></div>
          <div style="height:80px;border-radius:10px;overflow:hidden;background:var(--cream);display:grid;place-items:center;font-family:var(--font-mono);font-size:11px;opacity:0.6">+2.4k fotos</div>
        </div>
      </div>
      <div class="glass-card card-pad reveal" style="background:var(--brown-deep);color:var(--cream)">
        <h4 style="font-family:var(--font-display);margin:0 0 8px;color:var(--gold)">Mapa da sua jornada</h4>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${Array.from({length:30},(_,i)=>`<a href="#/${String(i+1).padStart(2,'0')}" style="width:36px;height:36px;border-radius:50%;background:${i===29?'var(--gold)':'rgba(255,255,255,0.08)'};color:${i===29?'var(--brown-deep)':'var(--cream)'};display:grid;place-items:center;font-family:var(--font-mono);font-size:11px;border:1px solid rgba(255,255,255,0.12)">${String(i+1).padStart(2,'0')}</a>`).join('')}
        </div>
        <p style="opacity:0.7;font-size:12px;margin-top:10px">30 páginas • 12 capítulos • 1 Brasil. Clique em qualquer número para revisitar.</p>
      </div>
    </div>
  </section>
  `
}
}
