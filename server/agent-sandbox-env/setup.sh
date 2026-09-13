#!/bin/bash

# ==============================================================================
# Classgrid AI Agent Sandbox - EC2 Deployment Script
# Run this script on the T3 Medium EC2 instance to set up the Docker sandbox.
# ==============================================================================

echo "🚀 Starting Classgrid AI Sandbox Setup..."

# 1. Update packages and install Docker if not present
echo "📦 Checking dependencies..."
sudo apt-get update -y
if ! command -v docker &> /dev/null
then
    echo "Installing Docker..."
    sudo apt-get install -y docker.io
    sudo systemctl start docker
    sudo systemctl enable docker
    # Add ubuntu user to docker group
    sudo usermod -aG docker ubuntu
    echo "✅ Docker installed. (You may need to log out and log back in for group changes to take effect)"
else
    echo "✅ Docker is already installed."
fi

# 2. Create the Shared Data Directory
echo "📁 Setting up isolated sandbox directories..."
sudo mkdir -p /home/ubuntu/sandbox_data
sudo chmod 777 /home/ubuntu/sandbox_data
echo "✅ /home/ubuntu/sandbox_data created and permissions set."

# 3. Build the Docker Image
echo "🐳 Building the 'my-agent-sandbox' Docker image..."
# Assuming this script is run from the same directory as the Dockerfile
docker build -t my-agent-sandbox .
if [ $? -eq 0 ]; then
    echo "✅ Docker image 'my-agent-sandbox' built successfully!"
else
    echo "❌ Failed to build Docker image. Please check the logs."
    exit 1
fi

echo "🎉 Setup Complete!"
echo "The AI can now securely connect via SSH and spin up isolated containers."
