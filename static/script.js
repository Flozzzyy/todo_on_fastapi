// Глобальные переменные
let currentUser = null;
let authToken = localStorage.getItem('authToken');
let tasks = [];
let currentFilter = 'all';
let searchQuery = '';
let currentTheme = localStorage.getItem('theme') || 'dark';

// DOM элементы
const authModal = document.getElementById('authModal');
const mainApp = document.getElementById('mainApp');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const logoutBtn = document.getElementById('logoutBtn');
const currentUserSpan = document.getElementById('currentUser');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskModal = document.getElementById('taskModal');
const taskForm = document.getElementById('taskForm');
const tasksList = document.getElementById('tasksList');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.filter-btn');
const themeToggleBtn = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const loginBtn = document.getElementById('loginBtn');
const guestState = document.getElementById('guestState');
const getStartedBtn = document.getElementById('getStartedBtn');

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    applyTheme(currentTheme);
});

function initializeApp() {
    if (authToken) {
        // Проверяем валидность токена
        checkAuthToken();
    } else {
        mainApp.classList.remove('hidden');
        updateAuthUI();
    }
}

function setupEventListeners() {
    // Авторизация
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', switchAuthTab);
    });
    
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    logoutBtn.addEventListener('click', handleLogout);
    if (loginBtn) loginBtn.addEventListener('click', showAuthModal);
    if (getStartedBtn) getStartedBtn.addEventListener('click', showAuthModal);
    
    // Задачи
    addTaskBtn.addEventListener('click', function() {
        if (!authToken) {
            showAuthModal();
            return;
        }
        showAddTaskModal();
    });
    taskForm.addEventListener('submit', handleTaskSubmit);
    document.getElementById('closeTaskModal').addEventListener('click', hideTaskModal);
    document.getElementById('cancelTaskBtn').addEventListener('click', hideTaskModal);
    
    // Поиск и фильтрация
    searchInput.addEventListener('input', handleSearch);
    filterBtns.forEach(btn => {
        btn.addEventListener('click', handleFilter);
    });
    // Тема
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
    
    // Закрытие модальных окон
    window.addEventListener('click', function(e) {
        if (e.target === authModal) {
            // Не закрываем модальное окно авторизации при клике вне его
        }
        if (e.target === taskModal) {
            hideTaskModal();
        }
    });
}

// Функции авторизации
function switchAuthTab(e) {
    const tab = e.target.dataset.tab;
    
    // Обновляем активную вкладку
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    // Показываем соответствующую форму
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    document.getElementById(tab + 'Form').classList.add('active');
}

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            authToken = data.access_token;
            localStorage.setItem('authToken', authToken);
            currentUser = extractUsernameFromJWT(authToken) || username;

            showNotification('Signed in successfully', 'success');
            hideAuthModal();
            updateAuthUI();
            loadTasks();
        } else {
            const error = await response.json();
            showNotification(error.detail || 'Sign in failed', 'error');
        }
    } catch (error) {
        showNotification('Connection error', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        if (response.ok) {
            showNotification('Account created. Please sign in.', 'success');
            // Switch to login tab
            document.querySelector('[data-tab="login"]').click();
            document.getElementById('loginUsername').value = username;
        } else {
            const error = await response.json();
            showNotification(error.detail || 'Sign up failed', 'error');
        }
    } catch (error) {
        showNotification('Connection error', 'error');
    }
}

function handleLogout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    tasks = [];
    
    updateAuthUI();
    renderTasks();
    showNotification('Signed out', 'info');
}

async function checkAuthToken() {
    try {
        const response = await fetch('/tasks', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            // Токен валиден, загружаем задачи
            const data = await response.json();
            tasks = data;
            currentUser = extractUsernameFromJWT(authToken) || 'User';
            hideAuthModal();
            updateAuthUI();
            renderTasks();
            updateStats();
        } else {
            // Токен невалиден
            localStorage.removeItem('authToken');
            authToken = null;
            updateAuthUI();
        }
    } catch (error) {
        updateAuthUI();
    }
}

// Функции отображения
function showAuthModal() {
    authModal.style.display = 'flex';
}

function hideAuthModal() {
    authModal.style.display = 'none';
    mainApp.classList.remove('hidden');
}

function showAddTaskModal() {
    document.getElementById('taskModalTitle').textContent = 'Add task';
    taskForm.reset();
    taskModal.classList.remove('hidden');
}

function hideTaskModal() {
    taskModal.classList.add('hidden');
    taskForm.reset();
}

// Функции работы с задачами
async function loadTasks() {
    try {
        // Show skeletons while loading
        tasksList.innerHTML = `
            <div class="task-skeleton skeleton"></div>
            <div class="task-skeleton skeleton"></div>
            <div class="task-skeleton skeleton"></div>
        `;
        const response = await fetch('/tasks', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            tasks = await response.json();
            if (guestState) guestState.classList.add('hidden');
            renderTasks();
            updateStats();
        } else {
            showNotification('Failed to load tasks', 'error');
        }
    } catch (error) {
        showNotification('Connection error', 'error');
    }
}

async function handleTaskSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const status = document.getElementById('taskStatus').checked;
    
    const taskData = {
        title,
        description,
        status
    };
    
    try {
        const response = await fetch('/tasks/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(taskData)
        });
        
        if (response.ok) {
            const newTask = await response.json();
            tasks.push(newTask);
            renderTasks();
            updateStats();
            hideTaskModal();
            showNotification('Task added', 'success');
        } else {
            const error = await response.json();
            showNotification(error.detail || 'Failed to add task', 'error');
        }
    } catch (error) {
        showNotification('Connection error', 'error');
    }
}

async function updateTaskStatus(taskId, newStatus) {
    try {
        const response = await fetch(`/tasks/update/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.ok) {
            const updatedTask = await response.json();
            const taskIndex = tasks.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
                tasks[taskIndex] = updatedTask;
                renderTasks();
                updateStats();
                showNotification('Status updated', 'success');
            }
        } else {
            showNotification('Failed to update status', 'error');
        }
    } catch (error) {
        showNotification('Connection error', 'error');
    }
}

async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }
    
    try {
        const response = await fetch(`/tasks/delete/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            tasks = tasks.filter(t => t.id !== taskId);
            renderTasks();
            updateStats();
            showNotification('Task deleted', 'success');
        } else {
            showNotification('Failed to delete task', 'error');
        }
    } catch (error) {
        showNotification('Connection error', 'error');
    }
}

// Функции рендеринга
function renderTasks() {
    const filteredTasks = getFilteredTasks();
    
    if (filteredTasks.length === 0) {
        tasksList.innerHTML = '';
        emptyState.classList.remove('hidden');
        if (!authToken && guestState) guestState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    if (guestState) guestState.classList.add('hidden');
    
    tasksList.innerHTML = filteredTasks.map(task => `
        <div class="task-item ${task.status ? 'completed' : ''}" data-id="${task.id}">
            <div class="task-header">
                <div class="task-title">${escapeHtml(task.title)}</div>
                <div class="task-actions">
                    <button class="task-action-btn edit" onclick="editTask(${task.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-action-btn delete" onclick="deleteTask(${task.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
            <div class="task-meta">
                <span class="task-status ${task.status ? 'completed' : 'pending'}">${task.status ? 'Completed' : 'Pending'}</span>
                <span>${formatDate(task.created)}</span>
            </div>
        </div>
    `).join('');
    
    // Добавляем обработчики кликов для переключения статуса
    tasksList.querySelectorAll('.task-item').forEach(item => {
        item.addEventListener('click', function(e) {
            if (!e.target.closest('.task-actions')) {
                const taskId = parseInt(this.dataset.id);
                const task = tasks.find(t => t.id === taskId);
                if (task) {
                    updateTaskStatus(taskId, !task.status);
                }
            }
        });
    });
}

function getFilteredTasks() {
    let filtered = tasks;
    
    // Фильтрация по статусу
    if (currentFilter === 'pending') {
        filtered = filtered.filter(task => !task.status);
    } else if (currentFilter === 'completed') {
        filtered = filtered.filter(task => task.status);
    }
    
    // Поиск
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(task => 
            task.title.toLowerCase().includes(query) ||
            (task.description && task.description.toLowerCase().includes(query))
        );
    }
    
    return filtered;
}

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status).length;
    const pending = total - completed;
    
    document.getElementById('totalTasks').textContent = total;
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('pendingTasks').textContent = pending;
}

// Тема: функции
function applyTheme(theme) {
    document.body.classList.toggle('light-theme', theme === 'light');
    themeIcon.className = theme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
    localStorage.setItem('theme', theme);
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(currentTheme);
    if (themeToggleBtn) {
        themeToggleBtn.classList.remove('animate');
        void themeToggleBtn.offsetWidth;
        themeToggleBtn.classList.add('animate');
        setTimeout(() => themeToggleBtn.classList.remove('animate'), 700);
    }
}

// JWT utils
function extractUsernameFromJWT(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || null;
    } catch (e) {
        return null;
    }
}

// Обработчики событий
function handleSearch(e) {
    searchQuery = e.target.value;
    renderTasks();
}

function handleFilter(e) {
    filterBtns.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    currentFilter = e.target.dataset.filter;
    renderTasks();
}

function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    document.getElementById('taskModalTitle').textContent = 'Edit task';
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDescription').value = task.description || '';
    document.getElementById('taskStatus').checked = task.status;
    
    // Временно изменяем обработчик формы для обновления
    const originalSubmit = taskForm.onsubmit;
    taskForm.onsubmit = async function(e) {
        e.preventDefault();
        
        const title = document.getElementById('taskTitle').value;
        const description = document.getElementById('taskDescription').value;
        const status = document.getElementById('taskStatus').checked;
        
        try {
            const response = await fetch(`/tasks/update/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ title, description, status })
            });
            
            if (response.ok) {
                const updatedTask = await response.json();
                const taskIndex = tasks.findIndex(t => t.id === taskId);
                if (taskIndex !== -1) {
                    tasks[taskIndex] = updatedTask;
                    renderTasks();
                    updateStats();
                    hideTaskModal();
                    showNotification('Task updated', 'success');
                }
            } else {
                const error = await response.json();
                showNotification(error.detail || 'Failed to update task', 'error');
            }
        } catch (error) {
            showNotification('Connection error', 'error');
        }
        
        // Восстанавливаем оригинальный обработчик
        taskForm.onsubmit = originalSubmit;
    };
    
    taskModal.classList.remove('hidden');
}

// Утилиты
function showNotification(message, type = 'info') {
    const notifications = document.getElementById('notifications');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = type === 'success' ? 'fas fa-check-circle' : 
                 type === 'error' ? 'fas fa-exclamation-circle' : 
                 'fas fa-info-circle';
    
    notification.innerHTML = `
        <i class="${icon}"></i>
        <span class="notification-message">${message}</span>
    `;
    
    notifications.appendChild(notification);
    
    // Автоматически удаляем уведомление через 5 секунд
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// UI helpers
function updateAuthUI() {
    const isAuth = !!authToken;
    mainApp.classList.remove('hidden');
    if (loginBtn) loginBtn.style.display = isAuth ? 'none' : 'inline-flex';
    if (logoutBtn) logoutBtn.style.display = isAuth ? 'inline-flex' : 'none';
    currentUserSpan.textContent = isAuth && currentUser ? currentUser : '';
    if (guestState) guestState.classList.toggle('hidden', isAuth);
}
