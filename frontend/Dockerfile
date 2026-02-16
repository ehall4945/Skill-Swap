FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy everything else
COPY . .

EXPOSE 5173

# Vite needs --host to be visible outside the container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]