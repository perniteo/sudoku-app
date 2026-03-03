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
  private static final String ROOM_USERS_SET = "room:users:"; // 🎯 Key: room:users:{gameId} (Set 구조)

  private final ObjectMapper objectMapper; // JSON 변환용 Jackson

  public String generateRoomCode(String gameId, int difficulty, String hostId) throws JsonProcessingException {
    String code = createRandomCode();

    // 방 정보 객체 생성 (난이도 포함)
    Map<String, Object> roomData = new HashMap<>();
    roomData.put("gameId", gameId);
    roomData.put("difficulty", difficulty);
    roomData.put("hostId", hostId); // 👈 [추가] 방장 식별자 저장
    roomData.put("createdAt", System.currentTimeMillis());

    String json = objectMapper.writeValueAsString(roomData);

    // Redis 저장 (코드 -> 상세 정보 JSON)
    redisTemplate.opsForValue().set(ROOM_CODE_PREFIX + code, json, 24, TimeUnit.HOURS);
    // 🎯 [수정] 숫자를 1로 세팅하는 대신 Set에 호스트 ID를 추가
    redisTemplate.opsForSet().add(ROOM_USERS_SET + gameId, hostId);

    return code;
  }

  public List<Map<String, Object>> getFilteredRooms(Integer difficulty) throws JsonProcessingException {
    List<Map<String, Object>> rooms = new ArrayList<>();
    // 1. room:code:* 패턴의 키들을 가져옴
    Set<String> keys = redisTemplate.keys(ROOM_CODE_PREFIX + "*");

    if (keys != null) {
      for (String key : keys) {
        String json = redisTemplate.opsForValue().get(key);
        if (json == null) continue;

        Map<String, Object> data = objectMapper.readValue(json, Map.class);
        int roomDiff = (int) data.get("difficulty");

        // 🎯 난이도 필터링
        if (difficulty == null || roomDiff == difficulty) {
          String code = key.replace(ROOM_CODE_PREFIX, "");
          String gameId = (String) data.get("gameId");

          // 🎯 [변경] increment 방식의 키가 아니라 Set의 size(SCARD)를 가져옴
          Long count = redisTemplate.opsForSet().size(ROOM_USERS_SET + gameId);

          data.put("roomCode", code);
          // 🎯 인원수가 null이면 0으로 처리
          data.put("currentPlayers", count != null ? count.intValue() : 0);
          rooms.add(data);
        }
      }
    }
    return rooms;
  }

  // 2. 방 참여 시 (중복 체크 및 인원 제한)
  public Map<String, Object> joinRoomByCode(String code, String userId) {
    String json = redisTemplate.opsForValue().get(ROOM_CODE_PREFIX + code.toUpperCase());
    if (json == null) throw new RuntimeException("존재하지 않는 방 코드입니다.");

    try {
      Map<String, Object> data = objectMapper.readValue(json, Map.class);
      String gameId = (String) data.get("gameId");
      String userSetKey = ROOM_USERS_SET + gameId;

      // 🎯 [핵심] SADD는 이미 있으면 0을 반환함. 중복 입장이면 숫자가 늘어나지 않음.
      redisTemplate.opsForSet().add(userSetKey, userId);

      // 🎯 실제 유니크한 인원수 확인
      Long count = redisTemplate.opsForSet().size(userSetKey);

      if (count != null && count > 2) {
        // 3명째라면 방금 추가한 유저를 다시 제거하고 튕김
        redisTemplate.opsForSet().remove(userSetKey, userId);
        throw new RuntimeException("방이 가득 찼습니다.");
      }

      Map<String, Object> result = new HashMap<>();
      result.put("gameId", gameId);
      result.put("difficulty", data.get("difficulty"));
      result.put("currentPlayers", count);
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

  // 3. 방 나가기 시 (Set에서 유저 제거)
  public void leaveRoom(String gameId, String roomCode, String userId) {
    String userSetKey = ROOM_USERS_SET + gameId;
    redisTemplate.opsForSet().remove(userSetKey, userId);

    Long count = redisTemplate.opsForSet().size(userSetKey);

    if (count == null || count <= 0) {
      redisTemplate.delete(userSetKey);
      if (roomCode != null) {
        redisTemplate.delete(ROOM_CODE_PREFIX + roomCode.toUpperCase());
      }
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

  // 4. 정보 조회 시 (Set 크기 반환)
  public Map<String, Object> getRoomInfoOnly(String code) {
    String json = redisTemplate.opsForValue().get(ROOM_CODE_PREFIX + code.toUpperCase());
    if (json == null) throw new RuntimeException("존재하지 않는 방입니다.");

    try {
      Map<String, Object> data = objectMapper.readValue(json, Map.class);
      String gameId = (String) data.get("gameId");

      // 🎯 Set의 크기가 곧 현재 인원수
      Long count = redisTemplate.opsForSet().size(ROOM_USERS_SET + gameId);

      data.put("roomCode", code.toUpperCase());
      data.put("currentPlayers", count != null ? count : 0);
      return data;
    } catch (JsonProcessingException e) {
      throw new RuntimeException("방 정보 파싱 실패");
    }
  }

  // 🎯 2. 방장 여부 판별 (익명/로그인 통합)
  public boolean isHost(String code, String currentUserId) {
    try {
      Map<String, Object> room = getRoomInfoOnly(code);
      String hostId = (String) room.get("hostId");
      return hostId != null && hostId.equals(currentUserId);
    } catch (Exception e) {
      return false;
    }
  }
}
