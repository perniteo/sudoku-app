# Sudoku Project Dev Log

## Day 1–2 (요약)
- React 프로젝트 초기 세팅
- 프론트엔드 기본 Sudoku UI 구성
- Spring 초기 설정 및 프로젝트 구조 정리

---

## Day 3 (2026-01-09) – Backend Domain Design

### 오늘 한 것
- 백엔드 Domain 구조 설계
  - SudokuGame / SudokuBoard / Cell 역할 분리
  - Board, Cell에 대한 직접 접근 차단 (캡슐화)
- puzzleBoard / answerBoard 분리 구조 확정
- Generator / Solver를 util 계층으로 분리

### 설계 결정
- Generator는 인터페이스로 두지 않음  
  → 스도쿠 구조(9x9)가 고정된 프로젝트 특성상 단일 구현으로 충분하다고 판단
- puzzleBoard와 answerBoard는 반드시 하나의 세트로 관리
- 실제 게임 규칙 및 로직은 Service가 아닌 Domain이 책임지도록 설계

### 고민했던 점
- GeneratedSudoku 객체의 필요성
  - 퍼즐 보드와 정답 보드는 논리적으로 분리 불가능
  - 생성 결과를 하나의 타입으로 묶는 것이 구조적으로 더 명확하다고 판단하여 도입

### 다음에 할 것
- Domain 내부에 placeNumber 로직 구현
- 입력 값에 대한 정답 비교 및 life 처리 로직 추가

---
## Day 4 (2026-01-11) – Backend Application Flow & API Integration

### 오늘 한 것
- Domain 설계 기반으로 실제 애플리케이션 흐름 구현
- Service / Controller 계층 구현 및 역할 분리
- HTTP 요청 → Domain 로직 → 응답까지 전체 흐름 연결
- Postman을 통해 실제 API 동작 검증


### 구현 내용 상세

#### Domain
- `placeNumber()` 로직 완성
  - 게임 상태(`PLAYING / COMPLETED / FAILED`)에 따른 입력 제한
  - 고정 칸 입력 방지
  - 정답/오답 판별 및 life 감소 처리
  - life 소진 시 GAME_OVER 상태 전환
- Game 규칙을 Domain 내부에 완전히 캡슐화
  - Controller / Service는 규칙을 전혀 알지 못하도록 설계

#### Service
- `SudokuGameService` 구현
  - 게임 생성(create)
  - 게임 조회(get)
  - 상호작용(placeNumber) 중계
- 여러 게임 인스턴스를 관리하는 역할 수행
- Domain 객체의 생명주기를 관리하되, 규칙에는 관여하지 않음

#### Controller
- REST API 엔드포인트 구성
  - `POST /games` : 새 게임 생성
  - `POST /games/{id}/place` : 숫자 입력
- Request / Response DTO 분리
  - HTTP 계층 전용 데이터 구조로 Domain 보호
- Service 호출 결과를 JSON 응답으로 변환하는 역할만 수행

### 테스트 및 검증
- JUnit 테스트를 통해 Domain 로직 검증
  - 고정 칸 입력
  - 정답/오답 처리
  - life 감소 및 게임 종료 상태
- Postman을 통해 실제 HTTP 요청 흐름 검증
  - create → place 순서가 강제되는 구조 확인
  - Domain 설계 의도가 API 흐름에 그대로 반영됨을 확인

### 설계적으로 의미 있었던 점
- Domain 중심 구조의 장점 체감
  - 규칙이 한 곳에 모여 있어 흐름을 추적하기 쉬움
  - 외부 계층(Spring, HTTP)이 Domain을 오염시키지 않음
- Service / Controller의 역할 경계가 명확해짐
  - Service: 생명주기와 상호작용 조율
  - Controller: 입출력 어댑터 역할
- “요청 → 상태 변화 → 응답”이라는 백엔드 흐름을 명확히 인식


### 현재 상태 정리
- 애플리케이션의 구조적 뼈대 완성
- 기능 확장(DB, Solver, Frontend 연동 등)을 위한 기반 마련
- 구현보다 구조 안정성을 우선한 단계 완료


### 다음에 할 것
- DB 연동을 통한 게임 상태 영속화
  - In-memory Map → RDB 전환
  - Game / Board 상태 저장 구조 설계
- API 예외 처리 정교화 (존재하지 않는 gameId 등)
- Frontend 연동을 통한 실제 플레이 흐름 완성

---
## Day 5 (2026-01-16) – Domain Validation 강화 & Front–Backend 연결 정리

### 오늘 확정 및 구현한 내용

#### 1. SudokuBoard 규칙 검증(validation) 구현
- Board 레벨에서 **스도쿠 규칙(row / col / box) 검증 로직 추가**
- `place()` 호출 시 다음을 모두 검증하도록 확정
  - 좌표 범위 검증
  - 값 범위 검증 (0 ~ 9)
  - 행 / 열 / 3×3 박스 중복 검사
- `value = 0`은 **지우기(ERASE)** 로 간주하여 규칙 검사 스킵
- Board는 **규칙 검증과 상태 보관만 담당**하도록 책임 고정

---

#### 2. Game vs Board 책임 분리 명확화
- **규칙 유효성**: SudokuBoard
- **정답 판정 / life 감소 / 게임 상태 전환**: SudokuGame
- answerBoard는 **플레이 중 정답 판정 기준**으로 유지
- “규칙상 가능”과 “정답 여부”를 완전히 다른 개념으로 분리

---

#### 3. 입력 정책 및 Life 감소 규칙 최종 확정
- 스도쿠는 퍼즐이 아닌 **게임(Game)** 으로 정의
- 룰상 가능한 입력은 **모두 허용**
- 다음 모든 경우를 **오입력으로 간주하여 life 감소**:
  - 고정된 칸 입력 시도
  - row / col / box 규칙 위반
  - answerBoard 기준 오답 입력
- Life 감소하지 않는 유일한 경우:
  - `ERASE (value = 0)`

> 입력은 비용이 드는 행동,  
> 추론(memo)은 비용이 들지 않는 행동으로 설계

---

#### 4. ERASE 개념 도입
- `value = 0`을 명시적인 **지우기 동작**으로 정의
- ERASE는 언제나 허용
- life 감소 없음
- 잘못된 입력 후 수정 가능한 정상적인 플레이 흐름 보장

---

#### 5. PlaceResult 확장 및 의미 고정
- PlaceResult에 게임 상태를 명확히 표현하는 값들 추가
  - CORRECT / WRONG / ERASE / ALREADY_FIXED / GAME_OVER / COMPLETED
- Result 자체가 성공 여부와 메시지를 포함하도록 설계
- Controller / Front가 별도 판단 로직을 가지지 않도록 구조 정리

---

#### 6. Front–Backend 연결 구조 정리
- Front에서 **게임 시작 → 게임 상태 유지 → 입력 요청** 흐름 확정
- `/games` : 게임 생성
- `/games/{id}/place` : 숫자 입력 및 결과 수신
- 프론트 상태를 `game(id, board, status, life)` 단위로 관리하도록 수정
- Board는 서버 응답 기준으로만 갱신 (프론트 규칙 판단 없음)

---

### 현재 상태
- Domain 레벨의 규칙, 검증, life 정책 모두 고정
- Board / Game / answerBoard 역할 명확
- Front–Backend 연결 흐름 정상 동작 확인
- 이후 작업은 테스트, UX, DB 연동 등 구현 확장 단계로 진행 가능
