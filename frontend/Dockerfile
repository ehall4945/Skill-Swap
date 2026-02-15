FROM node:20-slim

WORKDIR /app

# Copy package files first to cache layers
COPY package*.json ./
RUN npm install

# Copy the rest of the files
COPY . .

EXPOSE 3000

CMD ["npm", "start", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
