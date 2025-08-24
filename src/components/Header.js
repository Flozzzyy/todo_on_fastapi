import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sun, Moon, LogOut, User } from 'lucide-react';
import clsx from 'clsx';
import './Header.css';

function Header({ onLoginClick }) {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.body.classList.toggle('light-theme', theme === 'light');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h1>TaskFlow</h1>
          </div>
          
          <div className="header-actions">
            <button 
              onClick={toggleTheme} 
              className={clsx('theme-toggle', { 'light': theme === 'light' })}
              aria-label="Переключить тему"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            
            {user ? (
              <div className="user-menu">
                <div className="user-info">
                  <User size={16} />
                  <span className="username">{user.username}</span>
                </div>
                <button onClick={handleLogout} className="logout-btn" aria-label="Выйти">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button onClick={onLoginClick} className="login-btn">
                <User size={16} />
                Войти
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
