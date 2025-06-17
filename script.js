const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');
const resultText = document.getElementById('result');
const balanceEl = document.getElementById('balance');

let balance = 1000;
let isSpinning = false;

const prizes = [
  { label: '500₽', color: '#ff0000', value: 500 },
  { label: '0₽', color: '#222', value: 0 },
  { label: '200₽', color: '#00ff00', value: 200 },
  { label: '100₽', color: '#0000ff', value: 100 },
  { label: '0₽', color: '#222', value: 0 },
  { label: '300₽', color: '#ff00ff', value: 300 },
  { label: '0₽', color: '#222', value: 0 },
  { label: '1000₽', color: '#ffff00', value: 1000 }
];

const sectorAngle = 2 * Math.PI / prizes.length;
let angle = 0;
let currentAngle = 0;

function drawWheel() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  prizes.forEach((prize, i) => {
    const start = i * sectorAngle + angle;
    const end = start + sectorAngle;

    ctx.beginPath();
    ctx.moveTo(250, 250);
    ctx.arc(250, 250, 240, start, end);
    ctx.fillStyle = prize.color;
    ctx.fill();
    ctx.save();

    ctx.translate(250, 250);
    ctx.rotate(start + sectorAngle / 2);
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText(prize.label, 130, 10);
    ctx.restore();
  });
}

function spin() {
  if (isSpinning || balance < 100) return;

  balance -= 100;
  balanceEl.textContent = balance;
  resultText.textContent = '';

  isSpinning = true;
  let velocity = Math.random() * 0.3 + 0.25;
  const deceleration = 0.002;

  const spinInterval = setInterval(() => {
    angle += velocity;
    drawWheel();
    velocity -= deceleration;

    if (velocity <= 0) {
      clearInterval(spinInterval);
      const sectorIndex = Math.floor((prizes.length - (angle % (2 * Math.PI)) / sectorAngle)) % prizes.length;
      const prize = prizes[sectorIndex];
      balance += prize.value;
      balanceEl.textContent = balance;
      resultText.textContent = `Вы выиграли: ${prize.label}`;
      isSpinning = false;
    }
  }, 20);
}

drawWheel();
spinBtn.addEventListener('click', spin);
