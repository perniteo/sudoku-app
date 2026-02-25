import api from "../api";

export const GameService = {
  // 새 게임 시작 (ID 존재 여부에 따른 경로 분기 유지)
  startGame: (difficulty, validId) => {
    const url = validId ? `/games/start/${validId}` : `/games/start`;
    return api.post(url, { difficulty });
  },

  // 이어하기 체크 (로그인/비로그인 URL 분기 유지)
  checkRecentGame: (token, savedId) => {
    const url = token ? `/games` : `/games/${savedId}`;
    return api.get(url);
  },

  // 숫자 입력 (elapsedTime 포함)
  placeNumber: (gameId, row, col, value, elapsedTime) => {
    return api.post(`/games/${gameId}/place`, { row, col, value, elapsedTime });
  },

  // 메모 토글
  toggleMemo: (gameId, row, col, value) => {
    return api.post(`/games/${gameId}/memo`, { row, col, value });
  },

  // 저장 (로그인 유저 /games/save, 익명 /games/{id}/save 분기)
  saveAndExit: (gameId, elapsedTime, token) => {
    const url = token ? `/games/save` : `/games/${gameId}/save`;
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
