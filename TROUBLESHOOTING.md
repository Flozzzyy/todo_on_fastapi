# Устранение проблем

## Проблема: Не создаются задачи

### Решение:
1. Убедитесь, что FastAPI сервер запущен: `uvicorn main:app --reload`
2. Убедитесь, что React приложение запущено: `npm start`
3. Проверьте, что вы авторизованы в системе
4. Проверьте консоль браузера на наличие ошибок

### Проверка API:
```bash
# Тест регистрации
curl -X POST "http://localhost:8000/register" \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "email": "test@example.com", "password": "password123"}'

# Тест входа
curl -X POST "http://localhost:8000/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "password": "password123"}'

# Тест создания задачи (замените YOUR_TOKEN на полученный токен)
curl -X POST "http://localhost:8000/tasks/add" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Тестовая задача", "description": "Описание", "priority": "high"}'
```

## Проблема: Статистика не отображается

### Решение:
1. Убедитесь, что задачи загружаются правильно
2. Проверьте, что компонент StatsGrid получает правильные данные
3. Проверьте консоль браузера на ошибки

## Проблема: Ошибки CORS

### Решение:
1. Убедитесь, что в main.py настроен CORS middleware
2. Проверьте, что React приложение использует правильный прокси (http://localhost:8000)

## Проблема: Ошибки аутентификации

### Решение:
1. Проверьте, что токен сохраняется в localStorage
2. Убедитесь, что токен не истек (по умолчанию 30 минут)
3. Попробуйте выйти и войти заново

## Полезные команды:

```bash
# Очистка базы данных и пересоздание миграций
rm -rf migrations/versions/*
alembic revision --autogenerate -m "init"
alembic upgrade head

# Перезапуск серверов
# Терминал 1:
uvicorn main:app --reload

# Терминал 2:
npm start
```

## Проверка логов:

1. **FastAPI логи** - смотрите в терминале, где запущен uvicorn
2. **React логи** - смотрите в терминале, где запущен npm start
3. **Браузер логи** - откройте Developer Tools (F12) и смотрите Console
