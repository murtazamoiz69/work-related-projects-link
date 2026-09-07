FROM node:20-alpine AS build

WORKDIR /app

ENV HUSKY=0

COPY package.json package-lock.json ./
RUN npm ci --prefer-offline --no-audit

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --retries=10 --start-period=5s \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
