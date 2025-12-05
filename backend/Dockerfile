FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Use npm mirror to avoid registry issues
RUN npm config set registry https://registry.npmmirror.com && \
    npm install && \
    npm config set registry https://registry.npmjs.org

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Expose port
EXPOSE 8080

# Start the server
CMD ["npm", "start"]
