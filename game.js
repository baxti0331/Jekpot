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
  // Верхняя труба: высота от 50 до canvas.height - gap - 50
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

  // Движение игрока с гравитацией
  player.vy += GRAVITY;
  player.y += player.vy;

  // Ограничения по верхнему и нижнему краю
  if (player.y < 0) {
    player.y = 0;
    player.vy = 0;
  }
  if (player.y + player.height > canvas.height) {
    player.y = canvas.height - player.height;
    gameOver = true;
  }

  // Создаём препятствия через интервалы времени
  if (Date.now() - lastObstacleTime > OBSTACLE_INTERVAL) {
    createObstacle();
    lastObstacleTime = Date.now();
  }

  // Движение препятствий влево
  obstacles.forEach(ob => {
    ob.x -= 5;
  });

  // Удаляем вышедшие за левый край препятствия
  obstacles = obstacles.filter(ob => ob.x + ob.width > 0);

  // Проверка столкновений с препятствиями
  for (const ob of obstacles) {
    // Верхняя труба
    const topRect = { x: ob.x, y: 0, width: ob.width, height: ob.topHeight };
    // Нижняя труба
    const bottomRect = { x: ob.x, y: ob.bottomY, width: ob.width, height: canvas.height - ob.bottomY };

    if (rectsIntersect(player, topRect) || rectsIntersect(player, bottomRect)) {
      gameOver = true;
    }

    // Подсчёт очков — когда игрок пролетает препятствие
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

function draw() {
  // Фон небо
  ctx.fillStyle = '#87CEEB';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Рисуем игрока
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // Рисуем препятствия — трубы зелёные
  ctx.fillStyle = 'green';
  obstacles.forEach(ob => {
    // Верхняя труба
    ctx.fillRect(ob.x, 0, ob.width, ob.topHeight);
    // Нижняя труба
    ctx.fillRect(ob.x, ob.bottomY, ob.width, canvas.height - ob.bottomY);
  });

  // Счёт и время
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