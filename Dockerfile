# Version web (PWA) de ShelfSync: build estatico de Expo servido con Nginx.
# Las EXPO_PUBLIC_* se incrustan en el bundle al construir, no en runtime.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG EXPO_PUBLIC_API_BASE_URL
ENV EXPO_PUBLIC_API_BASE_URL=$EXPO_PUBLIC_API_BASE_URL
# API de impresion en la laptop (shelfsync-printer); vacia = imprimir avisa que falta
ARG EXPO_PUBLIC_PRINTER_URL
ENV EXPO_PUBLIC_PRINTER_URL=$EXPO_PUBLIC_PRINTER_URL
RUN test -n "$EXPO_PUBLIC_API_BASE_URL" && npx expo export --platform web

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
