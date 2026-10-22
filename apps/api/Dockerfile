FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm install
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build -w @tmsampark/shared && npm run build -w @tmsampark/api
WORKDIR /app/apps/api
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "dist/server.js"]
