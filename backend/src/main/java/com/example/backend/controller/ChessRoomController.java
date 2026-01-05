package com.example.backend.controller;

import com.example.backend.entity.GameRoom;
import com.example.backend.entity.User;
import com.example.backend.service.ChessRoomService;
import com.example.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/chess/rooms")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class ChessRoomController {

    @Autowired
    private ChessRoomService chessRoomService;

    @Autowired
    private UserService userService;

    @PostMapping("/{roomId}/start")
    public ResponseEntity<?> startGame(@PathVariable Long roomId, Principal principal) {
        try {
            User user = userService.findByUsername(principal.getName()).orElseThrow();
            GameRoom room = chessRoomService.startGame(roomId, user);
            return ResponseEntity.ok(room);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{roomId}/move")
    public ResponseEntity<?> makeMove(@PathVariable Long roomId, @RequestBody Map<String, Object> moveData,
            Principal principal) {
        try {
            User user = userService.findByUsername(principal.getName()).orElseThrow();
            GameRoom room = chessRoomService.updateMove(roomId, user, moveData);
            return ResponseEntity.ok(room);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
