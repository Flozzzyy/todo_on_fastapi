from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime

# Схемы для авторизации
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Схемы для задач
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: bool = False
    priority: Optional[str] = "medium"

class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: bool
    priority: Optional[str]
    created: datetime
    user_id: Optional[int]
    
    class Config:
        from_attributes = True

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[bool] = None
    priority: Optional[str] = None