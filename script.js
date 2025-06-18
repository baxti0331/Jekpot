window.onload = () => {
  setTimeout(() => {
    document.getElementById('loaderScreen').style.display = 'none';
    createBoard();
  }, 2000); // 2 секунды загрузки
};

const boardElement = document.getElementById('board');
const messageElement = document.getElementById('message');
const countdownElement = document.getElementById('countdown');
const scoreboard = document.getElementById('scoreboard');
const difficultySelect = document.getElementById('difficulty');
const canvas = document.getElementById('fireworksCanvas');
const ctx = canvas.getContext('2d');

let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = '❌';
let gameActive = true;
let fireworks = [];
let animationId;
let playerWins = 0;
let botWins = 0;
let draws = 0;

const winningConditions = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class FireworkParticle {
  constructor(x,y,color){
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = Math.random()*3 + 2;
    this.speedX = (Math.random()-0.5)*6;
    this.speedY = (Math.random()-0.5)*6;
    this.alpha = 1;
    this.gravity = 0.05;
    this.decay = 0.015 + Math.random()*0.015;
  }
  update() {
    this.speedY += this.gravity;
    this.x += this.speedX;
    this.y += this.speedY;
    this.alpha -= this.decay;
  }
  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
    ctx.fill();
    ctx.restore();
  }
}

function createFireworks(x, y) {
  const colors = ['#ff4757','#ffa502','#1e90ff','#2ed573','#ff6b81','#3742fa'];
  for(let i=0; i<60; i++){
    const color = colors[Math.floor(Math.random()*colors.length)];
    fireworks.push(new FireworkParticle(x, y, color));
  }
}

function animateFireworks() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for(let i = fireworks.length - 1; i >= 0; i--){
    const p = fireworks[i];
    p.update();
    p.draw();
    if(p.alpha <= 0){
      fireworks.splice(i,1);
    }
  }
  if(fireworks.length > 0){
    animationId = requestAnimationFrame(animateFireworks);
  } else {
    cancelAnimationFrame(animationId);
  }
}

function showFireworks() {
  createFireworks(window.innerWidth/2, window.innerHeight/2);
  animateFireworks();
}

function createBoard() {
  boardElement.innerHTML = '';
  board.forEach((cell, index) => {
    const cellDiv = document.createElement('div');
    cellDiv.classList.add('cell');
    cellDiv.dataset.index = index;
    cellDiv.textContent = cell;
    if(cell !== '') cellDiv.classList.add('disabled');
    cellDiv.addEventListener('click', onCellClick);
    boardElement.appendChild(cellDiv);
  });
}

function onCellClick(e) {
  const index = e.target.dataset.index;
  if(!gameActive || board[index] !== '' || currentPlayer === '⭕') return;
  board[index] = currentPlayer;
  updateBoard();
  checkResult();
  if(gameActive && currentPlayer === '⭕'){
    setTimeout(botMove, 500);
  }
}

function updateBoard() {
  document.querySelectorAll('.cell').forEach(cell => {
    const idx = cell.dataset.index;
    cell.textContent = board[idx];
    if(board[idx] !== '') cell.classList.add('disabled');
    else cell.classList.remove('disabled');
  });
}

function updateScoreboard() {
  scoreboard.textContent = `Игрок ❌: ${playerWins}  |  Бот ⭕: ${botWins}  |  Ничьи: ${draws}`;
}

function checkResult() {
  let roundWon = false;
  for(const condition of winningConditions){
    const [a,b,c] = condition;
    if(board[a] === '' || board[b] === '' || board[c] === '') continue;
    if(board[a] === board[b] && board[b] === board[c]){
      roundWon = true;
      break;
    }
  }
  if(roundWon){
    messageElement.textContent = `Победитель: ${currentPlayer}! 🎉`;
    gameActive = false;
    highlightWinningCells();
    showFireworks();

    if(currentPlayer === '❌') playerWins++;
    else if(currentPlayer === '⭕') botWins++;

    updateScoreboard();
    startCountdownAndRestart();
    return;
  }
  if(!board.includes('')){
    messageElement.textContent = 'Ничья! 🤝';
    gameActive = false;
    draws++;
    updateScoreboard();
    startCountdownAndRestart();
    return;
  }
  currentPlayer = currentPlayer === '❌' ? '⭕' : '❌';
  messageElement.textContent = `Ход: ${currentPlayer}`;
  countdownElement.textContent = '';
}

function highlightWinningCells() {
  for(const condition of winningConditions){
    const [a,b,c] = condition;
    if(board[a] !== '' && board[a] === board[b] && board[b] === board[c]){
      document.querySelector(`.cell[data-index="${a}"]`).style.backgroundColor = '#55efc4';
      document.querySelector(`.cell[data-index="${b}"]`).style.backgroundColor = '#55efc4';
      document.querySelector(`.cell[data-index="${c}"]`).style.backgroundColor = '#55efc4';
    }
  }
}

function startCountdownAndRestart() {
  let timeLeft = 3;
  countdownElement.textContent = timeLeft;
  clearInterval(window.countdownInterval);
  window.countdownInterval = setInterval(() => {
    timeLeft--;
    if(timeLeft <= 0){
      clearInterval(window.countdownInterval);
      countdownElement.textContent = '';
      restartGame();
    } else {
      countdownElement.textContent = timeLeft;
    }
  }, 1000);
}

function restartGame() {
  board = ['', '', '', '', '', '', '', '', ''];
  currentPlayer = '❌';
  gameActive = true;
  messageElement.textContent = `Ход: ${currentPlayer}`;
  countdownElement.textContent = '';
  createBoard();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  fireworks = [];
  cancelAnimationFrame(animationId);
}

// Бот ходит в зависимости от выбранного уровня сложности
function botMove() {
  if (!gameActive) return;
  const difficulty = difficultySelect.value;

  if (difficulty === 'easy') {
    easyBotMove();
  } else if (difficulty === 'medium') {
    mediumBotMove();
  } else {
    hardBotMove();
  }
}

// Средний бот: минимакс с 70% вероятностью, случайный ход 30%
function mediumBotMove() {
  const randomChance = Math.random();
  if (randomChance < 0.7) {
    minimaxMove();
  } else {
    randomMove();
  }
}

// Сильный бот: минимакс с 90% вероятностью, случайный ход 10%
function hardBotMove() {
  const randomChance = Math.random();
  if (randomChance < 0.9) {
    minimaxMove();
  } else {
    randomMove();
  }
}

// Легкий бот: всегда случайный ход
function easyBotMove() {
  randomMove();
}

function randomMove() {
  const emptyIndices = board.map((val, idx) => val === '' ? idx : -1).filter(idx => idx !== -1);
  if (emptyIndices.length === 0) return;
  const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  board[randomIndex] = '⭕';
  updateBoard();
  checkResult();
}

function minimaxMove() {
  let bestScore = -Infinity;
  let move;
  for (let i = 0; i < board.length; i++) {
    if (board[i] === '') {
      board[i] = '⭕';
      let score = minimax(board, 0, false);
      board[i] = '';
      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  }
  board[move] = '⭕';
  updateBoard();
  checkResult();
}

function minimax(newBoard, depth, isMaximizing) {
  const scores = { '⭕': 1, '❌': -1, tie: 0 };
  const result = checkWinner(newBoard);
  if (result !== null) return scores[result];

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < newBoard.length; i++) {
      if (newBoard[i] === '') {
        newBoard[i] = '⭕';
        let score = minimax(newBoard, depth + 1, false);
        newBoard[i] = '';
        bestScore = Math.max(score, bestScore);
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < newBoard.length; i++) {
      if (newBoard[i] === '') {
        newBoard[i] = '❌';
        let score = minimax(newBoard, depth + 1, true);
        newBoard[i] = '';
        bestScore = Math.min(score, bestScore);
      }
    }
    return bestScore;
  }
}

function checkWinner(bd) {
  for (const condition of winningConditions) {
    const [a, b, c] = condition;
    if (bd[a] && bd[a] === bd[b] && bd[b] === bd[c]) {
      return bd[a];
    }
  }
  if (!bd.includes('')) return 'tie';
  return null;
} 