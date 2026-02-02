# Sudoku Board 생성 및 DB 삽입 모듈 개발 기록

## 목적
- 스도쿠 보드를 자동으로 생성하고, 필요할 때 DB에 삽입할 수 있는 모듈 구현
- Agile 방식으로 우선 완성 후, 추후 성능 최적화 및 구조 개선 가능하게 설계

## 구현 개요
1. **DTO 정의** (`SudokuBoardData`)
    - `difficulty` (int): 난이도
    - `initialBoard` (int[][]): 초기 스도쿠 보드
    - `solutionBoard` (int[][]): 정답 보드
    - Jackson 라이브러리를 활용해 JSON 변환 가능하도록 설정 (`@JsonProperty`, `@Builder`, `@Getter` 등)

2. **Mapper 정의** (`SudokuMapper`)
    - MyBatis를 이용한 SQL 매핑 인터페이스
    - `insertSudoku(difficulty, startBoard, answerBoard)` 메서드 구현
    - JSON 변환된 보드를 DB에 삽입

3. **Service 정의** (`BoardGenerateService`)
    - DTO를 받아 Jackson으로 JSON 변환 후 Mapper를 통해 DB 삽입
    - 의존성 주입을 통한 MyBatis Mapper 및 ObjectMapper 사용

4. **Runner 정의** (`BoardDatabaseRunner`)
    - `CommandLineRunner` 구현하여 애플리케이션 시작 시 보드 생성 및 DB 삽입 수행 가능
    - `BoardGeneratorTemp`를 통해 지정 개수의 보드 생성
    - 생성된 보드를 순회하며 Service를 통해 DB에 삽입

## SQL Mapper 예시
```sql
INSERT INTO sudoku_table (level, start_board, answer_board, created_at)
VALUES (
#{difficulty},
#{startBoard}::jsonb,
#{answerBoard}::jsonb,
NOW()
)
```

## 실행 및 결과
🚀 Sudoku data Generate and Start Insert...  
✅ Result : N data be stored in DB  
⚠️ 필요 시 BoardDatabaseRunner를 주석 처리하여 삽입 기능 비활성화 가능

## 느낀점 / 향후 계획
- 우선 완성 후, ID 기반 난이도 구역 나누기 등 성능 최적화 가능
- Service/Runner 구조를 모듈화하여 필요 시 재사용 용이
- DB 삽입 방식과 Board 생성 로직을 분리하여 유지보수 용이

---
## 개인적 설계고민
- ### `BoardGenerator.generate(int level, int times)`
  - **generator**를 실행 시 n번을 시도
  - times(시도) 하는 방식이 아닌 n개를 **return**하는 방식으로 변경할 것인지 생각해볼 필요있음


- ### **SQL Mapping**
  - **Jackson Mapper**를 통해 json data file을 남기고 그 file들을 기준으로 sql mapping하는 방식을 처음에 고려했음
  - 결과적으로는 불필요한 데이터 생성이라 생각돼서 필요한 부분만 json Mapping하고 sql Mapping을 진행하였음
  - 이 부분에 대해서 다시 생각해볼 필요 있을듯함(json data를 남기는 것이 좋은 판단이였을지)