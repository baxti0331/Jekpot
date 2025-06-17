const shopItems = [
  { id: 'X1', name: 'ASIC X1', cost: 50, income: 1, color: '#3c3c3c' },
  { id: 'S9', name: 'Antminer S9', cost: 200, income: 5, color: '#444' },
  { id: 'S19', name: 'Antminer S19', cost: 1000, income: 30, color: '#2e2e2e' },
  { id: 'M30', name: 'WhatsMiner M30', cost: 5000, income: 150, color: '#1a1a1a' }
];

let state = {
  score: 0,
  owned: { X1: 1, S9: 0, S19: 0, M30: 0 }
};

const saveKey = 'asicClickerState';
const scoreEl = document.getElementById('score');
const incomeEl = document.getElementById('income');
const shopEl = document.getElementById('shop');
const asicContainer = document.getElementById('asic-container');
const asicLabel = document.getElementById('asic-label');

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

function getBestAsic() {
  let best = shopItems[0];
  for (let i = shopItems.length - 1; i >= 0; i--) {
    if ((state.owned[shopItems[i].id] || 0) > 0) {
      best = shopItems[i];
      break;
    }
  }
  return best;
}

function flashEffect() {
  asicContainer.classList.add('flash');
  setTimeout(() => asicContainer.classList.remove('flash'), 400);
}

function updateUI() {
  scoreEl.textContent = `Очки: ${Math.floor(state.score)}`;
  incomeEl.textContent = `Доход/сек: ${calcIncome()}`;

  // Обновить внешний вид ASIC по лучшему устройству
  const best = getBestAsic();
  asicLabel.textContent = best.name;
  asicContainer.style.background = best.color;

  shopEl.innerHTML = '';
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
    shopEl.appendChild(div);
  });
}

asicContainer.addEventListener('click', () => {
  state.score++;
  save();
  updateUI();
});

setInterval(() => {
  state.score += calcIncome();
  save();
  updateUI();
}, 1000);

load();
updateUI();
