import { useEffect, useState, useCallback, useRef } from "react";
import SudokuBoard from "./components/SudokuBoard";
import AuthModal from "./components/AuthModal";
import GameOverlay from "./components/GameOverlay";
import Header from "./components/Header";
import MainMenu from "./components/MainMenu";
import GameInfo from "./components/GameInfo";
import NumberPad from "./components/NumberPad";
import RecordOverlay from "./components/RecordOverlay";
import RoomList from "./components/RoomList.jsx";
import Lobby from "./components/Lobby.jsx";
import api from "./api.js"; // 🎯 Axios 인스턴스
import SockJS from "sockjs-client";
import { Client, Stomp } from "@stomp/stompjs";
import MultiGameView from "./components/MultiGameView.jsx";
import WaitingRoom from "./components/WaitingRoom.jsx";

function App() {
  const [game, setGame] = useState(null);
  const [statusMessage, setStatusMessage] = useState("대기중");
  const [difficulty, setDifficulty] = useState(4);
  const [selectedCell, setSelectedCell] = useState(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [isNoteMode, setIsNoteMode] = useState(false);

  const [user, setUser] = useState(null);
  const [viewMode, setViewMode] = useState("menu"); // "menu", "game", "record", "auth", "lobby", "waiting"
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const [isLoginView, setIsLoginView] = useState(true);
  const [token, setToken] = useState(
    localStorage.getItem("accessToken") || null,
  );
  const [savedGameInfo, setSavedGameInfo] = useState(null);
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const API_BASE_URL = process.env.REACT_APP_API_URL;

  const [userStats, setUserStats] = useState({ records: [], summary: null });
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  const timerRef = useRef(null);

  const [stompClient, setStompClient] = useState(null);

  const stompClientRef = useRef(null);

  const [roomInfo, setRoomInfo] = useState(null); // { roomCode, gameId, isHost }

  const [chatMessages, setChatMessages] = useState([]); // [{sender, content}]

  const [rooms, setRooms] = useState([]); // 🎯 방 목록 저장용

  const leaveRoom = useCallback(() => {
    // 1. 소켓 연결 해제 (무전기 끄기)
    if (stompClientRef.current) {
      stompClientRef.current.deactivate();
      stompClientRef.current = null;
    }

    // 2. 방 정보 초기화 및 채팅 내역 삭제
    setRoomInfo(null);
    setChatMessages([]);

    // 3. 메인 메뉴로 이동
    setViewMode("menu");

    console.log("🏃 방에서 나갔습니다.");
  }, []);

  // 🎯 방 목록 가져오기 함수 (onShowRoomList에 연결될 놈)
  const fetchRoomList = async () => {
    try {
      setStatusMessage("방 목록 로딩 중...");
      const res = await api.get("/rooms/list"); // 백엔드 @GetMapping("/list") 호출
      setRooms(res.data); // 서버에서 받은 List<Map> 저장
      setViewMode("lobby"); // 🎯 화면을 '로비(RoomList)'로 전환
      setStatusMessage("방 목록 로드 완료");
    } catch (error) {
      console.error("방 목록 로드 실패:", error);
      alert("방 목록을 불러오지 못했습니다.");
      setStatusMessage("로딩 실패");
    }
  };

  const connectMultiplayer = useCallback(
    (gameId) => {
      if (!gameId) return;

      // 🎯 1. [중복 방지] 이미 연결된 소켓이 '진짜로' 살아있다면 새로 연결 안 함
      if (stompClientRef.current?.connected) {
        console.log("✅ 이미 연결된 소켓이 유효합니다.");
        return;
      }

      // 🎯 2. [클린업] 기존 객체가 있다면 확실히 끄고 시작
      if (stompClientRef.current) {
        try {
          stompClientRef.current.disconnect();
        } catch (e) {}
      }

      // 🎯 SockJS와 StompJS 호환성을 위해 Stomp.over(socket) 방식 사용
      const socket = new SockJS(`${API_BASE_URL}/ws-stomp?gameId=${gameId}`);
      const client = Stomp.over(socket);

      // 로그 너무 많으면 주석 처리해
      // client.debug = (str) => console.log("🚀 STOMP:", str);

      client.connect(
        {},
        () => {
          console.log("✅ 멀티플레이 연결 성공 (ID: " + gameId + ")");
          // 🎯 3. [핵심] 연결 성공 직후에만 Ref에 저장 (이게 Guest 연결 유지의 핵심)
          stompClientRef.current = client;

          // 1. 게임판 데이터 구독 (숫자 입력 등)
          client.subscribe(`/topic/game/${gameId}`, (msg) => {
            const data = JSON.parse(msg.body);
            console.log("📢 게임 데이터 수신:", data);

            // 🎯 서버 응답에 따라 보드판 전체 교체
            setGame((prev) => ({
              ...prev,
              board: data.board.map((r) => r.map((c) => c.v)),
              notes: data.board.map((r) => r.map((c) => Array.from(c.m || []))),
              status: data.status,
              life: data.life || 3,
            }));
            if (data.elapsedTime !== undefined) setSeconds(data.elapsedTime);

            // 🎯 만약 상태가 'PLAYING'으로 오면 대기실에서 게임판으로 화면 전환!
            if (data.status === "PLAYING") setViewMode("game");
          });

          // 2. 채팅 구독
          client.subscribe(`/topic/game/${gameId}/chat`, (msg) => {
            const chat = JSON.parse(msg.body);
            console.log("💬 채팅 도착:", chat);

            // 🎯 [핵심] 함수형 업데이트를 써야 최신 배열에 정확히 추가됨!
            setChatMessages((prevMessages) => {
              // 중복 메시지 방지 (동일 ID나 내용 체크 로직 넣으면 더 좋음)
              return [...prevMessages, chat];
            });
          });

          // 3. 설정(난이도) 변경 구독
          client.subscribe(`/topic/game/${gameId}/settings`, (msg) => {
            const settings = JSON.parse(msg.body);
            setRoomInfo((prev) => ({
              ...prev,
              difficulty: settings.difficulty,
            }));
          });

          // 4. 에러 구독 (추가해두면 좋음)
          client.subscribe(`/topic/game/${gameId}/errors`, (msg) => {
            alert("❌ 에러: " + JSON.parse(msg.body).message);
          });
        },
        (error) => {
          console.error("❌ STOMP 연결 에러:", error);
        },
      );

      stompClientRef.current = client;
    },
    [API_BASE_URL],
  );

  const handleCreateMultiRoom = async (selectedDifficulty) => {
    try {
      // 🎯 1. 서버에 방 생성 요청 (응답이 올 때까지 기다림)
      const res = await api.post(
        `/rooms/create?difficulty=${selectedDifficulty}`,
      );

      // 🎯 2. 응답 데이터에서 정확한 gameId 추출
      const { roomCode, gameId } = res.data;
      console.log("✅ 방 생성 완료! gameId:", gameId);

      // 🎯 3. 상태 업데이트 (화면 전환 준비)
      setRoomInfo({
        roomCode,
        gameId,
        isHost: true,
        difficulty: selectedDifficulty,
      });
      setViewMode("waiting");

      // 🎯 4. [핵심] 추출한 gameId를 "직접" 넘겨서 소켓 연결
      // (상태값인 gameId는 비동기라 아직 null일 수 있으니 res.data에서 꺼낸 걸 바로 씀)
      const client = connectMultiplayer(gameId);
      setStompClient(client);
    } catch (error) {
      console.error("방 생성 에러:", error);
      alert("방 생성 실패: " + error.message);
    }
  };

  const handleJoinByCode = async (code) => {
    if (!code || code.length < 6) return alert("올바른 코드를 입력하세요.");

    try {
      // 🎯 1. 서버에 코드 확인 요청
      const res = await api.get(`/rooms/join/${code.toUpperCase()}`);
      const { gameId, difficulty } = res.data;

      // 🎯 2. 방 정보 세팅 (참가자니까 isHost: false)
      setRoomInfo({
        roomCode: code.toUpperCase(),
        gameId,
        isHost: false,
        difficulty,
      });
      setViewMode("waiting");

      // 🎯 3. 무전기 채널 맞추기 (소켓 연결)
      const client = connectMultiplayer(gameId); // 기존 함수 재사용
      setStompClient(client);

      // (선택) 채팅방에 "XX님이 입장했습니다" 알림 쏘는 로직 추가 가능
    } catch (error) {
      alert("방을 찾을 수 없거나 이미 가득 찼습니다.");
    }
  };

  // 🎯 채팅 전송 함수
  const sendChat = (content) => {
    if (!stompClientRef.current?.connected) {
      console.warn("⚠️ 채팅 연결 안 됨");
      return;
    }

    stompClientRef.current.publish({
      destination: `/multi/game/${roomInfo.gameId}/chat`,
      body: JSON.stringify({
        sender: token ? "나" : "익명",
        content: content,
      }),
    });
  };

  // 🎯 난이도 변경 함수
  const updateDifficulty = (newDiff) => {
    // 1. 방장이 아니면 리턴
    if (!roomInfo?.isHost) return;

    // 2. 소켓 연결 확인 (NPE 방어)
    if (!stompClientRef.current || !stompClientRef.current.connected) {
      console.warn("⚠️ 소켓이 아직 연결되지 않았습니다.");
      return;
    }

    // 3. 데이터 전송 (StompJS v7이면 publish, 구버전이면 send)
    const client = stompClientRef.current;
    const destination = `/multi/game/${roomInfo.gameId}/settings`;

    client.publish({
      destination: destination,
      body: JSON.stringify({
        difficulty: newDiff,
        roomCode: roomInfo.roomCode, // 🎯 서버가 Redis를 고칠 때 쓸 열쇠(Key) 전달!
      }),
    });

    console.log("📤 난이도 변경 송신:", newDiff);
  };

  // 🎯 [발행] 숫자 입력 시 서버로 던지는 전용 함수
  const sendMove = useCallback(
    (client, gameId, row, col, value) => {
      if (!client || !client.connected) {
        console.warn("⚠️ 소켓이 연결되지 않았습니다.");
        return;
      }

      client.publish({
        destination: `/multi/game/${gameId}/place`, // 👈 백엔드 @MessageMapping 주소
        body: JSON.stringify({
          row,
          col,
          value,
          elapsedTime: seconds, // 👈 현재 타이머 시간도 같이 보냄
        }),
      });
    },
    [seconds],
  ); // seconds가 바뀔 때마다 갱신

  // multiplayer 게임 시작 함수 (방장이 시작 버튼 누르면 호출)
  const startMultiGame = useCallback(() => {
    // 1. 방장이 아니거나 소켓 연결이 없으면 중단
    if (!roomInfo?.isHost || !stompClientRef.current?.connected) {
      alert("방장만 게임을 시작할 수 있거나, 연결이 불안정합니다.");
      return;
    }

    console.log("🚀 멀티플레이 게임 시작 신호 발송!");

    // 2. 서버의 @MessageMapping("/game/{gameId}/start") 주소로 신호 쏨
    stompClientRef.current.publish({
      destination: `/multi/game/${roomInfo.gameId}/start`,
      body: JSON.stringify({
        difficulty: roomInfo.difficulty,
        roomCode: roomInfo.roomCode,
      }),
    });
  }, [roomInfo, stompClientRef]);

  // 🎯 시간 포맷 함수
  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // 🎯 기록실 통계 로드 (원본 로직 + api.js 적용)
  const fetchUserStats = async (passedToken) => {
    const activeToken = passedToken || token;
    if (!activeToken) return;
    setIsStatsLoading(true);
    try {
      const res = await api.get("/api/records/all");
      setUserStats(res.data);
    } catch (e) {
      console.error("통계 로드 실패:", e);
    } finally {
      setIsStatsLoading(false);
    }
  };

  // 🎯 로그인/회원가입 (원본 로직 + api.js 적용)
  const onLoginSubmit = async (isLoginView, email, password, nickname) => {
    const endpoint = isLoginView ? "/api/auth/sign-in" : "/api/auth/signup";
    try {
      const res = await api.post(
        endpoint,
        isLoginView ? { email, password } : { email, password, nickname },
      );
      if (isLoginView) {
        const { accessToken, refreshToken } = res.data;
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        onLoginSuccess(accessToken);
        alert("로그인 성공! 🎉");
      } else {
        alert("회원가입 완료! 로그인을 진행해주세요.");
        setIsLoginView(true);
      }
    } catch (err) {
      const errorMsg = err.response?.data || "정보를 확인해주세요.";
      alert(`실패: ${errorMsg}`);
    }
  };

  const onLoginSuccess = async (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser({ token: newToken });
    setViewMode("menu");
  };
  // 🎯 게임 시작 (fetch -> api.post 교체, 네 원본 로직 100%)
  const startGame = async () => {
    setStatusMessage("게임 생성 중...");
    const savedId = localStorage.getItem("sudoku_game_id");
    const validId = savedId && savedId !== "undefined" ? savedId : "";

    try {
      // 🎯 이제 여기서 401 나면 api.js가 알아서 reissue 해옴
      const res = await api.post(
        validId ? `/games/start/${validId}` : `/games/start`,
        { difficulty },
      );
      const data = res.data;

      localStorage.setItem("sudoku_game_id", data.gameId);

      const serverBoard = data.board;
      const newBoard = serverBoard.map((r) => r.map((c) => c.v));
      const newNotes = serverBoard.map((r) =>
        r.map((c) => Array.from(c.m || [])),
      );

      setSeconds(0);
      setGame({
        ...data,
        id: data.gameId,
        board: newBoard,
        notes: newNotes,
        life: data.life ?? 3,
        difficulty,
      });
      setViewMode("game");
      setStatusMessage(data.status);
    } catch (error) {
      setStatusMessage("에러: " + error.message);
    }
  };

  // 🎯 이어하기 (네 원본 로직 100% 복구 - 이게 빠져서 안 눌린 거다!)
  const continueGame = async () => {
    const savedId = localStorage.getItem("sudoku_game_id");
    const currentToken = localStorage.getItem("accessToken");
    if (!currentToken && !savedId) {
      setStatusMessage("진행 중인 게임 정보를 찾을 수 없습니다.");
      return;
    }
    setStatusMessage("이전 게임 불러오는 중...");

    try {
      // 🎯 토큰 있으면 /games, 없으면 /games/uuid 호출
      const res = await api.get(currentToken ? `/games` : `/games/${savedId}`);
      const data = res.data;

      const serverBoard = data.board;
      const newBoard = serverBoard.map((row) => row.map((cell) => cell.v));
      const newNotes = serverBoard.map((row) =>
        row.map((cell) => Array.from(cell.m || [])),
      );

      setGame({
        ...data,
        id: data.gameId || data.id,
        board: newBoard,
        notes: newNotes,
        life: data.life || 3,
        difficulty: data.difficulty,
      });

      if (data.elapsedTime || data.accumulatedSeconds) {
        setSeconds(data.elapsedTime || data.accumulatedSeconds);
      }

      setSelectedCell({ row: 0, col: 0 });
      setViewMode("game");
      setIsNoteMode(false);
      setStatusMessage("게임을 이어서 시작합니다.");
      setHasSavedGame(true);
    } catch (error) {
      setStatusMessage("불러오기 실패: " + error.message);
      setHasSavedGame(false);
    }
  };

  // 🎯 이어하기 데이터 체크 (메뉴 화면용)
  const checkRecentGame = useCallback(async (passedToken) => {
    const activeToken = passedToken || localStorage.getItem("accessToken");
    const savedId = localStorage.getItem("sudoku_game_id");
    if (!activeToken && !savedId) {
      setHasSavedGame(false);
      return;
    }
    try {
      const res = await api.get(activeToken ? `/games` : `/games/${savedId}`);
      const data = res.data;
      setHasSavedGame(true);
      setSavedGameInfo({
        difficulty: data.difficulty,
        life: data.life,
        elapsedTime: data.accumulatedSeconds || data.elapsedTime || 0,
      });
    } catch (error) {
      setHasSavedGame(false);
      setSavedGameInfo(null);
    }
  }, []);
  // 🎯 숫자 입력 ( api.js 적용)
  const placeNumber = useCallback(
    async (row, col, value) => {
      if (!game || isPlacing) return;

      // 🎯 1. [낙관적 업데이트] 이건 싱글/멀티 공통! 일단 화면부터 바꿈
      setGame((prev) => {
        const newBoard = [...prev.board];
        newBoard[row] = [...newBoard[row]];
        newBoard[row][col] = value;
        return { ...prev, board: newBoard };
      });

      // 🔥 [멀티플레이 전용 분기] gameId가 multi: 로 시작하면 소켓으로 던짐
      if (
        game.gameId?.startsWith("multi:") &&
        stompClientRef.current?.connected
      ) {
        stompClientRef.current.publish({
          destination: `/multi/game/${game.gameId}/place`,
          body: JSON.stringify({ row, col, value, elapsedTime: seconds }),
        });
        return; // 👈 API 호출 안 하고 리턴!
      }

      setIsPlacing(true);
      setStatusMessage("숫자 입력 중...");

      try {
        // 🎯 이제 여기서 401 나면 api.js가 알아서 reissue 해옴
        const res = await api.post(`/games/${game.gameId}/place`, {
          row,
          col,
          value,
          elapsedTime: seconds,
        });
        const data = res.data;

        const serverBoard = data.board;
        setGame((prev) => ({
          ...prev,
          board: serverBoard.map((r) => r.map((c) => c.v)),
          notes: serverBoard.map((r) => r.map((c) => Array.from(c.m || []))),
          status: data.status,
          life: data.life,
        }));
        setStatusMessage(`${data.status} (life: ${data.life})`);
      } catch (error) {
        setStatusMessage("에러: " + error.message);
      } finally {
        setIsPlacing(false);
      }
    },
    [game, seconds, isPlacing, stompClient, sendMove],
  );

  // 🎯 메모 토글 (원본 100% + api.js 적용)
  const toggleNote = useCallback(
    async (row, col, value) => {
      if (!game || value === 0) return;
      try {
        const res = await api.post(`/games/${game.gameId}/memo`, {
          row,
          col,
          value,
        });
        const data = res.data;
        const serverBoard = data.board;
        setGame((prev) => ({
          ...prev,
          board: serverBoard.map((r) => r.map((c) => c.v)),
          notes: serverBoard.map((r) => r.map((c) => Array.from(c.m || []))),
        }));
      } catch (error) {
        console.error("메모 저장 실패:", error);
      }
    },
    [game],
  );

  // 🎯 저장 및 종료 (원본 100% + api.js 적용)
  const saveAndExit = async () => {
    if (!game) return;
    const currentToken = localStorage.getItem("accessToken");
    const savedId = localStorage.getItem("sudoku_game_id");
    try {
      const res = await api.post(
        currentToken ? `/games/save` : `/games/${savedId}/save`,
        {
          elapsedTime: seconds,
        },
      );
      const data = res.data;
      setSavedGameInfo({
        difficulty: data.difficulty,
        life: data.life,
        elapsedTime: data.elapsedTime || data.accumulatedSeconds,
      });
      setHasSavedGame(true);
      setGame(null);
      setViewMode("menu");
    } catch (error) {
      console.error("저장 실패:", error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    setUser(null);
    setHasSavedGame(false);
    setSavedGameInfo(null);
    setViewMode("menu");
    setStatusMessage("로그아웃 되었습니다.");
  };

  // --- Effects ---
  useEffect(() => {
    const savedId = localStorage.getItem("sudoku_game_id");
    const currentToken = localStorage.getItem("accessToken");
    if (!game && viewMode === "menu" && (currentToken || savedId)) {
      checkRecentGame(currentToken);
    }
  }, [viewMode, game === null, token, checkRecentGame]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!e || !e.key || viewMode === "auth" || viewMode === "pause") return;
      const moveKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
      if (moveKeys.includes(e.key)) {
        e.preventDefault();
        setSelectedCell((prev) => {
          if (!prev) return { row: 0, col: 0 };
          let { row, col } = prev;
          if (e.key === "ArrowUp") row = Math.max(0, row - 1);
          if (e.key === "ArrowDown") row = Math.min(8, row + 1);
          if (e.key === "ArrowLeft") col = Math.max(0, col - 1);
          if (e.key === "ArrowRight") col = Math.min(8, col + 1);
          return { row, col };
        });
        return;
      }
      if (e.key.toLowerCase() === "n") {
        setIsNoteMode((prev) => !prev);
        return;
      }
      if (!selectedCell || isPlacing || !game) return;
      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 1 && num <= 9) {
        isNoteMode
          ? toggleNote(selectedCell.row, selectedCell.col, num)
          : placeNumber(selectedCell.row, selectedCell.col, num);
      } else if (["0", "Backspace", "Delete"].includes(e.key)) {
        placeNumber(selectedCell.row, selectedCell.col, 0);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedCell,
    isPlacing,
    game,
    isNoteMode,
    viewMode,
    toggleNote,
    placeNumber,
  ]);

  // 2. 타이머 로직 수정
  useEffect(() => {
    // 🎯 상태가 PLAYING이고 게임 화면일 때만 타이머 가동
    if (game?.status === "PLAYING" && viewMode === "game") {
      // 이미 타이머가 돌고 있으면 중복 생성 방지
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setSeconds((prev) => prev + 1);
        }, 1000);
      }
    } else {
      // 🎯 게임 중이 아니면 즉시 정지 및 초기화
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    // 컴포넌트 언마운트 시 클린업
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [game?.status, viewMode]); // 👈 status가 바뀌어도 내부 if문에서 걸러짐

  useEffect(() => {
    // roomInfo가 생기면 자동으로 소켓을 연결함
    if (roomInfo?.gameId) {
      console.log("📡 [Effect] 소켓 연결 시도:", roomInfo.gameId);
      connectMultiplayer(roomInfo.gameId);
    }

    // 🎯 [클린업] 방을 나가거나 컴포넌트가 죽을 때 소켓을 확실히 끔
    return () => {
      if (stompClientRef.current) {
        console.log("🧹 소켓 연결 종료");
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
    };
  }, [roomInfo?.gameId]); // 👈 gameId가 바뀔 때만 실행되므로 중복 실행 방지됨

  const testSocket = () => {
    const currentGameId = "multi:2cfdb7b2-99d8-4934-bc5c-9f4df06ce113";
    const currentRoomCode = "D1E92F";

    // 🎯 주소 뒤에 ?gameId=...&roomCode=... 를 반드시 붙여야 500 에러 안 남!
    const socket = new SockJS(
      `${API_BASE_URL}/ws-stomp?gameId=${currentGameId}&roomCode=${currentRoomCode}`,
    );
    const client = Stomp.over(socket);

    client.connect(
      {},
      (frame) => {
        console.log("✅ 드디어 연결 성공!:", frame);

        // 🎯 [구독] 이 방의 실시간 소식을 듣겠다!
        client.subscribe(`/topic/game/${currentGameId}`, (msg) => {
          console.log("📢 [실시간 데이터 도착]:", JSON.parse(msg.body));
        });

        // 🎯 [테스트 발행] 2초 뒤에 서버로 숫자 하나 쏴보기
        setTimeout(() => {
          console.log("🚀 서버로 숫자 쏘는 중...");
          client.send(
            `/multi/game/${currentGameId}/place`,
            {},
            JSON.stringify({ row: 0, col: 0, value: 7, elapsedTime: 100 }),
          );
        }, 2000);
      },
      (error) => {
        console.error("❌ STOMP 연결 에러:", error);
      },
    );
  };

  console.log("🕵️ WaitingRoom 타입 체크:", typeof WaitingRoom);

  // --- Render ---
  return (
    <div
      style={{
        padding: "20px",
        position: "relative",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      {/* 1. 상단 공통 헤더 */}
      <Header
        token={token}
        onLoginClick={() => setViewMode("SIGNIN")}
        onLogout={handleLogout}
        onShowRecords={() => {
          setIsRecordOpen(true);
          fetchUserStats();
        }}
      />

      {/* 2. 통계 팝업 */}
      {isRecordOpen && (
        <RecordOverlay
          records={userStats.records}
          summary={userStats.summary}
          token={token}
          onClose={() => setIsRecordOpen(false)}
          formatTime={formatTime}
        />
      )}

      {/* 🎯 3. 메인 콘텐츠 영역 (ViewMode 분기) */}
      <main style={{ marginTop: "20px" }}>
        {/* (1) 초기 메인 메뉴 */}
        {viewMode === "menu" && (
          <MainMenu
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            onStart={startGame}
            onContinue={continueGame}
            hasSavedGame={hasSavedGame}
            token={token}
            savedGameInfo={savedGameInfo}
            formatTime={formatTime}
            onCreateMultiRoom={handleCreateMultiRoom}
            onShowRoomList={fetchRoomList}
            onJoinByCode={handleJoinByCode}
          />
        )}

        {/* (2) 멀티플레이 방 목록 (Lobby) */}
        {viewMode === "lobby" && (
          <RoomList
            rooms={rooms}
            onJoin={handleJoinByCode}
            onBack={() => setViewMode("menu")}
          />
        )}

        {/* (3) 멀티플레이 대기실 (Waiting Room) */}
        {viewMode === "waiting" && roomInfo && (
          <WaitingRoom
            roomInfo={roomInfo}
            chatMessages={chatMessages}
            onSendMessage={sendChat}
            onUpdateDifficulty={updateDifficulty}
            onCancel={leaveRoom} // 방 나갈 때 소켓 해제 및 메뉴 이동 로직 필요
            onStartGame={startMultiGame} // 방장이 게임 시작 버튼 누르면 호출되는 함수
            isHost={roomInfo.isHost}
          />
        )}

        {/* (4) 실제 게임 플레이 (싱글/멀티 공용) */}
        {(viewMode === "game" || viewMode === "pause") && game && (
          <>
            <GameInfo
              game={game}
              formatTime={formatTime}
              seconds={seconds}
              isNoteMode={isNoteMode}
              onToggleNote={() => setIsNoteMode(!isNoteMode)}
              onPause={() => setViewMode("pause")}
            />
            <div
              style={{
                position: "relative",
                display: "inline-block",
                marginTop: "20px",
              }}
            >
              <SudokuBoard
                board={game.board}
                notes={game.notes}
                selectedCell={selectedCell}
                onSelectCell={setSelectedCell}
              />
              <GameOverlay
                game={game}
                viewMode={viewMode}
                setViewMode={setViewMode}
                setGame={setGame}
                setSeconds={setSeconds}
                saveAndExit={saveAndExit}
                formatTime={formatTime}
                seconds={seconds}
                startGame={startGame}
                togglePause={() =>
                  setViewMode((v) => (v === "pause" ? "game" : "pause"))
                }
              />
            </div>
            <NumberPad
              viewMode={viewMode}
              isNoteMode={isNoteMode}
              onInput={isNoteMode ? toggleNote : placeNumber}
              onErase={() => placeNumber(selectedCell.row, selectedCell.col, 0)}
              selectedCell={selectedCell}
              isPlacing={isPlacing}
            />
          </>
        )}
      </main>

      {/* 4. 인증 모달 (항상 최상단) */}
      <AuthModal
        show={viewMode === "SIGNIN"}
        isLoginView={isLoginView}
        setIsLoginView={setIsLoginView}
        game={game}
        setViewMode={setViewMode}
        onLoginSubmit={onLoginSubmit}
      />
    </div>
  );
}
export default App;
