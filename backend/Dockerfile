FROM python:3.14

ENV PYTHONUNBUFFERED=1

# Install uv
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#installing-uv
COPY --from=ghcr.io/astral-sh/uv:0.9.26 /uv /uvx /bin/

# Compile bytecode
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#compiling-bytecode
ENV UV_COMPILE_BYTECODE=1

# uv Cache
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#caching
ENV UV_LINK_MODE=copy

# Increase HTTP timeout for slow network environments
ENV UV_HTTP_TIMEOUT=120

WORKDIR /app/

# Place executables in the environment at the front of the path
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#using-the-environment
ENV PATH="/app/.venv/bin:$PATH"

# Install all dependencies in one step
# First copy all files (source before sync)
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#intermediate-layers
COPY ./backend/pyproject.toml ./backend/alembic.ini /app/backend/
COPY ./backend/scripts /app/backend/scripts
COPY ./backend/app /app/backend/app

RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    --mount=type=bind,source=backend/pyproject.toml,target=backend/pyproject.toml \
    uv sync --frozen

WORKDIR /app/backend/

CMD ["fastapi", "run", "--workers", "4", "app/main.py"]
