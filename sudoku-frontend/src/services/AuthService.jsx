import api from "../api";

export const AuthService = {
  // 이메일 중복 체크
  checkEmail: async (email) => {
    // ⚠️ 경로가 백엔드 컨트롤러의 @RequestMapping("/api/auth") + @GetMapping("/check-email")과 맞아야 함
    const res = await api.get(`/api/auth/check-email?email=${email}`);
    return res.data; // true 또는 false 반환
  },

  // 닉네임 중복 체크
  checkNickname: async (nickname) => {
    const res = await api.get(`/api/auth/check-nickname?nickname=${nickname}`);
    return res.data;
  },

  // 로그인
  signIn: async (email, password) => {
    const res = await api.post("/api/auth/sign-in", { email, password });

    // 🎯 백엔드에서 준 정보(accessToken, email, nickname)를 그대로 반환
    // 만약 백엔드 필드명이 다르면 여기서 맞춰주면 됨
    return {
      accessToken: res.data.accessToken,
      email: res.data.email || email, // 서버가 안 주면 입력값이라도 사용
      nickname: res.data.nickname, // 서버에서 온 닉네임
    };
  },

  // 🎯 [추가] 토큰 재발급 시 유저 정보 가공
  reissue: async () => {
    const res = await api.post("/api/auth/reissue");
    return {
      accessToken: res.data.accessToken,
      email: res.data.email,
      nickname: res.data.nickname,
    };
  },

  // 회원가입
  signUp: async (email, password, nickname) => {
    const res = await api.post("/api/auth/signup", {
      email,
      password,
      nickname,
    });
    return res.data;
  },

  // 로그아웃
  signOut: async () => {
    try {
      await api.post("/api/auth/sign-out");
    } catch (err) {
      console.error("로그아웃 요청 실패:", err);
    } finally {
      // 🎯 토큰과 함께 유저 정보도 반드시 삭제!
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user"); // 이 줄 추가
    }
  },
};
