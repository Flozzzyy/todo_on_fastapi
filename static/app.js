// Vue.js 3 приложение для управления задачами
const app = Vue.createApp({
    data() {
        return {
            currentUser: null,
            authToken: localStorage.getItem('authToken'),
            showAuthModal: false,
            tasks: [],
            loading: false,
            searchQuery: '',
            currentFilter: 'all',
            theme: localStorage.getItem('theme') || 'dark',
            filters: [
                { value: 'all', label: 'Все', icon: 'fas fa-list' },
                { value: 'pending', label: 'В ожидании', icon: 'fas fa-clock' },
                { value: 'completed', label: 'Выполнено', icon: 'fas fa-check' }
            ]
        }
    },
    
    computed: {
        filteredTasks() {
            let filtered = this.tasks;
            
            // Фильтрация по статусу
            if (this.currentFilter === 'pending') {
                filtered = filtered.filter(task => !task.status);
            } else if (this.currentFilter === 'completed') {
                filtered = filtered.filter(task => task.status);
            }
            
            // Поиск
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                filtered = filtered.filter(task => 
                    task.title.toLowerCase().includes(query) ||
                    (task.description && task.description.toLowerCase().includes(query))
                );
            }
            
            return filtered;
        },
        
        stats() {
            const total = this.tasks.length;
            const completed = this.tasks.filter(t => t.status).length;
            const pending = total - completed;
            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
            
            return { total, completed, pending, percentage };
        }
    },
    
    mounted() {
        this.applyTheme();
        if (this.authToken) {
            this.checkAuth();
        }
    },
    
    methods: {
        async handleLogin(credentials) {
            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(credentials)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.authToken = data.access_token;
                    localStorage.setItem('authToken', this.authToken);
                    this.currentUser = credentials.username;
                    this.showAuthModal = false;
                    this.loadTasks();
                }
            } catch (error) {
                console.error('Login error:', error);
            }
        },
        
        async loadTasks() {
            this.loading = true;
            try {
                const response = await fetch('/tasks', {
                    headers: { 'Authorization': `Bearer ${this.authToken}` }
                });
                
                if (response.ok) {
                    this.tasks = await response.json();
                }
            } catch (error) {
                console.error('Load tasks error:', error);
            } finally {
                this.loading = false;
            }
        },
        
        checkAuth() {
            // Проверка токена
            this.loadTasks();
        },
        
        logout() {
            this.authToken = null;
            this.currentUser = null;
            this.tasks = [];
            localStorage.removeItem('authToken');
        },
        
        toggleTheme() {
            this.theme = this.theme === 'light' ? 'dark' : 'light';
            this.applyTheme();
            localStorage.setItem('theme', this.theme);
        },
        
        applyTheme() {
            document.body.classList.toggle('light-theme', this.theme === 'light');
        },
        
        setFilter(filter) {
            this.currentFilter = filter;
        },
        
        filterTasks() {
            // Автоматическая фильтрация через computed свойство
        },
        
        async toggleTaskStatus(task) {
            try {
                const response = await fetch(`/tasks/update/${task.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.authToken}`
                    },
                    body: JSON.stringify({ status: !task.status })
                });
                
                if (response.ok) {
                    const updatedTask = await response.json();
                    const index = this.tasks.findIndex(t => t.id === task.id);
                    if (index !== -1) {
                        this.tasks[index] = updatedTask;
                    }
                }
            } catch (error) {
                console.error('Toggle status error:', error);
            }
        },
        
        editTask(task) {
            // Простая реализация редактирования
            console.log('Edit task:', task);
        },
        
        deleteTask(taskId) {
            if (!confirm('Вы уверены, что хотите удалить эту задачу?')) {
                return;
            }
            
            // Удаляем из локального массива
            this.tasks = this.tasks.filter(t => t.id !== taskId);
        },
        
        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        },
        
        getPriorityClass(task) {
            const priority = task.priority || 'medium';
            return `priority-${priority}`;
        },
        
        getPriorityLabel(task) {
            const priority = task.priority || 'medium';
            const labels = {
                low: 'Низкий',
                medium: 'Средний',
                high: 'Высокий'
            };
            return labels[priority] || 'Средний';
        }
    }
});

app.mount('#app');
