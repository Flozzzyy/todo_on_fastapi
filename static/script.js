// API Configuration
const API_BASE_URL = 'http://localhost:8000';

// Global State
let tasks = [];
let currentFilter = 'all';
let searchQuery = '';
let isAddFormVisible = false;

// DOM Elements
const elements = {
    addForm: document.getElementById('add-task-form'),
    addTaskToggle: document.getElementById('add-task-toggle'),
    addTaskSection: document.getElementById('add-task-section'),
    tasksContainer: document.getElementById('tasks-container'),
    searchInput: document.getElementById('search-tasks'),
    filterBtns: document.querySelectorAll('.filter-btn'),
    editModal: document.getElementById('edit-modal'),
    editForm: document.getElementById('edit-task-form'),
    closeModal: document.getElementById('close-modal'),
    cancelEdit: document.getElementById('cancel-edit'),
    notification: document.getElementById('notification'),
    stats: {
        total: document.getElementById('total-tasks'),
        completed: document.getElementById('completed-tasks'),
        pending: document.getElementById('pending-tasks')
    }
};

// Utility Functions
const utils = {
    showNotification: (message, type = 'success') => {
        const notification = elements.notification;
        const messageEl = notification.querySelector('.notification-message');
        
        notification.className = `notification ${type} show`;
        messageEl.textContent = message;
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    },

    formatDate: (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    animateElement: (element, animation) => {
        element.style.animation = 'none';
        element.offsetHeight; // Trigger reflow
        element.style.animation = animation;
    },

    // Новая функция для анимации выполнения задачи
    animateTaskCompletion: (taskElement, isCompleting) => {
        if (isCompleting) {
            taskElement.classList.add('completing');
            setTimeout(() => {
                taskElement.classList.remove('completing');
            }, 600);
        }
    },

    // Анимация статистики
    animateStats: () => {
        Object.values(elements.stats).forEach(stat => {
            stat.classList.add('pulse');
            setTimeout(() => {
                stat.classList.remove('pulse');
            }, 500);
        });
    },

    // Плавная анимация появления элементов
    fadeInElement: (element, delay = 0) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            element.style.transition = 'all 0.5s ease-out';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, delay);
    },

    // Переключение формы добавления задачи
    toggleAddForm: () => {
        isAddFormVisible = !isAddFormVisible;
        
        if (isAddFormVisible) {
            elements.addTaskSection.classList.add('show');
            elements.addTaskToggle.classList.add('rotated');
            // Фокус на первое поле формы
            setTimeout(() => {
                document.getElementById('task-title').focus();
            }, 300);
        } else {
            elements.addTaskSection.classList.remove('show');
            elements.addTaskToggle.classList.remove('rotated');
            // Сброс формы при скрытии
            elements.addForm.reset();
        }
    }
};

// API Functions
const api = {
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async getTasks() {
        return await this.request('/tasks');
    },

    async createTask(taskData) {
        return await this.request('/tasks/add', {
            method: 'POST',
            body: JSON.stringify(taskData)
        });
    },

    async updateTask(id, taskData) {
        return await this.request(`/tasks/update/${id}`, {
            method: 'PUT',
            body: JSON.stringify(taskData)
        });
    },

    async deleteTask(id) {
        return await this.request(`/tasks/delete/${id}`, {
            method: 'DELETE'
        });
    }
};

// Task Management
const taskManager = {
    async loadTasks() {
        try {
            showLoading();
            tasks = await api.getTasks();
            this.renderTasks();
            this.updateStats();
        } catch (error) {
            utils.showNotification('Ошибка при загрузке задач', 'error');
        } finally {
            hideLoading();
        }
    },

    async addTask(taskData) {
        try {
            const newTask = await api.createTask(taskData);
            tasks.push(newTask);
            this.renderTasks();
            this.updateStats();
            utils.showNotification('Задача успешно добавлена!');
            
            // Скрыть форму после успешного добавления
            utils.toggleAddForm();
            
            return newTask;
        } catch (error) {
            utils.showNotification('Ошибка при создании задачи', 'error');
            throw error;
        }
    },

    async updateTask(id, taskData) {
        try {
            const updatedTask = await api.updateTask(id, taskData);
            const index = tasks.findIndex(task => task.id === id);
            if (index !== -1) {
                tasks[index] = updatedTask;
                this.renderTasks();
                this.updateStats();
                utils.showNotification('Задача успешно обновлена!');
            }
            return updatedTask;
        } catch (error) {
            utils.showNotification('Ошибка при обновлении задачи', 'error');
            throw error;
        }
    },

    async deleteTask(id) {
        try {
            await api.deleteTask(id);
            tasks = tasks.filter(task => task.id !== id);
            this.renderTasks();
            this.updateStats();
            utils.showNotification('Задача успешно удалена!');
        } catch (error) {
            utils.showNotification('Ошибка при удалении задачи', 'error');
            throw error;
        }
    },

    getFilteredTasks() {
        let filtered = tasks;

        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(task => 
                task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        // Apply status filter
        switch (currentFilter) {
            case 'completed':
                filtered = filtered.filter(task => task.status);
                break;
            case 'pending':
                filtered = filtered.filter(task => !task.status);
                break;
        }

        return filtered;
    },

    renderTasks() {
        const filteredTasks = this.getFilteredTasks();
        const container = elements.tasksContainer;

        if (filteredTasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h3>${searchQuery ? 'Задачи не найдены' : 'Нет задач'}</h3>
                    <p>${searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Создайте свою первую задачу!'}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredTasks.map(task => this.createTaskHTML(task)).join('');
        
        // Add event listeners to new elements
        this.addTaskEventListeners();
        
        // Анимация появления задач
        const taskElements = container.querySelectorAll('.task-item');
        taskElements.forEach((element, index) => {
            utils.fadeInElement(element, index * 100);
        });
    },

    createTaskHTML(task) {
        const statusClass = task.status ? 'completed' : '';
        const statusIcon = task.status ? 'fas fa-check-circle' : 'fas fa-clock';
        const statusText = task.status ? 'Выполнено' : 'В ожидании';
        
        return `
            <div class="task-item ${statusClass}" data-task-id="${task.id}" draggable="true">
                <div class="task-header">
                    <div class="task-title">${escapeHtml(task.title)}</div>
                    <div class="task-actions">
                        <button class="btn btn-success edit-task" title="Редактировать">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger delete-task" title="Удалить">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                <div class="task-meta">
                    <span>
                        <i class="${statusIcon}"></i>
                        ${statusText}
                    </span>
                    <span>
                        <i class="fas fa-calendar"></i>
                        ${utils.formatDate(task.created)}
                    </span>
                </div>
            </div>
        `;
    },

    addTaskEventListeners() {
        // Edit buttons
        document.querySelectorAll('.edit-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = parseInt(btn.closest('.task-item').dataset.taskId);
                this.openEditModal(taskId);
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = parseInt(btn.closest('.task-item').dataset.taskId);
                this.confirmDelete(taskId);
            });
        });

        // Task item click for quick toggle
        document.querySelectorAll('.task-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.task-actions')) {
                    const taskId = parseInt(item.dataset.taskId);
                    const task = tasks.find(t => t.id === taskId);
                    if (task) {
                        this.quickToggleStatus(task, item);
                    }
                }
            });
        });
    },

    openEditModal(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        document.getElementById('edit-task-id').value = task.id;
        document.getElementById('edit-task-title').value = task.title;
        document.getElementById('edit-task-description').value = task.description || '';
        document.getElementById('edit-task-status').checked = task.status;

        elements.editModal.classList.add('active');
    },

    closeEditModal() {
        elements.editModal.classList.remove('active');
        elements.editForm.reset();
    },

    async confirmDelete(taskId) {
        if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
            await this.deleteTask(taskId);
        }
    },

    async quickToggleStatus(task, taskElement) {
        const newStatus = !task.status;
        
        // Анимация выполнения
        utils.animateTaskCompletion(taskElement, true);
        
        try {
            await this.updateTask(task.id, { ...task, status: newStatus });
            
            // Дополнительная анимация после успешного обновления
            setTimeout(() => {
                taskElement.style.transition = 'all 0.3s ease';
                if (newStatus) {
                    taskElement.style.transform = 'scale(1.02)';
                    setTimeout(() => {
                        taskElement.style.transform = 'scale(1)';
                    }, 300);
                }
            }, 600);
            
        } catch (error) {
            console.error('Error toggling task status:', error);
        }
    },

    updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(task => task.status).length;
        const pending = total - completed;

        // Плавное обновление статистики
        const animateNumber = (element, target) => {
            const current = parseInt(element.textContent) || 0;
            const increment = (target - current) / 10;
            let currentValue = current;
            
            const timer = setInterval(() => {
                currentValue += increment;
                if ((increment > 0 && currentValue >= target) || 
                    (increment < 0 && currentValue <= target)) {
                    element.textContent = target;
                    clearInterval(timer);
                } else {
                    element.textContent = Math.round(currentValue);
                }
            }, 50);
        };

        animateNumber(elements.stats.total, total);
        animateNumber(elements.stats.completed, completed);
        animateNumber(elements.stats.pending, pending);

        // Анимация статистики
        utils.animateStats();
    }
};

// UI Functions
function showLoading() {
    elements.tasksContainer.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Загружаем задачи...</p>
        </div>
    `;
}

function hideLoading() {
    // Loading will be replaced by renderTasks()
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize
    taskManager.loadTasks();

    // Add task toggle button
    elements.addTaskToggle.addEventListener('click', () => {
        utils.toggleAddForm();
    });

    // Add task form
    elements.addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const taskData = {
            title: formData.get('title'),
            description: formData.get('description') || null,
            status: formData.get('status') === 'on'
        };

        try {
            await taskManager.addTask(taskData);
        } catch (error) {
            console.error('Error adding task:', error);
        }
    });

    // Search functionality
    elements.searchInput.addEventListener('input', utils.debounce((e) => {
        searchQuery = e.target.value;
        taskManager.renderTasks();
    }, 300));

    // Filter buttons
    elements.filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            taskManager.renderTasks();
        });
    });

    // Modal events
    elements.closeModal.addEventListener('click', () => taskManager.closeEditModal());
    elements.cancelEdit.addEventListener('click', () => taskManager.closeEditModal());
    
    elements.editModal.addEventListener('click', (e) => {
        if (e.target === elements.editModal) {
            taskManager.closeEditModal();
        }
    });

    // Edit form
    elements.editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const taskId = parseInt(document.getElementById('edit-task-id').value);
        const formData = new FormData(e.target);
        
        const taskData = {
            title: formData.get('title'),
            description: formData.get('description') || null,
            status: formData.get('status') === 'on'
        };

        try {
            await taskManager.updateTask(taskId, taskData);
            taskManager.closeEditModal();
        } catch (error) {
            console.error('Error updating task:', error);
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + N to toggle add task form
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            utils.toggleAddForm();
        }
        
        // Escape to close modal or form
        if (e.key === 'Escape') {
            if (elements.editModal.classList.contains('active')) {
                taskManager.closeEditModal();
            } else if (isAddFormVisible) {
                utils.toggleAddForm();
            }
        }
        
        // Ctrl/Cmd + F to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            elements.searchInput.focus();
        }
    });

    // Drag and Drop functionality
    let draggedElement = null;

    elements.tasksContainer.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('task-item')) {
            draggedElement = e.target;
            e.target.style.opacity = '0.5';
        }
    });

    elements.tasksContainer.addEventListener('dragend', (e) => {
        if (e.target.classList.contains('task-item')) {
            e.target.style.opacity = '1';
            draggedElement = null;
        }
    });

    elements.tasksContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        const taskItem = e.target.closest('.task-item');
        if (taskItem && draggedElement && taskItem !== draggedElement) {
            const rect = taskItem.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            
            if (e.clientY < midY) {
                taskItem.style.borderTop = '3px solid #667eea';
                taskItem.style.borderBottom = '';
            } else {
                taskItem.style.borderTop = '';
                taskItem.style.borderBottom = '3px solid #667eea';
            }
        }
    });

    elements.tasksContainer.addEventListener('dragleave', (e) => {
        const taskItem = e.target.closest('.task-item');
        if (taskItem) {
            taskItem.style.borderTop = '';
            taskItem.style.borderBottom = '';
        }
    });

    elements.tasksContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        const taskItem = e.target.closest('.task-item');
        if (taskItem && draggedElement && taskItem !== draggedElement) {
            taskItem.style.borderTop = '';
            taskItem.style.borderBottom = '';
            
            // Here you could implement reordering logic
            utils.showNotification('Перетаскивание задач будет добавлено в следующей версии!');
        }
    });

    // Auto-refresh every 30 seconds
    setInterval(() => {
        taskManager.loadTasks();
    }, 30000);

    // Welcome message
    setTimeout(() => {
        utils.showNotification('Добро пожаловать в Task Manager! 🎉');
    }, 1000);
});

// Add some cool CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    @keyframes slideInFromRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .task-item {
        animation: slideInFromRight 0.3s ease-out;
    }
    
    .task-item:nth-child(1) { animation-delay: 0.1s; }
    .task-item:nth-child(2) { animation-delay: 0.2s; }
    .task-item:nth-child(3) { animation-delay: 0.3s; }
    .task-item:nth-child(4) { animation-delay: 0.4s; }
    .task-item:nth-child(5) { animation-delay: 0.5s; }
`;
document.head.appendChild(style);
