// =============== Данные и локальное хранилище ===============

let products = []; // список товаров
let currentProductId = null; // выбранный товар

// Загрузка данных из localStorage
function loadData() {
  const data = localStorage.getItem('phoneShopData');
  if (data) {
    products = JSON.parse(data);
  } else {
    products = [];
  }
}

// Сохранение данных в localStorage
function saveData() {
  localStorage.setItem('phoneShopData', JSON.stringify(products));
}

// =============== Утилиты ===============

// Генерация уникального id
function generateId() {
  return 'id-' + Math.random().toString(36).substr(2, 9);
}

// Формат даты в строку ГГГГ-ММ-ДД
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return d.toISOString().slice(0, 10);
}

// Получить текущую дату в формате YYYY-MM-DD
function getToday() {
  return formatDate(new Date());
}

// =============== Работа с товарами ===============

// Добавление товара
function addProduct(name, model, quantity, costPrice, salePrice) {
  const newProduct = {
    id: generateId(),
    name: name.trim(),
    model: model.trim(),
    quantity: Number(quantity) || 0,
    costPrice: costPrice ? Number(costPrice) : null,
    salePrice: salePrice ? Number(salePrice) : null,
    operations: [] // операции: продажи, пополнения, займы
  };
  products.push(newProduct);
  saveData();
  renderProductsList();
}

// Рендер списка товаров
function renderProductsList() {
  const container = document.getElementById('products-list');
  container.innerHTML = '';

  if (products.length === 0) {
    container.textContent = 'Товары отсутствуют.';
    return;
  }

  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.tabIndex = 0;
    card.setAttribute('data-id', product.id);

    const title = document.createElement('h3');
    title.className = 'product-title';
    title.textContent = `${product.name} — ${product.model}`;

    const info = document.createElement('p');
    info.className = 'product-info';
    info.textContent = `Остаток: ${calculateCurrentStock(product)} шт.`;

    card.appendChild(title);
    card.appendChild(info);

    card.addEventListener('click', () => {
      openProductDetails(product.id);
    });
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openProductDetails(product.id);
      }
    });

    container.appendChild(card);
  });
}

// Вычисление текущего остатка (с учётом операций)
function calculateCurrentStock(product) {
  let stock = product.quantity; // начальный остаток
  product.operations.forEach(op => {
    if (op.type === 'sale') stock -= op.quantity;
    else if (op.type === 'restock') stock += op.quantity;
    else if (op.type === 'loan') stock -= op.quantity;
  });
  return stock;
}
// =============== Работа с деталями товара ===============

function openProductDetails(productId) {
  currentProductId = productId;
  const product = products.find(p => p.id === productId);
  if (!product) return;

  // Скрыть список товаров, показать детали
  document.getElementById('add-product-section').classList.add('hidden');
  document.getElementById('products-list-section').classList.add('hidden');
  document.getElementById('product-details-section').classList.remove('hidden');

  // Заголовок
  document.getElementById('product-title').textContent = `${product.name} — ${product.model}`;

  // Текущий остаток
  document.getElementById('current-stock').textContent = calculateCurrentStock(product);

  // Очистить форму добавления операции
  resetOperationForm();

  // Заполнить дату в форме операцией сегодня
  document.getElementById('operation-date').value = getToday();

  // Отобразить последние 5 операций
  renderOperationsTable(product);

  // Отрисовать график
  renderStockChart(product);
}

function resetOperationForm() {
  const form = document.getElementById('add-operation-form');
  form.reset();
  document.getElementById('operation-date').value = getToday();
  document.getElementById('operation-price').disabled = true;
  document.getElementById('operation-loan-person').disabled = true;
}

function closeProductDetails() {
  currentProductId = null;
  document.getElementById('add-product-section').classList.remove('hidden');
  document.getElementById('products-list-section').classList.remove('hidden');
  document.getElementById('product-details-section').classList.add('hidden');
}

// =============== Работа с операциями ===============

function addOperation(productId, type, date, quantity, price, loanPerson) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const op = {
    id: generateId(),
    type,
    date: date || getToday(),
    quantity: Number(quantity),
    price: price !== null && price !== '' ? Number(price) : null,
    loanPerson: loanPerson ? loanPerson.trim() : null,
  };

  product.operations.push(op);
  saveData();
}
function renderOperationsTable(product) {
  const tbody = document.querySelector('#operations-table tbody');
  tbody.innerHTML = '';

  // Отсортируем по дате, последние сверху
  const opsSorted = [...product.operations].sort((a, b) => new Date(b.date) - new Date(a.date));

  const last5 = opsSorted.slice(0, 5);

  if (last5.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.textContent = 'Операции отсутствуют.';
    td.style.textAlign = 'center';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  last5.forEach(op => {
    const tr = document.createElement('tr');

    const tdDate = document.createElement('td');
    tdDate.textContent = formatDate(op.date);
    tr.appendChild(tdDate);

    const tdType = document.createElement('td');
    let typeText = '';
    if (op.type === 'sale') typeText = 'Продажа';
    else if (op.type === 'restock') typeText = 'Пополнение';
    else if (op.type === 'loan') typeText = 'Займ';
    tdType.textContent = typeText;
    tr.appendChild(tdType);

    const tdQty = document.createElement('td');
    tdQty.textContent = op.quantity;
    tr.appendChild(tdQty);

    const tdPrice = document.createElement('td');
    tdPrice.textContent = op.price !== null ? op.price.toFixed(2) : '-';
    tr.appendChild(tdPrice);

    const tdLoanPerson = document.createElement('td');
    tdLoanPerson.textContent = op.loanPerson || '-';
    tr.appendChild(tdLoanPerson);

    tbody.appendChild(tr);
  });
}

// =============== График динамики остатков ===============

let stockChart = null;

function renderStockChart(product) {
  const ctx = document.getElementById('stock-chart').getContext('2d');

  if (stockChart) {
    stockChart.destroy();
  }

  // Получаем все даты операций + сегодня
  const datesSet = new Set(product.operations.map(op => op.date));
  datesSet.add(getToday());

  const datesArr = Array.from(datesSet).sort((a,b) => new Date(a) - new Date(b));

  // Функция для подсчёта остатка на конкретную дату
  function stockAtDate(dateStr) {
    let stock = product.quantity;
    product.operations.forEach(op => {
      if (new Date(op.date) <= new Date(dateStr)) {
        if (op.type === 'sale') stock -= op.quantity;
        else if (op.type === 'restock') stock += op.quantity;
        else if (op.type === 'loan') stock -= op.quantity;
      }
    });
    return stock;
  }

  const labels = datesArr.map(d => formatDate(d));
  const data = datesArr.map(d => stockAtDate(d));

  stockChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Остаток на складе',
        data,
        borderColor: '#2a5d9f',
        backgroundColor: 'rgba(42, 93, 159, 0.3)',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: '#1a1a1a',
            font: { size: 14 }
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        },
      },
      interaction: {
        mode: 'nearest',
        intersect: false
      }
    }
  });
}
// Обработка добавления товара из формы
document.getElementById('add-product-form').addEventListener('submit', e => {
  e.preventDefault();
  const name = e.target.productName.value;
  const model = e.target.productModel.value;
  const quantity = e.target.productQuantity.value;
  const costPrice = e.target.productCost.value;
  const salePrice = e.target.productSale.value;

  if (!name.trim()) {
    alert('Название товара обязательно');
    return;
  }

  addProduct(name, model, quantity, costPrice, salePrice);

  e.target.reset();
});

// Обработка переключения типа операции
document.getElementById('operation-type').addEventListener('change', e => {
  const val = e.target.value;
  const priceInput = document.getElementById('operation-price');
  const loanPersonInput = document.getElementById('operation-loan-person');

  if (val === 'sale') {
    priceInput.disabled = false;
    loanPersonInput.disabled = true;
  } else if (val === 'restock') {
    priceInput.disabled = false;
    loanPersonInput.disabled = true;
  } else if (val === 'loan') {
    priceInput.disabled = true;
    loanPersonInput.disabled = false;
  } else {
    priceInput.disabled = true;
    loanPersonInput.disabled = true;
  }
});

// Добавление операции
document.getElementById('add-operation-form').addEventListener('submit', e => {
  e.preventDefault();

  if (!currentProductId) return alert('Выберите товар');

  const type = e.target['operation-type'].value;
  const date = e.target['operation-date'].value;
  const quantity = e.target['operation-quantity'].value;
  const price = e.target['operation-price'].value;
  const loanPerson = e.target['operation-loan-person'].value;

  if (!type) {
    alert('Выберите тип операции');
    return;
  }

  if (!quantity || Number(quantity) <= 0) {
    alert('Введите количество больше 0');
    return;
  }

  if ((type === 'sale' || type === 'restock') && (!price || Number(price) <= 0)) {
    alert('Введите корректную цену');
    return;
  }

  if (type === 'loan' && !loanPerson.trim()) {
    alert('Введите имя лица, которому даёте займ');
    return;
  }

  addOperation(currentProductId, type, date, quantity, price, loanPerson);

  // Обновить интерфейс
  const product = products.find(p => p.id === currentProductId);
  if (!product) return;

  document.getElementById('current-stock').textContent = calculateCurrentStock(product);
  renderOperationsTable(product);
  renderStockChart(product);

  e.target.reset();
  e.target['operation-date'].value = getToday();
});

// Кнопка закрытия деталей
document.getElementById('close-details-btn').addEventListener('click', () => {
  closeProductDetails();
});

// Инициализация
window.addEventListener('DOMContentLoaded', () => {
  loadData();
  renderProductsList();
});