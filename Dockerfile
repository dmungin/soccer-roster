# Multi-stage build for smaller final image
# Stage 1: Build the Vue application
FROM node:22-alpine AS build

WORKDIR /app

# Copy package.json and install all dependencies (including dev)
COPY package*.json ./
RUN npm install

# Copy all source files and build the app
COPY . .
RUN npm run build

# Stage 2: Serve the app with Express
FROM node:22-alpine

WORKDIR /app

# Install production dependencies only (Express, better-sqlite3, bcrypt, etc.)
COPY package*.json ./
RUN npm install --omit=dev

# Copy the server files and the built static files
COPY server.js ./
COPY server/ ./server/
COPY --from=build /app/dist ./dist

# Create data directory for SQLite
RUN mkdir -p /data

# Environment
ENV PORT=3000
ENV DB_PATH=/data/soccer-roster.db
ENV NODE_ENV=production

# Expose the server port
EXPOSE 3000

# Persistent data volume
VOLUME /data

# Start the server
CMD ["npm", "start"]
