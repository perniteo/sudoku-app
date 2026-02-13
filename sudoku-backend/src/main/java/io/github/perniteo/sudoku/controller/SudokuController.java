package io.github.perniteo.sudoku.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import io.github.perniteo.sudoku.controller.dto.GameStartRequest;
import io.github.perniteo.sudoku.controller.dto.PlaceRequest;
import io.github.perniteo.sudoku.controller.dto.PlaceResponse;
import io.github.perniteo.sudoku.domain.PlaceResult;
import io.github.perniteo.sudoku.domain.SudokuGame;
import io.github.perniteo.sudoku.controller.dto.GameStartResponse;
import io.github.perniteo.sudoku.service.SudokuGameService;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/games")
public class SudokuController {

  private final SudokuGameService service;

  public SudokuController(SudokuGameService service) {
    this.service = service;
  }

  @PostMapping
  public GameStartResponse startGame(@RequestBody GameStartRequest request) throws JsonProcessingException {
    int difficulty = request.getDifficulty();
    String gameId = service.createGame(difficulty);
    SudokuGame game = service.getGame(gameId);

    return new GameStartResponse(
        gameId,
        extractBoard(game),
        game.getStatus().name()
    );
  }

  // 퍼즐 보드만 int[][]로 내려주는 임시 메서드
  private int[][] extractBoard(SudokuGame game) {
    int[][] board = new int[9][9];
    for (int r = 0; r < 9; r++) {
      for (int c = 0; c < 9; c++) {
        board[r][c] = game.getValue(r, c);
      }
    }
    return board;
  }

  @PostMapping("/{id}/place")
  public PlaceResponse placeNumber(
      @PathVariable String id,
      @RequestBody PlaceRequest request
  ) {
    PlaceResult result =
        service.placeNumber(
            id,
            request.getRow(),
            request.getCol(),
            request.getValue()
        );

    SudokuGame game = service.getGame(id);

    return new PlaceResponse(
        result.name(),
        extractBoard(game),
        game.getLife(),
        game.getStatus().name()
    );
  }


}
