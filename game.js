const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// Параметры мира (по ширине сделаем очень длинным, но реализуем бесконечную платформу)
const WORLD_WIDTH = 100000;  // Очень длинный мир по горизонтали
const WORLD_HEIGHT = 600;

const player = {
  x: 100,
  y: 0,
  width: 40,
  height: 40,
  vx: 0,
  vy: 0,
  runSpeed: 10,
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

// Основная платформа — бесконечная дорога (по высоте fixed)
const PLATFORM_HEIGHT = 40;
const PLATFORM_Y = WORLD_HEIGHT - PLATFORM_HEIGHT;

// Несколько платформ для прыжков вверх
const platforms = [
  { x: 300, y: 450, width: 200, height: 20 },
  { x: 700, y: 380, width: 150, height: 20 },
  { x: 1100, y: 320, width: 200, height: 20 },
  { x: 1500, y: 450, width: 180, height: 20 },
  { x: 1900, y: 380, width: 220, height: 20 },
];

// Монеты на платформах
const coins = [
  { x: 320, y: 410, size: 20, collected: false },
  { x: 720, y: 340, size: 20, collected: false },
  { x: 1120, y: 280, size: 20, collected: false },
  { x: 1520, y: 410, size: 20, collected: false },
  { x: 1920, y: 340, size: 20, collected: false },
];

// Враги патрулируют на платформах
const enemies = [
  { x: 600, y: PLATFORM_Y - 40, width: 40, height: 40, direction: 1, speed: 2, range: [600, 800] },
  { x: 1400, y: PLATFORM_Y - 40, width: 40, height: 40, direction: 1, speed: 3, range: [1400, 1700] },
];

let score = 0;
let startTime = Date.now();

let touchHold = false;
let lastTapTime = 0;

canvas.addEventListener('touchstart', e => {
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

canvas.addEventListener('touchend', e => {
  e.preventDefault();
  touchHold = false;
});

// Для ПК мыши — тоже самое (удобно для теста)
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
  player.y = PLATFORM_Y - player.height;
  player.vx = 0;
  player.vy = 0;
  player.onGround = true;
  score = 0;
  coins.forEach(c => c.collected = false);
  startTime = Date.now();
}

function update() {
  // Горизонтальное движение: удержание пальца - бежим вправо
  player.vx = touchHold ? player.runSpeed : 0;

  // Гравитация
  player.vy += player.gravity;

  player.x += player.vx;
  player.y += player.vy;

  // Проверяем столкновение с бесконечной основной платформой (дорогой)
  if (player.y + player.height > PLATFORM_Y) {
    player.y = PLATFORM_Y - player.height;
    player.vy = 0;
    player.onGround = true;
  } else {
    player.onGround = false;
  }

  // Столкновения с дополнительными платформами
  for (const plat of platforms) {
    if (
      player.x < plat.x + plat.width &&
      player.x + player.width > plat.x &&
      player.y < plat.y + plat.height &&
      player.y + player.height > plat.y
    ) {
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

  // Обновляем врагов (патрулируют)
  enemies.forEach(enemy => {
    enemy.x += enemy.speed * enemy.direction;
    if (enemy.x < enemy.range[0] || enemy.x > enemy.range[1]) {
      enemy.direction *= -1;
    }
  });

  // Проверка столкновений с врагами
  for (const enemy of enemies) {
    if (rectsIntersect(player, enemy)) {
      resetGame();
      break;
    }
  }

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

  // Камера следует за игроком по горизонтали, фиксируем по вертикали
  camera.x = player.x + player.width / 2 - canvas.width / 2;
  camera.y = 0;  // по вертикали камера не двигается (фокус на платформе)

  if (camera.x < 0) camera.x = 0;
  if (camera.x + canvas.width > WORLD_WIDTH) camera.x = WORLD_WIDTH - canvas.width;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  // Фон
  ctx.fillStyle = '#87CEEB';
  ctx.fillRect(camera.x, camera.y, canvas.width, canvas.height);

  // Бесконечная платформа (длинная дорога)
  ctx.fillStyle = '#654321';
  ctx.fillRect(camera.x, PLATFORM_Y, canvas.width, PLATFORM_HEIGHT);

  // Рисуем дополнительные платформы
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

  // Счёт и время (в левом верхнем углу)
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