FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm install
COPY packages/shared packages/shared
COPY backend backend
RUN npm run build -w @tmsampark/shared && npm run build -w @tmsampark/api
WORKDIR /app/backend
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "dist/server.js"]
