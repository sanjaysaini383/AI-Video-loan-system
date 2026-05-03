FROM node:18-alpine

WORKDIR /app

COPY package.json ./
RUN npm config set fetch-timeout 120000 && npm config set fetch-retry-mintimeout 20000 && npm config set fetch-retry-maxtimeout 120000 && npm install --verbose || npm install --verbose || npm install --verbose

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
