FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source
COPY . .

# Environment variables
ENV NODE_ENV=production

# Run the Telegram bot
CMD ["npm", "run", "bot"]
