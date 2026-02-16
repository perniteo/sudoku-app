package io.github.perniteo.sudoku.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import io.github.perniteo.sudoku.domain.PlaceResult;
import io.github.perniteo.sudoku.domain.SudokuGame;
import io.github.perniteo.sudoku.dto.SudokuBoardData;
import io.github.perniteo.sudoku.repository.GameRepository;
import io.github.perniteo.sudoku.util.generator.GeneratedSudoku;
import io.github.perniteo.sudoku.util.generator.SudokuGenerator;
import jakarta.transaction.Transactional;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SudokuGameService {

  private final AtomicLong idGenerator = new AtomicLong();
  private final BoardLoadService boardLoadService;
  private final GameRepository gameRepository;

  @Transactional
  public void saveGame(String userId, SudokuGame game) {
    // 1. 이미 컨트롤러나 서비스에서 game.updateTime(elapsedTime)이 호출된 상태여야 함
    // 2. 도메인 객체를 Redis DTO로 변환하여 저장
    gameRepository.save(userId, game);
  }

  public String createGame(int difficulty) throws JsonProcessingException {

    SudokuBoardData boardData = boardLoadService.loadBoard(difficulty);
    SudokuGame game = new SudokuGame(boardData);
    long id = idGenerator.incrementAndGet();
    gameRepository.save(String.valueOf(id), game);

    return String.valueOf(id);
  }

  public String createGame(String userId, int difficulty) throws JsonProcessingException {
    // 1. 기존 게임 삭제 (1인 1게임 보장)
    gameRepository.delete(userId);

    // 2. 새 게임 생성 및 저장
    SudokuBoardData boardData = boardLoadService.loadBoard(difficulty);
    SudokuGame game = new SudokuGame(boardData);
    gameRepository.save(userId, game);

    return userId;
  }

  public PlaceResult placeNumber(String userId, int row, int col, int value, long elapsedTime) {
    // 1. Redis에서 데이터 Fetch 및 Domain 복구
    SudokuGame game = getGame(userId);

    // 2. Pure Java 도메인 로직 수행 (메모리 내 상태 변경)
    PlaceResult result = game.placeNumber(row, col, value);

    game.updateTime(elapsedTime);

    // 3. 결과에 따른 후처리
    if (result == PlaceResult.GAME_OVER || result == PlaceResult.COMPLETED) {
      // 게임이 종료된 경우 Redis에서 삭제 (필요시 DB 기록 로직 추가)
      gameRepository.delete(userId);
    } else {
      // 진행 중인 경우 변경된 상태(Cell, Memo, Life 등)를 Redis에 덮어쓰기
      gameRepository.save(userId, game);
    }
    return result;
  }


  public SudokuGame getGame(String gameId) {
    return gameRepository.findById(gameId)
        .orElseThrow(() -> new IllegalArgumentException("게임 없음"));
  }

  @Transactional
  public void toggleMemo(String userId, int row, int col, int value) {
    // 1. Redis에서 도메인 복구
    SudokuGame game = getGame(userId);

    // 2. 도메인 로직 수행 (메모 업데이트)
    // 앞서 SudokuGame에 추가한 toggleMemo 호출
    game.toggleMemo(row, col, value);

    // 3. 변경된 상태(CellSnapshots 내의 Set<Integer> m)를 Redis에 다시 저장
    gameRepository.save(userId, game);
  }


}
