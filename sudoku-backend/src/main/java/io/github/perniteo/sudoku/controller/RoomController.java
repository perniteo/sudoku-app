package io.github.perniteo.sudoku.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import io.github.perniteo.sudoku.service.RoomService;
import io.github.perniteo.sudoku.service.SudokuGameService;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

  @PostMapping("/create")
  public ResponseEntity<?> createRoom(
      @RequestParam int difficulty,
      @RequestParam String userId // 🎯 프론트의 myId (anon:xxx 혹은 user:xxx)
  ) throws JsonProcessingException {
    String tempId = "multi:" + java.util.UUID.randomUUID();

    // 🎯 방 생성 시 유저 ID를 같이 넘김
    String roomCode = roomService.generateRoomCode(tempId, difficulty, userId);

    return ResponseEntity.ok(Map.of(
        "roomCode", roomCode,
        "gameId", tempId,
        "isHost", true
    ));
  }

  // 🎯 2. 참여 코드로 방 정보 조회 (Guest)
  @GetMapping("/join/{code}")
  public ResponseEntity<Map<String, Object>> joinRoom(@PathVariable String code, @RequestParam String userId) {
    try {
      Map<String, Object> data = roomService.joinRoomByCode(code, userId);
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

  @GetMapping("/waiting/{code}") // 🎯 대기실 전용 조회 API 추가
  public ResponseEntity<Map<String, Object>> getWaitingRoomInfo(
      @PathVariable String code,
      @AuthenticationPrincipal String email // 현재 요청자가 누군지 확인
  ) {
    // 1. Redis에서 방 코드로 방 정보 조회
    Map<String, Object> roomData = roomService.getRoomInfoOnly(code.toUpperCase());

    if (roomData == null) {
      return ResponseEntity.notFound().build();
    }

    // 2. 🎯 [핵심] 현재 요청자가 이 방의 방장(Host)인지 판별해서 추가
    // (Redis에 저장된 호스트 ID와 현재 유저 ID/익명ID 비교)
    boolean isHost = roomService.isHost(code, email);
    roomData.put("isHost", isHost);

    return ResponseEntity.ok(roomData);
  }

  // 🎯 대기실 정보 단순 조회 (인원수 유지, 새로고침용)
  @GetMapping("/info/{code}")
  public ResponseEntity<?> getRoomInfo(@PathVariable String code) {
    return ResponseEntity.ok(roomService.getRoomInfoOnly(code));
  }


}
