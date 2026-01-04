package com.example.backend.controller;

import com.example.backend.entity.UnoRoom;
import com.example.backend.entity.User;
import com.example.backend.service.UnoRoomService;
import com.example.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/uno")
public class UnoRoomController {

    @Autowired
    private UnoRoomService unoRoomService;

    @Autowired
    private UserService userService;

    // Create a new room
    @PostMapping("/rooms")
    public ResponseEntity<?> createRoom(@RequestBody Map<String, Integer> body, Authentication auth) {
        try {
            User user = userService.findByUsername(auth.getName()).orElseThrow();
            int maxPlayers = body.getOrDefault("maxPlayers", 4);
            UnoRoom room = unoRoomService.createRoom(user, maxPlayers);
            return ResponseEntity.ok(room);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Get room by ID
    @GetMapping("/rooms/{roomId}")
    public ResponseEntity<?> getRoom(@PathVariable Long roomId, Authentication auth) {
        try {
            UnoRoom room = unoRoomService.getRoom(roomId);
            if (room == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(room);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Get room by invite code
    @GetMapping("/rooms/code/{inviteCode}")
    public ResponseEntity<?> getRoomByCode(@PathVariable String inviteCode, Authentication auth) {
        try {
            UnoRoom room = unoRoomService.getRoomByInviteCode(inviteCode);
            if (room == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(room);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Join a room
    @PostMapping("/rooms/join/{inviteCode}")
    public ResponseEntity<?> joinRoom(@PathVariable String inviteCode, Authentication auth) {
        try {
            User user = userService.findByUsername(auth.getName()).orElseThrow();
            UnoRoom room = unoRoomService.joinRoom(inviteCode, user);
            return ResponseEntity.ok(room);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Leave a room
    @PostMapping("/rooms/{roomId}/leave")
    public ResponseEntity<?> leaveRoom(@PathVariable Long roomId, Authentication auth) {
        try {
            User user = userService.findByUsername(auth.getName()).orElseThrow();
            UnoRoom room = unoRoomService.leaveRoom(roomId, user);
            if (room == null) {
                return ResponseEntity.ok(Map.of("message", "Room closed"));
            }
            return ResponseEntity.ok(room);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Start the game
    @PostMapping("/rooms/{roomId}/start")
    public ResponseEntity<?> startGame(@PathVariable Long roomId, Authentication auth) {
        try {
            User user = userService.findByUsername(auth.getName()).orElseThrow();
            UnoRoom room = unoRoomService.startGame(roomId, user);
            return ResponseEntity.ok(room);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Play a card
    @PostMapping("/rooms/{roomId}/play")
    public ResponseEntity<?> playCard(
            @PathVariable Long roomId,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        try {
            User user = userService.findByUsername(auth.getName()).orElseThrow();
            String cardId = body.get("cardId");
            String chosenColor = body.get("chosenColor");
            UnoRoom room = unoRoomService.playCard(roomId, user, cardId, chosenColor);
            return ResponseEntity.ok(room);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Draw a card
    @PostMapping("/rooms/{roomId}/draw")
    public ResponseEntity<?> drawCard(@PathVariable Long roomId, Authentication auth) {
        try {
            User user = userService.findByUsername(auth.getName()).orElseThrow();
            UnoRoom room = unoRoomService.drawCard(roomId, user);
            return ResponseEntity.ok(room);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Get user's active rooms
    @GetMapping("/my-rooms")
    public ResponseEntity<?> getMyRooms(Authentication auth) {
        try {
            User user = userService.findByUsername(auth.getName()).orElseThrow();
            List<UnoRoom> rooms = unoRoomService.getUserActiveRooms(user);
            return ResponseEntity.ok(rooms);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Play again - restart game with same players
    @PostMapping("/rooms/{roomId}/play-again")
    public ResponseEntity<?> playAgain(@PathVariable Long roomId, Authentication auth) {
        try {
            User user = userService.findByUsername(auth.getName()).orElseThrow();
            UnoRoom room = unoRoomService.playAgain(roomId, user);
            return ResponseEntity.ok(room);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
