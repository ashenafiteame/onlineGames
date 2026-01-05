package com.example.backend.controller;

import com.example.backend.entity.GameRoom;
import com.example.backend.entity.User;
import com.example.backend.service.TicTacToeRoomService;
import com.example.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/tictactoe/rooms")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class TicTacToeRoomController {

    @Autowired
    private TicTacToeRoomService ticTacToeRoomService;

    @Autowired
    private UserService userService;

    @PostMapping("/{roomId}/start")
    public ResponseEntity<?> startGame(@PathVariable Long roomId, Principal principal) {
        try {
            User user = userService.findByUsername(principal.getName()).orElseThrow();
            GameRoom room = ticTacToeRoomService.startGame(roomId, user);
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
            GameRoom room = ticTacToeRoomService.updateMove(roomId, user, moveData);
            return ResponseEntity.ok(room);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
