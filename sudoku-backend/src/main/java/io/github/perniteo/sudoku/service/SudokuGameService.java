package io.github.perniteo.sudoku.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import io.github.perniteo.sudoku.controller.dto.PlaceResponse;
import io.github.perniteo.sudoku.domain.GameRecord;
import io.github.perniteo.sudoku.domain.PlaceResult;
import io.github.perniteo.sudoku.domain.SudokuGame;
import io.github.perniteo.sudoku.dto.SudokuBoardData;
import io.github.perniteo.sudoku.repository.GameRecordRepository;
import io.github.perniteo.sudoku.repository.GameRepository;
import io.github.perniteo.sudoku.util.generator.GeneratedSudoku;
import io.github.perniteo.sudoku.util.generator.SudokuGenerator;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
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
  private final GameRecordRepository gameRecordRepository;

  @Transactional
  public SudokuGame saveProgress(String userId, long elapsedTime) {
    SudokuGame game = getGame(userId);
    game.updateTime(elapsedTime);
    gameRepository.save(userId, game); // Redis 저장 (기존 메서드 활용)
    return game;
  }

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

  public String createMultiGame(String gameId, int difficulty) throws JsonProcessingException {
    // 🎯 1. 기존 데이터 정리 (혹시 모를 중복 방지)
    gameRepository.delete(gameId);

    // 🎯 2. 새 게임 보드 로드 및 생성
    SudokuBoardData boardData = boardLoadService.loadBoard(difficulty);
    SudokuGame game = new SudokuGame(boardData);

    // 🎯 3. 저장 (키를 multi:uuid 형태로 저장)
    gameRepository.save(gameId, game);

    return gameId;
  }

  @Transactional
  public PlaceResponse placeNumber(String userId, int row, int col, int value, long elapsedTime) {
    SudokuGame game = getGame(userId);
    PlaceResult result = game.placeNumber(row, col, value);
    game.updateTime(elapsedTime);

    // 🎯 삭제나 업데이트 전에 최종 상태 스냅샷을 먼저 만듭니다.
    PlaceResponse response = new PlaceResponse(
        result.name(),
        game.getPuzzleBoard().getCellSnapshots(),
        game.getLife(),
        game.getStatus().name()
    );

    if (result == PlaceResult.GAME_OVER || result == PlaceResult.COMPLETED) {
      // [영구 저장] PostgreSQL
      saveRecordToDb(userId, game);
      // 2. 🎯 Redis 데이터를 지우지 않고 '짧은 수명'으로 다시 저장
      // (프론트엔드가 최종 화면을 그릴 시간을 벌어줌 + 유저 이탈 시 자동 삭제)
      gameRepository.saveWithTTL(userId, game, 600); // 600초(10분) 뒤 자동 삭제
    } else {
      // [업데이트] Redis
      gameRepository.save(userId, game);
    }

    return response; // 🎯 조립된 응답을 컨트롤러로 리턴
  }

  private void saveRecordToDb(String userId, SudokuGame game) {
    // 1. 엔티티 생성 (아까 만든 GameRecord)
    GameRecord record = GameRecord.builder()
        .email(userId.replace("user:", "")) // 접두사 제거
        .boardId(game.getBoardId())
        .difficulty(game.getDifficulty())
        .elapsedTime(game.getAccumulatedSeconds())
        .life(game.getLife())
        .status(game.getStatus())
        .completedAt(LocalDateTime.now())
        .build();

    // 2. JPA를 통해 PostgreSQL에 저장
    gameRecordRepository.save(record);
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
