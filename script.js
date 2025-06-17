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

  const rimWidth = 22;
  // Обод с градиентом и тенью
  let rimGradient = ctx.createRadialGradient(0, 0, wheelRadius, 0, 0, wheelRadius + rimWidth);
  rimGradient.addColorStop(0, '#555');
  rimGradient.addColorStop(1, '#111');
  ctx.beginPath();
  ctx.arc(0, 0, wheelRadius + rimWidth, 0, 2 * Math.PI);
  ctx.fillStyle = rimGradient;
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Сегменты с эффектом гравировки
  for (let i = 0; i < numSegments; i++) {
    const startAngle = i * anglePerSegment;
    const endAngle = startAngle + anglePerSegment;

    const baseColor = colors[i];
    const grad = ctx.createLinearGradient(
      Math.cos(startAngle) * wheelRadius,
      Math.sin(startAngle) * wheelRadius,
      Math.cos(endAngle) * wheelRadius,
      Math.sin(endAngle) * wheelRadius
    );
    grad.addColorStop(0, baseColor);
    grad.addColorStop(0.5, '#222');
    grad.addColorStop(1, baseColor);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, wheelRadius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Тиснение — тонкие полосы
    ctx.save();
    ctx.clip();
    const linesCount = 15;
    ctx.lineWidth = 1;
    for (let j = 0; j < linesCount; j++) {
      let dist = (j / linesCount) * wheelRadius;
      ctx.beginPath();
      ctx.strokeStyle = j % 2 === 0 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)';
      ctx.moveTo(dist * Math.cos(startAngle), dist * Math.sin(startAngle));
      ctx.lineTo(dist * Math.cos(endAngle), dist * Math.sin(endAngle));
      ctx.stroke();
    }
    ctx.restore();

    // Контур сегмента — гравировка
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, wheelRadius, startAngle, endAngle);
    ctx.closePath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 1;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Текст с тенью для рельефа
    ctx.save();
    ctx.fillStyle = '#eee';
    ctx.font = 'bold 16px Verdana';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const textAngle = startAngle + anglePerSegment / 2;
    ctx.rotate(textAngle);
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 3;
    ctx.fillText(segments[i], wheelRadius - 20, 0);
    ctx.restore();
  }

  // Центр — металлический круг с глянцем и гравированной надписью
  const centerRadius = 40;
  const centerGradient = ctx.createRadialGradient(0, 0, centerRadius * 0.3, 0, 0, centerRadius);
  centerGradient.addColorStop(0, '#bbb');
  centerGradient.addColorStop(0.5, '#555');
  centerGradient.addColorStop(1, '#222');

  ctx.beginPath();
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = centerGradient;
  ctx.arc(0, 0, centerRadius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Блик на центре
  const glossGradient = ctx.createRadialGradient(-centerRadius / 3, -centerRadius / 3, centerRadius / 10, 0, 0, centerRadius / 1.5);
  glossGradient.addColorStop(0, 'rgba(255,255,255,0.7)');
  glossGradient.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.beginPath();
  ctx.fillStyle = glossGradient;
  ctx.arc(0, 0, centerRadius, 0, 2 * Math.PI);
  ctx.fill();

  // Гравированная надпись "СПИН"
  ctx.save();
  ctx.fillStyle = '#ddd';
  ctx.font = 'bold 20px Verdana';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 4;
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#444';
  ctx.strokeText('СПИН', 0, 0);
  ctx.fillText('СПИН', 0, 0);
  ctx.restore();

  ctx.restore();
}

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

  // Учитываем, что стрелка смотрит вниз (π/2 сдвиг)
  let adjustedAngle = (2 * Math.PI - normalizedAngle + Math.PI / 2) % (2 * Math.PI);

  let index = Math.floor(adjustedAngle / anglePerSegment);

  resultDiv.textContent = `Выпало: ${segments[index]}`;
}

spinBtn.addEventListener('click', spin);

drawWheel(currentAngle);