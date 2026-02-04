package io.github.perniteo.sudoku.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import io.github.perniteo.sudoku.domain.PlaceResult;
import io.github.perniteo.sudoku.domain.SudokuGame;
import io.github.perniteo.sudoku.dto.SudokuBoardData;
import io.github.perniteo.sudoku.util.generator.GeneratedSudoku;
import io.github.perniteo.sudoku.util.generator.SudokuGenerator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SudokuGameService {

  private final Map<Long, SudokuGame> games = new ConcurrentHashMap<>();
  private final AtomicLong idGenerator = new AtomicLong();
  private final BoardLoadService boardLoadService;
  public Long createGame(int difficulty) throws JsonProcessingException {
    SudokuBoardData boardData = boardLoadService.loadBoard(difficulty);
    SudokuGame game = new SudokuGame(boardData);
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
