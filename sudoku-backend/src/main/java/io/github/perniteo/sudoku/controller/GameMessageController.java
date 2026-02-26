package io.github.perniteo.sudoku.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import io.github.perniteo.common.exception.BaseException;
import io.github.perniteo.sudoku.controller.dto.ChatRequest;
import io.github.perniteo.sudoku.controller.dto.GameStartResponse;
import io.github.perniteo.sudoku.controller.dto.PlaceRequest;
import io.github.perniteo.sudoku.controller.dto.PlaceResponse;
import io.github.perniteo.sudoku.domain.SudokuGame;
import io.github.perniteo.sudoku.service.RoomService;
import io.github.perniteo.sudoku.service.SudokuGameService;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class GameMessageController {

  private final SudokuGameService gameService;
  private final SimpMessagingTemplate messagingTemplate;
  private final RoomService roomService;

  @MessageExceptionHandler(BaseException.class)
  public void handleBaseException(BaseException e, @DestinationVariable String gameId) {
    // 🎯 HTTP 상태 코드 숫자값(400, 404 등)과 메시지를 묶어서 전송
    Map<String, Object> errorData = new HashMap<>();
    errorData.put("status", e.getStatus().value());
    errorData.put("message", e.getMessage());

    // 🎯 해당 게임 방의 에러 채널로 Push
    messagingTemplate.convertAndSend("/topic/game/" + gameId + "/errors", errorData);
  }

  // [게임 조작] /multi/game/{gameId}/place
  @MessageMapping("/game/{gameId}/place")
  public void handleMultiPlace(@DestinationVariable String gameId, PlaceRequest request) {
    PlaceResponse response = gameService.placeNumber(
        gameId, request.getRow(), request.getCol(),
        request.getValue(), request.getElapsedTime()
    );
    // 해당 방을 구독 중인 모든 유저에게 결과 전송
    messagingTemplate.convertAndSend("/topic/game/" + gameId, response);
  }

  // [실시간 메모 공유] /multi/game/{gameId}/memo
  @MessageMapping("/game/{gameId}/memo")
  @SendTo("/topic/game/{gameId}/memo") // 🎯 메모 전용 채널로 분리해서 쏘는 게 성능상 이득!
  public Map<String, Object> handleMultiMemo(@DestinationVariable String gameId, Map<String, Object> memoData) {
    // 🎯 Redis 저장 로직 없이 바로 리턴 (배달만 함)
    // payload: { row: 0, col: 1, value: 5 }
    return memoData;
  }

  // [실시간 채팅] /multi/game/{gameId}/chat
  @MessageMapping("/game/{gameId}/chat")
  @SendTo("/topic/game/{gameId}/chat")    // 👈 서버가 구독자들에게 뿌려주는 주소
  public void handleChat(@DestinationVariable String gameId, ChatRequest chat) {
    // 채팅은 DB나 Redis에 저장할 필요가 없다면 바로 쏴줍니다 (Stateless)
    // 만약 저장하고 싶다면 ChatService를 여기서 호출하세요.
    messagingTemplate.convertAndSend("/topic/game/" + gameId + "/chat", chat);
  }

  @MessageMapping("/game/{gameId}/settings")
  @SendTo("/topic/game/{gameId}/settings")
  public Map<String, Object> handleSettings(
      @DestinationVariable String gameId,
      Map<String, Object> settings
  ) throws JsonProcessingException {

    // 🎯 1. 프론트에서 보낸 새 난이도 추출
    int newDifficulty = (int) settings.get("difficulty");
    String roomCode = (String) settings.get("roomCode"); // 프론트에서 같이 보내줘야 함

    // 🎯 2. Redis에 저장된 방 정보(JSON) 업데이트
    if (roomCode != null) {
      roomService.updateRoomDifficulty(roomCode, newDifficulty);
    }

    // 🎯 3. 방 안의 모든 사람에게 브로드캐스트 (실시간 UI 반영)
    return settings;
  }

  @MessageMapping("/game/{gameId}/start")
  @SendTo("/topic/game/{gameId}")
  public GameStartResponse handleStartGame(
      @DestinationVariable String gameId, Map<String, Object> payload)
      throws JsonProcessingException {
    System.out.println("🚨 [STOMP] 시작 요청 도착! gameId: " + gameId + ", payload: " + payload);
    int difficulty = (int) payload.get("difficulty");

    gameService.createMultiGame(gameId, difficulty);

    System.out.println("🎮 게임 시작! 보드판 생성 완료: " + gameId);// 🎯 3. 저장된 게임 데이터 로드
    SudokuGame game = gameService.getGame(gameId);

    //  기존 싱글플레이 응답(GameStartResponse)과 동일한 구조로 리턴
    // (gameId, boardSnapshots, status)
    System.out.println("🎮 [MULTI START] " + gameId + " | Difficulty: " + difficulty);

    return new GameStartResponse(
        gameId,
        game.getPuzzleBoard().getCellSnapshots(), // 👈 기존과 동일한 스냅샷 포맷
        game.getStatus().name()
    );
  }
}