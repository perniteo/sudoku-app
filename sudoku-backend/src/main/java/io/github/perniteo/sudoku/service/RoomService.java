package io.github.perniteo.sudoku.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RoomService {
  private final StringRedisTemplate redisTemplate;
  private static final String ROOM_CODE_PREFIX = "room:code:"; // 코드 -> gameId
  private static final String ROOM_USER_COUNT = "room:count:"; // gameId -> 현재 인원수

  private final ObjectMapper objectMapper; // JSON 변환용 Jackson

  public String generateRoomCode(String gameId, int difficulty) throws JsonProcessingException {
    String code = createRandomCode();

    // 방 정보 객체 생성 (난이도 포함)
    Map<String, Object> roomData = new HashMap<>();
    roomData.put("gameId", gameId);
    roomData.put("difficulty", difficulty);
    roomData.put("createdAt", System.currentTimeMillis());

    String json = objectMapper.writeValueAsString(roomData);

    // Redis 저장 (코드 -> 상세 정보 JSON)
    redisTemplate.opsForValue().set(ROOM_CODE_PREFIX + code, json, 24, TimeUnit.HOURS);
    redisTemplate.opsForValue().set(ROOM_USER_COUNT + gameId, "1", 24, TimeUnit.HOURS);

    return code;
  }

  public List<Map<String, Object>> getFilteredRooms(Integer difficulty) throws JsonProcessingException {
    List<Map<String, Object>> rooms = new ArrayList<>();
    Set<String> keys = redisTemplate.keys(ROOM_CODE_PREFIX + "*");

    if (keys != null) {
      for (String key : keys) {
        String json = redisTemplate.opsForValue().get(key);
        Map<String, Object> data = objectMapper.readValue(json, Map.class);

        int roomDiff = (int) data.get("difficulty");

        // 🎯 필터 조건 체크: 난이도가 null이거나 일치할 때만 담기
        if (difficulty == null || roomDiff == difficulty) {
          String code = key.replace(ROOM_CODE_PREFIX, "");
          String gameId = (String) data.get("gameId");
          String count = redisTemplate.opsForValue().get(ROOM_USER_COUNT + gameId);

          data.put("roomCode", code);
          data.put("currentPlayers", count != null ? Integer.parseInt(count) : 0);
          rooms.add(data);
        }
      }
    }
    return rooms;
  }

  public Map<String, Object> joinRoomByCode(String code) {
    String json = redisTemplate.opsForValue().get(ROOM_CODE_PREFIX + code.toUpperCase());
    if (json == null) throw new RuntimeException("존재하지 않는 방 코드입니다.");

    try {
      // 🎯 JSON 전체를 Map으로 파싱 (gameId, difficulty 다 들어있음)
      Map<String, Object> data = objectMapper.readValue(json, Map.class);
      String gameId = (String) data.get("gameId");

      // 인원 체크 로직
      Long count = redisTemplate.opsForValue().increment(ROOM_USER_COUNT + gameId);
      if (count != null && count > 2) {
        redisTemplate.opsForValue().decrement(ROOM_USER_COUNT + gameId);
        throw new RuntimeException("방이 가득 찼습니다.");
      }

      // 🎯 gameId랑 difficulty 둘 다 담아서 리턴
      Map<String, Object> result = new HashMap<>();
      result.put("gameId", gameId);
      result.put("difficulty", data.get("difficulty"));
      return result;

    } catch (JsonProcessingException e) {
      throw new RuntimeException("방 정보 파싱 실패");
    }
  }

  private String createRandomCode() {
    // 숫자 + 대문자 조합 6자리 생성 로직
    return UUID.randomUUID().toString().substring(0, 6).toUpperCase();
  }

  public List<Map<String, Object>> getAllRooms() {
    List<Map<String, Object>> rooms = new ArrayList<>();
    // 🎯 Redis에서 room:code:* 패턴의 키들을 안전하게 스캔
    Set<String> keys = redisTemplate.keys("room:code:*");

    if (keys != null) {
      for (String key : keys) {
        String code = key.replace("room:code:", "");
        String gameId = redisTemplate.opsForValue().get(key);
        String count = redisTemplate.opsForValue().get("room:count:" + gameId);

        // 🎯 방 코드, 현재 인원 등을 묶어서 리스트에 담기
        Map<String, Object> roomInfo = new HashMap<>();
        roomInfo.put("roomCode", code);
        roomInfo.put("gameId", gameId);
        roomInfo.put("currentPlayers", count != null ? Integer.parseInt(count) : 0);
        rooms.add(roomInfo);
      }
    }
    return rooms;
  }

  public void leaveRoom(String gameId, String roomCode) {
    // 1. 인원 감소
    Long count = redisTemplate.opsForValue().decrement(ROOM_USER_COUNT + gameId);

    // 2. 🎯 인원이 0명이거나 음수면 방 폭파 (자원 정리)
    if (count == null || count <= 0) {
      redisTemplate.delete(ROOM_USER_COUNT + gameId);
      if (roomCode != null) {
        redisTemplate.delete(ROOM_CODE_PREFIX + roomCode.toUpperCase());
      }
      // 필요하다면 여기서 gameService.deleteGame(gameId) 호출해서 게임판도 삭제
    }
  }

  public void updateRoomDifficulty(String code, int newDifficulty) throws JsonProcessingException {
    String key = ROOM_CODE_PREFIX + code.toUpperCase();
    String json = redisTemplate.opsForValue().get(key);

    if (json != null) {
      Map<String, Object> data = objectMapper.readValue(json, Map.class);
      data.put("difficulty", newDifficulty); // 🎯 난이도 갱신

      String updatedJson = objectMapper.writeValueAsString(data);
      // Redis 덮어쓰기 (기존 만료시간 유지하려면 getExpire 확인 후 세팅)
      redisTemplate.opsForValue().set(key, updatedJson, 24, TimeUnit.HOURS);
    }
  }
}
