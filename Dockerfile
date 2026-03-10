FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN node --max_old_space_size=1024 node_modules/@angular/cli/bin/ng.js build --configuration production

FROM nginx:alpine
COPY --from=builder /app/dist/employee-monitoring-front/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
