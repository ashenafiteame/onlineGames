package com.example.backend.service;

import com.example.backend.entity.Game;
import com.example.backend.repository.GameRepository;
import com.example.backend.repository.ScoreRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class GameService {

    @Autowired
    private GameRepository gameRepository;

    @Autowired
    private ScoreRepository scoreRepository;

    @PostConstruct
    public void seedGames() {
        seedGame("Memory Match", "Test your memory by matching pairs of cards.", "memory");
        seedGame("Guess Number", "Guess the number between 1 and 100.", "guess");
        seedGame("Snake", "Classic snake game. Eat food, grow, don't hit walls!", "snake");
        seedGame("Balloon Popper", "Pop as many balloons as you can in 30 seconds!", "balloon");
        seedGame("Lane Racer", "Dodge traffic on the infinite highway.", "lane-racer");
        seedGame("Moto Racer", "High speed bike racing! Smooth steering required.", "moto-racer");
    }

    private void seedGame(String name, String description, String type) {
        if (gameRepository.findByName(name).isEmpty()) {
            gameRepository.save(new Game(null, name, description, type));
        }
    }

    public List<Game> getAllGames() {
        return gameRepository.findAll();
    }

    public Optional<Game> getGameByName(String name) {
        return gameRepository.findByName(name);
    }

    public Optional<Game> getGameByType(String type) {
        return gameRepository.findByType(type);
    }

    public Optional<Game> getGameById(Long id) {
        return gameRepository.findById(id);
    }

    @Transactional
    public void deleteGame(Game game) {
        scoreRepository.deleteByGame(game);
        gameRepository.delete(game);
    }

    public long countGames() {
        return gameRepository.count();
    }
}
