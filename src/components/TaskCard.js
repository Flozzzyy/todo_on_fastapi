import React, { useState } from 'react';
import { CheckCircle, Edit, Trash2, Calendar, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import './TaskCard.css';

function TaskCard({ task, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description || '',
    priority: task.priority || 'medium'
  });

  const handleToggleStatus = () => {
    onUpdate(task.id, { status: !task.status });
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    onUpdate(task.id, editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'medium'
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Вы уверены, что хотите удалить эту задачу?')) {
      onDelete(task.id);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      low: 'Низкий',
      medium: 'Средний',
      high: 'Высокий'
    };
    return labels[priority] || 'Средний';
  };

  const getPriorityIcon = (priority) => {
    if (priority === 'high') {
      return <AlertCircle size={16} className="priority-icon high" />;
    }
    return null;
  };

  if (isEditing) {
    return (
      <div className="task-card editing">
        <div className="edit-form">
          <input
            type="text"
            value={editData.title}
            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            className="edit-title"
            placeholder="Название задачи"
          />
          
          <textarea
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            className="edit-description"
            placeholder="Описание задачи (необязательно)"
            rows="3"
          />
          
          <select
            value={editData.priority}
            onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
            className="edit-priority"
          >
            <option value="low">Низкий приоритет</option>
            <option value="medium">Средний приоритет</option>
            <option value="high">Высокий приоритет</option>
          </select>
          
          <div className="edit-actions">
            <button onClick={handleSave} className="btn btn-primary">
              Сохранить
            </button>
            <button onClick={handleCancel} className="btn">
              Отмена
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('task-card', { completed: task.status })}>
      <div className="task-header">
        <div className="task-status" onClick={handleToggleStatus}>
          <CheckCircle 
            size={20} 
            className={clsx('status-icon', { checked: task.status })}
          />
        </div>
        
        <div className="task-content">
          <h3 className="task-title">{task.title}</h3>
          {task.description && (
            <p className="task-description">{task.description}</p>
          )}
        </div>
        
        <div className="task-actions">
          <button onClick={handleEdit} className="action-btn edit" title="Редактировать">
            <Edit size={16} />
          </button>
          <button onClick={handleDelete} className="action-btn delete" title="Удалить">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div className="task-meta">
        <div className="task-date">
          <Calendar size={14} />
          <span>{formatDate(task.created)}</span>
        </div>
        
        <div className="task-priority">
          {getPriorityIcon(task.priority || 'medium')}
          <span className={clsx('priority-label', task.priority || 'medium')}>
            {getPriorityLabel(task.priority || 'medium')}
          </span>
        </div>
      </div>
    </div>
  );
}

export default TaskCard;
