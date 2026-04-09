# Multi-stage logic for smaller final image
# Stage 1: Build the Vue application
FROM node:22-alpine AS build

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy all source files and build the app
COPY . .
RUN npm run build

# Stage 2: Serve the app with Express
FROM node:22-alpine

WORKDIR /app

# Only install production dependencies for the Express server
COPY package*.json ./
RUN npm install --omit=dev

# Copy the server file and the built static files
COPY server.js ./
COPY --from=build /app/dist ./dist

# Expose the server port
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
