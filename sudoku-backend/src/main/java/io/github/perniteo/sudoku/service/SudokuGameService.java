package io.github.perniteo.sudoku.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import io.github.perniteo.sudoku.domain.PlaceResult;
import io.github.perniteo.sudoku.domain.SudokuGame;
import io.github.perniteo.sudoku.dto.SudokuBoardData;
import io.github.perniteo.sudoku.repository.GameRepository;
import io.github.perniteo.sudoku.util.generator.GeneratedSudoku;
import io.github.perniteo.sudoku.util.generator.SudokuGenerator;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SudokuGameService {

  private final AtomicLong idGenerator = new AtomicLong();
  private final BoardLoadService boardLoadService;
  private final GameRepository gameRepository;

  public String createGame(int difficulty) throws JsonProcessingException {
    SudokuBoardData boardData = boardLoadService.loadBoard(difficulty);
    SudokuGame game = new SudokuGame(boardData);
    long id = idGenerator.incrementAndGet();
    gameRepository.save(String.valueOf(id), game);

    return String.valueOf(id);
  }

  public PlaceResult placeNumber(String gameId, int row, int col, int value) {
    SudokuGame game = gameRepository.findById(gameId)
        .orElseThrow(() -> new IllegalArgumentException("게임 없음"));
    PlaceResult result = game.placeNumber(row, col, value);
    gameRepository.save(gameId, game); // Redis 대비
    return result;
  }

  public SudokuGame getGame(String gameId) {
    return gameRepository.findById(gameId)
        .orElseThrow(() -> new IllegalArgumentException("게임 없음"));
  }


}
