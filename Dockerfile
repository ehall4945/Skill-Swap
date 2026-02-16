FROM node:20-slim

WORKDIR /app

# Copy package files first to cache layers
COPY package*.json ./
RUN npm install

# Copy the rest of the files
COPY . .

# EXPOSE 3000 # Old
# Changed EXPOSE from 3000 to 5173
EXPOSE 5173

# CMD ["npm", "start"] # Old
# Updated the command to run the Vite dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
