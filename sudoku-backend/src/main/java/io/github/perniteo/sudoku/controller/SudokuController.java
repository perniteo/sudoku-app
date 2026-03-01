package io.github.perniteo.sudoku.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import io.github.perniteo.sudoku.controller.dto.GameContinueResponse;
import io.github.perniteo.sudoku.controller.dto.GameSaveRequest;
import io.github.perniteo.sudoku.controller.dto.GameStartRequest;
import io.github.perniteo.sudoku.controller.dto.GameStartResponse;
import io.github.perniteo.sudoku.controller.dto.PlaceRequest;
import io.github.perniteo.sudoku.controller.dto.PlaceResponse;
import io.github.perniteo.sudoku.domain.GameStatus;
import io.github.perniteo.sudoku.domain.PlaceResult;
import io.github.perniteo.sudoku.domain.SudokuGame;
import io.github.perniteo.sudoku.service.SudokuGameService;
import java.util.ArrayList;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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
        game.getPuzzleBoard().getCellSnapshots(),
        game.getStatus().name(),
        difficulty
    );
  }

//  // [이어하기 & 상태 조회]
//  @GetMapping({"/{id:.+}", ""}) // ID가 경로에 있거나 JWT 이메일로 조회
//  public ResponseEntity<GameContinueResponse> getRecentGame(
//      @AuthenticationPrincipal String email,
//      @PathVariable(required = false) String id
//  ) {
//    String finalId = (email != null) ? "user:" + email : id;
//
//    try {
//      SudokuGame game = service.getGame(finalId);
//      return ResponseEntity.ok(new GameContinueResponse(
//          finalId,
//          game.getPuzzleBoard().getCellSnapshots(),
//          game.getStatus().name(),
//          game.getDifficulty(),
//          game.getLife(),
//          game.getAccumulatedSeconds()
//      ));
//    } catch (IllegalArgumentException e) {
//      return ResponseEntity.notFound().build(); // 게임 없으면 404
//    }
//  }
  // 1. 로그인 사용자 (JWT 기반) - URL: /games
  @GetMapping(value = {"", "/"})
  public ResponseEntity<GameContinueResponse> getRecentGameByToken(
      @AuthenticationPrincipal String email
  ) {
    // anonymousUser 문자열 방어 로직
    if (email == null || "anonymousUser".equals(email)) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    return fetchGame("user:" + email);
  }

  // 2. 익명 사용자 (ID 기반) - URL: /games/anon:uuid
  @GetMapping("/{id}") //
  public ResponseEntity<GameContinueResponse> getRecentGameById(@PathVariable String id) {
    return fetchGame(id);
  }

  // 3. 공통 조회 메서드
  private ResponseEntity<GameContinueResponse> fetchGame(String gameId) {
    try {
      SudokuGame game = service.getGame(gameId);

      // 🎯 깬 게임이거나 게임오버된 판은 '이어하기' 대상에서 제외!
      if (game.getStatus() == GameStatus.COMPLETED || game.getStatus() == GameStatus.FAILED) {
        return ResponseEntity.notFound().build(); // 404를 주면 프론트에서 이어하기 버튼이 사라짐
      }

      return ResponseEntity.ok(new GameContinueResponse(
          gameId,
          game.getPuzzleBoard().getCellSnapshots(),
          game.getStatus().name(),
          game.getDifficulty(),
          game.getLife(),
          game.getAccumulatedSeconds()
      ));
    } catch (IllegalArgumentException e) {
      return ResponseEntity.notFound().build(); // 여기서 404가 나감
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

  // single play
  @PostMapping("/{id}/place")
  public PlaceResponse placeNumber(
      @PathVariable String id,
      @RequestBody PlaceRequest request
  ) {
    // 서비스에게 모든 책임을 위임합니다.
    return service.placeNumber(
        id, id,
        request.getRow(),
        request.getCol(),
        request.getValue(),
        request.getElapsedTime()
    );
  }

  @PostMapping("/{id}/memo")
  public ResponseEntity<PlaceResponse> toggleMemo(
      @PathVariable String id,
      @RequestBody PlaceRequest request // row, col, value 재사용
  ) {
    // 1. 메모 수정 수행
    service.toggleMemo(id, request.getRow(), request.getCol(), request.getValue());

    // 2. 수정된 최신 게임 정보 가져오기
    SudokuGame game = service.getGame(id);

    // [핵심] 싱글플레이는 프론트가 보낸 시간을 '골든 타임'으로 인정해줌
    // 그래야 Pause로 멈춰있던 시간이 보존됨
    long currentElapsedTime = request.getElapsedTime();
    game.updateTime(currentElapsedTime);
    service.saveGame(id, game); // Redis에 시간 갱신 저장

    // 3. 전체 보드(CellRedisDto[][])와 함께 응답 반환
    return ResponseEntity.ok(new PlaceResponse(
        "MEMO_TOGGLED",
        game.getPuzzleBoard().getCellSnapshots(), // 👈 이게 있어야 리액트가 그림
        game.getLife(),
        game.getStatus().name(),
        currentElapsedTime, id
    ));
  }

  @PostMapping("/save")
  public ResponseEntity<GameContinueResponse> saveGameByToken(
      @AuthenticationPrincipal String email,
      @RequestBody GameSaveRequest request
  ) {
    // 🎯 여기서 401을 던져야 리액트의 Interceptor가 "아! 재발급하자!" 하고 일어납니다.
    if (email == null || "anonymousUser".equals(email)) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    return processSave("user:" + email, request.getElapsedTime());
  }

  @PostMapping("/{id}/save")
  public ResponseEntity<GameContinueResponse> saveGameById(
      @PathVariable String id,
      @RequestBody GameSaveRequest request
  ) {
    return processSave(id, request.getElapsedTime());
  }

  private ResponseEntity<GameContinueResponse> processSave(String gameId, long elapsedTime) {
    // 1. 서비스에서 저장 후 최신 객체 받아오기
    SudokuGame game = service.saveProgress(gameId, elapsedTime);

    // 2. 응답 DTO 조립하여 반환
    return ResponseEntity.ok(new GameContinueResponse(
        gameId,
        game.getPuzzleBoard().getCellSnapshots(),
        game.getStatus().name(),
        game.getDifficulty(),
        game.getLife(),
        game.getAccumulatedSeconds()
    ));
  }

}
