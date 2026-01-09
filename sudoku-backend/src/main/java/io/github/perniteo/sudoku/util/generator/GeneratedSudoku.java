package io.github.perniteo.sudoku.util.generator;

import io.github.perniteo.sudoku.domain.SudokuBoard;

public class GeneratedSudoku {

  private final SudokuBoard puzzleBoard;
  private final SudokuBoard answerBoard;

  public GeneratedSudoku(SudokuBoard puzzleBoard, SudokuBoard answerBoard) {
    this.puzzleBoard = puzzleBoard;
    this.answerBoard = answerBoard;
  }

  public SudokuBoard getPuzzleBoard() {
    return puzzleBoard;
  }

  public SudokuBoard getAnswerBoard() {
    return answerBoard;
  }

}
