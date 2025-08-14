import datetime
from sqlalchemy.orm import mapped_column, Mapped, declarative_base

Base = declarative_base()

class TaskModel(Base):
    __tablename__ = 'task'

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] 
    description: Mapped[str] = mapped_column(nullable=True)
    created: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.now)
    status: Mapped[bool] = mapped_column(nullable=True, default=False)
