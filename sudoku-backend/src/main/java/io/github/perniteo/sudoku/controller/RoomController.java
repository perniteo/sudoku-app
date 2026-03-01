package io.github.perniteo.sudoku.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import io.github.perniteo.sudoku.service.RoomService;
import io.github.perniteo.sudoku.service.SudokuGameService;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/rooms")
public class RoomController {
  private final SudokuGameService gameService;
  private final RoomService roomService;

  // 🎯 1. 멀티플레이 방 생성 (Host)
  @PostMapping("/create")
  public ResponseEntity<?> createRoom(@RequestParam int difficulty) throws JsonProcessingException {
    // 기존 서비스로 Stateless 게임 생성 (임시 ID 부여)
    String tempId = "multi:" + java.util.UUID.randomUUID();

    // 방 생성시 createGame(게임 시작 해버리는 문제 해결)
    // gameService.createGame(tempId, difficulty);

    // Redis에 6자리 참여 코드와 매핑 저장
    String roomCode = roomService.generateRoomCode(tempId, difficulty);

    return ResponseEntity.ok(Map.of(
        "roomCode", roomCode,
        "gameId", tempId
    ));
  }

  // 🎯 2. 참여 코드로 방 정보 조회 (Guest)
  @GetMapping("/join/{code}")
  public ResponseEntity<Map<String, Object>> joinRoom(@PathVariable String code) {
    try {
      Map<String, Object> data = roomService.joinRoomByCode(code);
      return ResponseEntity.ok(data);
    } catch (IllegalArgumentException e) {
      return ResponseEntity.notFound().build();
    }
  }

  @GetMapping("/list")
  public ResponseEntity<List<Map<String, Object>>> getRoomList(
      @RequestParam(required = false) Integer difficulty // 🎯 필터 선택 사항
  ) throws JsonProcessingException {
    List<Map<String, Object>> rooms = roomService.getFilteredRooms(difficulty);
    return ResponseEntity.ok(rooms);
  }


}
