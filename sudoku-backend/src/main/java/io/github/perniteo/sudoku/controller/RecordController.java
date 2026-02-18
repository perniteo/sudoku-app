package io.github.perniteo.sudoku.controller;

import io.github.perniteo.sudoku.controller.dto.RecordResponse;
import io.github.perniteo.sudoku.domain.GameRecord;
import io.github.perniteo.sudoku.repository.GameRecordRepository;
import io.github.perniteo.sudoku.service.RecordService;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/records")
@RequiredArgsConstructor
public class RecordController {
  private final GameRecordRepository recordRepository;


  private final RecordService recordService; // Repository 대신 Service 주입

  @GetMapping("/all") // 🎯 요청을 하나로 합침
  public ResponseEntity<RecordResponse> getAll(@AuthenticationPrincipal String email) {
    return ResponseEntity.ok(recordService.getFullRecordInfo(email));
  }
}
