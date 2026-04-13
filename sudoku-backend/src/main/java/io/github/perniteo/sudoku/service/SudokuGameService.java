package io.github.perniteo.sudoku.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import io.github.perniteo.common.exception.BaseException;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
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
  public PlaceResponse placeNumber(String gameId, String userId, int row, int col, int value, long clientTime) {
    int maxRetry = 3;

    for (int i = 0; i < maxRetry; i++) {
      try {
        // 1. 최신 상태 조회 (버전 포함)
        SudokuGame game = getGame(gameId);

        // 2. 비즈니스 로직 수행
        PlaceResult result = game.placeNumber(row, col, value, userId);

        // 시간 결정 로직
        long finalTime;
        if (gameId.startsWith("multi:")) {
          LocalDateTime start = game.getStartedAt();
          finalTime = java.time.Duration.between(start, LocalDateTime.now()).getSeconds();
        } else {
          finalTime = clientTime;
        }
        game.updateTime(finalTime);

        // 응답 스냅샷 생성
        PlaceResponse response = new PlaceResponse(
            result.name(),
            game.getPuzzleBoard().getCellSnapshots(),
            game.getLife(),
            game.getStatus().name(),
            finalTime,
            userId
        );

        // 3. 저장 (Repository 내부에서 버전 비교 수행)
        if (result == PlaceResult.GAME_OVER || result == PlaceResult.COMPLETED) {
          saveRecordToDb(gameId, game);
          gameRepository.saveWithTTL(gameId, game, 600);
        } else {
          gameRepository.save(gameId, game); // 🎯 충돌 시 여기서 Exception 발생
        }

        return response;

      } catch (OptimisticLockingFailureException e) {
        // 🎯 충돌 발생 시 재시도 로직
        if (i == maxRetry - 1) {
          // 3번 다 실패하면 커스텀 예외 던짐
          throw new BaseException("다른 사용자가 동시에 입력하여 처리에 실패했습니다. 다시 시도해주세요.", HttpStatus.CONFLICT);
        }
        // 50ms 대기 후 루프 재시작 (최신 데이터를 다시 가져오기 위함)
        try { Thread.sleep(50); } catch (InterruptedException ignored) {}
      }
    }
    throw new BaseException("서버 혼잡으로 인해 처리가 지연되었습니다.", HttpStatus.SERVICE_UNAVAILABLE);
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
