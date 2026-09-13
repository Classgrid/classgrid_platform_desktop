FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /data

# Install system dependencies: FFmpeg, Ghostscript, Poppler (for PDFs), and Node.js
RUN apt-get update && apt-get install -y \
    curl \
    ffmpeg \
    ghostscript \
    poppler-utils \
    imagemagick \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install standard data science and PDF libraries for the Agent
RUN pip install pandas numpy matplotlib seaborn openpyxl reportlab

# Create a non-root user for security (so the Agent isn't running as root inside the container)
RUN useradd -m agent && chown -R agent:agent /data
USER agent

# The default command just keeps it ready for bash execution
CMD ["/bin/bash"]
