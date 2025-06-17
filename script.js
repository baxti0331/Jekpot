const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');
const resultDiv = document.getElementById('result');

const segments = [
  'Приз 1',
  'Приз 2',
  'Приз 3',
  'Приз 4',
  'Приз 5',
  'Приз 6',
  'Приз 7',
  'Приз 8',
];

const colors = [
  '#e74c3c',
  '#3498db',
  '#f1c40f',
  '#2ecc71',
  '#9b59b6',
  '#e67e22',
  '#1abc9c',
  '#e84393',
];

const wheelRadius = 240;
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

  // 3D light gradient style
  const grad = ctx.createRadialGradient(0, 0, wheelRadius * 0.3, 0, 0, wheelRadius);
  grad.addColorStop(0, '#ffffffaa');
  grad.addColorStop(1, '#000000aa');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, wheelRadius, 0, 2 * Math.PI);
  ctx.fill();

  for (let i = 0; i < numSegments; i++) {
    const startAngle = i * anglePerSegment;
    const endAngle = startAngle + anglePerSegment;

    // Draw segment
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, wheelRadius, startAngle, endAngle);
    ctx.closePath();

    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();

    // Add subtle shading for 3D effect
    const shading = ctx.createLinearGradient(0, -wheelRadius, 0, wheelRadius);
    shading.addColorStop(0, 'rgba(0,0,0,0.15)');
    shading.addColorStop(0.5, 'rgba(255,255,255,0.2)');
    shading.addColorStop(1, 'rgba(0,0,0,0.15)');
    ctx.fillStyle = shading;
    ctx.fill();

    // Draw text
    ctx.save();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const textAngle = startAngle + anglePerSegment / 2;
    ctx.rotate(textAngle);
    ctx.fillText(segments[i], wheelRadius - 15, 0);
    ctx.restore();
  }

  // Draw center circle
  ctx.beginPath();
  ctx.fillStyle = '#222';
  ctx.shadowColor = '#00ffcc';
  ctx.shadowBlur = 20;
  ctx.arc(0, 0, 40, 0, 2 * Math.PI);
  ctx.fill();

  ctx.restore();
}

drawWheel(currentAngle);

function spin() {
  if (isSpinning) return;
  isSpinning = true;
  resultDiv.textContent = '';
  spinBtn.disabled = true;

  const spins = Math.floor(Math.random() * 3) + 4; // 4-6 полных вращений
  const extraAngle = Math.random() * 2 * Math.PI; // дополнительный угол

  const targetAngle = spins * 2 * Math.PI + extraAngle;

  let start = null;
  const duration = 6000; // 6 секунд

  function animate(timestamp) {
    if (!start) start = timestamp;
    const elapsed = timestamp - start;

    // ease out cubic
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
  // Определяем индекс сегмента по текущему углу
  const normalizedAngle = currentAngle % (2 * Math.PI);
  const index = numSegments - Math.floor(normalizedAngle / anglePerSegment) - 1;
  const finalIndex = (index + numSegments) % numSegments; // на всякий случай

  resultDiv.textContent = `Поздравляем! Выпал: ${segments[finalIndex]}`;
}

spinBtn.addEventListener('click', spin);