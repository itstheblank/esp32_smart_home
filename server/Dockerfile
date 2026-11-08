# Dockerfile for Smart Home Web Server
FROM python:3.12-slim

LABEL maintainer="Smart Home Team"
LABEL description="Web Service and MQTT Test Center for ESP32 Smart Home"

WORKDIR /app

# Keep Python output unbuffered for real-time docker logs
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Expose web dashboard port
EXPOSE 5000

# Run web service
CMD ["python3", "main.py"]
