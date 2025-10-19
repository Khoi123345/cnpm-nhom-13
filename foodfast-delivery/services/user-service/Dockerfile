# syntax=docker/dockerfile:1
FROM node:18.20.8-alpine

WORKDIR /usr/src/app

# Copy package.json and package-lock.json first to leverage Docker caching
COPY package.json package-lock.json ./

# Install dependencies inside the container
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Start the application
CMD ["node", "src/server.js"]
