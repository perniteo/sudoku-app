import React, {
  BrowserRouter,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import SudokuBoard from "./components/SudokuBoard.jsx";
import AuthModal from "./components/AuthModal.jsx";
import GameOverlay from "./components/GameOverlay.jsx";
import Header from "./components/Header.jsx";
import MainMenu from "./components/MainMenu.jsx";
import GameInfo from "./components/GameInfo.jsx";
import NumberPad from "./components/NumberPad.jsx";
import RecordOverlay from "./components/RecordOverlay.jsx";
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

  // 🎯 1. anonymousId를 먼저 선언 (상단)
  const [anonymousId] = useState(() => {
    const savedId = localStorage.getItem("sudoku_anon_id");
    if (savedId) return savedId;
    const newId = `anon:${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem("sudoku_anon_id", newId);
    return newId;
  });

  // 🎯 2. myId를 '계산된 값'으로 정의 (useMemo 추천)
  // user 객체가 null일 때를 대비해 ?. (Optional Chaining) 필수!
  const myId = useMemo(() => {
    if (token && user?.email) {
      return `user:${user.email}`;
    }
    return anonymousId;
  }, [token, user, anonymousId]);

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
    (gameId, roomCode) => {
      if (!gameId || !roomCode) return;

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
      const socket = new SockJS(
        `${API_BASE_URL}/ws-stomp?gameId=${gameId}&roomCode=${roomInfo?.roomCode || ""}`,
      );
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
            setGame((prev) => {
              // 🎯 [수정] 서버에서 온 메모 데이터 가공
              const serverNotes = data.notes
                ? data.notes.map((r) => r.map((c) => Array.from(c.m || [])))
                : null;

              return {
                ...prev,
                gameId: data.gameId || gameId,
                board: data.board,
                difficulty:
                  data.difficulty || roomInfo?.difficulty || prev?.difficulty,
                lastInteract: data.lastInteract,

                // 🔥 [핵심 방어] 서버 데이터(serverNotes)가 있으면 쓰고,
                // 없으면 내 기존 메모(prev?.notes)를 쓰되,
                // 둘 다 없으면 빈 배열(9x9)을 새로 만듭니다.
                notes:
                  serverNotes ||
                  prev?.notes ||
                  Array.from({ length: 9 }, () => Array(9).fill([])),

                status: data.status,
                life: data.life || 3,
              };
            });
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

          // 🎯 4. 실시간 메모(Notes) 구독 (휘발성 공유)
          client.subscribe(`/topic/game/${gameId}/memo`, (msg) => {
            const data = JSON.parse(msg.body);
            console.log("📝 메모 도착:", data);

            // 🎯 [핵심] Redis를 안 거치므로, 여기서 내 로컬 상태(setGame)를 직접 수정함
            setGame((prev) => {
              if (!prev || !prev.notes) return prev;

              const { row, col, value } = data;
              const newNotes = [...prev.notes];
              newNotes[row] = [...newNotes[row]]; // 깊은 복사

              // Set을 활용해 메모 토글 (이미 있으면 지우고, 없으면 추가)
              const currentSet = new Set(newNotes[row][col]);
              if (currentSet.has(value)) {
                currentSet.delete(value);
              } else {
                currentSet.add(value);
              }

              newNotes[row][col] = Array.from(currentSet);
              return { ...prev, notes: newNotes };
            });
          });

          // 5. 에러 구독 (추가해두면 좋음)
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
    [API_BASE_URL, roomInfo?.difficulty, roomInfo?.roomCode],
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
      // roomCode도 같이 넘겨서 서버가 Redis 고칠 때 쓸 열쇠(Key)로 활용하게 함
      const client = connectMultiplayer(gameId, roomCode);
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

      const roomCode = code.toUpperCase(); // 입력한 코드를 대문자로 변환해서 저장 (서버도 대문자로 처리한다고 가정)

      // 🎯 2. 방 정보 세팅 (참가자니까 isHost: false)
      setRoomInfo({
        roomCode: roomCode,
        gameId,
        isHost: false,
        difficulty,
      });
      setViewMode("waiting");

      // 🎯 3. 무전기 채널 맞추기 (소켓 연결)
      // roomCode도 같이 넘겨서 서버가 Redis 고칠 때 쓸 열쇠(Key)로 활용하게 함
      const client = connectMultiplayer(gameId, roomCode); // 기존 함수 재사용
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
    (row, col, value) => {
      // 🎯 [수정] stompClientRef.current를 직접 참조해서 유연하게 대응
      const client = stompClientRef.current;
      const gameId = roomInfo?.gameId; // 🎯 여기서 현재 방의 gameId를 가져옴

      if (!client || !client.connected || !gameId) {
        console.warn("⚠️ 소켓 연결 또는 gameId가 없습니다:", {
          connected: client?.connected,
          gameId,
        });
        return;
      }

      console.log(`🚀 [SEND] ${gameId} - [${row},${col}] = ${value}`);

      client.publish({
        destination: `/multi/game/${gameId}/place`,
        body: JSON.stringify({
          row,
          col,
          value,
          elapsedTime: seconds,
        }),
      });
    },
    [roomInfo?.gameId, seconds],
  ); // 🎯 roomInfo가 바뀔 때마다 함수 갱신

  // multiplayer 게임 시작 함수 (방장이 시작 버튼 누르면 호출)
  const startMultiGame = useCallback(() => {
    // 1. 방장이 아니거나 소켓 연결이 없으면 중단
    if (!roomInfo?.isHost || !stompClientRef.current?.connected) {
      alert("방장만 게임을 시작할 수 있거나, 연결이 불안정합니다.");
      return;
    }
    const gid = roomInfo?.gameId;
    if (!gid) return alert("게임 ID가 없습니다.");

    console.log("🚀 멀티플레이 게임 시작 신호 발송!");

    // 2. 서버의 @MessageMapping("/multi/game/{gameId}/start") 주소로 신호 쏨
    stompClientRef.current.publish({
      destination: `/multi/game/${roomInfo.gameId}/start`,
      body: JSON.stringify({
        difficulty: roomInfo.difficulty,
        roomCode: roomInfo.roomCode,
      }),
    });
  }, [roomInfo, stompClientRef]);

  const handleMultiInput = useCallback(
    (row, col, value) => {
      // 🎯 roomInfo나 game 객체에서 최신 gameId 추출
      const targetId = game?.gameId || roomInfo?.gameId;

      if (!targetId || !stompClientRef.current?.connected) {
        console.warn("⚠️ 멀티플레이 입력 불가: 소켓 연결 또는 ID 없음", {
          targetId,
        });
        return;
      }

      // 🎯 전송 (HTTP Post가 아니라 소켓 Publish!)
      stompClientRef.current.publish({
        destination: `/multi/game/${targetId}/place`,
        body: JSON.stringify({
          row,
          col,
          value,
          elapsedTime: seconds,
          userId: myId,
        }),
      });

      console.log(`📤 [MULTI SEND] ${targetId} -> [${row}, ${col}]: ${value}`);
    },
    [game?.gameId, roomInfo?.gameId, seconds, user?.email, token, anonymousId],
  );

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
      const newNotes = serverBoard.map((r) =>
        r.map((c) => Array.from(c.m || [])),
      );

      setSeconds(0);
      setGame({
        ...data,
        id: data.gameId,
        board: serverBoard,
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
      const newNotes = serverBoard.map((row) =>
        row.map((cell) => Array.from(cell.m || [])),
      );

      setGame({
        ...data,
        id: data.gameId || data.id,
        board: serverBoard,
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
      // 🎯 1. 기본 방어 로직 (좌표나 게임 객체 없으면 중단)
      if (!game || row === null || col === null) return;

      // 🔥 2. [핵심] 이미 숫자가 있는 칸은 "확정된 칸"으로 간주하고 클릭 무시
      // value가 0이 아닌 숫자가 이미 들어있다면 함수를 여기서 바로 끝냅니다.
      // 🎯 1. [해결] 객체인지 숫자인지 판별해서 실제 숫자 값(v)을 가져옴
      const cellData = game.board[row][col];
      const currentValue = typeof cellData === "object" ? cellData.v : cellData;

      // 🎯 2. [수정] 객체 자체를 0과 비교하지 말고, 추출한 숫자가 0인지 확인!
      if (currentValue !== 0) {
        console.warn("🚫 이미 숫자가 채워진 칸은 수정할 수 없습니다.");
        return;
      }

      // 🎯 [수정] 서버가 줄 수 있는 모든 ID 후보군을 다 뒤져서 하나라도 걸리게 함
      const currentId =
        game.gameId || game.id || game.game_id || roomInfo?.gameId;

      if (!currentId) {
        // 🚨 여기서 game 객체를 통째로 찍어서 '진짜 이름'이 뭔지 확인해봐!
        console.error("❌ ID 실종! 객체 구조 확인:", game);
        return;
      }

      // 🎯 2. [낙관적 업데이트] 화면 먼저 바꾸기 (사용자 경험)
      setGame((prev) => {
        const newBoard = [...prev.board];
        newBoard[row] = [...newBoard[row]];
        newBoard[row][col] = value;
        return { ...prev, board: newBoard };
      });

      // 🔥 3. [멀티플레이 분기]
      if (currentId.toString().startsWith("multi:")) {
        if (stompClientRef.current?.connected) {
          stompClientRef.current.publish({
            destination: `/multi/game/${currentId}/place`,
            body: JSON.stringify({
              row,
              col,
              value,
              elapsedTime: seconds,
              userId: token ? `user:${user.email}` : anonymousId,
            }),
          });
          return; // 👈 소켓은 여기서 끝!
        }
        console.warn("⚠️ 소켓 연결 끊김, 재연결 필요");
        return;
      }

      // 🎯 4. [싱글플레이 로직] 여기서부터는 비로그인/로그인 솔로 전용
      if (isPlacing) return; // 🎯 중복 클릭 방지는 여기서만!

      setIsPlacing(true);
      try {
        const res = await api.post(`/games/${currentId}/place`, {
          row,
          col,
          value,
          elapsedTime: seconds,
        });

        const data = res.data;
        if (data.elapsedTime !== undefined) setSeconds(data.elapsedTime); // 추가
        setGame((prev) => ({
          ...prev,
          board: data.board,
          notes: data.board.map((r) => r.map((c) => Array.from(c.m || []))),
          status: data.status,
          life: data.life,
        }));
      } catch (error) {
        console.error("💥 싱글플레이 요청 실패:", error);
        setStatusMessage("입력 실패: " + error.message);
      } finally {
        setIsPlacing(false);
      }
    },
    // 🎯 의존성 배열 최적화: 필요한 최소 값만 감시
    [game, seconds, isPlacing, roomInfo, token, user?.email, anonymousId],
  );

  // 🎯 메모 토글 (원본 100% + api.js 적용)
  const toggleNote = useCallback(
    async (row, col, value) => {
      if (!game || value === 0) return;
      const currentId = game.gameId || game.id || roomInfo?.gameId;
      try {
        // 🔥 멀티플레이면 소켓 발사
        if (
          currentId?.startsWith("multi:") &&
          stompClientRef.current?.connected
        ) {
          stompClientRef.current.publish({
            destination: `/multi/game/${currentId}/memo`,
            body: JSON.stringify({ row, col, value }),
          });
          return; // 🎯 여기서 종료!
        }
        const res = await api.post(`/games/${game.gameId}/memo`, {
          row,
          col,
          value,
        });
        const data = res.data;
        const serverBoard = data.board;
        setGame((prev) => ({
          ...prev,
          board: serverBoard,
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
      connectMultiplayer(roomInfo.gameId, roomInfo.roomCode);
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
                myId={myId} // 👈 이거 필수!
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
              onInput={(r, c, v) => {
                // 🎯 멀티플레이 판별
                if (game?.gameId?.startsWith("multi:")) {
                  if (isNoteMode) {
                    // 메모 기능도 소켓으로 쏘고 싶다면 별도 함수 필요, 일단 일반 입력만!
                    handleMultiInput(r, c, v);
                  } else {
                    handleMultiInput(r, c, v);
                  }
                } else {
                  // 기존 싱글플레이 로직
                  isNoteMode ? toggleNote(r, c, v) : placeNumber(r, c, v);
                }
              }}
              onErase={() => {
                if (game?.gameId?.startsWith("multi:")) {
                  handleMultiInput(selectedCell.row, selectedCell.col, 0);
                } else {
                  placeNumber(selectedCell.row, selectedCell.col, 0);
                }
              }}
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
