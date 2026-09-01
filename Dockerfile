FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    GLASSWAKE_PROJECT_ROOT=/app \
    PORT=8080

WORKDIR /app

COPY pyproject.toml README.md ./
COPY src ./src
COPY services ./services
COPY contracts ./contracts
COPY fixtures ./fixtures
COPY dist ./dist

RUN pip install --no-cache-dir ".[api,google]"

CMD ["sh", "-c", "uvicorn services.cloud_api.main:app --host 0.0.0.0 --port ${PORT}"]
