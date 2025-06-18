<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<title>Крестики-нолики — Игра с ботом</title>
<style>
  /* Сброс и базовые стили */
  * {
    box-sizing: border-box;
  }
  body {
    margin: 0; padding: 20px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    display: flex; flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    min-height: 100vh;
    color: #f0f0f5;
    user-select: none;
  }
  #loaderScreen {
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: linear-gradient(135deg, #4b6cb7, #182848);
    display: flex; justify-content: center; align-items: center; flex-direction: column;
    color: #e0e0ff; font-size: 30px; font-weight: 700; z-index: 1000;
  }
  .spinner {
    margin-top: 25px; width: 60px; height: 60px;
    border: 8px solid rgba(255,255,255,0.15);
    border-top: 8px solid #a29bfe;
    border-radius: 50%;
    animation: spin 1.3s linear infinite;
  }
  @keyframes spin {
    0% { transform: rotate(0deg);}
    100% { transform: rotate(360deg);}
  }

  /* Контейнер выбора сложности */
  #difficultySelect {
    margin-bottom: 25px;
    background: rgba(255,255,255,0.15);
    padding: 14px 24px;
    border-radius: 30px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    user-select: none;
    display: flex;
    align-items: center;
    gap: 15px;
    font-weight: 600;
    font-size: 18px;
    color: #dfe6e9;
    backdrop-filter: blur(10px);
  }
  #difficultySelect label {
    cursor: default;
  }
  #difficultySelect select {
    background: #fff;
    border-radius: 20px;
    padding: 8px 14px;
    font-size: 18px;
    border: none;
    outline: none;
    box-shadow: 0 3px 10px rgba(255,255,255,0.4);
    cursor: pointer;
    transition: background-color 0.3s ease;
  }
  #difficultySelect select:hover {
    background-color: #f1f1f1;
  }

  /* Счёт и сообщение */
  #scoreboard {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 20px;
    letter-spacing: 0.06em;
    text-shadow: 0 0 10px #a29bfe;
    user-select: none;
  }
  #message {
    margin-top: 24px;
    font-size: 28px;
    font-weight: 700;
    color: #ffeaa7;
    text-shadow: 0 0 8px #fab1a0;
    min-height: 36px;
    user-select: none;
  }
  #countdown {
    margin-top: 6px;
    font-size: 22px;
    font-weight: 600;
    color: #dfe6e9cc;
    min-height: 28px;
    user-select: none;
  }

  /* Игровое поле */
  #board {
    display: grid;
    grid-template-columns: repeat(3, 110px);
    grid-template-rows: repeat(3, 110px);
    gap: 16px;
    user-select: none;
  }
  @media (max-width: 400px) {
    #board {
      grid-template-columns: repeat(3, 80px);
      grid-template-rows: repeat(3, 80px);
      gap: 12px;
    }
  }
  .cell {
    background: linear-gradient(145deg, #7f8cfa, #5e66cc);
    border-radius: 24px;
    box-shadow:  7px 7px 15px #514c93,
                -7px -7px 15px #a3a0f4;
    font-size: 78px;
    color: #dfe6e9;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: 
      background-color 0.3s ease,
      transform 0.15s ease,
      box-shadow 0.3s ease;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
  .cell:hover:not(.disabled) {
    background: linear-gradient(145deg, #a29bfe, #6c5ce7);
    box-shadow:
      0 0 12px 3px #6c5ce7;
    transform: scale(1.05);
  }
  .cell:active:not(.disabled) {
    transform: scale(0.95);
    box-shadow:
      inset 2px 2px 10px #4a44aa,
      inset -2px -2px 10px #8b81f7;
  }
  .cell.disabled {
    cursor: default;
    color: #b2bec3;
    background: linear-gradient(145deg, #5a60a3, #474c8f);
    box-shadow: inset 5px 5px 15px #3a3e7a,
                inset -5px -5px 15px #6e73b9;
  }

  /* Кнопка сброса */
  #resetButton {
    margin-top: 30px;
    padding: 12px 28px;
    background: linear-gradient(145deg, #a29bfe, #6c5ce7);
    color: white;
    font-size: 20px;
    font-weight: 700;
    border: none;
    border-radius: 30px;
    cursor: pointer;
    box-shadow:
      0 8px 20px rgba(108,92,231,0.7);
    transition: 
      background-color 0.3s ease,
      box-shadow 0.3s ease,
      transform 0.15s ease;
    user-select: none;
  }
  #resetButton:hover {
    background: linear-gradient(145deg, #8178f7, #4b39d7);
    box-shadow:
      0 10px 30px rgba(75,57,215,0.9);
    transform: scale(1.05);
  }
  #resetButton:active {
    transform: scale(0.95);
    box-shadow: 0 4px 15px rgba(75,57,215,0.6);
  }

  /* Canvas для фейерверка */
  #fireworksCanvas {
    position: fixed;
    top: 0; left: 0;
    width: 100vw; height: 100vh;
    pointer-events: none;
    z-index: 100;
  }
</style>
</head>
<body>
<div id="loaderScreen" role="alert" aria-live="assertive">Игра загружается...<div class="spinner"></div></div>

<div id="difficultySelect">
  <label for="difficulty">Выберите уровень сложности:</label>
  <select id="difficulty" aria-label="Уровень сложности">
    <option value="medium" selected>Средний</option>
    <option value="hard">Сильный</option>
    <option value="boss">Босс</option>
  </select>
</div>

<div id="scoreboard" aria-live="polite" aria-atomic="true">Игрок ❌: 0  |  Бот ⭕: 0  |  Ничьи: 0</div>

<div id="board" role="grid" aria-label="Игровое поле крестики-нолики"></div>

<div id="message" aria-live="polite" aria-atomic="true">Ходит: ❌</div>
<div id="countdown" aria-live="polite" aria-atomic="true"></div>

<button id="resetButton" aria-label="Начать новую игру">Начать заново</button>

<canvas id="fireworksCanvas"></canvas>

<script src="tic-tac-toe-bot.js"></script>
</body>
</html>