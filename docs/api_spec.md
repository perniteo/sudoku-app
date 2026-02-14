# Sudoku API

## 핵심 기능
- [x] 퍼즐 생성 (난이도별)
- [x] 게임 진행/검증 (server-stateful)
- [x] 유저 인증 (JWT)
- [ ] 랭킹 시스템 (애매해서 고민)
- [ ] 히스토리 (개인 통계)
- [ ] 같이 풀기

## 기술적 포인트
- JWT 인증: stateless 확장성 
- 상태 관리 캐싱
  - 현재 back server memory (Map object)로 관리
  - Redis 캐싱(in-memory db): 퍼즐 생성 부하 감소 예상 고려중
- 동시성 처리: 여러 게임 격리

## Redis

- [x] server In-memory -> redis(aof)
- [x] 이어하기 (user-id) 기반 ttl 포함한 redis 저장
- [ ] 비회원(uuid) 세션 저장
- [ ] jwt refresh token 발급 후 저장