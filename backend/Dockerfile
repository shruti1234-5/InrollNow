# Use official Node.js base image
FROM node:18

# Set working directory inside container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the port your app runs on (matches the backend port)
EXPOSE 5000

# Command to run the application
CMD ["npm", "start"]
