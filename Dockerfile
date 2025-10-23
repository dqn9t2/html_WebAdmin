# 1. Start from a lightweight Node.js image
FROM node:20-alpine

# 2. Create a working directory inside the container
WORKDIR /app

# 3. Copy package.json and package-lock.json
COPY package*.json ./

# 4. Install dependencies
RUN npm install

# 5. Copy all other project files
COPY . .

# 7. Expose the app port
EXPOSE 4000

# 8. Start your app
CMD ["node", "server.js"]
