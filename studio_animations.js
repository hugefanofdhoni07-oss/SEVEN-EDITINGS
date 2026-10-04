/* ============ advanced interactive animation & motion engine ============ */

/* ============ ambient cursor spotlight follower ============ */
(function initSpotlight(){
  const spot = document.createElement('div');
  spot.className = 'ambient-spotlight';
  document.body.appendChild(spot);

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let spotX = mouseX;
  let spotY = mouseY;

  window.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function renderSpotlight(){
    spotX += (mouseX - spotX) * 0.08;
    spotY += (mouseY - spotY) * 0.08;
    spot.style.transform = `translate3d(${spotX}px, ${spotY}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(renderSpotlight);
  }
  requestAnimationFrame(renderSpotlight);
})();

/* ============ atmospheric floating dust particles ============ */
(function initFilmDust(){
  const container = document.getElementById('filmDust');
  if(!container) return;
  const count = 35;
  for(let i=0; i<count; i++){
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random()*3.5 + 1.2;
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.left = (Math.random()*100) + '%';
    p.style.top = (Math.random()*100) + '%';
    p.style.setProperty('--dur', (Math.random()*9 + 8) + 's');
    p.style.setProperty('--delay', (Math.random()*6) + 's');
    p.style.setProperty('--dx', (Math.random()*100 - 50) + 'px');
    p.style.setProperty('--dy', (-(Math.random()*140 + 60)) + 'px');
    p.style.setProperty('--peak', (Math.random()*0.35 + 0.15).toString());
    container.appendChild(p);
  }
})();

/* ============ custom magnetic viewfinder cursor + hud readout ============ */
(function initViewfinderCursor(){
  if(window.matchMedia('(pointer: coarse)').matches){
    document.body.classList.add('no-custom-cursor');
    return;
  }
  const ring = document.getElementById('cursorRing');
  const dot = document.getElementById('cursorDot');
  if(!ring || !dot) return;

  const hud = document.createElement('div');
  hud.className = 'cursor-hud';
  hud.textContent = 'REC [24FPS]';
  document.body.appendChild(hud);

  let mouseX = -100, mouseY = -100;
  let ringX = -100, ringY = -100;
  let dotX = -100, dotY = -100;

  window.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    hud.style.transform = `translate3d(${mouseX + 16}px, ${mouseY + 16}px, 0)`;
  });

  function renderCursor(){
    ringX += (mouseX - ringX) * 0.2;
    ringY += (mouseY - ringY) * 0.2;
    dotX += (mouseX - dotX) * 0.5;
    dotY += (mouseY - dotY) * 0.5;

    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
    dot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%)`;

    requestAnimationFrame(renderCursor);
  }
  requestAnimationFrame(renderCursor);

  // Target triggers & magnetic snapping
  document.addEventListener('mouseover', e => {
    const target = e.target.closest('a, button, input, textarea, .filter-btn, .port-audio-btn, .loop-btn');
    const portTile = e.target.closest('.port-tile, .svc-card, .compare');
    
    if(portTile){
      ring.classList.add('hover-frame');
      dot.classList.add('hover');
      hud.textContent = 'CAMERA 1 [LOG PROFILE]';
    } else if(target){
      ring.classList.add('hover');
      dot.classList.add('hover');
      hud.textContent = 'SELECT';
    } else {
      ring.classList.remove('hover', 'hover-frame');
      dot.classList.remove('hover');
      hud.textContent = 'REC [24FPS]';
    }
  });

  document.addEventListener('mouseleave', () => {
    ring.style.opacity = '0';
    dot.style.opacity = '0';
    hud.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    ring.style.opacity = '1';
    dot.style.opacity = '1';
    hud.style.opacity = '1';
  });
})();

/* ============ 3D card tilt, glare physics & interactive split wipe ============ */
(function init3DTiltAndInteractiveSplit(){
  if(window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Add decorative HUD brackets to service cards
  document.querySelectorAll('.svc-card').forEach(card => {
    if(!card.querySelector('.hud-corners')){
      const corners = document.createElement('div');
      corners.className = 'hud-corners';
      corners.innerHTML = '<span class="tl"></span><span class="tr"></span><span class="bl"></span><span class="br"></span>';
      card.appendChild(corners);
    }
    if(!card.querySelector('.glow-border')){
      const glow = document.createElement('div');
      glow.className = 'glow-border';
      card.appendChild(glow);
    }
  });

  // Add Sprocket hole strips and split dividers to portfolio tiles
  document.querySelectorAll('.port-tile').forEach(tile => {
    if(!tile.querySelector('.sprocket-strip')){
      const leftSprocket = document.createElement('div');
      leftSprocket.className = 'sprocket-strip left';
      for(let i=0; i<8; i++){ leftSprocket.appendChild(document.createElement('span')); }
      tile.appendChild(leftSprocket);

      const rightSprocket = document.createElement('div');
      rightSprocket.className = 'sprocket-strip right';
      for(let i=0; i<8; i++){ rightSprocket.appendChild(document.createElement('span')); }
      tile.appendChild(rightSprocket);
    }

    if(!tile.querySelector('.split-divider-line')){
      const divider = document.createElement('div');
      divider.className = 'split-divider-line';
      tile.appendChild(divider);
    }
  });

  // Tilt and Glare
  const tiltCards = document.querySelectorAll('.port-tile, .svc-card, .price-card');
  tiltCards.forEach(card => {
    if(!card.querySelector('.glare-overlay')){
      const glare = document.createElement('div');
      glare.className = 'glare-overlay';
      card.appendChild(glare);
    }

    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const xPct = (x / rect.width - 0.5) * 2; // -1 to 1
      const yPct = (y / rect.height - 0.5) * 2; // -1 to 1

      const tiltMax = card.classList.contains('port-tile') ? 8 : 5;
      card.style.transform = `perspective(1000px) rotateX(${-yPct * tiltMax}deg) rotateY(${xPct * tiltMax}deg) translateY(-5px)`;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);

      // Real-time mouse tracking split wipe for portfolio tiles
      if(card.classList.contains('port-tile')){
        const gradedStream = card.querySelector('.graded-stream');
        const divider = card.querySelector('.split-divider-line');
        if (card.classList.contains('is-playing')) {
          if(gradedStream) gradedStream.style.clipPath = 'none';
          if(divider) divider.style.display = 'none';
        } else {
          const splitPct = Math.min(100, Math.max(0, (x / rect.width) * 100));
          if(gradedStream){
            gradedStream.style.clipPath = `inset(0 ${100 - splitPct}% 0 0)`;
          }
          if(divider){
            divider.style.display = 'block';
            divider.style.left = `${splitPct}%`;
          }
        }
      }
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      if(card.classList.contains('port-tile')){
        const gradedStream = card.querySelector('.graded-stream');
        const divider = card.querySelector('.split-divider-line');
        if (divider) divider.style.display = 'none';
        if(gradedStream){
          if(card.classList.contains('is-playing')){
            gradedStream.style.clipPath = 'none';
          } else {
            gradedStream.style.clipPath = '';
          }
        }
      }
    });
  });

  // Hero comparison 3D subtle tilt
  const compareWrap = document.querySelector('.compare-wrap');
  if(compareWrap){
    compareWrap.addEventListener('mousemove', e => {
      const rect = compareWrap.getBoundingClientRect();
      const xPct = (e.clientX - rect.left) / rect.width - 0.5;
      const yPct = (e.clientY - rect.top) / rect.height - 0.5;
      compareWrap.style.transform = `perspective(1200px) rotateY(${xPct * 4}deg) rotateX(${-yPct * 4}deg)`;
    });
    compareWrap.addEventListener('mouseleave', () => {
      compareWrap.style.transform = '';
    });
  }
})();

/* ============ magnetic button pull ============ */
(function initMagneticButtons(){
  if(window.matchMedia('(pointer: coarse)').matches) return;
  const buttons = document.querySelectorAll('.btn, .filter-btn, .play-btn, .loop-btn, .audio-mute-btn, #navToggle');
  buttons.forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const x = (e.clientX - rect.left) - rect.width / 2;
      const y = (e.clientY - rect.top) - rect.height / 2;
      btn.style.transform = `translate(${x * 0.22}px, ${y * 0.22}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
})();

/* ============ interactive audio waveform visualizer ============ */
(function initAudioWaveVisualizer(){
  const canvas = document.getElementById('audioWaveCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  if(!ctx) return;

  function resize(){
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  let phase = 0;
  function draw(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = canvas.width;
    const h = canvas.height;
    const barCount = Math.floor(w / 7);
    const scrollPct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight || 1);

    for(let i = 0; i < barCount; i++){
      const x = i * 7;
      const normX = i / barCount;
      const wave1 = Math.sin(normX * 14 + phase + scrollPct * 12);
      const wave2 = Math.cos(normX * 28 - phase * 0.9);
      const wave3 = Math.sin(normX * 8 + phase * 1.6);
      
      const amplitude = (Math.abs(wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2)) * (h * 0.75);
      const barH = Math.max(3, amplitude);
      const y = (h - barH) / 2;

      ctx.fillStyle = `rgba(242, 201, 76, ${0.25 + (amplitude / h) * 0.55})`;
      ctx.fillRect(x, y, 3.5, barH);
    }
    phase += 0.05;
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();

/* ============ click ripple wave ============ */
document.addEventListener('click', e => {
  const target = e.target.closest('.btn, .port-tile, .filter-btn, .play-btn, .loop-btn, .audio-mute-btn, .svc-card, .price-card');
  if(!target) return;
  const rect = target.getBoundingClientRect();
  const ripple = document.createElement('span');
  ripple.className = 'click-ripple';
  const size = Math.max(rect.width, rect.height) * 1.6;
  ripple.style.width = size + 'px';
  ripple.style.height = size + 'px';
  ripple.style.left = (e.clientX - rect.left) + 'px';
  ripple.style.top = (e.clientY - rect.top) + 'px';
  target.appendChild(ripple);
  setTimeout(() => ripple.remove(), 700);
});
