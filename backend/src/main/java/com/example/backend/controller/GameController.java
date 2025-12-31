package com.example.backend.controller;

import com.example.backend.entity.Game;
import com.example.backend.service.GameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/games")
public class GameController {

    @Autowired
    private GameService gameService;

    // Seeding is now handled by GameService @PostConstruct

    @GetMapping
    public List<Game> getAllGames() {
        return gameService.getAllGames();
    }

    @DeleteMapping("/{name}")
    public ResponseEntity<?> deleteGame(@PathVariable String name) {
        return gameService.getGameByName(name).map(game -> {
            gameService.deleteGame(game);
            return ResponseEntity.ok().body("Game '" + name + "' deleted successfully.");
        }).orElse(ResponseEntity.notFound().build());
    }
}
