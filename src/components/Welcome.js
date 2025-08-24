import React from 'react';
import { CheckSquare, Clock, TrendingUp, Users } from 'lucide-react';
import './Welcome.css';

function Welcome({ onGetStarted }) {
  return (
    <div className="welcome">
      <div className="container">
        <div className="welcome-content">
          <div className="welcome-hero">
            <div className="hero-icon">
              <CheckSquare size={64} />
            </div>
            <h1 className="hero-title">
              Добро пожаловать в <span className="highlight">TaskFlow</span>
            </h1>
            <p className="hero-subtitle">
              Организуйте свои задачи эффективно и красиво. 
              Современный интерфейс для максимальной продуктивности.
            </p>
            <button onClick={onGetStarted} className="cta-button">
              <CheckSquare size={20} />
              Начать работу
            </button>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <CheckSquare size={32} />
              </div>
              <h3>Управление задачами</h3>
              <p>Создавайте, редактируйте и отслеживайте прогресс ваших задач</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Clock size={32} />
              </div>
              <h3>Приоритизация</h3>
              <p>Устанавливайте приоритеты и сроки для эффективного планирования</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <TrendingUp size={32} />
              </div>
              <h3>Аналитика</h3>
              <p>Отслеживайте свой прогресс с помощью детальной статистики</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Users size={32} />
              </div>
              <h3>Безопасность</h3>
              <p>Ваши данные защищены современными методами шифрования</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Welcome;
