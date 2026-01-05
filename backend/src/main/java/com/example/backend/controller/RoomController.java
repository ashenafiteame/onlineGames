package com.example.backend.controller;

import com.example.backend.entity.GameRoom;
import com.example.backend.entity.User;
import com.example.backend.service.RoomService;
import com.example.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    @Autowired
    private RoomService roomService;

    @Autowired
    private UserService userService;

    @PostMapping("/create")
    public ResponseEntity<?> createRoom(@RequestBody Map<String, Object> body, Authentication auth) {
        try {
            User user = userService.findByUsername(auth.getName()).orElseThrow();
            String gameType = (String) body.get("gameType");
            int maxPlayers = (int) body.getOrDefault("maxPlayers", 2);

            @SuppressWarnings("unchecked")
            Map<String, Object> settings = (Map<String, Object>) body.get("settings");

            GameRoom room = roomService.createRoom(user, gameType, maxPlayers, settings);
            return ResponseEntity.ok(room);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/join/{code}")
    public ResponseEntity<?> joinRoom(@PathVariable String code, Authentication auth) {
        try {
            User user = userService.findByUsername(auth.getName()).orElseThrow();
            GameRoom room = roomService.joinRoom(code, user);
            return ResponseEntity.ok(room);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getRoom(@PathVariable Long id) {
        GameRoom room = roomService.getRoom(id);
        if (room == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(room);
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<?> leaveRoom(@PathVariable Long id, Authentication auth) {
        try {
            User user = userService.findByUsername(auth.getName()).orElseThrow();
            GameRoom room = roomService.leaveRoom(id, user);
            return ResponseEntity.ok(Map.of("message", "Left room", "roomId", id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
