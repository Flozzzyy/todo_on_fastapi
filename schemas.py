from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: bool = False

class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: bool
    created: datetime
    
    class Config:
        from_attributes = True

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[bool] = None