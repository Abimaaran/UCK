# Use official Node.js runtime
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package configuration files
COPY package*.json ./

# Install npm dependencies
RUN npm install --omit=dev

# Copy application files
COPY . .

# Railway dynamic port
ENV PORT=5000
EXPOSE 5000

# Start server
CMD ["node", "server.js"]
