# ==========================================
# Classgrid Backend API - Dockerfile
# ==========================================
FROM node:20-alpine

# Install OS dependencies if needed (e.g. for native modules, canvas, etc.)
# We install standard build tools just in case
RUN apk add --no-cache python3 make g++ 

WORKDIR /app

# Copy dependency definitions
COPY package.json package-lock.json* ./

# Install dependencies (use --production if dev dependencies are not needed)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Ensure the server knows it is running in production
ENV NODE_ENV=production

# The port must match what server.js listens on (process.env.PORT || 3000)
EXPOSE 3000

# Start the Node API
CMD ["npm", "start"]
