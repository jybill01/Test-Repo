# 1단계: 빌드 환경 (x86 고정)
FROM --platform=linux/amd64 python:3.11-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# ---------------------------------------------------

# 2단계: 실행 환경 (x86 고정)
FROM --platform=linux/amd64 python:3.11-slim
WORKDIR /app

# 라이브러리 및 소스코드 복사
COPY --from=builder /root/.local /root/.local
COPY ./app ./app
COPY ./proto ./proto
COPY ./docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# 팩트: YAML에서 주입할 PORT 변수들은 다 날리고, '시스템 필수 변수'만 남김!
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1

EXPOSE 8085 9095

# 헬스체크
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8085/health')"

CMD ["/docker-entrypoint.sh"]