import React, { useState } from "react";

const AuthModal = ({
  show,
  isLoginView,
  setIsLoginView,
  game,
  setViewMode,
  // onLoginSubmit은 부모로부터 전달받은 성공 후 로직으로 활용
  onLoginSubmit,
}) => {
  // 1. 입력 데이터를 담을 상태 (닉네임 포함)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nickname: "",
  });

  if (!show) return null;

  // 2. 입력값이 바뀔 때마다 상태 업데이트
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 3. Spring Boot API 호출 함수
  const handleAuthAction = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // 직접 fetch 하지 말고 부모(App.js)가 준 함수에 데이터만 배달
    // 순서: isLoginView, email, password, nickname
    onLoginSubmit(
      isLoginView,
      formData.email,
      formData.password,
      formData.nickname,
    );
  };
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2>{isLoginView ? "Sign In" : "Sign Up"}</h2>
        <p style={styles.subText}>
          {game?.status === "COMPLETED"
            ? "🏆 기록을 저장하려면 로그인하세요!"
            : "스도쿠의 모든 기능을 즐겨보세요."}
        </p>

        <div style={styles.form}>
          <input
            name="email"
            type="email"
            value={formData.email}
            placeholder="이메일 (ID)"
            style={styles.input}
            onChange={handleChange}
          />
          {/* 닉네임은 회원가입일 때만 노출 */}
          {!isLoginView && (
            <input
              name="nickname"
              value={formData.nickname}
              placeholder="닉네임 (최대 20자)"
              style={styles.input}
              onChange={handleChange}
            />
          )}
          <input
            name="password"
            type="password"
            value={formData.password}
            placeholder="비밀번호"
            style={styles.input}
            onChange={handleChange}
          />
          {!isLoginView && (
            <input
              name="confirmPassword"
              type="password"
              value="password"
              placeholder="비밀번호 확인"
              style={styles.input}
              onChange={handleChange}
            />
          )}

          <button onClick={handleAuthAction} style={styles.submitBtn}>
            {isLoginView ? "로그인" : "가입하기"}
          </button>
        </div>

        <div style={{ marginTop: "20px", fontSize: "14px" }}>
          {isLoginView ? (
            <p>
              계정이 없으신가요?{" "}
              <span onClick={() => setIsLoginView(false)} style={styles.link}>
                회원가입
              </span>
            </p>
          ) : (
            <p>
              이미 계정이 있나요?{" "}
              <span onClick={() => setIsLoginView(true)} style={styles.link}>
                로그인
              </span>
            </p>
          )}
        </div>

        <button
          onClick={() => setViewMode(game ? "game" : "menu")}
          style={styles.closeBtn}
        >
          나중에 하기
        </button>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#fff",
    padding: "40px",
    borderRadius: "12px",
    width: "320px",
    textAlign: "center",
    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
  },
  subText: { fontSize: "14px", color: "#666", marginBottom: "20px" },
  form: { display: "flex", flexDirection: "column", gap: "12px" },
  input: { padding: "10px", borderRadius: "4px", border: "1px solid #ccc" },
  submitBtn: {
    padding: "12px",
    backgroundColor: "#4CAF50",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  link: { color: "#2196F3", cursor: "pointer", textDecoration: "underline" },
  closeBtn: {
    marginTop: "15px",
    background: "none",
    border: "none",
    color: "#999",
    cursor: "pointer",
    textDecoration: "underline",
  },
};

export default AuthModal;
