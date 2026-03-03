import api from "../api";

export const GameService = {
  // 🎯 1. 새 게임 시작: 유저 ID(validId)를 경로로 사용
  startGame: (difficulty, userId) => {
    // 백엔드가 /games/start/{userId} 로 기대함
    return api.post(`/games/start/${userId}`, { difficulty });
  },

  // 🎯 2. 이어하기 체크: 유저 ID(userId)로 조회
  checkRecentGame: (token, userId) => {
    // 로그인 시 /games, 비로그인 시 /games/{userId}
    const url = token ? `/games` : `/games/${userId}`;
    return api.get(url);
  },

  // 🎯 3. 숫자 입력 & 메모: 멀티는 gameId, 싱글은 userId 사용
  // (현재 백엔드가 싱글/멀티 구분 없이 gameId 자리에 userId를 받는지 확인 필요)
  placeNumber: (id, row, col, value, elapsedTime) => {
    return api.post(`/games/${id}/place`, { row, col, value, elapsedTime });
  },

  toggleMemo: (id, row, col, value) => {
    return api.post(`/games/${id}/memo`, { row, col, value });
  },

  // 🎯 4. 저장: [핵심] gameId가 아닌 userId를 경로로 사용!
  saveAndExit: (userId, elapsedTime, token) => {
    // 로그인 유저: /games/save (세션/토큰에서 ID 추출)
    // 비로그인 유저: /games/{userId}/save
    console.log(
      "저장 요청 - userId:",
      userId,
      "elapsedTime:",
      elapsedTime,
      "token:",
      token,
    );
    const url = token ? `/games/save` : `/games/${userId}/save`;
    return api.post(url, { elapsedTime });
  },
};

export const authService = {
  signIn: (email, password) =>
    api.post("/api/auth/sign-in", { email, password }),
  signUp: (email, password, nickname) =>
    api.post("/api/auth/signup", { email, password, nickname }),
  fetchStats: () => api.get("/api/records/all"),
};
