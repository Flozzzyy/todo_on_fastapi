import datetime
from sqlalchemy.orm import DeclarativeBase, mapped_column, Mapped, declarative_base

class Base(DeclarativeBase):
    pass

class UserModel(Base):
    __tablename__ = 'users'
    
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(unique=True, index=True)
    email: Mapped[str] = mapped_column(unique=True, index=True)
    hashed_password: Mapped[str]
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.now)

class TaskModel(Base):
    __tablename__ = 'task'

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] 
    description: Mapped[str] = mapped_column(nullable=True)
    created: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.now)
    status: Mapped[bool] = mapped_column(nullable=True, default=False)
    priority: Mapped[str] = mapped_column(nullable=True, default="medium")
    user_id: Mapped[int] = mapped_column(nullable=True)  # Связь с пользователем
