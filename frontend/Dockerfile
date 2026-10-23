FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm install
COPY packages/shared packages/shared
COPY frontend frontend
RUN npm run build -w @tmsampark/shared && npm run build -w @tmsampark/web
WORKDIR /app/frontend
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "start"]
