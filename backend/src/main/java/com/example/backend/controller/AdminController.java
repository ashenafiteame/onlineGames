package com.example.backend.controller;

import com.example.backend.entity.Game;
import com.example.backend.entity.Game;
import com.example.backend.entity.User;
import com.example.backend.service.GameService;
import com.example.backend.service.ScoreService;
import com.example.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserService userService;

    @Autowired
    private GameService gameService;

    @Autowired
    private ScoreService scoreService;

    @GetMapping("/dashboard")
    public Map<String, Object> getDashboard() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userService.countUsers());
        stats.put("totalGames", gameService.countGames());
        stats.put("totalScores", scoreService.countScores());
        return stats;
    }

    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok().body("User deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/users/{id}/toggle-role")
    public ResponseEntity<?> toggleUserRole(@PathVariable Long id) {
        try {
            User user = userService.toggleUserRole(id);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/leaderboard")
    public List<User> getLeaderboard() {
        return userService.getTopUsersByScore();
    }

    @GetMapping("/games")
    public List<Game> getAllGames() {
        return gameService.getAllGames();
    }

    @DeleteMapping("/games/{id}")
    public ResponseEntity<?> deleteGame(@PathVariable Long id) {
        return gameService.getGameById(id).map(game -> {
            gameService.deleteGame(game);
            return ResponseEntity.ok().body("Game deleted successfully");
        }).orElse(ResponseEntity.notFound().build());
    }
}
