package io.github.perniteo.sudoku.repository;

import io.github.perniteo.sudoku.domain.SudokuGame;
import java.util.Optional;
import java.util.Set;

public interface GameRepository {

  void save(String gameId, SudokuGame sudokuGame);

  Optional<SudokuGame> findById(String gameId);

  void delete(String gameId);

  // 🎯 default를 붙이면 구현체들이 강제로 오버라이드 안 해도 됩니다!
  default void saveWithTTL(String userId, SudokuGame game, long seconds) {
    // 기본값은 그냥 일반 save 호출
    save(userId, game);
  }

}