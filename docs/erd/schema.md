# Database Schema

## 1. users
| column | type | constraint | description |
|--------|------|------------|-------------|
| id | bigint | PK | 사용자 고유 ID |
| email | varchar(255) | UNIQUE, NOT NULL | 로그인 ID |
| password | varchar(255) | NOT NULL | 암호화 저장 |
| nickname | varchar(50) | NOT NULL | 표시 이름 |
| created_at | timestamp | default now() | 생성일 |

- email UNIQUE 인덱스 적용
- user_id 기준으로 타 테이블과 FK 연결

---

## 2. board
| column | type | description |
|--------|------|------------|
| id | bigint | PK |
| start_board | jsonb | 초기 문제 |
| answer_board | jsonb | 정답 |
| level | int | 난이도 |
| created_at | timestamp | 생성일 |

- JSONB 사용 → 문제 구조 확장성 확보

---

## 3. game_records
| column | type | constraint | description |
|--------|------|------------|-------------|
| id | bigint | PK |
| user_id | bigint | FK(users.id) | 유저 참조 |
| board_id | bigint | FK(board.id) | 문제 참조 |
| difficulty | int | NOT NULL | 난이도 |
| elapsed_time | bigint | | 소요 시간 |
| life | int | | 남은 생명 |
| status | varchar(20) | | 완료 상태 |
| completed_at | timestamp | default now() | 완료 시점 |

- Redis에서 관리하던 상태는 완료 시점에만 영구 저장