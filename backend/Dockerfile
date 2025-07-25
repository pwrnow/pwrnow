FROM python:3.12.11-slim-bookworm

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install --no-install-recommends -y \
    build-essential \
    libpq-dev \
    gettext \
    && apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy entrypoint and start scripts
COPY entrypoint.sh /entrypoint.sh
COPY start.sh /start.sh
RUN chmod +x /entrypoint.sh /start.sh

# Copy application code
COPY . .

ENTRYPOINT ["/entrypoint.sh"]