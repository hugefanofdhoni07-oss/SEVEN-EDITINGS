/* ---------- loader ---------- */
  document.body.classList.add('lock');
  window.addEventListener('load', ()=>{
    setTimeout(()=>{
      document.getElementById('loader').classList.add('hide');
      document.body.classList.remove('lock');
    }, 1300);
  });

/* ---------- lenis smooth scroll ---------- */
  if(typeof Lenis !== 'undefined'){
    try {
      const lenis = new Lenis();
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    } catch(e) {
      console.warn('Lenis initialization failed:', e);
    }
  }

  /* ---------- hero split-text word reveal ---------- */
  (function splitHeroTitle(){
    const h1 = document.querySelector('#hero h1');
    if(!h1) return;
    // preserve inner markup (e.g. the <span class="gold"> line break group) by splitting per top-level node
    const walker = (node, delayStart) => {
      let delay = delayStart;
      const frag = document.createDocumentFragment();
      node.childNodes.forEach(child=>{
        if(child.nodeType === Node.TEXT_NODE){
          child.textContent.split(/(\s+)/).forEach(chunk=>{
            if(chunk.trim() === ''){ if(chunk) frag.appendChild(document.createTextNode(chunk)); return; }
            const wrap = document.createElement('span'); wrap.className = 'word';
            const inner = document.createElement('span');
            inner.textContent = chunk;
            inner.style.animationDelay = delay.toFixed(2) + 's';
            delay += 0.045;
            wrap.appendChild(inner);
            frag.appendChild(wrap);
          });
        } else if(child.nodeType === Node.ELEMENT_NODE){
          const clone = child.cloneNode(false);
          const result = walker(child, delay);
          clone.appendChild(result.frag);
          delay = result.delay;
          frag.appendChild(clone);
        }
      });
      return { frag, delay };
    };
    const baseDelay = 1.05; // sync with existing heroIn animation-delay for h1
    const { frag } = walker(h1, baseDelay);
    h1.innerHTML = '';
    h1.appendChild(frag);
  })();

  /* ---------- reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  revealEls.forEach((el,i)=>{ el.style.setProperty('--d', (i%6)*0.08 + 's'); });
  const revealObserver = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){ entry.target.classList.add('in'); revealObserver.unobserve(entry.target); }
    });
  }, { threshold:.15 });
  revealEls.forEach(el=>revealObserver.observe(el));

  const strip = document.getElementById('strip');
  const stripObserver = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{ if(entry.isIntersecting){ entry.target.classList.add('in'); stripObserver.unobserve(entry.target); } });
  }, { threshold:.3 });
  stripObserver.observe(strip);

  /* ---------- stat counters ---------- */
  const statEls = document.querySelectorAll('[data-count]');
  const statObserver = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        const el = entry.target;
        const target = parseFloat(el.dataset.count);
        const decimal = parseInt(el.dataset.decimal || "0");
        const divisor = decimal ? Math.pow(10, decimal) : 1;
        const realTarget = decimal ? target/10 : target;
        const suffix = el.dataset.suffix || "";
        const dur = 1400; const start = performance.now();
        function tick(now){
          const p = Math.min(1, (now-start)/dur);
          const eased = 1 - Math.pow(1-p, 3);
          const val = realTarget * eased;
          el.textContent = (decimal ? val.toFixed(decimal) : Math.round(val)) + suffix;
          if(p < 1){ requestAnimationFrame(tick); } else { el.classList.add('done'); }
        }
        requestAnimationFrame(tick);
        statObserver.unobserve(el);
      }
    });
  }, { threshold:.4 });
  statEls.forEach(el=>statObserver.observe(el));

  /* ---------- header hide/show + scrolled state ---------- */
  const header = document.getElementById('siteHeader');
  let lastY = window.scrollY;

  /* ---------- scroll scrubber ---------- */
  const playhead = document.getElementById('playhead');
  const tcReadout = document.getElementById('tcReadout');
  const ticksEl = document.getElementById('ticks');
  const ticketTc = document.getElementById('ticketTc');
  for(let i=0;i<41;i++){ const s=document.createElement('span'); ticksEl.appendChild(s); }

  function formatTc(totalFrames){
    const fps=30;
    const h = Math.floor(totalFrames/(3600*fps));
    const m = Math.floor((totalFrames/fps%3600)/60);
    const s = Math.floor(totalFrames/fps%60);
    const f = Math.floor(totalFrames%fps);
    const p = n => String(n).padStart(2,'0');
    return `${p(h)}:${p(m)}:${p(s)}:${p(f)}`;
  }

  function onScroll(){
    const doc = document.documentElement;
    const scrollPct = doc.scrollTop / (doc.scrollHeight - doc.clientHeight);
    const pct = Math.min(1, Math.max(0, scrollPct || 0));
    playhead.style.left = (pct*100) + '%';
    const totalRuntimeFrames = 2*3600*30 + 30*30;
    tcReadout.innerHTML = `TC <b>${formatTc(pct*totalRuntimeFrames)}</b> / 02:30:00:00`;
    ticketTc.textContent = formatTc(pct*totalRuntimeFrames);

    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 40);
    if(y > lastY && y > 200){ header.classList.add('hide-nav'); } else { header.classList.remove('hide-nav'); }
    lastY = y;

    if(heroBg){ heroBg.style.transform = `translate3d(0, ${y*0.18}px, 0)`; }
  }
  document.addEventListener('scroll', onScroll, {passive:true});
  const heroBg = document.querySelector('.hero-bg');
  onScroll();

  /* ---------- hero compare ---------- */
  function wireCompare(rangeId, gradedId, handleId){
    const range = document.getElementById(rangeId);
    const gradedFrame = document.getElementById(gradedId);
    const handle = document.getElementById(handleId);
    function update(v){ gradedFrame.style.clipPath = `inset(0 ${100-v}% 0 0)`; handle.style.left = v + '%'; }
    range.addEventListener('input', e => update(e.target.value));
    update(range.value);
  }
  wireCompare('compareRange','gradedFrame','handle');
  wireCompare('modalRange','modalGradedFrame','modalHandle');

  /* ---------- portfolio data + render ---------- */
  const cuts = [
    {id:'CUT_01', cat:'Color Grading', a:'#3a2a0d', b:'#171006', photo:'https://picsum.photos/id/1018/700/875'},
    {id:'CUT_02', cat:'Photo Retouching', a:'#4a3512', b:'#1c1409', photo:'https://picsum.photos/id/823/700/875'},
    {id:'CUT_03', cat:'Cinematic Edit', a:'#2e2108', b:'#120d05', photo:'https://picsum.photos/id/1050/700/875'},
    {id:'CUT_04', cat:'Thumbnail Design', a:'#5a3f10', b:'#221808', photo:'https://picsum.photos/id/96/700/875'},
    {id:'CUT_05', cat:'Social Content', a:'#3a2a0d', b:'#0f0b05', photo:'https://picsum.photos/id/1062/700/875'},
    {id:'CUT_06', cat:'Color Grading', a:'#4a3512', b:'#171006', photo:'https://picsum.photos/id/1039/700/875'},
    {id:'CUT_07', cat:'Photo Retouching', a:'#4f3814', b:'#1a1207', photo:'https://picsum.photos/id/180/700/875'},
    {id:'CUT_08', cat:'Cinematic Edit', a:'#3a2a0d', b:'#0f0c07', photo:'https://picsum.photos/id/1015/700/875'},
    {id:'CUT_09', cat:'Social Content', a:'#5a3f10', b:'#171006', photo:'https://picsum.photos/id/1074/700/875'}
  ];
  const portGrid = document.getElementById('portGrid');
  cuts.forEach((c,i)=>{
    const tile = document.createElement('div');
    tile.className='port-tile';
    tile.dataset.cat = c.cat;
    tile.dataset.reveal = 'scale';
    tile.style.setProperty('--d', (i%6)*0.07 + 's');
    tile.innerHTML = `
      <div class="art">
        <div class="before" style="background-image:url('${c.photo}'); filter:grayscale(.65) contrast(.82) brightness(.75) saturate(.55);"></div>
        <div class="after" style="background-image:url('${c.photo}'); filter:saturate(1.3) contrast(1.1) brightness(1.02) sepia(.08);"></div>
        <div class="tint" style="background:linear-gradient(135deg, ${c.a}, ${c.b}); opacity:.5;"></div>
      </div>
      <span class="scan"></span>
      <div class="play"></div>
      <div class="overlay"><span class="cutid mono">${c.id}</span><span class="cat">${c.cat}</span></div>`;
    tile.addEventListener('click', ()=> openLightbox(c));
    revealObserver.observe(tile);
    portGrid.appendChild(tile);
  });

  /* ---------- portfolio tile tilt (skip on touch / reduced motion) ---------- */
  if(!window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    document.querySelectorAll('.port-tile').forEach(tile=>{
      tile.addEventListener('mousemove', e=>{
        const rect = tile.getBoundingClientRect();
        const dx = (e.clientX - rect.left) / rect.width - 0.5;
        const dy = (e.clientY - rect.top) / rect.height - 0.5;
        tile.style.transform = `perspective(900px) rotateY(${dx*7}deg) rotateX(${-dy*7}deg) translateY(-4px)`;
      });
      tile.addEventListener('mouseleave', ()=>{ tile.style.transform = ''; });
    });
  }

  document.querySelectorAll('.filter-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      document.querySelectorAll('.port-tile').forEach(tile=>{
        const match = f === 'all' || tile.dataset.cat === f;
        tile.classList.toggle('hidden', !match);
      });
    });
  });

  /* ---------- lightbox ---------- */
  const lightbox = document.getElementById('lightbox');
  const modalCutId = document.getElementById('modalCutId');
  const modalCat = document.getElementById('modalCat');
  const modalRawFrame = document.getElementById('modalRawFrame');
  const modalGradedFrame = document.getElementById('modalGradedFrame');
  function openLightbox(c){
    modalCutId.textContent = c.id;
    modalCat.textContent = c.cat;
    modalRawFrame.style.backgroundImage = `url('${c.photo}')`;
    modalRawFrame.style.filter = 'grayscale(.65) contrast(.82) brightness(.75) saturate(.55)';
    modalGradedFrame.style.backgroundImage = `url('${c.photo}')`;
    modalGradedFrame.style.filter = 'saturate(1.3) contrast(1.1) brightness(1.02) sepia(.08)';
    lightbox.classList.add('open');
    document.body.classList.add('lock');
  }
  function closeLightbox(){ lightbox.classList.remove('open'); document.body.classList.remove('lock'); }
  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e=>{ if(e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', e=>{ if(e.key === 'Escape') closeLightbox(); });

  /* ---------- testimonials carousel ---------- */
  const tTrack = document.getElementById('tTrack');
  const slides = tTrack.children.length;
  const tDots = document.getElementById('tDots');
  let tIndex = 0, tTimer;
  for(let i=0;i<slides;i++){
    const d = document.createElement('div');
    d.className = 't-dot' + (i===0?' active':'');
    d.addEventListener('click', ()=> goTo(i));
    tDots.appendChild(d);
  }
  const tProgressFill = document.getElementById('tProgressFill');
  function goTo(i){
    tIndex = (i + slides) % slides;
    tTrack.style.transform = `translateX(-${tIndex*100}%)`;
    [...tDots.children].forEach((d,idx)=>d.classList.toggle('active', idx===tIndex));
    resetAuto();
  }
  function resetAuto(){
    clearInterval(tTimer);
    tTimer = setInterval(()=>goTo(tIndex+1), 6000);
    if(tProgressFill){
      tProgressFill.classList.remove('run');
      void tProgressFill.offsetWidth; // restart CSS animation
      tProgressFill.classList.add('run');
    }
  }
  document.getElementById('tNext').addEventListener('click', ()=>goTo(tIndex+1));
  document.getElementById('tPrev').addEventListener('click', ()=>goTo(tIndex-1));
  resetAuto();

  /* ---------- faq accordion ---------- */
  document.querySelectorAll('.faq-item').forEach(item=>{
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    if(item.classList.contains('open')) a.style.maxHeight = a.scrollHeight + 'px';
    q.addEventListener('click', ()=>{
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(other=>{
        other.classList.remove('open');
        other.querySelector('.faq-a').style.maxHeight = null;
      });
      if(!isOpen){ item.classList.add('open'); a.style.maxHeight = a.scrollHeight + 'px'; }
    });
  });

  /* ---------- mobile nav ---------- */
  const navToggle = document.getElementById('navToggle');
  const navUl = document.querySelector('nav ul');
  navToggle.addEventListener('click', ()=>{
    const open = navUl.style.display === 'flex';
    navUl.style.display = open ? 'none' : 'flex';
    navUl.style.flexDirection = 'column';
    navUl.style.position='fixed';
    navUl.style.top='34px'; navUl.style.right='0';
    navUl.style.background='var(--ink)';
    navUl.style.padding='20px 28px';
    navUl.style.border='1px solid var(--line)';
    navUl.style.gap='18px';
  });
  document.querySelectorAll('nav a').forEach(a=>a.addEventListener('click', ()=>{
    if(window.innerWidth <= 640) navUl.style.display = 'none';
  }));

  /* ---------- contact form (demo only) ---------- */
  document.getElementById('projectForm').addEventListener('submit', function(e){
    e.preventDefault();
    const btn = this.querySelector('button');
    const original = btn.textContent;
    btn.textContent = 'Queued ✓';
    this.reset();
    setTimeout(()=>{ btn.textContent = original; }, 2200);
  });

  /* ---------- hero tilt parallax ---------- */
  const isCoarseEarly = window.matchMedia('(pointer: coarse)').matches;
  const reduceMotionEarly = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const heroSection = document.getElementById('hero');
  const heroCard = document.querySelector('.compare-wrap');
  if(heroSection && heroCard && !isCoarseEarly && !reduceMotionEarly){
    heroSection.addEventListener('mousemove', e=>{
      const rect = heroCard.getBoundingClientRect();
      const cx = rect.left + rect.width/2;
      const cy = rect.top + rect.height/2;
      const dx = (e.clientX - cx) / (rect.width/2);
      const dy = (e.clientY - cy) / (rect.height/2);
      const clampedX = Math.max(-1, Math.min(1, dx));
      const clampedY = Math.max(-1, Math.min(1, dy));
      heroCard.style.transform = `perspective(1200px) rotateY(${clampedX*4}deg) rotateX(${-clampedY*4}deg)`;
    });
    heroSection.addEventListener('mouseleave', ()=>{ heroCard.style.transform = ''; });
  }

  /* ---------- custom cursor ---------- */
  const isCoarse = window.matchMedia('(pointer: coarse)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(isCoarse || reduceMotion){
    document.documentElement.classList.add('no-custom-cursor');
  } else {
    const ring = document.getElementById('cursorRing');
    const dot = document.getElementById('cursorDot');
    let rx=0, ry=0, dx=0, dy=0;
    window.addEventListener('mousemove', e=>{ dx=e.clientX; dy=e.clientY; dot.style.left=dx+'px'; dot.style.top=dy+'px'; });
    function loop(){
      rx += (dx-rx)*0.16; ry += (dy-ry)*0.16;
      ring.style.left = rx+'px'; ring.style.top = ry+'px';
      requestAnimationFrame(loop);
    }
    loop();
    // circular hover state for text-entry fields
    document.querySelectorAll('input, textarea, select').forEach(el=>{
      el.addEventListener('mouseenter', ()=>{ ring.classList.add('hover'); dot.classList.add('hover'); });
      el.addEventListener('mouseleave', ()=>{ ring.classList.remove('hover'); dot.classList.remove('hover'); });
    });
    // viewfinder hover state for clickable/interactive elements
    document.querySelectorAll('a, button, .port-tile, .faq-q').forEach(el=>{
      el.addEventListener('mouseenter', ()=>ring.classList.add('hover-frame'));
      el.addEventListener('mouseleave', ()=>ring.classList.remove('hover-frame'));
    });
  }

  /* ---------- magnetic pull for buttons & nav links ---------- */
  if(!isCoarse && !reduceMotion){
    document.querySelectorAll('.btn, .filter-btn, .t-arrow, nav a').forEach(el=>{
      const strength = el.classList.contains('btn') ? 0.28 : 0.35;
      el.addEventListener('mousemove', e=>{
        const rect = el.getBoundingClientRect();
        const mx = (e.clientX - rect.left - rect.width/2) * strength;
        const my = (e.clientY - rect.top - rect.height/2) * strength;
        el.style.transform = `translate(${mx}px, ${my}px)`;
      });
      el.addEventListener('mouseleave', ()=>{ el.style.transform = ''; });
    });
  }
