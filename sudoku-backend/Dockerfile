# 🎯 최신 실무 표준인 Eclipse Temurin 이미지 사용 (Java 17)
FROM eclipse-temurin:17-jdk-alpine

# 2. 실행 파일을 복사할 위치 설정
WORKDIR /app

# 3. 빌드된 Jar 파일을 복사 (빌드 도구에 따라 경로 확인 필요)
# Gradle: build/libs/*.jar  |  Maven: target/*.jar
COPY build/libs/*.jar app.jar

# 4. 앱 실행
ENTRYPOINT ["java", "-jar", "app.jar"]