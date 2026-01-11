package io.github.perniteo.sudoku.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import io.github.perniteo.sudoku.util.generator.GeneratedSudoku;
import io.github.perniteo.sudoku.util.generator.SudokuGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

public class SudokuGameTest {

  private SudokuGame game;

  @Test
  void testRunCheck() {
    assertTrue(true);
  }

  @BeforeEach
  void setUp() {
    SudokuGenerator generator = new SudokuGenerator();
    GeneratedSudoku generated = generator.generate();
    game = new SudokuGame(generated);
  }

  @Test
  void 고정된_칸에_숫자를_놓으면_ALREADY_FIXED가_반환된다() {
    PlaceResult result = game.placeNumber(0, 0, 9);
    assertEquals(PlaceResult.ALREADY_FIXED, result);
  }

}
