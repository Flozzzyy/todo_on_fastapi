from fastapi import Depends, FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from models import *
from database import *
from schemas import *

app = FastAPI(title="Task Manager API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене замените на конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.on_event('startup')
async def startup():
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/")
async def root():
    return {"message": "Task Manager API is running! Visit /static/index.html for the frontend"}

@app.post('/tasks/add', response_model=TaskResponse)
async def add_one(task: TaskCreate, db: AsyncSession = Depends(get_db)):
    try:
        new = TaskModel(**task.model_dump())
        db.add(new)
        await db.commit()
        await db.refresh(new)
        return new
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating task: {str(e)}")

@app.get('/tasks', response_model=list[TaskResponse])
async def get_all(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TaskModel))
    tasks = result.scalars().all()
    return tasks

@app.get('/tasks/{id}', response_model=TaskResponse)
async def get_one(id: int, db: AsyncSession = Depends(get_db)):
    res = await db.get(TaskModel, id)
    if res is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return res

@app.put('/tasks/update/{id}', response_model=TaskResponse)
async def update_one(id: int, task_update: TaskUpdate, db: AsyncSession = Depends(get_db)):
    task = await db.get(TaskModel, id)
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

@app.delete('/tasks/delete/{id}')
async def delete_one(id: int, db: AsyncSession = Depends(get_db)):
    task = await db.get(TaskModel, id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    await db.delete(task)
    await db.commit()
    return {'message': f'task {id} deleted successfully'}
