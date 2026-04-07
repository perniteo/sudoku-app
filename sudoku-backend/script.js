import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '20s', target: 10 }, // 20초 동안 사용자 10명까지 늘리기
    { duration: '40s', target: 30 }, // 40초 동안 30명 유지 (피크)
    { duration: '20s', target: 0 },  // 서서히 종료
  ],
};

export default function () {
  const url = 'http://localhost:8080/games/start';

  // POST로 보낼 데이터 (난이도: 4 ~ 11)
  const payload = JSON.stringify({
    difficulty: 4
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // 1. 게임 시작 API 호출 (POST)
  const res = http.post(url, payload, params);

  // 2. 응답 검증 (200 OK인지, gameId나 board 데이터가 잘 오는지)
  check(res, {
    'is status 200': (r) => r.status === 200,
    // 필드명을 board로 수정!
    'has board data': (r) => r.json().board !== undefined,
    // 추가로 gameId가 잘 왔는지도 체크해보면 좋음
    'has gameId': (r) => r.json().gameId !== undefined,
  });

  sleep(1); // 다음 행동까지 1초 대기
}
