// Глобальные переменные
let currentUser = null;
let authToken = localStorage.getItem('authToken');
let tasks = [];
let currentFilter = 'all';
let searchQuery = '';

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

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    if (authToken) {
        // Проверяем валидность токена
        checkAuthToken();
    } else {
        showAuthModal();
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
    
    // Задачи
    addTaskBtn.addEventListener('click', showAddTaskModal);
    taskForm.addEventListener('submit', handleTaskSubmit);
    document.getElementById('closeTaskModal').addEventListener('click', hideTaskModal);
    document.getElementById('cancelTaskBtn').addEventListener('click', hideTaskModal);
    
    // Поиск и фильтрация
    searchInput.addEventListener('input', handleSearch);
    filterBtns.forEach(btn => {
        btn.addEventListener('click', handleFilter);
    });
    
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
            currentUser = username;
            
            showNotification('Успешный вход!', 'success');
            hideAuthModal();
            loadTasks();
        } else {
            const error = await response.json();
            showNotification(error.detail || 'Ошибка входа', 'error');
        }
    } catch (error) {
        showNotification('Ошибка соединения', 'error');
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
            showNotification('Регистрация успешна! Теперь войдите в систему.', 'success');
            // Переключаемся на вкладку входа
            document.querySelector('[data-tab="login"]').click();
            document.getElementById('loginUsername').value = username;
        } else {
            const error = await response.json();
            showNotification(error.detail || 'Ошибка регистрации', 'error');
        }
    } catch (error) {
        showNotification('Ошибка соединения', 'error');
    }
}

function handleLogout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    tasks = [];
    
    showAuthModal();
    showNotification('Вы вышли из системы', 'info');
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
            currentUser = 'Пользователь'; // Можно получить из токена
            hideAuthModal();
            renderTasks();
            updateStats();
        } else {
            // Токен невалиден
            localStorage.removeItem('authToken');
            authToken = null;
            showAuthModal();
        }
    } catch (error) {
        showAuthModal();
    }
}

// Функции отображения
function showAuthModal() {
    authModal.style.display = 'flex';
    mainApp.classList.add('hidden');
}

function hideAuthModal() {
    authModal.style.display = 'none';
    mainApp.classList.remove('hidden');
    currentUserSpan.textContent = currentUser;
}

function showAddTaskModal() {
    document.getElementById('taskModalTitle').textContent = 'Добавить задачу';
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
        const response = await fetch('/tasks', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            tasks = await response.json();
            renderTasks();
            updateStats();
        } else {
            showNotification('Ошибка загрузки задач', 'error');
        }
    } catch (error) {
        showNotification('Ошибка соединения', 'error');
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
            showNotification('Задача добавлена!', 'success');
        } else {
            const error = await response.json();
            showNotification(error.detail || 'Ошибка добавления задачи', 'error');
        }
    } catch (error) {
        showNotification('Ошибка соединения', 'error');
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
                showNotification('Статус обновлен!', 'success');
            }
        } else {
            showNotification('Ошибка обновления статуса', 'error');
        }
    } catch (error) {
        showNotification('Ошибка соединения', 'error');
    }
}

async function deleteTask(taskId) {
    if (!confirm('Вы уверены, что хотите удалить эту задачу?')) {
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
            showNotification('Задача удалена!', 'success');
        } else {
            showNotification('Ошибка удаления задачи', 'error');
        }
    } catch (error) {
        showNotification('Ошибка соединения', 'error');
    }
}

// Функции рендеринга
function renderTasks() {
    const filteredTasks = getFilteredTasks();
    
    if (filteredTasks.length === 0) {
        tasksList.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
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
                <span class="task-status ${task.status ? 'completed' : 'pending'}">
                    ${task.status ? 'Выполнено' : 'В ожидании'}
                </span>
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
    
    document.getElementById('taskModalTitle').textContent = 'Редактировать задачу';
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
                    showNotification('Задача обновлена!', 'success');
                }
            } else {
                const error = await response.json();
                showNotification(error.detail || 'Ошибка обновления задачи', 'error');
            }
        } catch (error) {
            showNotification('Ошибка соединения', 'error');
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
    return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
