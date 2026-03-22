# syntax=docker/dockerfile:1
FROM python:3.12.11-slim-bookworm AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# --- Build stage: compile wheels ---
FROM base AS build
RUN apt-get update && apt-get install --no-install-recommends -y \
    build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip wheel --wheel-dir /wheels -r requirements.txt

# --- Dev target ---
FROM base AS dev
WORKDIR /app
RUN apt-get update && apt-get install --no-install-recommends -y \
    libpq-dev gettext \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /wheels /wheels
RUN pip install --no-cache-dir --no-index --find-links=/wheels /wheels/* && rm -rf /wheels
COPY requirements.txt requirements-dev.txt ./
RUN pip install --no-cache-dir -r requirements-dev.txt
COPY . .
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# --- Prod target ---
FROM base AS prod
ARG APP_HOME=/app
ARG SERVICE=worker
ENV SERVICE=${SERVICE}

WORKDIR ${APP_HOME}

RUN addgroup --system django && adduser --system --ingroup django django

RUN apt-get update && apt-get install --no-install-recommends -y \
    libpq-dev gettext curl \
    && apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /wheels /wheels
RUN pip install --no-cache-dir --no-index --find-links=/wheels /wheels/* && rm -rf /wheels

COPY --chown=django:django . ${APP_HOME}
COPY --chmod=755 entrypoint.prod.sh /entrypoint.sh
COPY --chmod=755 start_files/ /start_files/
RUN mkdir -p ${APP_HOME}/media ${APP_HOME}/staticfiles \
    && chown -R django:django ${APP_HOME}/media ${APP_HOME}/staticfiles

USER django

ENTRYPOINT ["/entrypoint.sh"]
CMD /start_files/start_${SERVICE}.sh
