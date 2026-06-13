FROM node:24-alpine

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 5173

# Dev server, reachable from outside the container.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
