import api from "../api";

export const GameService = {
  // 새 게임 시작
  startGame: async (difficulty, validId) => {
    const url = validId ? `/games/start/${validId}` : `/games/start`;
    const res = await api.post(url, { difficulty });
    return res.data;
  },
  // 이어하기 정보 체크
  checkRecentGame: async (guestId) => {
    const url = guestId ? `/games/${guestId}` : `/games`;
    const res = await api.get(url);
    return res.data;
  },
  // 숫자 입력 및 메모 토글
  placeNumber: async (gameId, row, col, value, elapsedTime) => {
    const res = await api.post(`/games/${gameId}/place`, {
      row,
      col,
      value,
      elapsedTime,
    });
    return res.data;
  },
  toggleMemo: async (gameId, row, col, value) => {
    const res = await api.post(`/games/${gameId}/memo`, { row, col, value });
    return res.data;
  },
  // 저장 및 종료
  saveAndExit: async (gameId, elapsedTime, isGuest) => {
    const url = isGuest ? `/games/${gameId}/save` : `/games/save`;
    const res = await api.post(url, { elapsedTime });
    return res.data;
  },
};

export const authService = {
  signIn: (email, password) =>
    api.post("/api/auth/sign-in", { email, password }),
  signUp: (email, password, nickname) =>
    api.post("/api/auth/signup", { email, password, nickname }),
  fetchStats: () => api.get("/api/records/all"),
};
