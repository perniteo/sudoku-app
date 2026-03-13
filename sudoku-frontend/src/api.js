import axios from "axios";

const baseURL = process.env.REACT_APP_API_URL || "http://localhost:8080";

const api = axios.create({
  baseURL: baseURL,
  // 🎯 [핵심] 모든 요청에 쿠키를 포함함 (HttpOnly 전송 필수 옵션)
  withCredentials: true,
});

// 1. 요청 인터셉터 (AccessToken은 여전히 Header에 담는 경우)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 2. 응답 인터셉터 (401 에러 시 토큰 갱신)
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log("🔄 토큰 만료! 재발급 시도 중...");

        const res = await axios.post(
          `${baseURL}/api/auth/reissue`,
          {},
          {
            withCredentials: true,
          },
        );

        // 🎯 [수정] 서버가 준 새 데이터 수령 (accessToken, email, nickname)
        const { accessToken, email, nickname } = res.data;

        // 1. 로컬 스토리지 갱신
        localStorage.setItem("accessToken", accessToken);

        // 2. 💡 [핵심] App.js의 상태를 강제로 동기화하기 위한 커스텀 이벤트 발송
        // api.js는 리액트 컴포넌트가 아니라서 setUser를 직접 못 부르기 때문에 이벤트를 씁니다.
        const authEvent = new CustomEvent("auth_refresh", {
          detail: { token: accessToken, user: { email, nickname } },
        });
        window.dispatchEvent(authEvent);

        // 3. 원래 요청 재시도
        originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (reissueError) {
        console.error("❌ 리프레시 토큰 만료 - 로그아웃 처리");
        localStorage.removeItem("accessToken");
        // 로그아웃 이벤트 발송
        window.dispatchEvent(new Event("auth_logout"));
        return Promise.reject(reissueError);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
