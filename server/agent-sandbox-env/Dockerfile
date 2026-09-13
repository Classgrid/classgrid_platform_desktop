FROM python:3.13-slim

# Set the working directory in the container
WORKDIR /data

# Install system dependencies: FFmpeg, Ghostscript, Poppler (for PDFs), ImageMagick, OCR, LibreOffice, Chromium
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg \
    unzip \
    zip \
    ffmpeg \
    ghostscript \
    poppler-utils \
    imagemagick \
    tesseract-ocr \
    libreoffice \
    chromium \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g typescript playwright \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install standard data science and PDF libraries for the Agent
RUN pip install --no-cache-dir \
    pandas numpy matplotlib seaborn openpyxl reportlab pymupdf pdfplumber pytest \
    playwright

# Create a non-root user for security (so the Agent isn't running as root inside the container)
RUN useradd -m agent && chown -R agent:agent /data
USER agent

# The default command just keeps it ready for bash execution
CMD ["/bin/bash"]
