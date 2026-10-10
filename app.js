'use strict';
const game = new SnakeGame();
const canvas = document.getElementById('board');
const context = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const pauseButton = document.getElementById('pause-button');
const speedSelect = document.getElementById('speed');
const scoreLabel = document.getElementById('score');
const bestLabel = document.getElementById('best');
const announcer = document.getElementById('announcement');
let best = 0;
try { const stored = Number(localStorage.getItem('little-snake-best')); if (Number.isFinite(stored) && stored > 0) best = stored; } catch { /* Storage can be unavailable on local files or in private mode. */ }
let baseDelay = 135;
let previousTime = 0;
let elapsed = 0;
const statusText = { ready: '准备就绪', running: '游戏进行中', paused: '已暂停', gameover: '本局结束', won: '挑战成功' };

function draw() {
  const width = canvas.width;
  const cell = width / game.size;
  context.fillStyle = '#111c15';
  context.fillRect(0, 0, width, width);
  context.strokeStyle = '#203023';
  context.lineWidth = Math.max(1, width / 900);
  context.beginPath();
  for (let i = 1; i < game.size; i++) {
    context.moveTo(i * cell, 0); context.lineTo(i * cell, width);
    context.moveTo(0, i * cell); context.lineTo(width, i * cell);
  }
  context.stroke();
  if (game.food) {
    context.fillStyle = '#f5a977';
    context.shadowColor = '#f5a977'; context.shadowBlur = cell * .55;
    context.beginPath(); context.arc((game.food.x + .5) * cell, (game.food.y + .5) * cell, cell * .27, 0, Math.PI * 2); context.fill();
    context.shadowBlur = 0;
  }
  game.snake.forEach((part, index) => {
    context.fillStyle = index === 0 ? '#dcff9a' : '#a7d45e';
    const gap = cell * .08;
    context.beginPath(); context.roundRect(part.x * cell + gap, part.y * cell + gap, cell - gap * 2, cell - gap * 2, cell * .2); context.fill();
    if (index === 0) {
      context.fillStyle = '#283c1e';
      const positions = { right: [[.68, .32], [.68, .68]], left: [[.32, .32], [.32, .68]], up: [[.32, .32], [.68, .32]], down: [[.32, .68], [.68, .68]] };
      positions[game.direction].forEach(([x, y]) => { context.beginPath(); context.arc((part.x + x) * cell, (part.y + y) * cell, cell * .06, 0, Math.PI * 2); context.fill(); });
    }
  });
}
function resize() {
  canvas.width = canvas.height = Math.round(canvas.getBoundingClientRect().width * Math.min(window.devicePixelRatio || 1, 2));
  draw();
}
function updateUI() {
  scoreLabel.textContent = game.score;
  if (game.score > best) {
    best = game.score;
    try { localStorage.setItem('little-snake-best', String(best)); } catch {}
  }
  bestLabel.textContent = best;
  document.getElementById('status-label').textContent = statusText[game.status];
  pauseButton.disabled = !['running', 'paused'].includes(game.status);
  pauseButton.innerHTML = (game.status === 'paused' ? '继续' : '暂停') + ' <kbd>空格</kbd>';
  overlay.hidden = game.status === 'running';
  const messages = {
    ready: ['准备好了吗？', '一颗小点，一场新的冒险。', '开始游戏', '也可以按空格开始'],
    paused: ['休息一下', '准备好了，就继续前进。', '继续游戏', '按空格继续'],
    gameover: ['再来一局？', `本局获得 ${game.score} 分，下次会更棒。`, '再玩一次', '按 Enter 重新开始'],
    won: ['你填满了整个棋盘！', `获得 ${game.score} 分，恭喜完成挑战。`, '再玩一次', '按 Enter 重新开始']
  };
  if (messages[game.status]) {
    const [title, description, label, hint] = messages[game.status];
    document.getElementById('overlay-title').textContent = title;
    document.getElementById('overlay-description').textContent = description;
    document.getElementById('play-button').innerHTML = label + ' <span aria-hidden="true">→</span>';
    document.getElementById('overlay-hint').textContent = hint;
    announcer.textContent = title + '。' + description;
  }
}
function restart() {
  game.reset();
  baseDelay = { easy: 190, normal: 135, fast: 95 }[speedSelect.value];
  game.start(); elapsed = 0;
  canvas.focus({ preventScroll: true });
  announcer.textContent = '游戏开始';
  updateUI(); draw();
}
function play() {
  if (['ready', 'gameover', 'won'].includes(game.status)) restart();
  else if (game.status === 'paused') { game.start(); elapsed = 0; canvas.focus({ preventScroll: true }); announcer.textContent = '游戏继续'; updateUI(); }
}
function togglePause() {
  if (game.status === 'running') game.pause();
  else if (game.status === 'paused') game.start();
  else if (game.status === 'ready') { restart(); return; }
  elapsed = 0; updateUI();
}
document.getElementById('play-button').addEventListener('click', play);
document.getElementById('restart-button').addEventListener('click', restart);
pauseButton.addEventListener('click', togglePause);
const keys = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
window.addEventListener('keydown', event => {
  if (event.ctrlKey || event.metaKey || event.altKey || event.target.closest('select, input, textarea, [contenteditable="true"]')) return;
  const direction = keys[event.key] || keys[event.key.toLowerCase()];
  if (direction) { event.preventDefault(); game.turn(direction); }
  else if (event.code === 'Space' || event.key === 'Enter') {
    if (event.target.closest('button, a')) return;
    event.preventDefault();
    if (!event.repeat) { if (event.key === 'Enter') restart(); else togglePause(); }
  }
});
document.querySelectorAll('[data-direction]').forEach(button => {
  button.addEventListener('pointerdown', event => { event.preventDefault(); game.turn(button.dataset.direction); });
  button.addEventListener('click', event => { if (event.detail === 0) game.turn(button.dataset.direction); });
});
document.addEventListener('visibilitychange', () => { if (document.hidden && game.status === 'running') { game.pause(); elapsed = 0; updateUI(); } });
window.addEventListener('resize', resize);
function frame(time) {
  const delta = previousTime ? Math.min(time - previousTime, 250) : 0;
  previousTime = time;
  if (game.status === 'running') {
    elapsed += delta;
    const delay = Math.max(65, baseDelay - game.score / 10 * 3);
    if (elapsed >= delay) {
      elapsed %= delay;
      game.step(); updateUI(); draw();
    }
  }
  requestAnimationFrame(frame);
}
updateUI(); resize(); requestAnimationFrame(frame);
