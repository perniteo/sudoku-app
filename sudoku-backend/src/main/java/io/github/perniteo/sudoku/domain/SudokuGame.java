package io.github.perniteo.sudoku.domain;

import io.github.perniteo.sudoku.dto.SudokuBoardData;
import io.github.perniteo.sudoku.dto.SudokuBoardRow;
import io.github.perniteo.sudoku.dto.redis.SudokuRedisDto;
import io.github.perniteo.sudoku.util.generator.GeneratedSudoku;
import java.time.LocalDateTime;

public class SudokuGame {

  private final LocalDateTime startedAt;
  private GameStatus status;
  private final SudokuBoard puzzleBoard;
  private final SudokuBoard answerBoard;
  private int life;
  private int difficulty;
  private long accumulatedSeconds; // 👈 추가: 누적 플레이 시간(초)
  private final long boardId;
//  private final String puzzleJson;
//  private final String answerJson;

  public SudokuGame(GeneratedSudoku generated) {
    this.puzzleBoard = generated.getPuzzleBoard();
    this.answerBoard = generated.getAnswerBoard();
    this.boardId = generated.getBoardId();
    this.startedAt = LocalDateTime.now();
    this.status = GameStatus.PLAYING;
    this.life = 3;
  }
//  public SudokuGame(SudokuBoardRow boardRow) {
//    this.difficulty = boardRow.getDifficulty();
//    this.puzzleJson = boardRow.getStartJson();
//    this.answerJson = boardRow.getAnswerJson();
//    this.startedAt = LocalDateTime.now();
//    this.life = 3;
//    this.status = GameStatus.PLAYING;
//  }

  public SudokuGame(SudokuBoardData boardData) {
    this.difficulty = boardData.getDifficulty();
    this.puzzleBoard = SudokuBoard.from(boardData.getInitialBoard());
    this.answerBoard = SudokuBoard.from(boardData.getSolutionBoard());
    this.startedAt = LocalDateTime.now();
    this.life = 3;
    this.status = GameStatus.PLAYING;
    this.boardId = boardData.getBoardId();
  }

  // [추가] Redis DTO로부터 도메인 객체 복구 (Private 생성자 활용)
  private SudokuGame(LocalDateTime startedAt, GameStatus status, SudokuBoard puzzleBoard,
      SudokuBoard answerBoard, int life, int difficulty, long accumulatedSeconds, long boardId) {
    this.startedAt = startedAt;
    this.status = status;
    this.puzzleBoard = puzzleBoard;
    this.answerBoard = answerBoard;
    this.life = life;
    this.difficulty = difficulty;
    this.accumulatedSeconds = accumulatedSeconds;
    this.boardId = boardId;
  }

  // [추가] Redis -> Domain 브릿지 메서드
  public static SudokuGame from(SudokuRedisDto dto) {
    return new SudokuGame(
        dto.getStartedAt(),
        dto.getStatus(),
        SudokuBoard.fromSnapshots(dto.getPuzzleBoard()), // 메모/고정 상태 포함 복구
        SudokuBoard.from(dto.getAnswerBoard()),          // 정답지는 단순 숫자 복구
        dto.getLife(),
        dto.getDifficulty(),
        dto.getElapsedTime(),
        dto.getBoardId()
    );
  }

  // [추가] Domain -> Redis 변환 메서드
  public SudokuRedisDto toRedisDto() {
    return SudokuRedisDto.builder()
        .startedAt(this.startedAt)
        .status(this.status)
        .puzzleBoard(this.puzzleBoard.getCellSnapshots()) // Cell 정보 평면화
        .answerBoard(this.answerBoard.getMatrix())
        .life(this.life)
        .difficulty(this.difficulty)
        .elapsedTime(this.accumulatedSeconds)
        .boardId(this.boardId)
        .build();
  }

  public void updateTime(long time) {
    this.accumulatedSeconds = time;
  }

  public long getAccumulatedSeconds() { return accumulatedSeconds; }

  public int getValue(int row, int col) {
    return puzzleBoard.getValue(row, col);
  }

  public LocalDateTime getStartedAt() {
    return startedAt;
  }

  public GameStatus getStatus() {
    return status;
  }

  public int getLife() {
    return life;
  }

  public SudokuBoard getPuzzleBoard() { return puzzleBoard; }

  public int getDifficulty() {return this.difficulty;}

  public long getBoardId() { return boardId; }

  public PlaceResult placeNumber(int row, int col, int value, String userId) {
    if (status != GameStatus.PLAYING) return PlaceResult.GAME_OVER;

    if (puzzleBoard.isFixed(row, col)) return PlaceResult.ALREADY_FIXED;

    if (value == 0) {
      puzzleBoard.erase(row, col);
      return PlaceResult.ERASE;
    }

    if (answerBoard.getValue(row, col) != value) {
      life--;
      if (life <= 0) {
        status = GameStatus.FAILED;
        return PlaceResult.GAME_OVER;
      }
      return PlaceResult.WRONG;
    }

    puzzleBoard.place(row, col, value, userId);

    if (puzzleBoard.isCompleted()) {
      status = GameStatus.COMPLETED;
      return PlaceResult.COMPLETED;
    }

    return PlaceResult.CORRECT;
  }

  public void toggleMemo(int row, int col, int value) {
    // 1. 게임 진행 중일 때만 허용
    if (this.status != GameStatus.PLAYING) return;

    // 2. 이미 숫자가 채워진 칸(Fixed 포함)은 메모 불가
    if (this.puzzleBoard.getValue(row, col) != 0) return;

    // 3. 보드 객체에 메모 토글 위임
    this.puzzleBoard.toggleMemo(row, col, value);
  }
}
