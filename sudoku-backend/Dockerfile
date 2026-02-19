# 1단계: 빌드 스테이지 (Gradle 환경)
FROM gradle:8.5-jdk17 AS build
WORKDIR /app
COPY . .
# 🎯 여기서 직접 jar를 빌드합니다. (test는 제외해서 속도 업)
RUN ./gradlew clean build -x test

# 2단계: 실행 스테이지 (가벼운 JRE 환경)
FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app
# 🎯 1단계에서 만든 jar 파일만 쏙 가져옵니다.
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]