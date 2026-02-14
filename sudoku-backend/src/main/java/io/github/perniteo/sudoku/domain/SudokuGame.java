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
//  private final String puzzleJson;
//  private final String answerJson;

  public SudokuGame(GeneratedSudoku generated) {
    this.puzzleBoard = generated.getPuzzleBoard();
    this.answerBoard = generated.getAnswerBoard();
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
  }

  // [추가] Redis DTO로부터 도메인 객체 복구 (Private 생성자 활용)
  private SudokuGame(LocalDateTime startedAt, GameStatus status, SudokuBoard puzzleBoard,
      SudokuBoard answerBoard, int life, int difficulty) {
    this.startedAt = startedAt;
    this.status = status;
    this.puzzleBoard = puzzleBoard;
    this.answerBoard = answerBoard;
    this.life = life;
    this.difficulty = difficulty;
  }

  // [추가] Redis -> Domain 브릿지 메서드
  public static SudokuGame from(SudokuRedisDto dto) {
    return new SudokuGame(
        dto.getStartedAt(),
        dto.getStatus(),
        SudokuBoard.fromSnapshots(dto.getPuzzleBoard()), // 메모/고정 상태 포함 복구
        SudokuBoard.from(dto.getAnswerBoard()),          // 정답지는 단순 숫자 복구
        dto.getLife(),
        dto.getDifficulty()
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
        .build();
  }

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

  public PlaceResult placeNumber(int row, int col, int value) {
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

    puzzleBoard.place(row, col, value);

    if (puzzleBoard.isCompleted()) {
      status = GameStatus.COMPLETED;
      return PlaceResult.COMPLETED;
    }

    return PlaceResult.CORRECT;
  }
}
