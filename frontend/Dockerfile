# Frontend build and production image
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV VITE_GATEWAY_URL=http://localhost:8000

RUN npm run build

# Production stage - minimal image
FROM node:20-slim

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

EXPOSE 5173

CMD ["serve", "-s", "dist", "-l", "5173"]
