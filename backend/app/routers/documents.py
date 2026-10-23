from fastapi import APIRouter, Depends, Query, status
from app.core.security import get_current_user
from app.models.models import User
from app.schemas.schemas import PresignedUrlRequest, PresignedUrlResponse
from app.services.s3 import generate_presigned_upload_url, generate_presigned_download_url

router = APIRouter(prefix="/documents", tags=["Documents & AWS S3 Vault"])

@router.post("/presigned-url", response_model=PresignedUrlResponse)
def get_presigned_upload_url(
    payload: PresignedUrlRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generates an Amazon S3 presigned PUT URL allowing clients
    to upload movie posters or avatars directly to S3 with SSE-S3 encryption.
    """
    folder = payload.folder if payload.folder in ["posters", "avatars", "attachments"] else "posters"
    result = generate_presigned_upload_url(
        filename=payload.filename,
        file_type=payload.file_type,
        folder=folder
    )
    return result

@router.get("/presigned-download")
def get_presigned_download(
    key: str = Query(..., description="S3 Object Key in Vault"),
    current_user: User = Depends(get_current_user)
):
    """Generates an expiring presigned GET URL to securely access S3 documents."""
    download_url = generate_presigned_download_url(file_key=key, expires_in=3600)
    return {"key": key, "download_url": download_url}
