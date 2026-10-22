FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm install
COPY packages/shared packages/shared
COPY apps/web apps/web
RUN npm run build -w @tmsampark/shared && npm run build -w @tmsampark/web
WORKDIR /app/apps/web
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "start"]
