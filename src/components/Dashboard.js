import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Filter, CheckCircle, Clock, TrendingUp, List } from 'lucide-react';
import TaskCard from './TaskCard';
import AddTaskModal from './AddTaskModal';
import StatsGrid from './StatsGrid';
import './Dashboard.css';

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFilter, setCurrentFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const filters = [
    { value: 'all', label: 'Все', icon: List },
    { value: 'pending', label: 'В ожидании', icon: Clock },
    { value: 'completed', label: 'Выполнено', icon: CheckCircle }
  ];

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await axios.get('/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('Ошибка загрузки задач:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (taskData) => {
    try {
      const response = await axios.post('/tasks/add', taskData);
      setTasks([...tasks, response.data]);
      setShowAddModal(false);
    } catch (error) {
      console.error('Ошибка создания задачи:', error);
      throw error; // Пробрасываем ошибку дальше для обработки в модальном окне
    }
  };

  const updateTask = async (taskId, updates) => {
    try {
      const response = await axios.put(`/tasks/update/${taskId}`, updates);
      setTasks(tasks.map(task => 
        task.id === taskId ? response.data : task
      ));
    } catch (error) {
      console.error('Ошибка обновления задачи:', error);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`/tasks/delete/${taskId}`);
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Ошибка удаления задачи:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    // Фильтрация по статусу
    if (currentFilter === 'pending' && task.status) return false;
    if (currentFilter === 'completed' && !task.status) return false;
    
    // Поиск
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return task.title.toLowerCase().includes(query) ||
             (task.description && task.description.toLowerCase().includes(query));
    }
    
    return true;
  });

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status).length,
    pending: tasks.filter(t => !t.status).length,
    percentage: tasks.length > 0 ? Math.round((tasks.filter(t => t.status).length / tasks.length) * 100) : 0
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Загружаем задачи...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="container">
        <StatsGrid stats={stats} />
        
        <div className="dashboard-controls">
          <div className="search-section">
            <div className="search-box">
              <Search size={20} />
              <input
                type="text"
                placeholder="Поиск задач..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          
          <div className="filter-section">
            {filters.map(filter => {
              const Icon = filter.icon;
              return (
                <button
                  key={filter.value}
                  onClick={() => setCurrentFilter(filter.value)}
                  className={`filter-btn ${currentFilter === filter.value ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  {filter.label}
                </button>
              );
            })}
          </div>
          
          <div className="add-section">
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary add-task-btn"
            >
              <Plus size={20} />
              Новая задача
            </button>
          </div>
        </div>

        <div className="tasks-section">
          {filteredTasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <List size={48} />
              </div>
              <h3>{searchQuery ? 'Задачи не найдены' : 'Задач пока нет'}</h3>
              <p>
                {searchQuery 
                  ? 'Попробуйте изменить поисковый запрос' 
                  : 'Создайте свою первую задачу!'
                }
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn btn-primary"
                >
                  <Plus size={16} />
                  Создать задачу
                </button>
              )}
            </div>
          ) : (
            <div className="tasks-grid">
              {filteredTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdate={updateTask}
                  onDelete={deleteTask}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddTaskModal
          onClose={() => setShowAddModal(false)}
          onAdd={addTask}
        />
      )}
    </div>
  );
}

export default Dashboard;
