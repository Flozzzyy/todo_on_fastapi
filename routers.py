from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models import TaskModel, UserModel
from database import get_db
from schemas import TaskCreate, TaskUpdate, TaskResponse, UserCreate, UserLogin, UserResponse, Token
from auth import get_password_hash, verify_password, create_access_token, get_current_active_user
from datetime import timedelta

# Создаем роутер вместо импорта app
router = APIRouter()

@router.get("/")
async def root():
    return {"message": "Task Manager API is running! Visit /static/index.html for the frontend"}

# Эндпоинты для авторизации
@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    """Регистрация нового пользователя"""
    # Проверяем, не существует ли уже пользователь с таким username
    result = await db.execute(select(UserModel).where(UserModel.username == user.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Проверяем, не существует ли уже пользователь с таким email
    result = await db.execute(select(UserModel).where(UserModel.email == user.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Создаем нового пользователя
    hashed_password = get_password_hash(user.password)
    db_user = UserModel(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    
    return db_user

@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """Вход пользователя"""
    # Ищем пользователя по username
    result = await db.execute(select(UserModel).where(UserModel.username == user_credentials.username))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Создаем токен доступа
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

# Защищенные эндпоинты для задач (требуют авторизации)
@router.post('/tasks/add', response_model=TaskResponse)
async def add_one(
    task: TaskCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    try:
        new = TaskModel(**task.model_dump(), user_id=current_user.id)
        db.add(new)
        await db.commit()
        await db.refresh(new)
        return new
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating task: {str(e)}")

@router.get('/tasks', response_model=list[TaskResponse])
async def get_all(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    # Получаем только задачи текущего пользователя
    result = await db.execute(select(TaskModel).where(TaskModel.user_id == current_user.id))
    tasks = result.scalars().all()
    return tasks

@router.get('/tasks/{id}', response_model=TaskResponse)
async def get_one(
    id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    # Получаем задачу и проверяем, что она принадлежит текущему пользователю
    result = await db.execute(
        select(TaskModel).where(TaskModel.id == id, TaskModel.user_id == current_user.id)
    )
    task = result.scalar_one_or_none()
    
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.put('/tasks/update/{id}', response_model=TaskResponse)
async def update_one(
    id: int, 
    task_update: TaskUpdate, 
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    # Получаем задачу и проверяем, что она принадлежит текущему пользователю
    result = await db.execute(
        select(TaskModel).where(TaskModel.id == id, TaskModel.user_id == current_user.id)
    )
    task = result.scalar_one_or_none()
    
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Обновляем поля задачи, если они были переданы
    if task_update.title is not None:
        task.title = task_update.title
    if task_update.description is not None:
        task.description = task_update.description
    if task_update.status is not None:
        task.status = task_update.status
    
    await db.commit()
    await db.refresh(task)
    return task

@router.delete('/tasks/delete/{id}')
async def delete_one(
    id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    # Получаем задачу и проверяем, что она принадлежит текущему пользователю
    result = await db.execute(
        select(TaskModel).where(TaskModel.id == id, TaskModel.user_id == current_user.id)
    )
    task = result.scalar_one_or_none()
    
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    await db.delete(task)
    await db.commit()
    return {'message': f'task {id} deleted successfully'}
