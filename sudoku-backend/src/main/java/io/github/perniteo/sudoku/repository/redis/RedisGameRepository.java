package io.github.perniteo.sudoku.repository.redis;

import io.github.perniteo.sudoku.domain.SudokuGame;
import io.github.perniteo.sudoku.dto.redis.SudokuRedisDto;
import io.github.perniteo.sudoku.repository.GameRepository;
import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.function.UnaryOperator;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Primary;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
@Primary
public class RedisGameRepository implements GameRepository {

  private final RedisTemplate<String, Object> redisTemplate;
  private static final String KEY_PREFIX = "sudoku:";

  @Override
  public void save(String userId, SudokuGame game) {
    SudokuRedisDto newDto = game.toRedisDto();

    // 🎯 버전 정보가 있다면 낙관적 락 검증 수행
    if (newDto.getVersion() != null) {
      Object data = redisTemplate.opsForValue().get(KEY_PREFIX + userId);
      if (data != null) {
        SudokuRedisDto currentDto = (SudokuRedisDto) data;
        // 🎯 현재 Redis의 버전이 내가 읽은 버전과 다르면 충돌 발생
        if (!currentDto.getVersion().equals(newDto.getVersion())) {
          throw new OptimisticLockingFailureException("이미 변경된 데이터입니다.");
        }
      }
      // 🎯 저장 전 버전 증가
      newDto.setVersion(newDto.getVersion() + 1);
    }

    // 2. DTO를 Redis에 저장 (2시간 유효)
    redisTemplate.opsForValue().set(KEY_PREFIX + userId, newDto, Duration.ofHours(2));
  }

  @Override
  public Optional<SudokuGame> findById(String userId) {
    // 1. Redis에서 DTO 객체를 꺼내옴
    Object data = redisTemplate.opsForValue().get(KEY_PREFIX + userId);

    if (data == null) {
      return Optional.empty();
    }

    // 2. DTO를 다시 순수 Java 도메인 객체로 복구하여 반환
    SudokuRedisDto dto = (SudokuRedisDto) data;
    return Optional.of(SudokuGame.from(dto));
  }

  @Override
  public void delete(String userId) {
    redisTemplate.delete(KEY_PREFIX + userId);
  }

  public void saveWithTTL(String id, SudokuGame game, long seconds) {
    SudokuRedisDto dto = game.toRedisDto();
    // 🎯 Redis에 데이터를 넣으면서 동시에 만료 시간(TTL) 설정
    redisTemplate.opsForValue().set("sudoku:" + id, dto, Duration.ofSeconds(seconds));
  }

  public void updateWithOptimisticLock(String userId, UnaryOperator<SudokuGame> updateLogic) {
    String key = KEY_PREFIX + userId;

    for (int i = 0; i < 3; i++) { // 최대 3번 재시도
      redisTemplate.watch(key); // 1. 해당 키 감시 시작

      SudokuRedisDto oldDto = (SudokuRedisDto) redisTemplate.opsForValue().get(key);
      SudokuGame game = SudokuGame.from(oldDto);

      // 2. 비즈니스 로직 수행 (예: 숫자 입력)
      SudokuGame updatedGame = updateLogic.apply(game);
      SudokuRedisDto newDto = updatedGame.toRedisDto();

      // 버전 업데이트
      newDto.setVersion(oldDto.getVersion() + 1);

      redisTemplate.multi(); // 3. 트랜잭션 시작
      redisTemplate.opsForValue().set(key, newDto, Duration.ofHours(2));

      List<Object> result = redisTemplate.exec(); // 4. 실행

      if (!result.isEmpty()) return; // 성공 시 종료
      // result가 비어있으면 watch 중인 키가 타인에 의해 변경됨 -> 재시도
    }
    throw new RuntimeException("동시성 충돌로 업데이트 실패");
  }

}