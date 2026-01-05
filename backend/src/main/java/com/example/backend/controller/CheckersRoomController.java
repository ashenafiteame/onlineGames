package com.example.backend.controller;

import com.example.backend.entity.GameRoom;
import com.example.backend.entity.User;
import com.example.backend.service.CheckersRoomService;
import com.example.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/checkers/rooms")
public class CheckersRoomController {

    @Autowired
    private CheckersRoomService checkersRoomService;

    @Autowired
    private UserService userService;

    @PostMapping("/{roomId}/start")
    public ResponseEntity<?> startGame(@PathVariable Long roomId, Authentication auth) {
        try {
            User user = userService.findByUsername(auth.getName()).orElseThrow();
            GameRoom room = checkersRoomService.startGame(roomId, user);
            return ResponseEntity.ok(room);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{roomId}/move")
    public ResponseEntity<?> makeMove(@PathVariable Long roomId, @RequestBody Map<String, Object> moveData,
            Authentication auth) {
        try {
            User user = userService.findByUsername(auth.getName()).orElseThrow();
            GameRoom room = checkersRoomService.updateMove(roomId, user, moveData);
            return ResponseEntity.ok(room);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
