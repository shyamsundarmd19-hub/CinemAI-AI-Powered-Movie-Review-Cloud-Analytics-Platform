from .auth import router as auth_router
from .movies import router as movies_router
from .reviews import router as reviews_router
from .documents import router as documents_router
from .admin import router as admin_router

__all__ = [
    "auth_router",
    "movies_router",
    "reviews_router",
    "documents_router",
    "admin_router",
]
