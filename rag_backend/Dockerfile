FROM python:3.11

# Create a non-root user (Hugging Face requirement)
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:${PATH}"

WORKDIR /app

# Install dependencies
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy application code
COPY --chown=user . .

# Hugging Face Spaces uses port 7860 by default
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
