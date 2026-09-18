FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps --omit=dev
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY next.config.mjs ./
EXPOSE 3000
CMD ["npm", "start"]
