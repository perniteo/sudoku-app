package io.github.perniteo.sudoku.service;

import io.github.perniteo.sudoku.domain.SudokuGame;
import io.github.perniteo.sudoku.util.generator.GeneratedSudoku;
import io.github.perniteo.sudoku.util.generator.SudokuGenerator;

public class SudokuGameService {

  private final SudokuGenerator generator = new SudokuGenerator();

  public SudokuGame createGame() {
    GeneratedSudoku generated = generator.generate();

    return new SudokuGame(generated);
  }

}
