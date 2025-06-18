window.onload = () => {
  setTimeout(() => {
    document.getElementById('loaderScreen').style.display = 'none';
    createBoard();
  }, 1500);
};

const boardElement = document.getElementById('board');
const messageElement = document.getElementById('message');
const countdownElement = document.getElementById('countdown');
const scoreboard = document.getElementById('scoreboard');
const difficultySelect = document.getElementById('difficulty');
const resetButton = document.getElementById('resetButton');
const canvas = document.getElementById('fireworksCanvas');
const ctx = canvas.getContext('2d');

let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = '❌'; // Игрок ходит первым
let gameActive = true;
let fireworks = [];
let animationId;
let playerWins = 0;
let botWins = 0;
let draws = 0;
let botThinkingTime = 3000; // По умолчанию средний уровень

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
  const colors = ['#ff4757','#ffa502','#1e90ff','#2ed573','#ff6b81','#3742fa','#a29bfe'];
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
    cellDiv.setAttribute('role', 'button');
    cellDiv.setAttribute('aria-label', `Ячейка ${index + 1}, ${board[index] ? (board[index] === '❌' ? 'крестик' : 'нолик') : 'пустая'}`);
    cellDiv.tabIndex = 0;
    cellDiv.textContent = cell;
    if(cell !== '') cellDiv.classList.add('disabled');
    cellDiv.addEventListener('click', onCellClick);
    cellDiv.addEventListener('keydown', e => {
      if(e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        cellDiv.click();
      }
    });
    boardElement.appendChild(cellDiv);
  });
  messageElement.textContent = `Ходит: ${currentPlayer}`;
  countdownElement.textContent = '';
  gameActive = true;
}

function onCellClick(e) {
  const index = e.target.dataset.index;
  if(!gameActive || board[index] !== '' || currentPlayer === '⭕') return;
  makeMove(index, currentPlayer);
  if(gameActive && currentPlayer === '⭕'){
    botMoveWithCountdown();
  }
}

function makeMove(index, player) {
  board[index] = player;
  updateBoard();
  checkResult();
  if(gameActive){
    currentPlayer = (player === '❌') ? '⭕' : '❌';
    messageElement.textContent = `Ходит: ${currentPlayer}`;
  }
}

function updateBoard() {
  boardElement.childNodes.forEach((cellDiv, idx) => {
    cellDiv.textContent = board[idx];
    if(board[idx] !== '') {
      cellDiv.classList.add('disabled');
      cellDiv.setAttribute('aria-label', `Ячейка ${idx + 1}, ${board[idx] === '❌' ? 'крестик' : 'нолик'}`);
    } else {
      cellDiv.classList.remove('disabled');
      cellDiv.setAttribute('aria-label', `Ячейка ${idx + 1}, пустая`);
    }
  });
}

function checkResult() {
  for(const condition of winningConditions){
    const [a,b,c] = condition;
    if(board[a] && board[a] === board[b] && board[b] === board[c]){
      gameActive = false;
      if(board[a] === '❌'){
        playerWins++;
        scoreboard.textContent = `Игрок ❌: ${playerWins}  |  Бот ⭕: ${botWins}  |  Ничьи: ${draws}`;
        messageElement.textContent = 'Вы победили! 🎉';
        showFireworks();
      } else {
        botWins++;
        scoreboard.textContent = `Игрок ❌: ${playerWins}  |  Бот ⭕: ${botWins}  |  Ничьи: ${draws}`;
        messageElement.textContent = 'Бот победил! 😢';
      }
      countdownElement.textContent = '';
      return;
    }
  }
  if(!board.includes('')){
    gameActive = false;
    draws++;
    scoreboard.textContent = `Игрок ❌: ${playerWins}  |  Бот ⭕: ${botWins}  |  Ничьи: ${draws}`;
    messageElement.textContent = 'Ничья! 🤝';
    countdownElement.textContent = '';
  }
}

function botMoveWithCountdown() {
  const difficulty = difficultySelect.value;
  switch(difficulty){
    case 'medium': botThinkingTime = 2500; break;
    case 'hard': botThinkingTime = 1000; break;
    case 'boss': botThinkingTime = 0; break;
  }

  if(botThinkingTime === 0){
    botMakeMove();
    return;
  }

  let timeLeft = botThinkingTime / 1000;
  countdownElement.textContent = `Бот думает: ${timeLeft.toFixed(1)} с`;
  const interval = 100;

  const countdownInterval = setInterval(() => {
    timeLeft -= interval / 1000;
    if(timeLeft <= 0){
      clearInterval(countdownInterval);
      countdownElement.textContent = '';
      botMakeMove();
    } else {
      countdownElement.textContent = `Бот думает: ${timeLeft.toFixed(1)} с`;
    }
  }, interval);
}

function botMakeMove() {
  if(!gameActive) return;

  let moveIndex;

  const difficulty = difficultySelect.value;

  if(difficulty === 'medium'){
    moveIndex = getRandomMove();
  } else if(difficulty === 'hard'){
    moveIndex = getBestMove('⭕');
  } else if(difficulty === 'boss'){
    moveIndex = getBestMove('⭕');
  }

  if(moveIndex !== undefined) {
    makeMove(moveIndex, '⭕');
  }
}

// Случайный ход для среднего уровня
function getRandomMove(){
  const available = board.map((v,i) => v === '' ? i : null).filter(v => v !== null);
  if(available.length === 0) return undefined;
  const randomIndex = Math.floor(Math.random() * available.length);
  return available[randomIndex];
}

// Минимакс с ограничением глубины для hard и boss
function getBestMove(player) {
  const opponent = player === '⭕' ? '❌' : '⭕';

  // Минимакс с альфа-бета отсечением и глубиной
  function minimax(newBoard, currentPlayer, depth){
    const availSpots = newBoard.map((v,i) => v === '' ? i : null).filter(v => v !== null);
    // Проверяем выигрыш
    if(checkWin(newBoard, opponent)) return {score: -10 + depth};
    if(checkWin(newBoard, player)) return {score: 10 - depth};
    if(availSpots.length === 0) return {score: 0};

    const moves = [];

    for(let i=0; i<availSpots.length; i++){
      const idx = availSpots[i];
      newBoard[idx] = currentPlayer;
      const result = minimax(newBoard, currentPlayer === player ? opponent : player, depth+1);
      moves.push({index: idx, score: result.score});
      newBoard[idx] = '';
    }

    let bestMove;
    if(currentPlayer === player){
      let bestScore = -Infinity;
      for(const move of moves){
        if(move.score > bestScore){
          bestScore = move.score;
          bestMove = move;
        }
      }
    } else {
      let bestScore = Infinity;
      for(const move of moves){
        if(move.score < bestScore){
          bestScore = move.score;
          bestMove = move;
        }
      }
    }
    return bestMove;
  }

  function checkWin(boardArr, playerSymbol){
    return winningConditions.some(([a,b,c]) => boardArr[a] === playerSymbol && boardArr[b] === playerSymbol && boardArr[c] === playerSymbol);
  }

  // Для «boss» можно использовать глубину без ограничений, для «hard» — ограничить глубину для скорости:
  if(difficulty === 'hard'){
    // Для упрощения — можно использовать getRandomMove() половину раз, чтобы не тормозить
    if(Math.random() < 0.5) return getRandomMove();
  }

  const best = minimax(board.slice(), player, 0);
  return best?.index ?? getRandomMove();
}

difficultySelect.addEventListener('change', () => {
  resetGame();
});

resetButton.addEventListener('click', () => {
  resetGame();
});

function resetGame(){
  board = ['', '', '', '', '', '', '', '', ''];
  currentPlayer = '❌';
  gameActive = true;
  messageElement.textContent = `Ходит: ${currentPlayer}`;
  countdownElement.textContent = '';
  createBoard();
}
