/* ---------- enhanced cinematic animations ---------- */
(function(){
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarse = window.matchMedia('(pointer: coarse)').matches;

  /* inject atmosphere layers if missing (works even without HTML edits) */
  const hero = document.getElementById('hero');
  if(hero){
    if(!document.getElementById('filmDust')){
      const dust = document.createElement('div');
      dust.id = 'filmDust';
      dust.className = 'film-dust';
      dust.setAttribute('aria-hidden', 'true');
      hero.insertBefore(dust, hero.querySelector('.wrap'));
    }
    if(!hero.querySelector('.hero-vignette')){
      const v = document.createElement('div');
      v.className = 'hero-vignette';
      v.setAttribute('aria-hidden', 'true');
      hero.insertBefore(v, hero.querySelector('.wrap'));
    }
    if(!hero.querySelector('.scan-beam')){
      const s = document.createElement('div');
      s.className = 'scan-beam';
      s.setAttribute('aria-hidden', 'true');
      hero.insertBefore(s, hero.querySelector('.wrap'));
    }
  }

  /* loader TC scramble */
  const slateTc = document.querySelector('.slate-tc');
  if(slateTc && !reduceMotion){
    slateTc.classList.add('loading');
    const original = slateTc.textContent;
    let frame = 0;
    const scramble = setInterval(()=>{
      frame++;
      const rnd = () => String(Math.floor(Math.random()*30)).padStart(2,'0');
      slateTc.textContent = `TC ${rnd()}:${rnd()}:${rnd()}:${rnd()} — LOADING TAKE`;
      if(frame > 28){
        clearInterval(scramble);
        slateTc.textContent = original;
        slateTc.classList.remove('loading');
      }
    }, 45);
  }

  /* floating film dust */
  const dustEl = document.getElementById('filmDust');
  if(dustEl && !reduceMotion){
    for(let i = 0; i < 26; i++){
      const p = document.createElement('span');
      p.className = 'particle';
      const size = 1 + Math.random() * 3;
      p.style.setProperty('--dur', (8 + Math.random() * 14) + 's');
      p.style.setProperty('--delay', (Math.random() * 12) + 's');
      p.style.setProperty('--dx', ((Math.random() - 0.5) * 180) + 'px');
      p.style.setProperty('--dy', (-80 - Math.random() * 160) + 'px');
      p.style.setProperty('--peak', String(0.15 + Math.random() * 0.35));
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.left = (Math.random() * 100) + '%';
      p.style.top = (40 + Math.random() * 55) + '%';
      dustEl.appendChild(p);
    }
  }

  /* section title underline sync */
  document.querySelectorAll('.section-head h2').forEach(h2=>{
    if(h2.classList.contains('in') || !h2.hasAttribute('data-reveal')){
      const obs = new IntersectionObserver((entries)=>{
        entries.forEach(e=>{
          if(e.isIntersecting){ e.target.classList.add('in'); obs.unobserve(e.target); }
        });
      }, { threshold: 0.55 });
      obs.observe(h2);
    }
  });

  /* hero compare auto-sweep (pauses when user drags) */
  const compareRange = document.getElementById('compareRange');
  const compareWrap = document.querySelector('#hero .compare');
  const gradedFrame = document.getElementById('gradedFrame');
  const handle = document.getElementById('handle');
  if(compareRange && compareWrap && gradedFrame && handle && !reduceMotion && !isCoarse){
    let idleTimer, animId, userActive = false;

    function setVal(v){
      const clamped = Math.max(0, Math.min(100, v));
      compareRange.value = clamped;
      gradedFrame.style.clipPath = `inset(0 ${100 - clamped}% 0 0)`;
      handle.style.left = clamped + '%';
    }

    function startSweep(){
      if(userActive) return;
      compareWrap.classList.add('auto-sweep');
      const start = performance.now();
      const duration = 5200;
      (function sweep(now){
        if(userActive) return;
        const t = ((now - start) % duration) / duration;
        setVal(50 + Math.sin(t * Math.PI * 2) * 38);
        animId = requestAnimationFrame(sweep);
      })(start);
    }

    function stopSweep(){
      compareWrap.classList.remove('auto-sweep');
      if(animId) cancelAnimationFrame(animId);
    }

    const markActive = ()=>{
      userActive = true;
      stopSweep();
      clearTimeout(idleTimer);
    };
    compareRange.addEventListener('pointerdown', markActive);
    compareRange.addEventListener('input', markActive);
    compareRange.addEventListener('pointerup', ()=>{
      idleTimer = setTimeout(()=>{ userActive = false; startSweep(); }, 4500);
    });
    idleTimer = setTimeout(startSweep, 2600);
  }

  /* light parallax on hero copy */
  if(!reduceMotion){
    const parallaxEls = [
      document.querySelector('#hero .eyebrow'),
      document.querySelector('#hero .lede'),
      document.querySelector('#hero .trust-row')
    ].filter(Boolean);
    parallaxEls.forEach(el => el.classList.add('hero-parallax'));
    document.addEventListener('scroll', ()=>{
      const y = window.scrollY;
      if(y > 700) return;
      parallaxEls.forEach((el, i)=>{
        el.style.transform = `translate3d(0, ${y * (0.035 + i * 0.018)}px, 0)`;
      });
    }, { passive: true });
  }

  /* mark active testimonial slide */
  const tTrack = document.getElementById('tTrack');
  if(tTrack){
    const slides = [...tTrack.children];
    const sync = ()=>{
      const m = (tTrack.style.transform || '').match(/-?[\d.]+/);
      const pct = m ? Math.abs(parseFloat(m[0])) : 0;
      const idx = Math.round(pct / 100) % slides.length;
      slides.forEach((s, i) => s.classList.toggle('active', i === idx));
    };
    slides[0]?.classList.add('active');
    document.getElementById('tNext')?.addEventListener('click', ()=> setTimeout(sync, 40));
    document.getElementById('tPrev')?.addEventListener('click', ()=> setTimeout(sync, 40));
    document.getElementById('tDots')?.addEventListener('click', ()=> setTimeout(sync, 40));
    setInterval(sync, 800);
  }

  /* portfolio filter morph — replace prior handlers cleanly */
  document.querySelectorAll('.filters').forEach(group=>{
    const buttons = [...group.querySelectorAll('.filter-btn')];
    buttons.forEach(btn=>{
      const clone = btn.cloneNode(true);
      btn.parentNode.replaceChild(clone, btn);
    });
    group.querySelectorAll('.filter-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        group.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const f = btn.dataset.filter;
        document.querySelectorAll('.port-tile').forEach(tile=>{
          const match = f === 'all' || tile.dataset.cat === f;
          if(!match){
            tile.classList.add('filter-out');
            setTimeout(()=>{
              if(tile.classList.contains('filter-out')) tile.classList.add('hidden');
            }, 380);
          } else {
            tile.classList.remove('hidden');
            requestAnimationFrame(()=> tile.classList.remove('filter-out'));
          }
        });
      });
    });
  });

  /* click ripple on custom cursor */
  if(!isCoarse && !reduceMotion){
    document.addEventListener('click', e=>{
      const ripple = document.createElement('span');
      ripple.className = 'cursor-ripple';
      ripple.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;`;
      document.body.appendChild(ripple);
      ripple.addEventListener('animationend', ()=> ripple.remove());
    });
    if(!document.getElementById('fxExtraStyles')){
      const s = document.createElement('style');
      s.id = 'fxExtraStyles';
      s.textContent = `
        .cursor-ripple{
          position:fixed; width:34px; height:34px; border:1px solid var(--gold-bright);
          border-radius:50%; transform:translate(-50%,-50%) scale(1);
          pointer-events:none; z-index:9997; opacity:.75;
          animation:cursorRipple .55s cubic-bezier(.16,1,.3,1) forwards;
        }
        @keyframes cursorRipple{ to{ transform:translate(-50%,-50%) scale(2.6); opacity:0; } }
        @keyframes lbFlash{ from{opacity:1} to{opacity:0} }
      `;
      document.head.appendChild(s);
    }
  }

  /* lightbox open flash */
  const lightbox = document.getElementById('lightbox');
  if(lightbox){
    const obs = new MutationObserver(()=>{
      if(!lightbox.classList.contains('open') || reduceMotion) return;
      const flash = document.createElement('div');
      flash.style.cssText = 'position:fixed;inset:0;z-index:9499;pointer-events:none;background:radial-gradient(circle,rgba(242,201,76,.16),transparent 60%);animation:lbFlash .4s ease-out forwards;';
      document.body.appendChild(flash);
      flash.addEventListener('animationend', ()=> flash.remove());
    });
    obs.observe(lightbox, { attributes: true, attributeFilter: ['class'] });
  }
})();
