const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');
const resultDiv = document.getElementById('result');

const segments = [
  '10 монет',
  '20 монет',
  '50 монет',
  '100 монет',
  'Удвоить ставку',
  'Подарок',
  'Потерять ход',
  'Бонусный ход',
];

const colors = [
  '#c0392b',
  '#2980b9',
  '#f39c12',
  '#27ae60',
  '#8e44ad',
  '#d35400',
  '#16a085',
  '#d91e18',
];

const wheelRadius = 150;
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const numSegments = segments.length;
const anglePerSegment = (2 * Math.PI) / numSegments;

let currentAngle = 0;
let isSpinning = false;

function drawWheel(angle) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);

  const rimWidth = 18;
  ctx.beginPath();
  ctx.arc(0, 0, wheelRadius + rimWidth, 0, 2 * Math.PI);
  ctx.fillStyle = '#111c';
  ctx.fill();

  for (let i = 0; i < numSegments; i++) {
    const startAngle = i * anglePerSegment;
    const endAngle = startAngle + anglePerSegment;

    const grad = ctx.createRadialGradient(
      Math.cos(startAngle + anglePerSegment / 2) * wheelRadius * 0.5,
      Math.sin(startAngle + anglePerSegment / 2) * wheelRadius * 0.5,
      wheelRadius * 0.1,
      0,
      0,
      wheelRadius
    );
    grad.addColorStop(0, colors[i]);
    grad.addColorStop(1, '#222');

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, wheelRadius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    const shading = ctx.createLinearGradient(
      Math.cos(startAngle) * wheelRadius,
      Math.sin(startAngle) * wheelRadius,
      Math.cos(endAngle) * wheelRadius,
      Math.sin(endAngle) * wheelRadius
    );
    shading.addColorStop(0, 'rgba(255,255,255,0.15)');
    shading.addColorStop(0.5, 'rgba(0,0,0,0.2)');
    shading.addColorStop(1, 'rgba(255,255,255,0.15)');
    ctx.fillStyle = shading;
    ctx.fill();

    ctx.save();
    ctx.fillStyle = '#eee';
    ctx.font = 'bold 16px Verdana';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const textAngle = startAngle + anglePerSegment / 2;
    ctx.rotate(textAngle);
    ctx.fillText(segments[i], wheelRadius - 20, 0);
    ctx.restore();
  }

  const centerRadius = 40;
  ctx.beginPath();
  ctx.shadowColor = '#0ff';
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#111';
  ctx.arc(0, 0, centerRadius, 0, 2 * Math.PI);
  ctx.fill();

  ctx.restore();
}

drawWheel(currentAngle);

function spin() {
  if (isSpinning) return;
  isSpinning = true;
  resultDiv.textContent = '';
  spinBtn.disabled = true;

  const spins = Math.floor(Math.random() * 3) + 4; // 4-6 оборотов
  const extraAngle = Math.random() * 2 * Math.PI;

  const targetAngle = spins * 2 * Math.PI + extraAngle;

  let start = null;
  const duration = 6000;

  function animate(timestamp) {
    if (!start) start = timestamp;
    const elapsed = timestamp - start;

    const t = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - t, 3);

    currentAngle = easeOut * targetAngle;

    drawWheel(currentAngle);

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      isSpinning = false;
      spinBtn.disabled = false;
      announceResult();
    }
  }

  requestAnimationFrame(animate);
}

function announceResult() {
  let normalizedAngle = currentAngle % (2 * Math.PI);
  if (normalizedAngle < 0) normalizedAngle += 2 * Math.PI;

  // Добавляем сдвиг π/2 радиан (90°), чтобы учесть, что стрелка вниз
  let adjustedAngle = (2 * Math.PI - normalizedAngle + Math.PI / 2) % (2 * Math.PI);

  let index = Math.floor(adjustedAngle / anglePerSegment);

  resultDiv.textContent = `Выпало: ${segments[index]}`;
}

spinBtn.addEventListener('click', spin);