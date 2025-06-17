const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 600;

const player = {
  x: 100,
  y: 100,
  width: 40,
  height: 40,
  vx: 0,
  vy: 0,
  speed: 7,
  runSpeed: 10,   // скорость бега при удержании
  jumpPower: -18,
  strongJumpPower: -28,
  gravity: 0.8,
  onGround: false,
  color: 'orange',
};

// Камера
const camera = {
  x: 0,
  y: 0,
  width: canvas.width,
  height: canvas.height,
};

const platforms = [
  { x: 0, y: 560, width: WORLD_WIDTH, height: 40 },
  { x: 300, y: 450, width: 200, height: 20 },
  { x: 150, y: 350, width: 150, height: 20 },
  { x: 500, y: 300, width: 200, height: 20 },
  { x: 800, y: 400, width: 150, height: 20 },
  { x: 1100, y: 350, width: 300, height: 20 },
  { x: 1500, y: 500, width: 400, height: 20 },
];

const coins = [
  { x: 320, y: 410, size: 20, collected: false },
  { x: 180, y: 310, size: 20, collected: false },
  { x: 550, y: 260, size: 20, collected: false },
  { x: 850, y: 360, size: 20, collected: false },
  { x: 1200, y: 310, size: 20, collected: false },
  { x: 1550, y: 460, size: 20, collected: false },
];

const enemies = [
  { x: 700, y: 520, width: 40, height: 40, direction: 1, speed: 2, range: [700, 900] },
  { x: 1300, y: 310, width: 40, height: 40, direction: 1, speed: 3, range: [1300, 1600] },
];

let score = 0;
let startTime = Date.now();

let touchHold = false; // флаг удержания пальца
let lastTapTime = 0;   // время последнего тапа для определения двойного тапа

// Обработчик касаний

canvas.addEventListener('touchstart', e => {
  e.preventDefault();

  touchHold = true;

  const now = Date.now();
  const tapInterval = now - lastTapTime;

  if (tapInterval < 300) {
    // Двойной тап — сильный прыжок
    if (player.onGround) {
      player.vy = player.strongJumpPower;
      player.onGround = false;
    }
  } else {
    // Одиночный тап — обычный прыжок
    if (player.onGround) {
      player.vy = player.jumpPower;
      player.onGround = false;
    }
  }

  lastTapTime = now;
});

canvas.addEventListener('touchend', e => {
  e.preventDefault();
  touchHold = false;
});

// Для мыши (если хочешь тестировать на ПК)

canvas.addEventListener('mousedown', e => {
  e.preventDefault();

  touchHold = true;

  const now = Date.now();
  const tapInterval = now - lastTapTime;

  if (tapInterval < 300) {
    if (player.onGround) {
      player.vy = player.strongJumpPower;
      player.onGround = false;
    }
  } else {
    if (player.onGround) {
      player.vy = player.jumpPower;
      player.onGround = false;
    }
  }

  lastTapTime = now;
});

canvas.addEventListener('mouseup', e => {
  e.preventDefault();
  touchHold = false;
});

function rectsIntersect(r1, r2) {
  return !(r2.x > r1.x + r1.width ||
           r2.x + r2.width < r1.x ||
           r2.y > r1.y + r1.height ||
           r2.y + r2.height < r1.y);
}

function resetGame() {
  player.x = 100;
  player.y = 100;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  score = 0;
  coins.forEach(c => c.collected = false);
  startTime = Date.now();
}

function update() {
  // Горизонтальное движение: если удерживаем палец - бежим вправо
  if (touchHold) {
    player.vx = player.runSpeed;
  } else {
    player.vx = 0;
  }

  // Гравитация
  player.vy += player.gravity;

  player.x += player.vx;
  player.y += player.vy;

  // Столкновения с платформами
  player.onGround = false;
  for (const plat of platforms) {
    if (
      player.x < plat.x + plat.width &&
      player.x + player.width > plat.x &&
      player.y < plat.y + plat.height &&
      player.y + player.height > plat.y
    ) {
      // Стоим сверху платформы
      if (player.vy > 0 && (player.y + player.height - player.vy) <= plat.y) {
        player.y = plat.y - player.height;
        player.vy = 0;
        player.onGround = true;
      } else if (player.vy < 0 && (player.y - player.vy) >= plat.y + plat.height) {
        player.y = plat.y + plat.height;
        player.vy = 0;
      } else {
        if (player.x + player.width > plat.x && player.x < plat.x) {
          player.x = plat.x - player.width;
        } else if (player.x < plat.x + plat.width && player.x > plat.x) {
          player.x = plat.x + plat.width;
        }
      }
    }
  }

  // Столкновения с врагами
  for (const enemy of enemies) {
    if (rectsIntersect(player, enemy)) {
      resetGame();
      break;
    }
  }

  // Обновляем врагов (патрулирование)
  enemies.forEach(enemy => {
    enemy.x += enemy.speed * enemy.direction;
    if (enemy.x < enemy.range[0] || enemy.x > enemy.range[1]) {
      enemy.direction *= -1;
    }
  });

  // Сбор монет
  coins.forEach(coin => {
    if (!coin.collected) {
      const coinRect = { x: coin.x, y: coin.y, width: coin.size, height: coin.size };
      if (rectsIntersect(player, coinRect)) {
        coin.collected = true;
        score++;
      }
    }
  });

  // Камера следует за игроком
  camera.x = player.x + player.width / 2 - canvas.width / 2;
  camera.y = player.y + player.height / 2 - canvas.height / 2;

  if (camera.x < 0) camera.x = 0;
  if (camera.y < 0) camera.y = 0;
  if (camera.x + canvas.width > WORLD_WIDTH) camera.x = WORLD_WIDTH - canvas.width;
  if (camera.y + canvas.height > WORLD_HEIGHT) camera.y = WORLD_HEIGHT - canvas.height;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  // Фон
  ctx.fillStyle = '#87CEEB';
  ctx.fillRect(camera.x, camera.y, canvas.width, canvas.height);

  // Платформы
  ctx.fillStyle = '#654321';
  platforms.forEach(plat => {
    ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
  });

  // Монеты
  coins.forEach(coin => {
    if (!coin.collected) {
      ctx.fillStyle = 'gold';
      ctx.beginPath();
      ctx.arc(coin.x + coin.size / 2, coin.y + coin.size / 2, coin.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Враги
  ctx.fillStyle = 'red';
  enemies.forEach(enemy => {
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
  });

  // Игрок
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);

  ctx.restore();

  // Счёт и время
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText(`Монет: ${score}`, 20, 30);
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  ctx.fillText(`Время: ${elapsed}s`, 20, 60);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

resetGame();
loop();