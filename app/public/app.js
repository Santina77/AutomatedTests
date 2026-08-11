const form = document.getElementById('product-form');
const errorEl = document.getElementById('form-error');
const listEl = document.getElementById('product-list');
const cancelButton = document.getElementById('cancel-button');
const priceHeaderButton = document.getElementById('price-header');
const submitButton = document.getElementById('submit-button');

let products = [];
let priceSortDirection = null; // null | 'asc' | 'desc'
let editingProductId = null;

function resetForm() {
  form.reset();
  form.querySelector('#in-stock-input').checked = true;
  errorEl.textContent = '';
  editingProductId = null;
  submitButton.textContent = 'Add Product';
}

function startEdit(product) {
  editingProductId = product.id;
  form.querySelector('#name-input').value = product.name;
  form.querySelector('#price-input').value = product.price;
  form.querySelector('#category-input').value = product.category;
  form.querySelector('#in-stock-input').checked = product.in_stock;
  errorEl.textContent = '';
  submitButton.textContent = 'Save Changes';
  form.querySelector('#name-input').focus();
}

function sortedProducts() {
  if (priceSortDirection === 'asc') {
    return [...products].sort((a, b) => a.price - b.price);
  }
  if (priceSortDirection === 'desc') {
    return [...products].sort((a, b) => b.price - a.price);
  }
  return products;
}

function updateSortHeader() {
  const th = priceHeaderButton.closest('th');
  if (priceSortDirection === 'asc') {
    priceHeaderButton.textContent = 'Price ▲';
    th.setAttribute('aria-sort', 'ascending');
  } else if (priceSortDirection === 'desc') {
    priceHeaderButton.textContent = 'Price ▼';
    th.setAttribute('aria-sort', 'descending');
  } else {
    priceHeaderButton.textContent = 'Price';
    th.setAttribute('aria-sort', 'none');
  }
}

function render() {
  renderProducts(sortedProducts());
  updateSortHeader();
}

function renderProducts(products) {
  listEl.innerHTML = '';

  if (products.length === 0) {
    const row = document.createElement('tr');
    row.dataset.testid = 'empty-state';
    row.innerHTML = '<td colspan="5">No products yet.</td>';
    listEl.appendChild(row);
    return;
  }

  for (const product of products) {
    const row = document.createElement('tr');
    row.dataset.testid = 'product-row';
    row.dataset.productId = product.id;
    row.innerHTML = `
      <td data-testid="product-name">${product.name}</td>
      <td data-testid="product-price">${product.price.toFixed(2)}</td>
      <td data-testid="product-category">${product.category}</td>
      <td data-testid="product-in-stock">${product.in_stock ? 'Yes' : 'No'}</td>
      <td>
        <button type="button" class="secondary-button" data-testid="edit-button">Edit</button>
        <button type="button" class="delete-button" data-testid="delete-button">Delete</button>
      </td>
    `;
    row.querySelector('.secondary-button').addEventListener('click', () => startEdit(product));
    row.querySelector('.delete-button').addEventListener('click', () => deleteProduct(product.id));
    listEl.appendChild(row);
  }
}

async function loadProducts() {
  const response = await fetch('/api/products');
  const body = await response.json();
  products = body.products;
  render();
}

async function deleteProduct(id) {
  await fetch(`/api/products/${id}`, { method: 'DELETE' });
  await loadProducts();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorEl.textContent = '';

  const formData = new FormData(form);
  const payload = {
    name: formData.get('name'),
    price: Number(formData.get('price')),
    category: formData.get('category'),
    in_stock: formData.get('in_stock') === 'on',
  };

  const url = editingProductId ? `/api/products/${editingProductId}` : '/api/products';
  const method = editingProductId ? 'PUT' : 'POST';

  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json();
    errorEl.textContent = body.error;
    return;
  }

  resetForm();
  await loadProducts();
});

cancelButton.addEventListener('click', () => {
  resetForm();
});

priceHeaderButton.addEventListener('click', () => {
  priceSortDirection = priceSortDirection === 'asc' ? 'desc' : 'asc';
  render();
});

loadProducts();
