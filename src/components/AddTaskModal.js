import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import './AddTaskModal.css';

function AddTaskModal({ onClose, onAdd }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Название задачи обязательно');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onAdd(formData);
      onClose();
    } catch (error) {
      setError('Ошибка создания задачи. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    if (error) {
      setError('');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="add-task-container">
          <div className="modal-header">
            <h2>Новая задача</h2>
            <p>Создайте новую задачу для отслеживания</p>
          </div>

          <form onSubmit={handleSubmit} className="add-task-form">
            <div className="form-group">
              <label htmlFor="title">
                <AlertCircle size={16} />
                Название задачи *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="input"
                placeholder="Введите название задачи"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">
                Описание
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="input"
                placeholder="Добавьте описание задачи (необязательно)"
                rows="4"
              />
            </div>

            <div className="form-group">
              <label htmlFor="priority">
                Приоритет
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="input"
              >
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
              </select>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                onClick={onClose}
                className="btn"
                disabled={loading}
              >
                Отмена
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Создание...' : 'Создать задачу'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddTaskModal;
