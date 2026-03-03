import api from "../api";

export const AuthService = {
  // 로그인
  signIn: async (email, password) => {
    // 🎯 바디에는 email, password만 담김 (RT는 쿠키로 구워짐)
    const res = await api.post("/api/auth/sign-in", { email, password });
    return {
      accessToken: res.data.accessToken,
      email: email, // 로그인 성공 시 이메일도 반환
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
    // 🎯 서버가 쿠키를 삭제(maxAge: 0)할 수 있도록 호출
    await api.post("/api/auth/sign-out");
    localStorage.removeItem("accessToken");
  },
};
