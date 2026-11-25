FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN mkdir -p /data/storage && chown -R node:node /data/storage /usr/src/app

USER node

EXPOSE 3001

CMD ["node", "src/server.js"]
