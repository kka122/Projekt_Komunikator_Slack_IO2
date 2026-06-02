FROM node:25-alpine as builder
WORKDIR /app

COPY ./app/package.json .
COPY ./app/package-lock.json .
RUN npm ci

COPY ./app .
COPY .env .

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY ./app/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]