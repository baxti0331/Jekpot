let trips = JSON.parse(localStorage.getItem('trips') || '[]');
let currentTripIndex = null;

function saveTrips() {
  localStorage.setItem('trips', JSON.stringify(trips));
}

function renderTripList() {
  const list = document.getElementById('trip-list');
  list.innerHTML = '';
  trips.forEach((trip, index) => {
    const div = document.createElement('div');
    div.className = 'trip-item';
    div.textContent = trip.name;
    div.onclick = () => openTrip(index);
    list.appendChild(div);
  });
}

function openTrip(index) {
  currentTripIndex = index;
  const trip = trips[index];
  document.getElementById('trip-list-section').style.display = 'none';
  document.getElementById('trip-editor-section').style.display = 'block';

  document.getElementById('trip-title').textContent = trip.name;
  document.getElementById('trip-location').value = trip.location || '';
  document.getElementById('trip-start').value = trip.startDate || '';
  document.getElementById('trip-end').value = trip.endDate || '';

  renderParticipants();
  renderExpenseForm();
  updateSummary();
}

function renderParticipants() {
  const trip = trips[currentTripIndex];
  const ul = document.getElementById('participant-list');
  ul.innerHTML = '';
  trip.participants = trip.participants || [];
  trip.participants.forEach(p => {
    const li = document.createElement('li');
    li.textContent = p;
    ul.appendChild(li);
  });

  ['expense-payer', 'transfer-from', 'transfer-to'].forEach(id => {
    const select = document.getElementById(id);
    select.innerHTML = '';
    trip.participants.forEach(p => {
      const option = document.createElement('option');
      option.value = option.text = p;
      select.appendChild(option);
    });
  });

  const customSplit = document.getElementById('custom-split-fields');
  customSplit.innerHTML = '';
  trip.participants.forEach(p => {
    const input = document.createElement('input');
    input.type = 'number';
    input.placeholder = p;
    input.dataset.name = p;
    customSplit.appendChild(input);
  });
}

function renderExpenseForm() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('expense-date').value = today;
}

function updateSummary() {
  const trip = trips[currentTripIndex];
  const balances = {};
  trip.participants.forEach(p => balances[p] = 0);

  const entries = [...(trip.expenses || []), ...(trip.transfers || [])];

  for (const entry of entries) {
    if (entry.type === 'expense') {
      const payer = entry.payer;
      const amount = entry.amount;
      const shares = entry.custom || {};
      const perPerson = !entry.custom ? amount / trip.participants.length : null;
      trip.participants.forEach(p => {
        const share = entry.custom ? (shares[p] || 0) : perPerson;
        balances[p] -= share;
      });
      balances[payer] += amount;
    } else if (entry.type === 'transfer') {
      balances[entry.from] -= entry.amount;
      balances[entry.to] += entry.amount;
    }
  }

  // Chart
  const ctx = document.getElementById('balance-chart').getContext('2d');
  if (window.balanceChart) window.balanceChart.destroy();
  window.balanceChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(balances),
      datasets: [{
        label: 'Баланс ₽',
        data: Object.values(balances),
        backgroundColor: Object.values(balances).map(v => v >= 0 ? 'green' : 'red')
      }]
    }
  });

  const summary = document.getElementById('summary-table');
  summary.innerHTML = '';
  const table = document.createElement('table');
  table.innerHTML = '<tr><th>Участник</th><th>Баланс (₽)</th></tr>';
  for (const [name, balance] of Object.entries(balances)) {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${name}</td><td style="color:${balance >= 0 ? 'green' : 'red'}">${balance.toFixed(2)}</td>`;
    table.appendChild(row);
  }
  summary.appendChild(table);

  // Debt Matrix
  const matrixDiv = document.getElementById('debt-matrix');
  matrixDiv.innerHTML = '';
  const debtTable = document.createElement('table');
  const headerRow = document.createElement('tr');
  headerRow.innerHTML = '<th></th>' + trip.participants.map(p => `<th>${p}</th>`).join('');
  debtTable.appendChild(headerRow);

  trip.participants.forEach(from => {
    const row = document.createElement('tr');
    row.innerHTML = `<th>${from}</th>`;
    trip.participants.forEach(to => {
      const cell = document.createElement('td');
      if (from === to) {
        cell.innerHTML = '-';
      } else {
        const diff = (balances[to] - balances[from]) / 2;
        if (diff > 0.01) {
          const btn = document.createElement('button');
          btn.textContent = `→ ${diff.toFixed(2)}₽`;
          btn.onclick = () => addTransfer(from, to, parseFloat(diff.toFixed(2)));
          cell.appendChild(btn);
        }
      }
      row.appendChild(cell);
    });
    debtTable.appendChild(row);
  });
  matrixDiv.appendChild(debtTable);
}

function addTransfer(from, to, amount) {
  const trip = trips[currentTripIndex];
  trip.transfers.push({ type: 'transfer', from, to, amount });
  saveTrips();
  updateSummary();
}

document.getElementById('create-trip-btn').onclick = () => {
  const name = prompt("Название поездки:");
  if (!name) return;
  trips.push({ name, participants: [], expenses: [], transfers: [] });
  saveTrips();
  renderTripList();
};

document.getElementById('back-to-trips').onclick = () => {
  document.getElementById('trip-editor-section').style.display = 'none';
  document.getElementById('trip-list-section').style.display = 'block';
  saveTrips();
  renderTripList();
};

document.getElementById('add-participant-btn').onclick = () => {
  const name = document.getElementById('new-participant').value.trim();
  if (!name) return;
  const trip = trips[currentTripIndex];
  if (!trip.participants.includes(name)) {
    trip.participants.push(name);
    saveTrips();
    renderParticipants();
    updateSummary();
  }
  document.getElementById('new-participant').value = '';
};

document.getElementById('custom-split').onchange = (e) => {
  document.getElementById('custom-split-fields').style.display = e.target.checked ? 'block' : 'none';
};

document.getElementById('add-expense-btn').onclick = () => {
  const trip = trips[currentTripIndex];
  const desc = document.getElementById('expense-desc').value;
  const amount = parseFloat(document.getElementById('expense-amount').value);
  const payer = document.getElementById('expense-payer').value;
  const date = document.getElementById('expense-date').value;
  const customSplit = document.getElementById('custom-split').checked;

  if (!desc || !amount || !payer) return alert('Заполните все поля');

  let custom = null;
  if (customSplit) {
    custom = {};
    const inputs = document.querySelectorAll('#custom-split-fields input');
    inputs.forEach(input => {
      const value = parseFloat(input.value);
      if (!isNaN(value)) {
        custom[input.dataset.name] = value;
      }
    });
  }

  trip.expenses.push({ type: 'expense', desc, amount, payer, date, custom });
  saveTrips();
  renderExpenseForm();
  updateSummary();
};

document.getElementById('add-transfer-btn').onclick = () => {
  const from = document.getElementById('transfer-from').value;
  const to = document.getElementById('transfer-to').value;
  const amount = parseFloat(document.getElementById('transfer-amount').value);
  if (!from || !to || !amount || from === to) return;
  addTransfer(from, to, amount);
  document.getElementById('transfer-amount').value = '';
};

// init
renderTripList();
