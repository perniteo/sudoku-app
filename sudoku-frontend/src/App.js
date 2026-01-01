import { useState } from "react";

function App() {
  const [status, setStatus] = useState("아직 안 눌림");

  const checkBackend = async () => {
    setStatus("눌림, 응답 대기중...");
    try {
      await fetch("/api/health2")
        .then((res) => res.json())
        .then((data) => setStatus(data.status));
    } catch (error) {
      setStatus("에러 발생: " + error.message);
    }
  };
  return (
    <div style={{ padding: "20px" }}>
      <h1>React Button Fetch Test</h1>

      <button onClick={checkBackend}>Check Backend Status</button>

      <p>Backend status: {status}</p>
    </div>
  );
}
export default App;
