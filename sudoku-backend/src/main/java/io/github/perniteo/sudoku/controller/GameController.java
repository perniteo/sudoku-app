//package io.github.perniteo.sudoku.controller;
//
//
//import io.github.perniteo.sudoku.controller.dto.GameStartResponse;
//import org.springframework.web.bind.annotation.PostMapping;
//import org.springframework.web.bind.annotation.RequestMapping;
//import org.springframework.web.bind.annotation.RestController;
//
//@RestController
//@RequestMapping("/api/game")
//public class GameController {
//
//  private int[][] dummyBoard() {
//    return new int[][]{
//        {5,3,0,0,7,0,0,0,0},
//        {6,0,0,1,9,5,0,0,0},
//        {0,9,8,0,0,0,0,6,0},
//        {8,0,0,0,6,0,0,0,3},
//        {4,0,0,8,0,3,0,0,1},
//        {7,0,0,0,2,0,0,0,6},
//        {0,6,0,0,0,0,2,8,0},
//        {0,0,0,4,1,9,0,0,5},
//        {0,0,0,0,8,0,0,7,9}
//    };
//  }
//
//  @PostMapping("/start")
//  public GameStartResponse startGame() {
//    return new GameStartResponse("1", dummyBoard(), "Playing");
//  }
//}
