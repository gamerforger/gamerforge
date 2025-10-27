/* script.js
   - Canvas background with moving grid lines, glowing particle sparks, and lightning chains
   - Typewriter effect for the hero title
   - Smooth scroll, nav toggle, lightbox, and contact form behavior
*/

(() => {
  // ======= Canvas Background (grid + sparks + lightning) =======
  const canvas = document.getElementById('bgCanvas');
  const ctx = canvas.getContext('2d', { alpha: true });

  let w = 0, h = 0, DPR = Math.max(1, window.devicePixelRatio || 1);

  function resize() {
    DPR = Math.max(1, window.devicePixelRatio || 1);
    w = canvas.width = Math.floor(window.innerWidth * DPR);
    h = canvas.height = Math.floor(window.innerHeight * DPR);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  // Grid settings
  const grid = {
    spacing: 40,
    offset: 0,
    speed: 18,
    color: 'rgba(85,240,255,0.05)',
  };

  // Sparks (particles)
  const sparks = [];
  const MAX_SPARKS = 90;

  function rand(min, max){ return Math.random() * (max - min) + min; }

  function createSpark() {
    return {
      x: rand(0, window.innerWidth),
      y: rand(0, window.innerHeight),
      vx: rand(-8, 8) * 0.05,
      vy: rand(-10, 8) * 0.05,
      radius: rand(0.8, 3.4),
      hue: rand(160, 320),
      life: rand(2.5, 6),
      age: 0
    };
  }

  for (let i = 0; i < MAX_SPARKS; i++) sparks.push(createSpark());

  // ======= Lightning Chains (connects spark balls) =======
  const lightningBolts = [];
  const MAX_LIGHTNING = 4; // few at a time

  function createLightningFromSparks() {
    if (sparks.length < 2) return null;

    // pick 2–4 random sparks
    const count = Math.floor(rand(2, 5));
    const selected = [];
    while (selected.length < count) {
      const s = sparks[Math.floor(rand(0, sparks.length))];
      if (!selected.includes(s)) selected.push(s);
    }

    const points = selected.map(s => ({ x: s.x, y: s.y }));

    return {
      points,
      alpha: 0,
      phase: 'fadein',
      hue: rand(160, 320),
      life: rand(0.4, 0.9)
    };
  }

  function drawLightning(dt) {
    // occasionally create a new lightning chain
    if (Math.random() < 0.02 && lightningBolts.length < MAX_LIGHTNING) {
      const bolt = createLightningFromSparks();
      if (bolt) lightningBolts.push(bolt);
    }

    for (let i = lightningBolts.length - 1; i >= 0; i--) {
      const bolt = lightningBolts[i];

      // fade logic
      if (bolt.phase === 'fadein') {
        bolt.alpha += dt * 4;
        if (bolt.alpha >= 1) bolt.phase = 'fadeout';
      } else if (bolt.phase === 'fadeout') {
        bolt.alpha -= dt * 2;
      }

      // slight color shift
      bolt.hue += dt * 60;
      if (bolt.hue > 360) bolt.hue -= 360;

      // draw zigzag lines
      ctx.save();
      ctx.beginPath();
      for (let j = 0; j < bolt.points.length - 1; j++) {
        const p1 = bolt.points[j];
        const p2 = bolt.points[j + 1];
        ctx.moveTo(p1.x, p1.y);
        // add tiny random offset for jagged lightning
        ctx.lineTo(p2.x + rand(-6,6), p2.y + rand(-6,6));
      }
      ctx.strokeStyle = `hsla(${bolt.hue}, 100%, 70%, ${0.35 * bolt.alpha})`;
      ctx.lineWidth = rand(1, 2);
      ctx.shadowColor = `hsla(${bolt.hue}, 100%, 70%, ${0.7 * bolt.alpha})`;
      ctx.shadowBlur = 16;
      ctx.stroke();
      ctx.restore();

      if (bolt.alpha <= 0) lightningBolts.splice(i, 1);
    }
  }

  let last = performance.now();
  function animate(now) {
    const dt = Math.min(0.04, (now - last)/1000);
    last = now;

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // background gradient
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(10,10,20,0.15)');
    g.addColorStop(1, 'rgba(5,5,12,0.6)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,window.innerWidth, window.innerHeight);

    // moving grid
    drawGrid(grid.spacing, grid.color, grid.offset * 0.4);
    drawGrid(grid.spacing*2, 'rgba(255,0,208,0.02)', grid.offset * 0.65);
    grid.offset += grid.speed * dt;

    // sparks
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      s.x += s.vx * (1 + i%3*0.3) * (1 + dt*4);
      s.y += s.vy * (1 + dt*6);
      s.age += dt;

      if (s.x < -30) s.x = window.innerWidth + 30;
      if (s.x > window.innerWidth + 30) s.x = -30;
      if (s.y < -30) s.y = window.innerHeight + 30;
      if (s.y > window.innerHeight + 30) s.y = -30;

      const alpha = Math.max(0, 1 - (s.age / s.life));
      const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.radius * 12);
      const color1 = `hsla(${s.hue}, 100%, 60%, ${0.18 * alpha})`;
      const color2 = `hsla(${(s.hue + 30) % 360}, 100%, 60%, ${0.06 * alpha})`;
      grad.addColorStop(0, color1);
      grad.addColorStop(0.6, color2);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius * 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `hsla(${s.hue}, 100%, 70%, ${0.9 * alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, Math.max(0.3, s.radius * 0.65), 0, Math.PI * 2);
      ctx.fill();

      if (s.age > s.life && Math.random() > 0.98) sparks[i] = createSpark();
    }

    // draw lightning chains on top
    drawLightning(dt);

    requestAnimationFrame(animate);
  }

  function drawGrid(spacing, color, offset){
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const wView = window.innerWidth, hView = window.innerHeight;
    const ofs = offset % spacing;
    for (let x = -spacing; x < wView + spacing; x += spacing) {
      ctx.moveTo(x + ofs, -spacing);
      ctx.lineTo(x + ofs, hView + spacing);
    }
    for (let y = -spacing; y < hView + spacing; y += spacing) {
      ctx.moveTo(-spacing, y + ofs * 0.6);
      ctx.lineTo(wView + spacing, y + ofs * 0.6);
    }
    ctx.stroke();
    ctx.restore();
  }

  requestAnimationFrame(animate);
  window.addEventListener('load', resize);
  resize();

  // ======= Typewriter effect =======
  const typeEl = document.getElementById('typewriter');
  const fullText = typeEl.getAttribute('data-text') || typeEl.textContent || 'Gamersmith';
  typeEl.textContent = '';

  function typewriter(node, text, speed=0.025) {
    let i = 0;
    function step() {
      if (i <= text.length) {
        node.textContent = text.slice(0, i);
        i++;
        setTimeout(step, speed + Math.random()*20);
      } else {
        node.classList.add('tw-done');
      }
    }
    step();
  }
  typewriter(typeEl, fullText, 70);

  const style = document.createElement('style');
  style.textContent = `
    #typewriter::after{
      content: "|";
      margin-left:8px;
      opacity:0.92;
      animation: blink 1s steps(2, start) infinite;
      color: rgba(255,255,255,0.85);
      font-weight:700;
    }
    #typewriter.tw-done::after{ animation: blink 1.2s steps(2,start) infinite; opacity:0.6 }
    @keyframes blink { 50%{ opacity:0 } }
  `;
  document.head.appendChild(style);

  // ======= Smooth scroll and nav toggle =======
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({behavior:'smooth', block:'start'});
        document.querySelector('.nav')?.classList.remove('expanded');
      }
    });
  });

  const navToggle = document.getElementById('navToggle');
  navToggle?.addEventListener('click', () => {
    document.querySelector('.nav')?.classList.toggle('expanded');
  });

  document.getElementById('year').textContent = new Date().getFullYear();

  // ======= Lightbox =======
  const lightbox = document.getElementById('lightbox');
  const lbContent = document.getElementById('lbContent');
  const lbClose = document.getElementById('lbClose');

  function openLightbox(contentEl) {
    lbContent.innerHTML = '';
    lbContent.appendChild(contentEl);
    lightbox.setAttribute('aria-hidden', 'false');
  }
  function closeLightbox() {
    lightbox.setAttribute('aria-hidden', 'true');
    lbContent.innerHTML = '';
  }
  lbClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.querySelectorAll('.demo-thumb').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type || 'image';
      const src = btn.dataset.src;
      if (type === 'image') {
        const img = document.createElement('img');
        img.src = src;
        img.alt = btn.querySelector('img')?.alt || 'Demo';
        img.style.maxWidth = '100%';
        img.style.display = 'block';
        openLightbox(img);
      } else if (type === 'iframe') {
        const iframe = document.createElement('iframe');
        iframe.src = src;
        iframe.style.width = '100%';
        iframe.style.height = '70vh';
        iframe.setAttribute('loading', 'lazy');
        openLightbox(iframe);
      }
    });
  });

  // ======= Contact form =======
  const contactForm = document.getElementById('contactForm');
  const contactResult = document.getElementById('contactResult');
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData(contactForm);
    if (!form.get('name') || !form.get('email') || !form.get('message')) {
      contactResult.textContent = 'Please complete all fields.';
      return;
    }
    contactResult.textContent = 'Thanks — message captured (demo form). We will email you back.';
    contactForm.reset();
    setTimeout(()=> contactResult.textContent = '', 6000);
  });

  // ======= Accessibility: reduce motion =======
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mq.matches) {
    grid.speed = 0;
    sparks.length = 0;
  }

})();
