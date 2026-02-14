package io.github.perniteo.sudoku.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import io.github.perniteo.sudoku.controller.dto.GameStartRequest;
import io.github.perniteo.sudoku.controller.dto.PlaceRequest;
import io.github.perniteo.sudoku.controller.dto.PlaceResponse;
import io.github.perniteo.sudoku.domain.PlaceResult;
import io.github.perniteo.sudoku.domain.SudokuGame;
import io.github.perniteo.sudoku.controller.dto.GameStartResponse;
import io.github.perniteo.sudoku.service.SudokuGameService;
import java.nio.file.attribute.UserPrincipal;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/games")
public class SudokuController {

  private final SudokuGameService service;

  /**
   * 게임 시작 (로그인 유저는 userId, 비로그인은 null 또는 "anonymous"로 요청)
   */
  @PostMapping({"/start", "/start/{anonymousId}"}) // 두 경로 모두 허용
  public GameStartResponse startGame(
      @AuthenticationPrincipal String email, // String에서 Object로 변경 (익명 유저 대응)
      @PathVariable(required = false) String id,
      @RequestBody GameStartRequest request) throws JsonProcessingException {
    // 1. 식별자 결정 (우선순위: 로그인 이메일 > 전달받은 익명 ID > 신규 생성)
    String finalId;
    // 1. 로그인 유저 최우선 (필터에서 email이 들어왔는지 확인)
    if (email != null && !email.equals("anonymousUser")) {
      finalId = "user:" + email;
    }
    // 2. 비로그인 유저 (기존 ID가 "anonymousUser"로 들어오지 않게 방어)
    else if (id != null && !id.isEmpty() && !id.contains("anonymousUser")) {
      finalId = id.startsWith("anon:") ? id : "anon:" + id;
    }
    // 3. 신규 발급
    else {
      finalId = "anon:" + java.util.UUID.randomUUID();
    }
    int difficulty = request.getDifficulty();
    String gameId = service.createGame(finalId, difficulty);
    SudokuGame game = service.getGame(gameId);

    return new GameStartResponse(
        finalId,
        game.getPuzzleBoard().getMatrix(),
        game.getStatus().name()
    );
  }

  // [이어하기 & 상태 조회]
  @GetMapping({"/{id}", ""}) // ID가 경로에 있거나 JWT 이메일로 조회
  public ResponseEntity<GameStartResponse> getRecentGame(
      @AuthenticationPrincipal String email,
      @PathVariable(required = false) String id
  ) {
    String finalId = (email != null) ? "user:" + email : id;

    try {
      SudokuGame game = service.getGame(finalId);
      return ResponseEntity.ok(new GameStartResponse(
          finalId,
          game.getPuzzleBoard().getMatrix(),
          game.getStatus().name()
      ));
    } catch (IllegalArgumentException e) {
      return ResponseEntity.notFound().build(); // 게임 없으면 404
    }
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
        game.getPuzzleBoard().getMatrix(),
        game.getLife(),
        game.getStatus().name()
    );
  }


}
