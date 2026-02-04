package io.github.perniteo.sudoku.util.generator;

import io.github.perniteo.sudoku.domain.SudokuBoard;

public class GeneratedSudoku {

  private final long boardId;
  private final int level;
  private final SudokuBoard puzzleBoard;
  private final SudokuBoard answerBoard;

  public GeneratedSudoku(SudokuBoard puzzleBoard, SudokuBoard answerBoard, long boardId, int level) {
    this.boardId = boardId;
    this.level = level;
    this.puzzleBoard = puzzleBoard;
    this.answerBoard = answerBoard;
  }

  public SudokuBoard getPuzzleBoard() {
    return puzzleBoard;
  }

  public SudokuBoard getAnswerBoard() {
    return answerBoard;
  }

  public long getBoardId() { return boardId; }

  public int getLevel() { return level; }
}
