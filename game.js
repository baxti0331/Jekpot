const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

const GRAVITY = 0.6;
const JUMP_POWER = -12;
const OBSTACLE_WIDTH = 80;
const OBSTACLE_GAP = 200;
const OBSTACLE_INTERVAL = 1500; // мс между препятствиями

let player = {
  x: 150,
  y: canvas.height / 2,
  width: 40,
  height: 30,
  vy: 0,
  color: 'orange',
};

let obstacles = [];
let lastObstacleTime = 0;
let score = 0;
let gameOver = false;
let startTime = Date.now();

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  if (!gameOver) {
    player.vy = JUMP_POWER;
  } else {
    resetGame();
  }
});

canvas.addEventListener('mousedown', e => {
  e.preventDefault();
  if (!gameOver) {
    player.vy = JUMP_POWER;
  } else {
    resetGame();
  }
});

function resetGame() {
  player.y = canvas.height / 2;
  player.vy = 0;
  obstacles = [];
  lastObstacleTime = 0;
  score = 0;
  gameOver = false;
  startTime = Date.now();
}

function createObstacle() {
  const topHeight = 50 + Math.random() * (canvas.height - OBSTACLE_GAP - 100);
  obstacles.push({
    x: canvas.width,
    topHeight: topHeight,
    bottomY: topHeight + OBSTACLE_GAP,
    width: OBSTACLE_WIDTH,
    passed: false,
  });
}

function update(deltaTime) {
  if (gameOver) return;

  player.vy += GRAVITY;
  player.y += player.vy;

  if (player.y < 0) {
    player.y = 0;
    player.vy = 0;
  }
  if (player.y + player.height > canvas.height) {
    player.y = canvas.height - player.height;
    gameOver = true;
  }

  if (Date.now() - lastObstacleTime > OBSTACLE_INTERVAL) {
    createObstacle();
    lastObstacleTime = Date.now();
  }

  obstacles.forEach(ob => {
    ob.x -= 5;
  });

  obstacles = obstacles.filter(ob => ob.x + ob.width > 0);

  for (const ob of obstacles) {
    const topRect = { x: ob.x, y: 0, width: ob.width, height: ob.topHeight };
    const bottomRect = { x: ob.x, y: ob.bottomY, width: ob.width, height: canvas.height - ob.bottomY };

    if (rectsIntersect(player, topRect) || rectsIntersect(player, bottomRect)) {
      gameOver = true;
    }

    if (!ob.passed && ob.x + ob.width < player.x) {
      ob.passed = true;
      score++;
    }
  }
}

function rectsIntersect(r1, r2) {
  return !(r2.x > r1.x + r1.width ||
           r2.x + r2.width < r1.x ||
           r2.y > r1.y + r1.height ||
           r2.y + r2.height < r1.y);
}

function drawPlayer(x, y, width, height) {
  ctx.save();
  ctx.translate(x + width / 2, y + height / 2);

  // Тело (овал)
  ctx.fillStyle = '#FFA500';
  ctx.beginPath();
  ctx.ellipse(0, 0, width * 0.5, height * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Голова (круг)
  ctx.beginPath();
  ctx.arc(0, -height * 0.6, width * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Глаза
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(-width * 0.15, -height * 0.65, width * 0.08, 0, Math.PI * 2);
  ctx.arc(width * 0.15, -height * 0.65, width * 0.08, 0, Math.PI * 2);
  ctx.fill();

  // Носик (треугольник)
  ctx.fillStyle = '#D2691E';
  ctx.beginPath();
  ctx.moveTo(0, -height * 0.55);
  ctx.lineTo(-width * 0.06, -height * 0.5);
  ctx.lineTo(width * 0.06, -height * 0.5);
  ctx.closePath();
  ctx.fill();

  // Уши (треугольники)
  ctx.fillStyle = '#FFA500';
  ctx.beginPath();
  ctx.moveTo(-width * 0.3, -height * 0.85);
  ctx.lineTo(-width * 0.15, -height * 1.1);
  ctx.lineTo(0, -height * 0.85);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(width * 0.3, -height * 0.85);
  ctx.lineTo(width * 0.15, -height * 1.1);
  ctx.lineTo(0, -height * 0.85);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Крылья (прозрачные)
  ctx.fillStyle = 'rgba(255, 165, 0, 0.5)';
  ctx.beginPath();
  ctx.ellipse(-width * 0.6, 0, width * 0.4, height * 0.8, Math.PI / 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(width * 0.6, 0, width * 0.4, height * 0.8, -Math.PI / 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function draw() {
  ctx.fillStyle = '#87CEEB';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawPlayer(player.x, player.y, player.width, player.height);

  ctx.fillStyle = 'green';
  obstacles.forEach(ob => {
    ctx.fillRect(ob.x, 0, ob.width, ob.topHeight);
    ctx.fillRect(ob.x, ob.bottomY, ob.width, canvas.height - ob.bottomY);
  });

  ctx.fillStyle = 'white';
  ctx.font = '24px Arial';
  ctx.fillText(`Очки: ${score}`, 20, 40);
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  ctx.fillText(`Время: ${elapsed}s`, 20, 80);

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Игра окончена', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '28px Arial';
    ctx.fillText('Нажмите или тапните, чтобы начать заново', canvas.width / 2, canvas.height / 2 + 40);
    ctx.textAlign = 'start';
  }
}

function loop(timestamp) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  update();
  draw();
  requestAnimationFrame(loop);
}

resetGame();
loop();