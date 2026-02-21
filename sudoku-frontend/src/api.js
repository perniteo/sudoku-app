import axios from "axios";

const api = axios.create({
  baseURL: "https://sudoku-app-production-fc40.up.railway.app",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // 401 발생 시에만 재발급 로직 진입
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const rfToken = localStorage.getItem("refreshToken");

        // 🎯 [수정됨] 서버의 'reissue' 전용 주소로 정확히 요청을 보냅니다.
        const res = await axios.post(
          "https://sudoku-app-production-fc40.up.railway.app/api/auth/reissue",
          { refreshToken: rfToken },
        );

        // 새 토큰들 꺼내기
        const { accessToken, refreshToken } = res.data;

        // 로컬 스토리지 업데이트
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);

        // 🎯 이후 나갈 모든 요청의 기본 헤더 업데이트
        api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

        // 🎯 방금 실패했던 현재 요청의 헤더도 새 토큰으로 교체
        originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;

        // 원래 하려던 요청 다시 보내기
        return api(originalRequest);
      } catch (reissueError) {
        // Refresh Token까지 만료된 경우 로그아웃 처리
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(reissueError);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
