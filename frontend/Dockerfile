FROM oven/bun:1 AS build-stage

WORKDIR /app

COPY frontend/package.json frontend/bun.lock ./

RUN bun install

COPY frontend/ .

ARG VITE_API_URL

RUN bun run build


FROM nginx:1

COPY --from=build-stage /app/dist/ /usr/share/nginx/html

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY frontend/nginx-backend-not-found.conf /etc/nginx/extra-conf.d/backend-not-found.conf