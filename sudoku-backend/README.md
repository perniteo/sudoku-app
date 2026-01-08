# Sudoku Backend

Spring Boot 기반의 스도쿠 게임 백엔드 서버입니다.  
스도쿠 퍼즐 생성, 검증, 풀이 로직을 REST API 형태로 제공합니다.

## Tech Stack
- Java 17
- Spring Boot
- Gradle
- REST API

## Features
- 스도쿠 퍼즐 생성
- 사용자 입력 검증
- 퍼즐 풀이 (Backtracking)
- 게임 상태 관리

## Run

Gradle Wrapper 실행:

    ./gradlew bootRun

빌드 후 실행:

    ./gradlew build
    java -jar build/libs/*.jar

## API (Draft)
- GET /api/sudoku/new
- POST /api/sudoku/validate
- POST /api/sudoku/solve

API 명세는 추후 Swagger로 정리 예정입니다.