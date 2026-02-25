package io.github.perniteo.sudoku.controller;

import io.github.perniteo.common.exception.BaseException;
import io.github.perniteo.sudoku.controller.dto.ChatRequest;
import io.github.perniteo.sudoku.controller.dto.PlaceRequest;
import io.github.perniteo.sudoku.controller.dto.PlaceResponse;
import io.github.perniteo.sudoku.service.SudokuGameService;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class GameMessageController {

  private final SudokuGameService gameService;
  private final SimpMessagingTemplate messagingTemplate;

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

  // [실시간 채팅] /multi/game/{gameId}/chat
  @MessageMapping("/game/{gameId}/chat")
  public void handleChat(@DestinationVariable String gameId, ChatRequest chat) {
    // 채팅은 DB나 Redis에 저장할 필요가 없다면 바로 쏴줍니다 (Stateless)
    // 만약 저장하고 싶다면 ChatService를 여기서 호출하세요.
    messagingTemplate.convertAndSend("/topic/game/" + gameId + "/chat", chat);
  }
}