FROM python:3.13-slim

# Set the working directory in the container
WORKDIR /data
ENV NODE_PATH=/usr/lib/node_modules
ENV PATH="/home/agent/.local/bin:${PATH}"

# Install system dependencies: FFmpeg, Ghostscript, Poppler (for PDFs), ImageMagick, OCR, LibreOffice, Chromium
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    wget \
    git \
    gnupg \
    unzip \
    zip \
    jq \
    ffmpeg \
    ghostscript \
    poppler-utils \
    imagemagick \
    tesseract-ocr \
    libreoffice \
    chromium \
    fonts-liberation \
    fonts-noto \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g typescript playwright googleapis express mongoose mongodb axios dotenv cors lodash date-fns ws socket.io fs-extra csv-parser \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install standard data science and PDF libraries for the Agent
RUN pip install --no-cache-dir \
    pandas numpy matplotlib seaborn openpyxl reportlab pymupdf pdfplumber pytest fpdf \
    playwright cairosvg Pillow beautifulsoup4 requests pytz python-dateutil networkx \
    scipy sympy xlrd xlwt PyPDF2 python-docx python-pptx pytesseract pydub \
    moviepy jinja2 lxml qrcode fpdf2 pycryptodome boto3 sqlalchemy tabulate \
    rich opencv-python-headless pdf2image lxml html5lib markdown \
    textblob spacy nltk scikit-learn statsmodels yfinance apscheduler \
    pydantic fastapi uvicorn yt-dlp

# Create a non-root user for security (so the Agent isn't running as root inside the container)
RUN useradd -m agent && chown -R agent:agent /data
USER agent

# Install Playwright browsers for the agent user
RUN playwright install chromium

# The default command just keeps it ready for bash execution
CMD ["/bin/bash"]
