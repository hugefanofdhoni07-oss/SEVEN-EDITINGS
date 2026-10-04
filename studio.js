/* ---------- studio core engine ---------- */
document.body.classList.add('lock');
window.addEventListener('load', ()=>{
  setTimeout(()=>{
    const loader = document.getElementById('loader');
    if(loader) loader.classList.add('hide');
    document.body.classList.remove('lock');
  }, 1300);
});

/* ---------- continuous marquee ticker engine ---------- */
(function initContinuousMarquee(){
  function startMarquee(){
    const track = document.querySelector('.marquee-track');
    if(!track) return;

    let pos = 0;
    const speed = 1.2; // pixels per frame at 60fps

    function tick(){
      pos += speed;
      const totalHalf = track.scrollWidth / 2;
      if(totalHalf > 0 && pos >= totalHalf){
        pos -= totalHalf;
      }
      track.style.transform = `translate3d(-${pos}px, 0, 0)`;
      requestAnimationFrame(tick);
    }
    track.style.animation = 'none'; // Use JS rAF for 100% reliable continuous 60fps motion
    requestAnimationFrame(tick);
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', startMarquee);
  } else {
    startMarquee();
  }
})();

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
  const baseDelay = 1.05;
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
if(strip){
  const stripObserver = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{ if(entry.isIntersecting){ entry.target.classList.add('in'); stripObserver.unobserve(entry.target); } });
  }, { threshold:.3 });
  stripObserver.observe(strip);
}

/* ---------- stat counters ---------- */
const statEls = document.querySelectorAll('[data-count]');
const statObserver = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      const el = entry.target;
      const target = parseFloat(el.dataset.count);
      const decimal = parseInt(el.dataset.decimal || "0");
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
if(ticksEl){
  for(let i=0;i<41;i++){ const s=document.createElement('span'); ticksEl.appendChild(s); }
}

function formatTc(totalFrames){
  const fps=30;
  const h = Math.floor(totalFrames/(3600*fps));
  const m = Math.floor((totalFrames/fps%3600)/60);
  const s = Math.floor(totalFrames/fps%60);
  const f = Math.floor(totalFrames%fps);
  const p = n => String(n).padStart(2,'0');
  return `${p(h)}:${p(m)}:${p(s)}:${p(f)}`;
}

const heroBg = document.querySelector('.hero-bg');

function onScroll(){
  const doc = document.documentElement;
  const scrollPct = doc.scrollTop / (doc.scrollHeight - doc.clientHeight);
  const pct = Math.min(1, Math.max(0, scrollPct || 0));
  if(playhead) playhead.style.left = (pct*100) + '%';
  const totalRuntimeFrames = 2*3600*30 + 30*30;
  if(tcReadout) {
    tcReadout.innerHTML = `<span class="audio-live-pill"><span class="dot"></span>LIVE TIMELINE</span>TC <b>${formatTc(pct*totalRuntimeFrames)}</b> / 02:30:00:00`;
  }
  if(ticketTc) ticketTc.textContent = formatTc(pct*totalRuntimeFrames);

  const y = window.scrollY;
  if(header){
    header.classList.toggle('scrolled', y > 40);
    if(y > lastY && y > 200){ header.classList.add('hide-nav'); } else { header.classList.remove('hide-nav'); }
  }
  lastY = y;

  if(heroBg){ heroBg.style.transform = `translate3d(0, ${y*0.18}px, 0)`; }
}
document.addEventListener('scroll', onScroll, {passive:true});
onScroll();

/* ---------- hero compare (Preserved Demo Comparison Photo) ---------- */
function wireHeroCompare(rangeId, gradedId, handleId){
  const range = document.getElementById(rangeId);
  const gradedFrame = document.getElementById(gradedId);
  const handle = document.getElementById(handleId);
  if(!range || !gradedFrame || !handle) return;
  function update(v){ gradedFrame.style.clipPath = `inset(0 ${100-v}% 0 0)`; handle.style.left = v + '%'; }
  range.addEventListener('input', e => update(e.target.value));
  update(range.value);
}
wireHeroCompare('compareRange','gradedFrame','handle');

/* ==========================================================================
   AUTHENTIC VIDEO PLAYBACK & HIGH-PRECISION AUDIO SUITE ENGINE
   ========================================================================== */

function formatMinSec(totalSeconds) {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00';
  const m = Math.floor(totalSeconds / 60);
  const sec = Math.floor(totalSeconds % 60);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function formatSMPTETimecode(totalSeconds, fps = 30) {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00:00:00';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const sec = Math.floor(totalSeconds % 60);
  const frames = Math.floor((totalSeconds - Math.floor(totalSeconds)) * fps);
  const p = n => String(n).padStart(2, '0');
  return `${p(h)}:${p(m)}:${p(sec)}:${p(frames)}`;
}

/* ---------- Portfolio Cuts Data (Local Master Files with Real Audio) ---------- */
const cuts = [
  {id:'CUT_01', cat:'Instagram Reels', fps:'29.97 FPS', video:'videos/1000202673.mp4', title:'Instagram Reels Master', a:'#3a2a0d', b:'#171006'},
  {id:'CUT_02', cat:'Text Intro', fps:'60.00 FPS', video:'videos/1000202674.mp4', title:'Motion Typography & Text Intro', a:'#4a3512', b:'#1c1409'},
  {id:'CUT_03', cat:'Title card recreation', fps:'24.00 FPS', video:'videos/1000202677.mp4', title:'Title Card Recreation', a:'#2e2108', b:'#120d05'},
  {id:'CUT_04', cat:'Cinema Edits', fps:'30.00 FPS', video:'videos/1000202679.mp4', title:'Cinematic Action Cut', a:'#5a3f10', b:'#221808'},
  {id:'CUT_05', cat:'Speed Ramp', fps:'60.00 FPS', video:'videos/1000202681.mp4', title:'Dynamic Speed Ramp Transition', a:'#3a2a0d', b:'#0f0b05'},
  {id:'CUT_06', cat:'Quality Enhancement', fps:'24.00 FPS', video:'videos/1000202683.mp4', title:'4K Quality Enhancement & Master', a:'#4a3512', b:'#171006'},
  {id:'CUT_07', cat:'Ai Scenes Recreations', fps:'30.00 FPS', video:'videos/1000202685.mp4', title:'AI VFX Scene Recreation', a:'#4f3814', b:'#1a1207'}
];

/* ---------- Portfolio Tile Controllers System ---------- */
const tileControllers = [];

const portGrid = document.getElementById('portGrid');
if(portGrid){
  cuts.forEach((c, i)=>{
    const tile = document.createElement('div');
    tile.className = 'port-tile';
    tile.dataset.cat = c.cat;
    tile.dataset.index = i;
    tile.dataset.reveal = 'scale';
    tile.style.setProperty('--d', (i % 6) * 0.07 + 's');
    tile.innerHTML = `
      <div class="hud-head">
        <span class="rec-badge"><span class="rec-dot"></span>REC</span>
        <span class="fps-badge mono">${c.fps}</span>
        <span class="take-badge mono" id="tileDur-${i}">FULL TAKE</span>
        <span class="audio-badge"><span class="dot"></span>AUDIO</span>
      </div>
      <div class="art">
        <div class="port-video-wrap">
          <video class="port-video raw-stream" loop muted playsinline webkit-playsinline preload="metadata" src="${c.video}"></video>
          <video class="port-video graded-stream" loop muted playsinline webkit-playsinline preload="metadata" src="${c.video}"></video>
          <div class="grade-tint" style="background:linear-gradient(135deg, ${c.a}, ${c.b});"></div>
        </div>
      </div>
      <span class="scan"></span>
      <div class="play" role="button" aria-label="Toggle Playback"></div>
      <div class="overlay">
        <span class="cutid mono">${c.id}</span>
        <span class="cat">${c.cat}</span>
        <div class="port-controls">
          <button class="port-play-btn" type="button" aria-label="Play cut with sound">
            <span class="p-icon">▶</span>
            <span class="p-txt">PLAY WITH SOUND</span>
          </button>
          <button class="port-audio-btn sound-on" type="button" aria-label="Toggle Sound" title="Sound Toggle">🔊</button>
          <button class="port-rotate-btn" type="button" aria-label="Rotate Video" title="Rotate video 90°">
            <span class="rot-icon">⟳</span>
            <span class="rot-deg mono">0°</span>
          </button>
          <span class="port-tc-badge mono">00:00 / 00:00</span>
          <button class="port-suite-btn" type="button" title="Open full theater player">THEATER ↗</button>
        </div>
      </div>
      <div class="port-progress-track"><div class="port-progress-fill"></div></div>`;

    const rawV = tile.querySelector('.raw-stream');
    const gradedV = tile.querySelector('.graded-stream');
    const videoWrap = tile.querySelector('.port-video-wrap');
    const playBtn = tile.querySelector('.port-play-btn');
    const playCenter = tile.querySelector('.play');
    const tcBadge = tile.querySelector('.port-tc-badge');
    const progFill = tile.querySelector('.port-progress-fill');
    const suiteBtn = tile.querySelector('.port-suite-btn');
    const audioBtn = tile.querySelector('.port-audio-btn');
    const rotateBtn = tile.querySelector('.port-rotate-btn');
    const tileDurBadge = tile.querySelector(`#tileDur-${i}`);
    const pIcon = playBtn?.querySelector('.p-icon');
    const pTxt = playBtn?.querySelector('.p-txt');

    let isTileMuted = false;
    let tileRotation = 0;

    // Load actual video duration on metadata ready
    gradedV.addEventListener('loadedmetadata', () => {
      if(tileDurBadge && gradedV.duration) {
        tileDurBadge.textContent = `${formatMinSec(gradedV.duration)} TAKE`;
      }
      if(tcBadge && gradedV.duration) {
        tcBadge.textContent = `00:00 / ${formatMinSec(gradedV.duration)}`;
      }
    });

    const ctrl = {
      tile,
      rawV,
      gradedV,
      videoWrap,
      playBtn,
      tcBadge,
      progFill,
      pIcon,
      pTxt,
      audioBtn,
      rotateBtn,
      cutData: c,
      index: i,
      rotation: 0,
      isPlaying: false,
      rafId: null,

      play() {
        // Pause other playing tiles and close/pause lightbox theater
        tileControllers.forEach(other => {
          if (other !== ctrl && other.isPlaying) other.pause();
        });
        if (isTheaterPlaying) theaterPause();

        // Baseline comparison stream is muted to prevent echo
        if (this.rawV) {
          this.rawV.muted = true;
          this.rawV.play().catch(() => {});
        }

        // Primary graded stream plays with master audio, fallback to muted if browser restricts
        if (this.gradedV) {
          this.gradedV.muted = isTileMuted;
          this.gradedV.volume = 1.0;
          
          const p = this.gradedV.play();
          if (p !== undefined) {
            p.then(() => {
              this.isPlaying = true;
              this.tile.classList.add('is-playing');
              this.tile.classList.remove('take-complete');
              if (this.pIcon) this.pIcon.textContent = '❚❚';
              if (this.pTxt) this.pTxt.textContent = 'PAUSE';
            }).catch(err => {
              console.warn('Audio play restricted by browser policy, falling back to muted playback:', err);
              this.gradedV.muted = true;
              isTileMuted = true;
              if (this.audioBtn) {
                this.audioBtn.textContent = '🔇';
                this.audioBtn.classList.remove('sound-on');
              }
              this.gradedV.play().then(() => {
                this.isPlaying = true;
                this.tile.classList.add('is-playing');
                this.tile.classList.remove('take-complete');
                if (this.pIcon) this.pIcon.textContent = '❚❚';
                if (this.pTxt) this.pTxt.textContent = 'PAUSE';
              }).catch(e => console.error('Video play error:', e));
            });
          }
        }

        this.isPlaying = true;
        this.tile.classList.add('is-playing');
        this.tile.classList.remove('take-complete');
        if (this.pIcon) this.pIcon.textContent = '❚❚';
        if (this.pTxt) this.pTxt.textContent = 'PAUSE';

        const tick = () => {
          if (!this.isPlaying) return;
          if (this.gradedV && this.gradedV.duration > 0) {
            const current = this.gradedV.currentTime;
            const dur = this.gradedV.duration;
            if (this.tcBadge) this.tcBadge.textContent = `${formatMinSec(current)} / ${formatMinSec(dur)}`;
            if (this.progFill) this.progFill.style.width = ((current / dur) * 100) + '%';
          }
          this.rafId = requestAnimationFrame(tick);
        };

        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.rafId = requestAnimationFrame(tick);
      },

      pause(completed = false) {
        this.isPlaying = false;
        if (this.rawV) this.rawV.pause();
        if (this.gradedV) this.gradedV.pause();
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.tile.classList.remove('is-playing');

        if (completed) {
          this.tile.classList.add('take-complete');
          if (this.pIcon) this.pIcon.textContent = '↺';
          if (this.pTxt) this.pTxt.textContent = 'REPLAY';
        } else {
          if (this.pIcon) this.pIcon.textContent = '▶';
          if (this.pTxt) this.pTxt.textContent = (this.gradedV && this.gradedV.currentTime > 0) ? 'RESUME' : 'PLAY WITH SOUND';
        }
      },

      toggle() {
        if (this.isPlaying) {
          this.pause();
        } else {
          this.play();
        }
      },

      toggleMute() {
        isTileMuted = !isTileMuted;
        if (this.gradedV) this.gradedV.muted = isTileMuted;
        if (this.audioBtn) {
          this.audioBtn.textContent = isTileMuted ? '🔇' : '🔊';
          this.audioBtn.classList.toggle('sound-on', !isTileMuted);
        }
      },

      rotate() {
        tileRotation = (tileRotation + 90) % 360;
        this.rotation = tileRotation;
        const rotDegEl = rotateBtn?.querySelector('.rot-deg');
        if (rotDegEl) rotDegEl.textContent = `${tileRotation}°`;
        if (rotateBtn) rotateBtn.classList.toggle('is-rotated', tileRotation !== 0);
        
        let scale = 1;
        if (tileRotation % 180 !== 0 && tile) {
          const tW = tile.clientWidth;
          const tH = tile.clientHeight;
          if (tW > 0 && tH > 0) {
            // When rotated 90° or 270°, fit cleanly inside the card without overflowing boundaries:
            scale = Math.min(tW / tH, 0.85);
          } else {
            scale = 0.8;
          }
        }
        if (videoWrap) {
          videoWrap.style.transform = `rotate(${tileRotation}deg) scale(${scale})`;
        }
      }
    };

    tileControllers.push(ctrl);

    // Hover video preview (cinematic muted preview on card hover)
    let hoverTimeout = null;
    tile.addEventListener('mouseenter', () => {
      if (ctrl.isPlaying) return;
      hoverTimeout = setTimeout(() => {
        if (!ctrl.isPlaying && gradedV) {
          gradedV.muted = true;
          const p = gradedV.play();
          if (p !== undefined) p.catch(() => {});
          if (rawV) {
            rawV.muted = true;
            rawV.play().catch(() => {});
          }
          tile.classList.add('is-previewing');
        }
      }, 100);
    });

    tile.addEventListener('mouseleave', () => {
      if (hoverTimeout) clearTimeout(hoverTimeout);
      if (!ctrl.isPlaying) {
        tile.classList.remove('is-previewing');
        if (gradedV) {
          gradedV.pause();
          gradedV.currentTime = 0;
        }
        if (rawV) {
          rawV.pause();
          rawV.currentTime = 0;
        }
        if (progFill) progFill.style.width = '0%';
        if (tcBadge && gradedV.duration) {
          tcBadge.textContent = `00:00 / ${formatMinSec(gradedV.duration)}`;
        }
      }
    });

    // When video ends
    gradedV.addEventListener('ended', () => {
      ctrl.pause(true);
    });

    // Play / Pause button click
    playBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      ctrl.toggle();
    });

    // Center play button click
    playCenter?.addEventListener('click', (e) => {
      e.stopPropagation();
      ctrl.toggle();
    });

    // Audio toggle button click
    audioBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      ctrl.toggleMute();
    });

    // Rotate button click
    rotateBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      ctrl.rotate();
    });

    // Open theater suite button click
    suiteBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      openVideoSuiteByIndex(i);
    });

    // Clicking tile overlay / cutid opens full theater
    tile.addEventListener('click', (e) => {
      if (e.target.closest('.port-play-btn') || e.target.closest('.play') || e.target.closest('.port-audio-btn') || e.target.closest('.port-rotate-btn')) return;
      openVideoSuiteByIndex(i);
    });

    revealObserver.observe(tile);
    portGrid.appendChild(tile);
  });
}

/* ---------- Portfolio Filter Buttons ---------- */
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.filter;
    document.querySelectorAll('.port-tile').forEach(tile => {
      const cat = tile.dataset.cat || '';
      const match = f === 'all' || cat === f ||
        (f === 'Text Intro' && (cat.includes('Text') || cat.includes('Title'))) ||
        (f === 'Quality Enhancement' && (cat.includes('Quality') || cat.includes('Enhancement'))) ||
        (f === 'Instagram Reels' && (cat.includes('Reel') || cat.includes('Social')));
      tile.classList.toggle('hidden', !match);
    });
  });
});

/* ---------- Interactive Video Theater Suite (Lightbox Modal) ---------- */
const lightbox = document.getElementById('lightbox');
const modalCutId = document.getElementById('modalCutId');
const modalCat = document.getElementById('modalCat');
const modalDurationPill = document.getElementById('modalDurationPill');
const theaterRawVideo = document.getElementById('theaterRawVideo');
const theaterGradedVideo = document.getElementById('theaterGradedVideo');
const theaterGradedStream = document.getElementById('theaterGradedStream');
const theaterRange = document.getElementById('theaterRange');
const theaterHandle = document.getElementById('theaterHandle');
const activeLutTag = document.getElementById('activeLutTag');
const theaterPlayBtn = document.getElementById('theaterPlayBtn');
const theaterLoopBtn = document.getElementById('theaterLoopBtn');
const theaterRotateBtn = document.getElementById('theaterRotateBtn');
const theaterRotDeg = document.getElementById('theaterRotDeg');
const theaterTimelineTrack = document.getElementById('theaterTimelineTrack');
const theaterTimelineFill = document.getElementById('theaterTimelineFill');
const theaterTimelineThumb = document.getElementById('theaterTimelineThumb');
const theaterTcDisplay = document.getElementById('theaterTcDisplay');
const theaterTcTotal = document.getElementById('theaterTcTotal');
const theaterTimeElapsed = document.getElementById('theaterTimeElapsed');
const theaterTimeTotal = document.getElementById('theaterTimeTotal');
const theaterContainer = document.getElementById('theaterContainer');
const theaterFeedback = document.getElementById('theaterFeedback');
const lightboxBackBtn = document.getElementById('lightboxBackBtn');
const prevCutBtn = document.getElementById('prevCutBtn');
const nextCutBtn = document.getElementById('nextCutBtn');
const theaterMuteBtn = document.getElementById('theaterMuteBtn');
const theaterSpeakerIcon = document.getElementById('theaterSpeakerIcon');
const theaterMuteTxt = document.getElementById('theaterMuteTxt');
const theaterVolumeSlider = document.getElementById('theaterVolumeSlider');
const theaterVolumeFill = document.getElementById('theaterVolumeFill');
const audioVuMeter = document.getElementById('audioVuMeter');
const theaterAudioStatus = document.getElementById('theaterAudioStatus');
const theaterFpsBadge = document.getElementById('theaterFpsBadge');

let currentCutIndex = 0;
let isTheaterPlaying = false;
let theaterSpeed = 1;
let theaterVolume = 1.0;
let isTheaterMuted = false;
let isTheaterLooping = true;
let theaterRotation = 0;
let theaterRafId = null;

function updateTheaterSplit(v){
  if(theaterGradedStream) theaterGradedStream.style.clipPath = `inset(0 ${100 - v}% 0 0)`;
  if(theaterHandle) theaterHandle.style.left = v + '%';
}
if(theaterRange){
  theaterRange.addEventListener('input', e => updateTheaterSplit(e.target.value));
}

function updateTheaterAudioUI(){
  if(theaterMuteBtn){
    theaterMuteBtn.classList.toggle('muted', isTheaterMuted || theaterVolume === 0);
  }
  if(theaterSpeakerIcon){
    if(isTheaterMuted || theaterVolume === 0){
      theaterSpeakerIcon.textContent = '🔇';
    } else if(theaterVolume < 0.3){
      theaterSpeakerIcon.textContent = '🔈';
    } else if(theaterVolume < 0.7){
      theaterSpeakerIcon.textContent = '🔉';
    } else {
      theaterSpeakerIcon.textContent = '🔊';
    }
  }
  if(theaterMuteTxt){
    theaterMuteTxt.textContent = (isTheaterMuted || theaterVolume === 0) ? 'MUTED' : 'SOUND ON';
  }
  if(theaterVolumeFill){
    theaterVolumeFill.style.width = isTheaterMuted ? '0%' : (theaterVolume * 100) + '%';
  }
  if(theaterAudioStatus){
    if(isTheaterMuted || theaterVolume === 0){
      theaterAudioStatus.textContent = 'MUTED (0%)';
      theaterAudioStatus.classList.remove('gold-pulse');
    } else {
      theaterAudioStatus.textContent = `MASTER STEREO (${Math.round(theaterVolume * 100)}%)`;
      theaterAudioStatus.classList.add('gold-pulse');
    }
  }
}

function updateTheaterUI(){
  if(!theaterGradedVideo) return;
  const current = theaterGradedVideo.currentTime || 0;
  const dur = theaterGradedVideo.duration || 0;
  const pct = dur > 0 ? Math.min(100, Math.max(0, (current / dur) * 100)) : 0;

  if(theaterTimelineFill) theaterTimelineFill.style.width = pct + '%';
  if(theaterTimelineThumb) theaterTimelineThumb.style.left = pct + '%';
  if(theaterTimeElapsed) theaterTimeElapsed.textContent = formatMinSec(current);
  if(theaterTimeTotal) theaterTimeTotal.textContent = formatMinSec(dur);
  if(theaterTcTotal) theaterTcTotal.textContent = formatSMPTETimecode(dur, 30);
  if(theaterTcDisplay) {
    theaterTcDisplay.innerHTML = `<span class="rec-dot-live"></span>TC <b>${formatSMPTETimecode(current, 30)}</b> / ${formatSMPTETimecode(dur, 30)}`;
  }
  if(modalDurationPill && dur > 0) {
    modalDurationPill.textContent = `RUNTIME: ${formatMinSec(dur)}`;
  }
}

function triggerTheaterCenterFeedback(isPlay){
  if(!theaterFeedback) return;
  const icon = theaterFeedback.querySelector('.fb-icon');
  if(icon) icon.textContent = isPlay ? '▶' : '❚❚';
  theaterFeedback.classList.remove('pop');
  void theaterFeedback.offsetWidth;
  theaterFeedback.classList.add('pop');
}

function theaterPlay(){
  if(!theaterGradedVideo) return;

  // Primary video stream — full audio
  theaterGradedVideo.muted = isTheaterMuted;
  theaterGradedVideo.volume = theaterVolume;
  theaterGradedVideo.playbackRate = theaterSpeed;

  const playPromise = theaterGradedVideo.play();
  if (playPromise !== undefined) {
    playPromise.then(() => {
      isTheaterPlaying = true;
      if(theaterPlayBtn) theaterPlayBtn.innerHTML = '<span>❚❚</span> Pause Take';
      if(audioVuMeter && !isTheaterMuted && theaterVolume > 0) {
        audioVuMeter.classList.add('playing');
      }
      triggerTheaterCenterFeedback(true);
    }).catch((err) => {
      console.warn('Theater audio play restricted, falling back to muted play:', err);
      theaterGradedVideo.muted = true;
      isTheaterMuted = true;
      updateTheaterAudioUI();
      theaterGradedVideo.play().then(() => {
        isTheaterPlaying = true;
        if(theaterPlayBtn) theaterPlayBtn.innerHTML = '<span>❚❚</span> Pause Take';
        triggerTheaterCenterFeedback(true);
      }).catch(e => console.error('Theater video play failed:', e));
    });
  }
  
  isTheaterPlaying = true;
  if(theaterPlayBtn) theaterPlayBtn.innerHTML = '<span>❚❚</span> Pause Take';
  if(audioVuMeter && !isTheaterMuted && theaterVolume > 0) {
    audioVuMeter.classList.add('playing');
  }

  const tick = () => {
    if(!isTheaterPlaying) return;
    updateTheaterUI();
    theaterRafId = requestAnimationFrame(tick);
  };

  if(theaterRafId) cancelAnimationFrame(theaterRafId);
  theaterRafId = requestAnimationFrame(tick);
}

function theaterPause(completed = false){
  isTheaterPlaying = false;
  if(theaterRafId) cancelAnimationFrame(theaterRafId);
  if(theaterGradedVideo) theaterGradedVideo.pause();
  if(audioVuMeter) audioVuMeter.classList.remove('playing');
  if(!completed) triggerTheaterCenterFeedback(false);

  if(theaterPlayBtn){
    if(completed){
      theaterPlayBtn.innerHTML = '<span>↺</span> Replay Take';
    } else {
      const current = theaterGradedVideo ? theaterGradedVideo.currentTime : 0;
      theaterPlayBtn.innerHTML = `<span>▶</span> ${current > 0 ? 'Resume Take' : 'Play Take'}`;
    }
  }
}

// When master video ends in theater
theaterGradedVideo?.addEventListener('ended', () => {
  if(isTheaterLooping){
    theaterGradedVideo.currentTime = 0;
    theaterPlay();
  } else {
    theaterPause(true);
  }
});

function openVideoSuiteByIndex(idx){
  currentCutIndex = (idx + cuts.length) % cuts.length;
  const c = cuts[currentCutIndex];
  if(!lightbox) return;

  if(modalCutId) modalCutId.textContent = c.id;
  if(modalCat) modalCat.textContent = c.cat.toUpperCase();
  if(theaterFpsBadge) theaterFpsBadge.textContent = c.fps;

  // Pause any portfolio tiles that were playing
  tileControllers.forEach(ctrl => { if(ctrl.isPlaying) ctrl.pause(); });

  theaterSpeed = 1;
  document.querySelectorAll('.speed-btn').forEach(b => b.classList.toggle('active', b.dataset.speed === '1'));

  if(theaterGradedVideo){
    theaterGradedVideo.src = c.video;
    theaterGradedVideo.currentTime = 0;
    theaterGradedVideo.loop = isTheaterLooping;
    theaterGradedVideo.playbackRate = 1;
    theaterGradedVideo.muted = isTheaterMuted;
    theaterGradedVideo.volume = theaterVolume;
    theaterGradedVideo.load();

    const onMeta = () => {
      updateTheaterUI();
      theaterGradedVideo.removeEventListener('loadedmetadata', onMeta);
    };
    theaterGradedVideo.addEventListener('loadedmetadata', onMeta);
  }

  // Set play button state
  if(theaterPlayBtn) theaterPlayBtn.innerHTML = '<span>❚❚</span> Pause Take';
  if(audioVuMeter) audioVuMeter.classList.remove('playing');

  setTheaterRotation(0, false);
  updateTheaterAudioUI();
  updateTheaterUI();

  lightbox.classList.add('open');
  document.body.classList.add('lock');

  // Auto-play the master take immediately upon opening
  setTimeout(() => {
    theaterPlay();
  }, 100);
}

function setTheaterRotation(deg, withFeedback = true){
  theaterRotation = (deg % 360 + 360) % 360;
  if(theaterRotDeg) theaterRotDeg.textContent = `${theaterRotation}°`;
  if(theaterRotateBtn) theaterRotateBtn.classList.toggle('active', theaterRotation !== 0);

  let scale = 1;
  if (theaterRotation % 180 !== 0 && theaterGradedVideo && theaterContainer) {
    const cWidth = theaterContainer.clientWidth;
    const cHeight = theaterContainer.clientHeight;
    // Get natural/rendered dimensions of the video element
    const vWidth = theaterGradedVideo.offsetWidth || theaterGradedVideo.videoWidth || cWidth;
    const vHeight = theaterGradedVideo.offsetHeight || theaterGradedVideo.videoHeight || cHeight;

    if (vWidth > 0 && vHeight > 0 && cWidth > 0 && cHeight > 0) {
      // When rotated 90° or 270°, the video's width must fit inside the container's height,
      // and the video's height must fit inside the container's width.
      const scaleToFitHeight = (cHeight * 0.94) / vWidth;
      const scaleToFitWidth = (cWidth * 0.94) / vHeight;
      scale = Math.min(scaleToFitHeight, scaleToFitWidth, 1);
    } else {
      scale = 0.54;
    }
  }

  const transformVal = `rotate(${theaterRotation}deg) scale(${scale})`;
  if(theaterGradedVideo) theaterGradedVideo.style.transform = transformVal;
  if(theaterRawVideo) theaterRawVideo.style.transform = transformVal;

  if(withFeedback && theaterFeedback){
    const icon = theaterFeedback.querySelector('.fb-icon');
    if(icon) icon.textContent = `⟳ ${theaterRotation}°`;
    theaterFeedback.classList.remove('pop');
    void theaterFeedback.offsetWidth;
    theaterFeedback.classList.add('pop');
  }
}

window.addEventListener('resize', () => {
  if (lightbox?.classList.contains('open') && theaterRotation % 180 !== 0) {
    setTheaterRotation(theaterRotation, false);
  }
});

function openVideoSuite(c){
  const idx = cuts.findIndex(item => item.id === c.id);
  openVideoSuiteByIndex(idx >= 0 ? idx : 0);
}

function closeVideoSuite(){
  if(!lightbox) return;
  theaterPause();
  lightbox.classList.remove('open');
  document.body.classList.remove('lock');
}

// Back and Close controls
lightboxBackBtn?.addEventListener('click', closeVideoSuite);
document.getElementById('lightboxClose')?.addEventListener('click', closeVideoSuite);
lightbox?.addEventListener('click', e => { if(e.target === lightbox) closeVideoSuite(); });

// Take Navigator buttons
prevCutBtn?.addEventListener('click', () => openVideoSuiteByIndex(currentCutIndex - 1));
nextCutBtn?.addEventListener('click', () => openVideoSuiteByIndex(currentCutIndex + 1));

// Loop toggle button
theaterLoopBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  isTheaterLooping = !isTheaterLooping;
  theaterLoopBtn.classList.toggle('active', isTheaterLooping);
  if(theaterRawVideo) theaterRawVideo.loop = isTheaterLooping;
  if(theaterGradedVideo) theaterGradedVideo.loop = isTheaterLooping;
  theaterLoopBtn.innerHTML = `<span>🔁</span> Loop ${isTheaterLooping ? 'ON' : 'OFF'}`;
});

// Rotate button
theaterRotateBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  setTheaterRotation(theaterRotation + 90, true);
});

// Audio Mute / Unmute Button
theaterMuteBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  isTheaterMuted = !isTheaterMuted;
  if(theaterGradedVideo) theaterGradedVideo.muted = isTheaterMuted;
  if(audioVuMeter){
    if(isTheaterMuted || !isTheaterPlaying) audioVuMeter.classList.remove('playing');
    else audioVuMeter.classList.add('playing');
  }
  updateTheaterAudioUI();
});

// Volume Slider
theaterVolumeSlider?.addEventListener('input', (e) => {
  e.stopPropagation();
  theaterVolume = parseFloat(e.target.value);
  isTheaterMuted = theaterVolume === 0;
  if(theaterGradedVideo){
    theaterGradedVideo.muted = isTheaterMuted;
    theaterGradedVideo.volume = theaterVolume;
  }
  if(audioVuMeter){
    if(isTheaterMuted || !isTheaterPlaying) audioVuMeter.classList.remove('playing');
    else audioVuMeter.classList.add('playing');
  }
  updateTheaterAudioUI();
});

// Click anywhere on theater footage to Play/Pause
theaterContainer?.addEventListener('click', (e) => {
  if(e.target === theaterRange) return;
  if(isTheaterPlaying) theaterPause(); else theaterPlay();
});

/* Play / Pause toggle button in Video Suite */
if(theaterPlayBtn){
  theaterPlayBtn.addEventListener('click', (e)=>{
    e.stopPropagation();
    if(isTheaterPlaying) theaterPause(); else theaterPlay();
  });
}

/* Timeline scrubber click & drag in Video Suite */
if(theaterTimelineTrack){
  function seekToEvent(e){
    if(!theaterGradedVideo || !theaterGradedVideo.duration) return;
    const rect = theaterTimelineTrack.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.min(1, Math.max(0, clickX / rect.width));
    const seekTime = pct * theaterGradedVideo.duration;
    theaterGradedVideo.currentTime = seekTime;
    if(theaterRawVideo) theaterRawVideo.currentTime = seekTime;
    updateTheaterUI();
    if(!isTheaterPlaying && theaterPlayBtn){
      theaterPlayBtn.innerHTML = '<span>▶</span> Resume Take';
    }
  }

  let isDraggingTimeline = false;
  theaterTimelineTrack.addEventListener('mousedown', e => {
    isDraggingTimeline = true;
    seekToEvent(e);
  });
  window.addEventListener('mousemove', e => {
    if(isDraggingTimeline) seekToEvent(e);
  });
  window.addEventListener('mouseup', () => {
    isDraggingTimeline = false;
  });
}

/* Speed Selector */
document.querySelectorAll('.speed-btn').forEach(btn => {
  btn.addEventListener('click', (e)=>{
    e.stopPropagation();
    document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    theaterSpeed = parseFloat(btn.dataset.speed || '1');
    if(theaterRawVideo) theaterRawVideo.playbackRate = theaterSpeed;
    if(theaterGradedVideo) theaterGradedVideo.playbackRate = theaterSpeed;
  });
});

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if(!lightbox?.classList.contains('open')) return;
  if(e.key === 'Escape') closeVideoSuite();
  if(e.key === ' ') {
    e.preventDefault();
    if(isTheaterPlaying) theaterPause(); else theaterPlay();
  }
  if(e.key === 'm' || e.key === 'M'){
    e.preventDefault();
    theaterMuteBtn?.click();
  }
  if(e.key === 'r' || e.key === 'R'){
    e.preventDefault();
    theaterRotateBtn?.click();
  }
  if(e.key === 'ArrowUp'){
    e.preventDefault();
    theaterVolume = Math.min(1, theaterVolume + 0.1);
    if(theaterVolumeSlider) theaterVolumeSlider.value = theaterVolume;
    isTheaterMuted = false;
    if(theaterGradedVideo){ theaterGradedVideo.muted = false; theaterGradedVideo.volume = theaterVolume; }
    updateTheaterAudioUI();
  }
  if(e.key === 'ArrowDown'){
    e.preventDefault();
    theaterVolume = Math.max(0, theaterVolume - 0.1);
    if(theaterVolumeSlider) theaterVolumeSlider.value = theaterVolume;
    isTheaterMuted = theaterVolume === 0;
    if(theaterGradedVideo){ theaterGradedVideo.muted = isTheaterMuted; theaterGradedVideo.volume = theaterVolume; }
    updateTheaterAudioUI();
  }
  if(e.key === 'ArrowLeft'){
    if(e.shiftKey) openVideoSuiteByIndex(currentCutIndex - 1);
    else if(theaterGradedVideo) {
      theaterGradedVideo.currentTime = Math.max(0, theaterGradedVideo.currentTime - 5);
      if(theaterRawVideo) theaterRawVideo.currentTime = theaterGradedVideo.currentTime;
      updateTheaterUI();
    }
  }
  if(e.key === 'ArrowRight'){
    if(e.shiftKey) openVideoSuiteByIndex(currentCutIndex + 1);
    else if(theaterGradedVideo) {
      theaterGradedVideo.currentTime = Math.min(theaterGradedVideo.duration || 0, theaterGradedVideo.currentTime + 5);
      if(theaterRawVideo) theaterRawVideo.currentTime = theaterGradedVideo.currentTime;
      updateTheaterUI();
    }
  }
});

/* ---------- testimonials carousel ---------- */
const tTrack = document.getElementById('tTrack');
if(tTrack){
  const slides = tTrack.children.length;
  const tDots = document.getElementById('tDots');
  let tIndex = 0, tTimer;
  for(let i=0;i<slides;i++){
    const d = document.createElement('div');
    d.className = 't-dot' + (i===0?' active':'');
    d.addEventListener('click', ()=> goTo(i));
    if(tDots) tDots.appendChild(d);
  }
  const tProgressFill = document.getElementById('tProgressFill');
  function goTo(i){
    tIndex = (i + slides) % slides;
    tTrack.style.transform = `translateX(-${tIndex*100}%)`;
    if(tDots) [...tDots.children].forEach((d,idx)=>d.classList.toggle('active', idx===tIndex));
    resetAuto();
  }
  function resetAuto(){
    clearInterval(tTimer);
    tTimer = setInterval(()=>goTo(tIndex+1), 6000);
    if(tProgressFill){
      tProgressFill.classList.remove('run');
      void tProgressFill.offsetWidth;
      tProgressFill.classList.add('run');
    }
  }
  document.getElementById('tNext')?.addEventListener('click', ()=>goTo(tIndex+1));
  document.getElementById('tPrev')?.addEventListener('click', ()=>goTo(tIndex-1));
  resetAuto();
}

/* ---------- faq accordion ---------- */
document.querySelectorAll('.faq-item').forEach(item=>{
  const q = item.querySelector('.faq-q');
  const a = item.querySelector('.faq-a');
  if(item.classList.contains('open') && a) a.style.maxHeight = a.scrollHeight + 'px';
  q?.addEventListener('click', ()=>{
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(other=>{
      other.classList.remove('open');
      const otherA = other.querySelector('.faq-a');
      if(otherA) otherA.style.maxHeight = null;
    });
    if(!isOpen && a){ item.classList.add('open'); a.style.maxHeight = a.scrollHeight + 'px'; }
  });
});

/* ---------- mobile nav ---------- */
const navToggle = document.getElementById('navToggle');
const navUl = document.querySelector('nav ul');
if(navToggle && navUl){
  navToggle.addEventListener('click', ()=>{
    const open = navUl.style.display === 'flex';
    navUl.style.display = open ? 'none' : 'flex';
    navUl.style.flexDirection = 'column';
    navUl.style.position='fixed';
    navUl.style.top='36px'; navUl.style.right='0';
    navUl.style.background='var(--ink)';
    navUl.style.padding='20px 28px';
    navUl.style.border='1px solid var(--line)';
    navUl.style.gap='18px';
  });
  document.querySelectorAll('nav a').forEach(a=>a.addEventListener('click', ()=>{
    if(window.innerWidth <= 640) navUl.style.display = 'none';
  }));
}

/* ---------- contact form ---------- */
document.getElementById('projectForm')?.addEventListener('submit', function(e){
  e.preventDefault();
  const btn = this.querySelector('button');
  if(btn){
    const original = btn.textContent;
    btn.textContent = 'Queued ✓';
    btn.classList.add('sent');
    this.reset();
    setTimeout(()=>{ btn.textContent = original; btn.classList.remove('sent'); }, 2400);
  }
});
