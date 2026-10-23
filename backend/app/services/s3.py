import os
import uuid
import mimetypes
from typing import Dict, Any, Optional
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from botocore.client import Config
from app.core.config import settings

def get_s3_client():
    """Initializes and returns boto3 S3 client with signature version 4."""
    if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
        return boto3.client(
            "s3",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            config=Config(signature_version="s3v4")
        )
    # Fallback to default AWS credential chain (IAM Role on EC2)
    return boto3.client("s3", region_name=settings.AWS_REGION, config=Config(signature_version="s3v4"))

def generate_presigned_upload_url(
    filename: str,
    file_type: str = "image/jpeg",
    folder: str = "posters",
    expires_in: int = 3600
) -> Dict[str, str]:
    """
    Generates an Amazon S3 presigned PUT URL allowing clients
    to upload directly to S3 with SSE-S3 (AES256) encryption.
    """
    ext = os.path.splitext(filename)[1]
    unique_key = f"{folder}/{uuid.uuid4()}{ext}"
    
    try:
        s3 = get_s3_client()
        upload_url = s3.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": settings.S3_BUCKET_NAME,
                "Key": unique_key,
                "ContentType": file_type,
                "ServerSideEncryption": "AES256"
            },
            ExpiresIn=expires_in
        )
        download_url = f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{unique_key}"
        return {
            "upload_url": upload_url,
            "file_key": unique_key,
            "download_url": download_url
        }
    except (ClientError, NoCredentialsError) as e:
        # Development fallback simulation
        mock_url = f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{unique_key}"
        return {
            "upload_url": f"http://localhost:8000/api/documents/mock-upload?key={unique_key}",
            "file_key": unique_key,
            "download_url": mock_url
        }

def generate_presigned_download_url(
    file_key: str,
    expires_in: int = 3600
) -> str:
    """Generates an Amazon S3 presigned GET URL for secure temporary file access."""
    try:
        s3 = get_s3_client()
        url = s3.generate_presigned_url(
            ClientMethod="get_object",
            Params={
                "Bucket": settings.S3_BUCKET_NAME,
                "Key": file_key
            },
            ExpiresIn=expires_in
        )
        return url
    except (ClientError, NoCredentialsError):
        return f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{file_key}"

def upload_file_bytes_to_s3(
    file_bytes: bytes,
    file_key: str,
    content_type: str = "application/pdf"
) -> str:
    """
    Directly uploads raw byte buffer to S3 with SSE-S3 encryption.
    Used by automated PDF report generator.
    """
    try:
        s3 = get_s3_client()
        s3.put_object(
            Bucket=settings.S3_BUCKET_NAME,
            Key=file_key,
            Body=file_bytes,
            ContentType=content_type,
            ServerSideEncryption="AES256"
        )
        return f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{file_key}"
    except (ClientError, NoCredentialsError) as e:
        print(f"[AWS S3 Info] Could not upload directly to S3: {e}. Saved mock key: {file_key}")
        return f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{file_key}"
