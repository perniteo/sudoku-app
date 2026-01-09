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
