# Use Node.js 22 Alpine
FROM node:22-alpine

# Install Chromium and dependencies for Puppeteer/WhatsApp-Web.js
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Set working directory
WORKDIR /app

# Copy package configuration files
COPY package*.json ./

# Install npm dependencies
RUN npm install --omit=dev

# Copy application files
COPY . .

# Expose backend port
ENV PORT=5000
EXPOSE 5000

# Start server
CMD ["node", "server.js"]
