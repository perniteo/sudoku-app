package io.github.perniteo.sudoku.service;

import io.github.perniteo.sudoku.domain.PlaceResult;
import io.github.perniteo.sudoku.domain.SudokuGame;
import io.github.perniteo.sudoku.util.generator.GeneratedSudoku;
import io.github.perniteo.sudoku.util.generator.SudokuGenerator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Service;

@Service
public class SudokuGameService {

  private final Map<Long, SudokuGame> games = new ConcurrentHashMap<>();
  private final AtomicLong idGenerator = new AtomicLong();

  public Long createGame() {
    SudokuGame game = new SudokuGame(new SudokuGenerator().generate());
    long id = idGenerator.incrementAndGet();
    games.put(id, game);

    return id;
  }

  public PlaceResult placeNumber(Long gameId, int row, int col, int value) {
    SudokuGame game = games.get(gameId);
    return game.placeNumber(row, col, value);
  }

  public SudokuGame getGame(Long gameId) {
    return games.get(gameId);
  }

}
