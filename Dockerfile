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
ENV PORT=10000
EXPOSE 10000

# Run the Telegram bot
CMD ["npm", "run", "bot"]
