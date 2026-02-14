package io.github.perniteo.sudoku.repository.redis;

import io.github.perniteo.sudoku.domain.SudokuGame;
import io.github.perniteo.sudoku.dto.redis.SudokuRedisDto;
import io.github.perniteo.sudoku.repository.GameRepository;
import java.time.Duration;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Primary;
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
    // 1. 도메인 객체를 Redis 전용 DTO로 변환
    SudokuRedisDto dto = game.toRedisDto();

    // 2. DTO를 Redis에 저장 (2시간 유효)
    redisTemplate.opsForValue().set(KEY_PREFIX + userId, dto, Duration.ofHours(2));
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

}