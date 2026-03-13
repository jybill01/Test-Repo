from functools import lru_cache
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    port: int = 8085
    grpc_port: int = 9095
    log_level: str = "INFO"
    environment: str = "development"
    
    # AWS Bedrock 설정
    aws_region: str = "us-east-1"
    bedrock_model_id: str = "anthropic.claude-sonnet-4-5-20250929-v1:0"
    bedrock_max_tokens: int = 2000
    bedrock_temperature: float = 0.7
    bedrock_timeout: int = 30
    
    # MariaDB 설정
    db_host: str = "planit-mariadb"
    db_port: int = 3306
    db_name: str = "planit_insight_db"
    db_user: str = "root"
    db_password: str = "root"
    db_pool_size: int = 5
    db_query_timeout: int = 10
    service_a_base_url: str = "http://planit-insight-svc:8084"
    
    # AWS Credentials (optional, can be loaded from .env or IAM Role)
    aws_access_key_id: str | None = None
    aws_secret_access_key: str | None = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"  # 정의되지 않은 필드가 있어도 무시함

@lru_cache()
def get_settings() -> Settings:
    return Settings()
