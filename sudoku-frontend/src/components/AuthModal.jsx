import React, { useState } from "react";
import { AuthService } from "../services/AuthService";

const AuthModal = ({
  show,
  onClose,
  isLoginView,
  setIsLoginView,
  game,
  onLoginSuccess, // 로그인 성공 시 호출될 콜백 (setToken 등)
}) => {
  // ✨ 중복 체크 메시지 상태 추가
  const [errors, setErrors] = useState({
    email: "",
    nickname: "",
  });

  // ✨ 이메일 중복 체크
  const handleEmailBlur = async () => {
    if (isLoginView || !formData.email) return; // 로그인 모드거나 비어있으면 패스
    try {
      const isDuplicate = await AuthService.checkEmail(formData.email);
      setErrors((prev) => ({
        ...prev,
        email: isDuplicate
          ? "이미 사용 중인 이메일입니다. ❌"
          : "사용 가능한 이메일입니다. ✅",
      }));
    } catch (err) {
      setErrors((prev) => ({ ...prev, email: "확인 불가" }));
    }
  };

  // ✨ 닉네임 중복 체크
  const handleNicknameBlur = async () => {
    if (isLoginView || !formData.nickname) return;
    try {
      const isDuplicate = await AuthService.checkNickname(formData.nickname);
      setErrors((prev) => ({
        ...prev,
        nickname: isDuplicate
          ? "이미 사용 중인 닉네임입니다. ❌"
          : "사용 가능한 닉네임입니다. ✅",
      }));
    } catch (err) {
      setErrors((prev) => ({ ...prev, nickname: "확인 불가" }));
    }
  };

  // 1. 입력 데이터를 담을 상태
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nickname: "",
  });

  if (!show) return null;

  // 2. 입력값 업데이트
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 3. 인증 로직 실행
  const handleAuthAction = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    try {
      if (isLoginView) {
        // --- 로그인 모드 ---
        const data = await AuthService.signIn(
          formData.email,
          formData.password,
        );

        // 성공 시 처리
        localStorage.setItem("accessToken", data.accessToken);
        // 🎯 [수정] 이메일뿐만 아니라 객체 형태로 정보를 몽땅 넘겨줍니다.
        // 만약 서버가 nickname을 안 준다면 우선 email을 nickname 대용으로라도 씁니다.
        onLoginSuccess(data.accessToken, {
          email: data.email,
          nickname: data.nickname || data.email.split("@")[0], // 닉네임 없으면 아이디라도!
        });
        onClose(); // 모달 닫기
        alert("로그인되었습니다!");
      } else {
        // --- 회원가입 모드 ---
        // 프론트엔드 자체 검증
        if (formData.password !== formData.confirmPassword) {
          return alert("비밀번호가 일치하지 않습니다.");
        }
        if (!formData.nickname) {
          return alert("닉네임을 입력해주세요.");
        }

        await AuthService.signUp(
          formData.email,
          formData.password,
          formData.nickname,
        );

        alert("회원가입 완료! 이제 로그인해주세요.");
        setIsLoginView(true); // 로그인 화면으로 전환
        // 가입 정보 초기화 (선택 사항)
        setFormData({ ...formData, password: "", confirmPassword: "" });
      }
    } catch (err) {
      console.error("인증 에러:", err);
      // 서버에서 온 에러 메시지가 있으면 노출, 없으면 기본 메시지
      const errMsg =
        err.response?.data?.message || err.response?.data || "인증 실패";
      alert(errMsg);
    }
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
            onBlur={handleEmailBlur} // 🎯 이메일 입력칸에서 나갈 때 검사
          />
          {/* ✨ 회원가입 모드일 때만 이메일 중복 메시지 표시 */}
          {!isLoginView && errors.email && (
            <p
              style={{
                ...styles.msgText,
                color: errors.email.includes("✅") ? "#4CAF50" : "#f44336",
              }}
            >
              {errors.email}
            </p>
          )}

          {!isLoginView && (
            <>
              <input
                name="nickname"
                value={formData.nickname}
                placeholder="닉네임 (최대 20자)"
                style={styles.input}
                onChange={handleChange}
                onBlur={handleNicknameBlur} // 🎯 닉네임 입력칸에서 나갈 때 검사
              />
              {/* ✨ 닉네임 중복 메시지 표시 */}
              {errors.nickname && (
                <p
                  style={{
                    ...styles.msgText,
                    color: errors.nickname.includes("✅")
                      ? "#4CAF50"
                      : "#f44336",
                  }}
                >
                  {errors.nickname}
                </p>
              )}
            </>
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
              value={formData.confirmPassword}
              placeholder="비밀번호 확인"
              style={styles.input}
              onChange={handleChange}
            />
          )}

          <button
            onClick={handleAuthAction}
            style={{
              ...styles.submitBtn,
              // 🎯 중복이 있거나 필수값이 없으면 버튼을 비활성화 스타일로 변경 (선택사항)
              opacity:
                !isLoginView &&
                (errors.email.includes("❌") || errors.nickname.includes("❌"))
                  ? 0.5
                  : 1,
            }}
            disabled={
              !isLoginView &&
              (errors.email.includes("❌") || errors.nickname.includes("❌"))
            }
          >
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

        <button onClick={onClose} style={styles.closeBtn}>
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
