const shopItems = [
  { id: 'X1', name: 'ASIC X1', cost: 50, income: 1 },
  { id: 'S9', name: 'Antminer S9', cost: 200, income: 5 },
  { id: 'S19', name: 'Antminer S19', cost: 1000, income: 30 },
  { id: 'M30', name: 'WhatsMiner M30', cost: 5000, income: 150 }
];

let state = {
  score: 0,
  owned: { X1: 1, S9: 0, S19: 0, M30: 0 }
};

const saveKey = 'asicClickerState';
const scoreEl = document.getElementById('score');
const incomeEl = document.getElementById('income');
const shopEl = document.getElementById('shop');
const shopItemsContainer = document.getElementById('shop-items');
const minerSpinner = document.getElementById('miner-spinner');
const shopToggleBtn = document.getElementById('shop-toggle');
const shopCloseBtn = document.getElementById('shop-close');

function save() {
  localStorage.setItem(saveKey, JSON.stringify(state));
}

function load() {
  const data = localStorage.getItem(saveKey);
  if (data) state = JSON.parse(data);
}

function calcIncome() {
  return shopItems.reduce((sum, item) =>
    sum + (state.owned[item.id] || 0) * item.income, 0);
}

function flashEffect() {
  minerSpinner.classList.add('flash');
  setTimeout(() => minerSpinner.classList.remove('flash'), 400);
}

function updateUI() {
  scoreEl.textContent = `Очки: ${Math.floor(state.score)}`;
  incomeEl.textContent = `Доход/сек: ${calcIncome()}`;

  shopItemsContainer.innerHTML = '';
  shopItems.forEach(item => {
    const count = state.owned[item.id] || 0;
    const div = document.createElement('div');
    div.className = 'shop-item';

    const btn = document.createElement('button');
    btn.textContent = `${item.name} (${count}) — ${item.cost} очков`;
    btn.disabled = state.score < item.cost;
    btn.onclick = () => {
      if (state.score >= item.cost) {
        state.score -= item.cost;
        state.owned[item.id] = count + 1;
        save();
        updateUI();
        flashEffect();
      }
    };

    div.appendChild(btn);
    shopItemsContainer.appendChild(div);
  });
}

minerSpinner.addEventListener('click', () => {
  state.score++;
  save();
  updateUI();
  flashEffect();
});

shopToggleBtn.addEventListener('click', () => {
  shopEl.classList.add('open');
});

shopCloseBtn.addEventListener('click', () => {
  shopEl.classList.remove('open');
});

setInterval(() => {
  state.score += calcIncome();
  save();
  updateUI();
}, 1000);

load();
updateUI();