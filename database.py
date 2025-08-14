from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
    async_sessionmaker,
)

url = 'sqlite+aiosqlite:///tasks.db'

async_engine = create_async_engine(url)
async_session = async_sessionmaker(async_engine, expire_on_commit=False)

async def get_db():
    async with async_session() as session:
        yield session
        


