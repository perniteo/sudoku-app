# Sudoku API Generator & Neon PostgreSQL Dev Log

## 선택 배경

### PostgreSQL 선택 이유
- **트랜잭션 관리 용이**: 스도쿠 보드를 실시간으로 생성하고 삽입하면서 동시 접근에도 안정적.
- **JSONB 지원**: 9x9 배열 형태의 보드를 그대로 저장 가능.
- **확장성**: 향후 seed 기반 동적 생성이나 복잡한 쿼리에도 대응 가능.

### MySQL 대비 트레이드오프
| 구분 | MySQL | PostgreSQL |
|------|-------|------------|
| 조회 중심 | 빠름, 단순 | 충분히 빠름
| 트랜잭션 | 단순 | ACID 보장
| JSON 지원 | 제한적 | JSONB로 배열/객체 저장 용이
| 확장성 | 제한적 | 기능 풍부, 복잡한 로직 지원

- **결론**: 내 API는 쓰기/생성 중심이므로, 트랜잭션 안정성과 JSONB 지원 때문에 PostgreSQL 선택.

### Neon Cloud 선택 이유
- 로컬 DB 설치 필요 없음 → 바로 클라우드 환경 사용 가능
- 무료 tier 제공 → 테스트/개발용 적합
- DB + 스토리지 + 트랜잭션 관리 모두 제공
- API 서버에서 바로 접근 가능 → generator → INSERT 간단하게 연결 가능

## DB 구조 (board 테이블)

```sql
CREATE TABLE board (
    id SERIAL PRIMARY KEY,               -- 자동 증가 ID
    start_board JSONB NOT NULL,          -- 시작 보드 (9x9 배열)
    answer_board JSONB NOT NULL,         -- 정답 보드
    level INT NOT NULL,                   -- 난이도
    created_at TIMESTAMP DEFAULT NOW()   -- 생성 시간
);
```

### 주요 사항
- `JSONB` 타입으로 배열 그대로 저장 가능
- `level` 컬럼으로 난이도 구분
- `created_at` 기본값으로 자동 생성 시간 기록

## 실시간 삽입 전략

1. Sudoku Generator에서 보드 생성 (`createBoard3()` + `boardRemover()` + `uniqueAnswerFinder()`)
2. 생성된 board를 DB INSERT:
```java
String sql = "INSERT INTO board (start_board, answer_board, level) VALUES (?::jsonb, ?::jsonb, ?)";
PreparedStatement ps = conn.prepareStatement(sql);
ps.setString(1, startBoardJson);
ps.setString(2, answerBoardJson);
ps.setInt(3, level);
ps.executeUpdate();
```
3. Repository/DAO 선택 사항:
   - 단순 JDBC로 충분
   - 확장 시 Spring JPA Repository 사용 가능

## 결론
- **Neon PostgreSQL + JSONB** 구조는 스도쿠 API Generator와 잘 맞음
- 로컬 DB 필요 없이 바로 Cloud에서 실시간 삽입 가능
- 추후 seed 기반 재현이나 동적 생성도 쉽게 통합 가능
- 트랜잭션과 ACID 보장 덕분에 동시 접근에도 안전함

---

