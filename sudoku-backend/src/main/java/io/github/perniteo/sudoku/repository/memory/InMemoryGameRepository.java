package io.github.perniteo.sudoku.repository.memory;

import io.github.perniteo.sudoku.domain.SudokuGame;
import io.github.perniteo.sudoku.repository.GameRepository;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Repository;

@Repository
public class InMemoryGameRepository implements GameRepository {

  private final Map<String, SudokuGame> games = new ConcurrentHashMap<>();

  @Override
  public void save(String gameId, SudokuGame game) {
    games.put(gameId, game);
  }

  @Override
  public Optional<SudokuGame> findById(String gameId) {
    return Optional.ofNullable(games.get(gameId));
  }

  @Override
  public void delete(String gameId) {
    games.remove(gameId);
  }
}