// Admin Panel JavaScript

const API_URL = 'http://localhost:5000/api';
let adminToken = localStorage.getItem('adminToken');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  if (adminToken) {
    showAdminPanel();
    loadDashboardStats();
  } else {
    showLoginPage();
  }
  
  // Mobile sidebar toggle
  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    document.querySelector('.admin-sidebar').classList.toggle('open');
  });
});

// Login Handler
async function handleAdminLogin(e) {
  e.preventDefault();
  const email = document.getElementById('adminEmail').value;
  const password = document.getElementById('adminPassword').value;

  try {
    const response = await fetch(`${API_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      adminToken = data.token;
      localStorage.setItem('adminToken', adminToken);
      showAdminPanel();
      loadDashboardStats();
      showToast('Login successful', 'success');
    } else {
      showToast(data.message || 'Login failed', 'error');
    }
  } catch (error) {
    showToast('Error: ' + error.message, 'error');
  }
}

// Logout
function handleAdminLogout() {
  localStorage.removeItem('adminToken');
  adminToken = null;
  showLoginPage();
  showToast('Logged out', 'info');
}

// Show/Hide Sections
function showLoginPage() {
  document.getElementById('loginContainer').hidden = false;
  document.getElementById('adminPanel').hidden = true;
}

function showAdminPanel() {
  document.getElementById('loginContainer').hidden = true;
  document.getElementById('adminPanel').hidden = false;
}

// Tab Navigation
function switchTab(e, tabName) {
  e.preventDefault();

  // Remove active class from all tabs and nav items
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

  // Add active class to selected tab and nav item
  document.getElementById(tabName).classList.add('active');
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

  // Close mobile sidebar
  document.querySelector('.admin-sidebar').classList.remove('open');

  // Load data for the tab
  loadTabData(tabName);
}

function loadTabData(tabName) {
  switch (tabName) {
    case 'users':
      loadUsers();
      break;
    case 'questions':
      loadQuestions();
      break;
    case 'answers':
      loadAnswers();
      break;
    case 'shop':
      loadShopItems();
      break;
    case 'purchases':
      loadPurchases();
      break;
  }
}

// Dashboard Stats
async function loadDashboardStats() {
  try {
    const response = await fetch(`${API_URL}/admin/stats`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const stats = await response.json();

    document.getElementById('statUsers').textContent = stats.totalUsers || 0;
    document.getElementById('statQuestions').textContent = stats.totalQuestions || 0;
    document.getElementById('statAnswers').textContent = stats.totalAnswers || 0;
    document.getElementById('statRedemptions').textContent = stats.totalRedemptions || 0;
  } catch (error) {
    showToast('Error loading stats: ' + error.message, 'error');
  }
}

// Load Users
async function loadUsers() {
  try {
    const response = await fetch(`${API_URL}/admin/users`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const users = await response.json();
    const tbody = document.getElementById('usersList');
    tbody.innerHTML = '';

    users.forEach(user => {
      const row = document.createElement('tr');
      const joinDate = new Date(user.created_at).toLocaleDateString();
      
      row.innerHTML = `
        <td>${user.id}</td>
        <td>${user.username}</td>
        <td>${user.email}</td>
        <td>${user.semester || '-'}</td>
        <td><strong>${user.points}</strong></td>
        <td>${joinDate}</td>
        <td>
          <div class="action-buttons">
            <button class="action-btn action-edit" onclick="openUserEditModal(${user.id}, ${user.points})">Edit</button>
            <button class="action-btn action-delete" onclick="deleteUser(${user.id})">Delete</button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    showToast('Error loading users: ' + error.message, 'error');
  }
}

// Edit User Points
function openUserEditModal(userId, currentPoints) {
  document.getElementById('editUserId').value = userId;
  document.getElementById('editUserPoints').value = currentPoints;
  document.getElementById('userEditModal').hidden = false;
}

function closeUserEditModal() {
  document.getElementById('userEditModal').hidden = true;
}

async function handleUpdateUserPoints(e) {
  e.preventDefault();
  const userId = document.getElementById('editUserId').value;
  const points = document.getElementById('editUserPoints').value;

  try {
    const response = await fetch(`${API_URL}/admin/users/${userId}/points`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ points: parseInt(points) })
    });

    if (response.ok) {
      showToast('Points updated successfully', 'success');
      closeUserEditModal();
      loadUsers();
      loadDashboardStats();
    } else {
      showToast('Error updating points', 'error');
    }
  } catch (error) {
    showToast('Error: ' + error.message, 'error');
  }
}

// Delete User
async function deleteUser(userId) {
  if (!confirm('Are you sure you want to delete this user?')) return;

  try {
    const response = await fetch(`${API_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.ok) {
      showToast('User deleted successfully', 'success');
      loadUsers();
      loadDashboardStats();
    } else {
      showToast('Error deleting user', 'error');
    }
  } catch (error) {
    showToast('Error: ' + error.message, 'error');
  }
}

// Load Questions
async function loadQuestions() {
  try {
    const response = await fetch(`${API_URL}/admin/questions`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const questions = await response.json();
    const tbody = document.getElementById('questionsList');
    tbody.innerHTML = '';

    questions.forEach(q => {
      const row = document.createElement('tr');
      const createdDate = new Date(q.created_at).toLocaleDateString();
      const title = q.title.substring(0, 40) + (q.title.length > 40 ? '...' : '');
      
      row.innerHTML = `
        <td>${q.id}</td>
        <td title="${q.title}">${title}</td>
        <td>${q.username}</td>
        <td>Sem ${q.semester}</td>
        <td>${q.answer_count}</td>
        <td>${createdDate}</td>
        <td>
          <div class="action-buttons">
            <button class="action-btn action-delete" onclick="deleteQuestion(${q.id})">Delete</button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    showToast('Error loading questions: ' + error.message, 'error');
  }
}

// Delete Question
async function deleteQuestion(questionId) {
  if (!confirm('Are you sure? This will also delete all related answers.')) return;

  try {
    const response = await fetch(`${API_URL}/admin/questions/${questionId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.ok) {
      showToast('Question deleted successfully', 'success');
      loadQuestions();
      loadDashboardStats();
    } else {
      showToast('Error deleting question', 'error');
    }
  } catch (error) {
    showToast('Error: ' + error.message, 'error');
  }
}

// Load Answers
async function loadAnswers() {
  try {
    const response = await fetch(`${API_URL}/admin/answers`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const answers = await response.json();
    const tbody = document.getElementById('answersList');
    tbody.innerHTML = '';

    answers.forEach(a => {
      const row = document.createElement('tr');
      const createdDate = new Date(a.created_at).toLocaleDateString();
      const questionTitle = a.question_title.substring(0, 30) + (a.question_title.length > 30 ? '...' : '');
      const contentPreview = a.content.substring(0, 30) + (a.content.length > 30 ? '...' : '');
      
      row.innerHTML = `
        <td>${a.id}</td>
        <td title="${a.question_title}">${questionTitle}</td>
        <td>${a.answerer}</td>
        <td>${a.is_correct ? '✓ Yes' : '✗ No'}</td>
        <td>${a.points_awarded}</td>
        <td>${createdDate}</td>
        <td>
          <div class="action-buttons">
            <button class="action-btn action-delete" onclick="deleteAnswer(${a.id})">Delete</button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    showToast('Error loading answers: ' + error.message, 'error');
  }
}

// Delete Answer
async function deleteAnswer(answerId) {
  if (!confirm('Are you sure you want to delete this answer?')) return;

  try {
    const response = await fetch(`${API_URL}/admin/answers/${answerId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.ok) {
      showToast('Answer deleted successfully', 'success');
      loadAnswers();
      loadDashboardStats();
    } else {
      showToast('Error deleting answer', 'error');
    }
  } catch (error) {
    showToast('Error: ' + error.message, 'error');
  }
}

// Load Shop Items
async function loadShopItems() {
  try {
    const response = await fetch(`${API_URL}/admin/shop`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const items = await response.json();
    const tbody = document.getElementById('shopList');
    tbody.innerHTML = '';

    items.forEach(item => {
      const row = document.createElement('tr');
      
      row.innerHTML = `
        <td>${item.id}</td>
        <td>${item.name}</td>
        <td>${item.description || '-'}</td>
        <td><strong>${item.points_required}</strong></td>
        <td>${item.category || '-'}</td>
        <td>
          <div class="action-buttons">
            <button class="action-btn action-edit" onclick="openEditItemModal(${item.id}, '${item.name}', '${item.description || ''}', ${item.points_required}, '${item.category || ''}')">Edit</button>
            <button class="action-btn action-delete" onclick="deleteShopItem(${item.id})">Delete</button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    showToast('Error loading shop items: ' + error.message, 'error');
  }
}

// Shop Item Modal Functions
function showCreateItemModal() {
  document.getElementById('itemId').value = '';
  document.getElementById('itemModalTitle').textContent = 'Create Shop Item';
  document.getElementById('itemName').value = '';
  document.getElementById('itemDescription').value = '';
  document.getElementById('itemPoints').value = '';
  document.getElementById('itemCategory').value = '';
  document.getElementById('itemModal').hidden = false;
}

function openEditItemModal(id, name, description, points, category) {
  document.getElementById('itemId').value = id;
  document.getElementById('itemModalTitle').textContent = 'Edit Shop Item';
  document.getElementById('itemName').value = name;
  document.getElementById('itemDescription').value = description;
  document.getElementById('itemPoints').value = points;
  document.getElementById('itemCategory').value = category;
  document.getElementById('itemModal').hidden = false;
}

function closeItemModal() {
  document.getElementById('itemModal').hidden = true;
}

async function handleShopItemSubmit(e) {
  e.preventDefault();
  const itemId = document.getElementById('itemId').value;
  const name = document.getElementById('itemName').value;
  const description = document.getElementById('itemDescription').value;
  const pointsRequired = document.getElementById('itemPoints').value;
  const category = document.getElementById('itemCategory').value;

  const url = itemId 
    ? `${API_URL}/admin/shop/${itemId}` 
    : `${API_URL}/admin/shop`;
  
  const method = itemId ? 'PUT' : 'POST';

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name,
        description,
        points_required: parseInt(pointsRequired),
        category
      })
    });

    if (response.ok) {
      showToast(itemId ? 'Item updated successfully' : 'Item created successfully', 'success');
      closeItemModal();
      loadShopItems();
    } else {
      showToast('Error saving item', 'error');
    }
  } catch (error) {
    showToast('Error: ' + error.message, 'error');
  }
}

// Delete Shop Item
async function deleteShopItem(itemId) {
  if (!confirm('Are you sure you want to delete this shop item?')) return;

  try {
    const response = await fetch(`${API_URL}/admin/shop/${itemId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.ok) {
      showToast('Shop item deleted successfully', 'success');
      loadShopItems();
    } else {
      showToast('Error deleting shop item', 'error');
    }
  } catch (error) {
    showToast('Error: ' + error.message, 'error');
  }
}

// Load Purchases
async function loadPurchases() {
  try {
    const response = await fetch(`${API_URL}/admin/purchases`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const purchases = await response.json();
    const tbody = document.getElementById('purchasesList');
    tbody.innerHTML = '';

    purchases.forEach(p => {
      const row = document.createElement('tr');
      const redeemedDate = new Date(p.redeemed_at).toLocaleDateString();
      
      row.innerHTML = `
        <td>${p.id}</td>
        <td>${p.username}</td>
        <td>${p.item_name}</td>
        <td><strong>${p.points_spent}</strong></td>
        <td>${redeemedDate}</td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    showToast('Error loading purchases: ' + error.message, 'error');
  }
}

// Toast Notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: '✓',
    error: '✗',
    info: 'ℹ'
  };
  
  toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}
