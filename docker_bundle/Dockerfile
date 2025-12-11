# Base image
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies (if needed for pysnmp/paramiko/builds)
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
# autogenstudio, pysnmp, paramiko, flask are required
RUN pip install --no-cache-dir \
    autogenstudio \
    pysnmp \
    paramiko \
    flask \
    gunicorn

# Copy application code
COPY osi_team_config.json /app/
COPY entrypoint.sh /app/
COPY setup_team.py /app/

# Expose port
EXPOSE 8081

# Set enviroment variables
ENV AUTOGENSTUDIO_APPDIR=/app/data

# Create data directory
RUN mkdir -p /app/data

# Entrypoint
RUN chmod +x /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]
