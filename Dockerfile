# Use a base image with Node.js installed
FROM node:18

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application files
COPY . .

# Expose the necessary port (if applicable)
EXPOSE 3000

# Command to run your bot
CMD ["node", "bot.js"]
