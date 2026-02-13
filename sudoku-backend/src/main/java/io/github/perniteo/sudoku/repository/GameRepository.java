package io.github.perniteo.sudoku.repository;

import io.github.perniteo.sudoku.domain.SudokuGame;
import java.util.Optional;
import java.util.Set;

public interface GameRepository {

  void save(String gameId, SudokuGame sudokuGame);

  Optional<SudokuGame> findById(String gameId);

  void delete(String gameId);
}