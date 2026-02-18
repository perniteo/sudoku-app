# 1단계: 빌드 (Node 환경)
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2단계: 배포 (Nginx 환경)
FROM nginx:stable-alpine
# 빌드된 정적 파일들을 Nginx 경로로 복사
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]