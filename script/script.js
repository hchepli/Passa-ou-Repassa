/* ============ utilidades ============ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const wait = ms => new Promise(r => setTimeout(r, ms));
const rand = (a, b) => a + Math.random() * (b - a);
const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const other = t => (t === 'A' ? 'B' : 'A');
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (RM) gsap.globalTimeline.timeScale(20);

const cs = getComputedStyle(document.documentElement);
const COL = { A: cs.getPropertyValue('--a').trim(), B: cs.getPropertyValue('--b').trim(), N: cs.getPropertyValue('--muted').trim() };
const CIRC = 175.93;

/* ============ sons (Web Audio) ============ */
const Sound = (() => {
  let ctx = null;
  const getCtx = () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };

  function tone(freq, start, dur, type = 'sine', vol = 0.25) {
    try {
      const c = getCtx();
      const o = c.createOscillator(), g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, c.currentTime + start);
      g.gain.setValueAtTime(0.0001, c.currentTime + start);
      g.gain.exponentialRampToValueAtTime(vol, c.currentTime + start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
      o.connect(g).connect(c.destination);
      o.start(c.currentTime + start);
      o.stop(c.currentTime + start + dur + 0.05);
    } catch (e) {}
  }

  return {
    correct() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.09, 0.35, 'triangle')); },
    wrong() { tone(220, 0, 0.25, 'sawtooth', 0.2); tone(155, 0.18, 0.45, 'sawtooth', 0.2); },
    warning() { tone(440, 0, 0.18, 'sine', 0.22); tone(330, 0.2, 0.3, 'sine', 0.22); },
    tick() { tone(1000, 0, 0.06, 'square', 0.08); },
    timeUp() { tone(196, 0, 0.5, 'sawtooth', 0.2); }
  };
})();

/* ============ piscada vermelha do alerta ============ */
let alertTween = null;
function setAlert(speed) {            // speed = duração de cada "respiro" (segundos)
  if (alertTween) { alertTween.kill(); alertTween = null; }
  alertTween = gsap.fromTo('#alert',
    { opacity: 0 },
    { opacity: 1, duration: speed, ease: 'sine.inOut', yoyo: true, repeat: -1 });
}
function stopAlert() {
  if (alertTween) { alertTween.kill(); alertTween = null; }
  gsap.to('#alert', { opacity: 0, duration: 0.25, overwrite: true });
}

/* ============ fundo em Three.js ============ */
const Scene3D = (() => {
  if (!window.THREE) return { tint() {}, pulse() {} };
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: $('#bg'), alpha: true, antialias: true }); }
  catch (e) { return { tint() {}, pulse() {} }; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.z = 14;
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(COL.N), wireframe: true, transparent: true, opacity: 0.22 });
  const geos = [new THREE.IcosahedronGeometry(1, 0), new THREE.OctahedronGeometry(1, 0), new THREE.TetrahedronGeometry(1.1, 0), new THREE.TorusGeometry(0.8, 0.25, 8, 16)];
  const group = new THREE.Group(); scene.add(group);
  const items = [];
  for (let i = 0; i < 34; i++) {
    const m = new THREE.Mesh(geos[i % geos.length], mat);
    m.position.set(rand(-17, 17), rand(-10, 10), rand(-16, 3));
    m.scale.setScalar(rand(0.4, 1.5));
    m.rotation.set(rand(0, 6), rand(0, 6), 0);
    m.userData = { vx: rand(-0.004, 0.004), vy: rand(-0.005, 0.005), fl: rand(0, 6), amp: rand(0.2, 0.7) };
    group.add(m); items.push(m);
  }
  const N = 280, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { pos[i * 3] = rand(-22, 22); pos[i * 3 + 1] = rand(-13, 13); pos[i * 3 + 2] = rand(-18, 6); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pmat = new THREE.PointsMaterial({ color: new THREE.Color(COL.N), size: 0.06, transparent: true, opacity: 0.55 });
  scene.add(new THREE.Points(pg, pmat));
  let mx = 0, my = 0;
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; });
  function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  addEventListener('resize', resize); resize();
  let t = 0;
  (function loop() {
    t += 0.01;
    if (!RM) items.forEach(m => { m.rotation.x += m.userData.vx; m.rotation.y += m.userData.vy; m.position.y += Math.sin(t + m.userData.fl) * 0.0035 * m.userData.amp; });
    group.rotation.y = Math.sin(t * 0.25) * 0.12;
    camera.position.x += (mx * 1.6 - camera.position.x) * 0.03;
    camera.position.y += (-my * 1.0 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  })();
  return {
    tint(hex) { const c = new THREE.Color(hex); [mat.color, pmat.color].forEach(m => gsap.to(m, { r: c.r, g: c.g, b: c.b, duration: 0.8 })); },
    pulse() {
      gsap.fromTo(group.scale, { x: 1.4, y: 1.4, z: 1.4 }, { x: 1, y: 1, z: 1, duration: 1.3, ease: 'power3.out' });
      gsap.fromTo(mat, { opacity: 0.6 }, { opacity: 0.22, duration: 1.3, ease: 'power2.out' });
    }
  };
})();

/* ============ estado ============ */
const S = { names: { A: CONFIG.TEAM_A_NAME, B: CONFIG.TEAM_B_NAME }, score: { A: 0, B: 0 }, q: 0, starter: 'A', turn: 'A', attempt: 1, wrong: [], order: [], locked: true, busy: false, canNext: false };

function setTone(color) { $('#app').style.setProperty('--turn', color); $('#glow').style.setProperty('--turn', color); Scene3D.tint(color); }

/* ============ animações compartilhadas ============ */
function splash(color, title, sub, onCover) {
  return new Promise(res => {
    const band = $('#band'), veil = $('#splash .veil');
    band.style.setProperty('--c', color);
    $('#splashTitle').textContent = title; $('#splashSub').textContent = sub || '';
    $('#splash').hidden = false;
    gsap.timeline({ onComplete: () => { $('#splash').hidden = true; res(); } })
      .fromTo(veil, { opacity: 0 }, { opacity: 0.94, duration: 0.35 }, 0)
      .fromTo(band, { xPercent: -105 }, { xPercent: 0, duration: 0.5, ease: 'power4.out' }, 0)
      .fromTo('#band .txt > *', { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: 'power3.out' }, '-=0.2')
      .add(() => { if (onCover) onCover(); Scene3D.pulse(); })
      .to({}, { duration: CONFIG.TIMING.SPLASH_HOLD })
      .to(band, { xPercent: 105, duration: 0.5, ease: 'power4.in' })
      .to(veil, { opacity: 0, duration: 0.4 }, '-=0.35');
  });
}

function flash(ok) {
  return new Promise(res => {
    const el = $('#flash');
    ok ? Sound.correct() : Sound.wrong();
    el.style.setProperty('--c', ok ? CONFIG.COLORS.good : CONFIG.COLORS.bad);
    $('#flashIco').textContent = ok ? '✓' : '✕';
    $('#flashMsg').textContent = ok ? CONFIG.TEXTS.correct : CONFIG.TEXTS.wrong;
    el.hidden = false;
    gsap.timeline({ onComplete: () => { el.hidden = true; res(); } })
      .fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.2 })
      .fromTo('#flash .inner', { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(2.5)' }, 0.05)
      .to({}, { duration: CONFIG.TIMING.FLASH_HOLD })
      .to(el, { opacity: 0, duration: 0.3 });
  });
}

function confetti(colors, n, el) {
  const layer = $('#fx');
  const r = el ? el.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (let i = 0; i < n; i++) {
    const d = document.createElement('i'); d.className = 'conf'; d.style.background = colors[i % colors.length];
    layer.appendChild(d);
    const ang = -Math.PI / 2 + rand(-1.2, 1.2), dist = rand(120, 380);
    gsap.set(d, { x: cx, y: cy, rotation: rand(0, 360), scale: rand(0.6, 1.3) });
    gsap.timeline({ onComplete: () => d.remove() })
      .to(d, { x: cx + Math.cos(ang) * dist, y: cy + Math.sin(ang) * dist, rotation: '+=' + rand(-540, 540), duration: rand(0.6, 0.9), ease: 'power3.out' })
      .to(d, { y: '+=' + rand(140, 280), opacity: 0, duration: 0.9, ease: 'power1.in' });
  }
}

function splitChars(el) {
  const text = el.textContent; el.textContent = '';
  text.split(' ').forEach((w, wi) => {
    const word = document.createElement('span'); word.className = 'word';
    [...w].forEach(c => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c; word.appendChild(s); });
    el.appendChild(word);
    if (wi < text.split(' ').length - 1) el.appendChild(document.createTextNode(' '));
  });
  return $$('.ch', el);
}

function show(name) {
  ['start', 'game', 'end'].forEach(n => { $('#screen-' + n).hidden = n !== name; });
}

/* ============ tela inicial / jokenpô ============ */
const HANDS = ['✊', '✋', '✌️'];
let rolling = false;
const readNames = () => { S.names.A = $('#inA').value.trim() || CONFIG.TEAM_A_NAME; S.names.B = $('#inB').value.trim() || CONFIG.TEAM_B_NAME; };
function syncPickLabels() { readNames(); $('#pickA').textContent = S.names.A; $('#pickB').textContent = S.names.B; }
$('#inA').addEventListener('input', syncPickLabels);
$('#inB').addEventListener('input', syncPickLabels);

function setStartBusy(b) { ['#jkBtn', '#pickA', '#pickB', '#inA', '#inB'].forEach(s => { $(s).disabled = b; }); }

function introStart() {
  setTone(COL.N);
  const chars = splitChars($('#startTitle'));
  gsap.from(chars, { yPercent: 110, rotation: 8, opacity: 0, duration: 0.8, stagger: 0.035, ease: 'back.out(1.6)' });
  gsap.from(['.eyebrow', '#screen-start .lead'], { y: 18, opacity: 0, duration: 0.6, stagger: 0.12, delay: 0.3 });
  gsap.from('.panel', { y: 50, opacity: 0, duration: 0.7, stagger: 0.15, delay: 0.45, ease: 'power3.out' });
  gsap.from('.vs', { scale: 0, duration: 0.6, delay: 0.7, ease: 'back.out(3)' });
  gsap.from(['#jkBtn', '.manual'], { y: 20, opacity: 0, duration: 0.6, stagger: 0.12, delay: 0.85, clearProps: 'all' });
}

async function playJokenpo() {
  if (rolling) return; rolling = true; setStartBusy(true); syncPickLabels();
  $('#panelA').classList.remove('win'); $('#panelB').classList.remove('win');
  const hA = $('#handA'), hB = $('#handB');
  let a, b, d;
  while (true) {
    $('#faceA').textContent = $('#faceB').textContent = '✊';
    gsap.set([hA, hB], { scale: 1, opacity: 1 });
    $('#jkMsg').textContent = 'Pedra… papel… tesoura!';
    await new Promise(res => gsap.timeline({ onComplete: res }).to([hA, hB], { y: -38, rotation: i => (i ? 14 : -14), duration: 0.22, yoyo: true, repeat: 5, ease: 'sine.inOut' }));
    a = Math.floor(Math.random() * 3); b = Math.floor(Math.random() * 3);
    $('#faceA').textContent = HANDS[a]; $('#faceB').textContent = HANDS[b];
    gsap.fromTo([hA, hB], { scale: 0.7 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
    d = (a - b + 3) % 3;
    if (d !== 0) break;
    $('#jkMsg').textContent = 'Empate! De novo…';
    await wait(1100);
  }
  await announceStarter(d === 1 ? 'A' : 'B');
}

async function announceStarter(team) {
  syncPickLabels();
  const win = $('#panel' + team), lose = $('#panel' + other(team));
  win.classList.add('win');
  gsap.to($('.hand', win), { scale: 1.18, duration: 0.5, ease: 'back.out(2)' });
  gsap.to(lose, { opacity: 0.35, duration: 0.4 });
  $('#jkMsg').textContent = `${S.names[team]} ganhou e responde primeiro!`;
  confetti([COL[team], CONFIG.COLORS.white, COL[team]], 28, $('.hand', win));
  await wait(CONFIG.TIMING.STARTER_DELAY_MS);
  await startGame(team);
}

/* ============ jogo ============ */
function prepare() {
  let base = CONFIG.SHUFFLE_QUESTIONS ? shuffle(QUESTIONS) : [...QUESTIONS];
  base = base.slice(0, CONFIG.MAX_QUESTIONS);
  return base.map(x => {
    const order = x.options.map((_, i) => i);
    const idx = CONFIG.SHUFFLE_OPTIONS ? shuffle(order) : order;
    return { q: x.q, options: idx.map(i => x.options[i]), a: idx.indexOf(x.a) };
  });
}

function applyNames() {
  $('#nameA').textContent = $('#endNameA').textContent = S.names.A;
  $('#nameB').textContent = $('#endNameB').textContent = S.names.B;
}
function renderScores() { $('#scoreA').textContent = S.score.A; $('#scoreB').textContent = S.score.B; }

async function startGame(starter) {
  readNames();
  Object.assign(S, { score: { A: 0, B: 0 }, q: 0, starter, order: prepare(), busy: true, canNext: false, locked: true });
  applyNames(); renderScores();
  await splash(COL[starter], `${S.names[starter]} começa!`, `Vocês têm ${CONFIG.SECONDS} segundos por vez`, () => { show('game'); loadQuestion(); });
  await enterQuestion();
  S.busy = false;
}

function setTurn(t) {
  S.turn = t;
  setTone(COL[t]);
  $('#teamA').classList.toggle('active', t === 'A');
  $('#teamB').classList.toggle('active', t === 'B');
  gsap.fromTo('#team' + t, { scale: 1.07 }, { scale: 1, duration: 0.7, ease: 'elastic.out(1,.55)', clearProps: 'transform' });
}

function loadQuestion() {
  const qd = S.order[S.q], N = S.order.length;
  S.attempt = 1; S.wrong = []; S.canNext = false; S.locked = true;
  setTurn(S.starter);
  $('#pcount').textContent = `Pergunta ${S.q + 1} de ${N}`;
  $('#segs').innerHTML = S.order.map((_, i) => `<i class="${i < S.q ? 'done' : i === S.q ? 'cur' : ''}"></i>`).join('');
  $('#qtext').textContent = qd.q;
  const box = $('#opts'); box.innerHTML = '';
  qd.options.forEach((txt, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'opt';
    b.innerHTML = `<span class="k">${'ABCD'[i]}</span><span class="t"></span>`;
    $('.t', b).textContent = txt;
    b.addEventListener('click', () => answer(i));
    box.appendChild(b);
  });
  $('#passBtn').hidden = false; $('#resMsg').hidden = true; $('#nextBtn').hidden = true;
  $('#nextBtn').textContent = S.q === N - 1 ? 'Ver resultado' : 'Próxima pergunta';
  resetTimerUI();
  gsap.set(['#qtext', '.opt', '.dock'], { opacity: 0 });
}

async function enterQuestion() {
  gsap.fromTo('#qtext', { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out', clearProps: 'transform' });
  gsap.fromTo('.opt', { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.08, delay: 0.15, ease: 'power3.out', clearProps: 'transform,opacity' });
  gsap.to('.dock', { opacity: 1, duration: 0.4, delay: 0.5 });
  await wait(RM ? 50 : 750);
  S.locked = false;
  startTimer();
}

/* ---- timer ---- */
let tick = null, deadline = 0, lastSec = -1;
function resetTimerUI() {
  stopAlert();
  const ring = $('#ring');
  ring.style.transition = 'none'; ring.style.strokeDashoffset = 0; void ring.getBoundingClientRect(); ring.style.transition = '';
  $('#timer').classList.remove('low'); $('#timerNum').textContent = CONFIG.SECONDS; lastSec = -1;
}
function startTimer() {
  stopTimer(); resetTimerUI();
  deadline = performance.now() + CONFIG.SECONDS * 1000;
  tick = setInterval(updateTimer, 100);
}
function stopTimer() { clearInterval(tick); tick = null; }
function updateTimer() {
  const left = Math.max(0, deadline - performance.now());
  const s = Math.ceil(left / 1000);
  $('#ring').style.strokeDashoffset = CIRC * (1 - left / (CONFIG.SECONDS * 1000));
  if (s !== lastSec) {
    lastSec = s; $('#timerNum').textContent = s;
    $('#timer').classList.toggle('low', s <= CONFIG.WARNING_SECONDS);
    if (s <= CONFIG.WARNING_SECONDS && s > 0) {
      gsap.fromTo('#timerNum', { scale: 1.4 }, { scale: 1, duration: 0.4, ease: 'power3.out' });
      Sound.tick();
    }
    if (s === CONFIG.ALERT_SECONDS) { Sound.warning(); setAlert(0.5); }   // piscada tranquila
    if (s === CONFIG.WARNING_SECONDS) setAlert(0.2);                       // piscada rápida (últimos segundos)
  }
  if (left <= 0) { stopTimer(); Sound.timeUp(); fail('time'); }
}

/* ---- respostas ---- */
function answer(i) {
  if (S.locked || S.busy) return;
  const qd = S.order[S.q];
  if (S.wrong.includes(i)) return;
  if (i === qd.a) { S.locked = true; stopTimer(); stopAlert(); correct(); }
  else fail('wrong', i);
}

async function correct() {
  const winner = S.turn;
  await flash(true);
  finish(winner);
}

async function fail(kind, idx) {
  if (S.locked && kind !== 'time') return;
  S.locked = true; stopTimer(); stopAlert();
  $('#passBtn').hidden = true;
  if (kind === 'wrong') {
    S.wrong.push(idx);
    const o = $$('.opt')[idx]; o.classList.add('wrong'); o.disabled = true;
    gsap.to(o, { keyframes: { x: [0, -12, 12, -8, 8, 0], easeEach: 'none' }, duration: 0.45, clearProps: 'transform' });
  }
  if (kind === 'wrong') await flash(false);
  else await wait(CONFIG.TIMING.PASS_DELAY_MS);
  if (S.attempt === 1) {
    S.attempt = 2;
    const t = other(S.turn);
    const sub = kind === 'time' ? 'Acabou o tempo!' : kind === 'wrong' ? 'Resposta errada' : 'Vez passada';
    await splash(COL[t], `Vez do ${S.names[t]}`, sub, () => { setTurn(t); resetTimerUI(); $('#passBtn').hidden = false; });
    S.locked = false; startTimer();
  } else {
    finish(null);
  }
}

function addScore(t) {
  const o = { v: S.score[t] }; S.score[t] += CONFIG.POINTS;
  gsap.to(o, { v: S.score[t], duration: 0.8, ease: 'power2.out', onUpdate: () => { $('#score' + t).textContent = Math.round(o.v); } });
  gsap.fromTo('#team' + t, { scale: 1.1 }, { scale: 1, duration: 0.7, ease: 'elastic.out(1,.5)', clearProps: 'transform' });
}

function finish(winner) {
  const qd = S.order[S.q];
  S.locked = true; stopTimer(); stopAlert();
  $('#passBtn').hidden = true;
  $$('.opt').forEach((o, i) => {
    o.disabled = true;
    if (i === qd.a) o.classList.add('correct');
    else if (!o.classList.contains('wrong')) o.classList.add('dim');
  });
  const correctEl = $$('.opt')[qd.a];
  const msg = $('#resMsg'); msg.hidden = false; $('#nextBtn').hidden = false;
  if (winner) {
    msg.textContent = S.attempt === 2 ? `${S.names[winner]} acertou na repassada! +${CONFIG.POINTS}` : `${S.names[winner]} acertou! +${CONFIG.POINTS}`;
    msg.style.color = COL[winner];
    addScore(winner);
    confetti([COL[winner], CONFIG.COLORS.white, CONFIG.COLORS.good], 40, correctEl);
    gsap.fromTo(correctEl, { scale: 1.04 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1,.4)', clearProps: 'transform' });
  } else {
    msg.textContent = CONFIG.TEXTS.noWinner;
    msg.style.color = 'var(--muted)';
    gsap.fromTo(correctEl, { scale: 1.03 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1,.4)', clearProps: 'transform' });
  }
  gsap.fromTo('#resMsg, #nextBtn', { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.1, delay: 0.25, clearProps: 'transform,opacity' });
  S.canNext = true;
}

async function nextQuestion() {
  if (S.busy || !S.canNext) return;
  S.busy = true; S.canNext = false;
  S.q++;
  if (S.q >= S.order.length) { await endGame(); S.busy = false; return; }
  S.starter = other(S.starter);
  const st = S.starter;
  await splash(COL[st], `Vez do ${S.names[st]}`, `Pergunta ${S.q + 1} de ${S.order.length}`, () => loadQuestion());
  await enterQuestion();
  S.busy = false;
}

async function endGame() {
  const a = S.score.A, b = S.score.B;
  const w = a === b ? null : a > b ? 'A' : 'B';
  const color = w ? COL[w] : COL.N;
  await splash(color, CONFIG.TEXTS.gameOver, 'Contando os pontos', () => {
    show('end');
    const t = $('#endTitle'); t.style.color = color;
    t.textContent = w ? `${S.names[w]} venceu!` : CONFIG.TEXTS.draw;
    $('#endA').textContent = a; $('#endB').textContent = b;
    setTone(color);
  });
  const chars = splitChars($('#endTitle'));
  gsap.from(chars, { yPercent: 110, rotation: 8, opacity: 0, duration: 0.8, stagger: 0.03, ease: 'back.out(1.6)' });
  gsap.from('.final .team', { y: 40, opacity: 0, scale: 0.9, duration: 0.7, stagger: 0.15, delay: 0.3, ease: 'back.out(1.8)', clearProps: 'transform,opacity' });
  gsap.from('#againBtn', { y: 20, opacity: 0, duration: 0.5, delay: 0.8, clearProps: 'all' });
  if (w) for (let i = 0; i < 4; i++) setTimeout(() => confetti([color, CONFIG.COLORS.white, CONFIG.COLORS.good], 36, i % 2 ? $('#endB') : $('#endA')), 500 + i * 420);
}

function resetToStart() {
  stopTimer(); stopAlert();
  Object.assign(S, { busy: false, canNext: false, locked: true });
  $('#faceA').textContent = $('#faceB').textContent = '✊';
  gsap.set(['#panelA', '#panelB', '.hand'], { clearProps: 'all' });
  $('#panelA').classList.remove('win'); $('#panelB').classList.remove('win');
  $('#jkMsg').innerHTML = '&nbsp;';
  setStartBusy(false); rolling = false;
  show('start');
  $('#startTitle').textContent = 'Quem começa?';
  introStart();
}

/* ============ eventos ============ */
$('#jkBtn').addEventListener('click', playJokenpo);
$('#pickA').addEventListener('click', () => { if (rolling) return; rolling = true; setStartBusy(true); announceStarter('A'); });
$('#pickB').addEventListener('click', () => { if (rolling) return; rolling = true; setStartBusy(true); announceStarter('B'); });
$('#passBtn').addEventListener('click', () => { if (!S.locked && !S.busy) fail('pass'); });
$('#nextBtn').addEventListener('click', nextQuestion);
$('#againBtn').addEventListener('click', resetToStart);
addEventListener('keydown', e => {
  if (e.target.matches && e.target.matches('input')) return;
  if (!$('#screen-game').hidden && !S.locked && !S.busy) {
    const m = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3 }[e.key.toLowerCase()];
    if (m !== undefined) { answer(m); return; }
  }
  if (e.key === 'Enter' && S.canNext) { e.preventDefault(); nextQuestion(); }
});

/* ============ inicialização ============ */
$('#inA').value = CONFIG.TEAM_A_NAME;
$('#inB').value = CONFIG.TEAM_B_NAME;
$('#inA').maxLength = $('#inB').maxLength = CONFIG.NAME_MAX_LENGTH;
$('#screen-start .lead').textContent = `Joguem pedra, papel e tesoura. Quem ganhar responde primeiro. Se não souber em ${CONFIG.SECONDS} segundos, passa para o outro time.`;
syncPickLabels();
introStart();