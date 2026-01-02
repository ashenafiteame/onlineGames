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
        seedGame("Checkers", "Classic strategy game of checkers vs AI.", "checkers");
        seedGame("Chess", "The ultimate strategy game. Play vs AI or challenge friends!", "chess");
        seedGame("Tic-Tac-Toe", "Classic X and O game. Get 3 in a row to win!", "tictactoe");
        seedGame("2048", "Join the numbers and get to the 2048 tile!", "2048");
        seedGame("Tetris", "Classic falling blocks puzzle game. Clear lines to score!", "tetris");
        seedGame("Connect Four", "Drop discs to connect 4 in a row. Challenge friends or AI!", "connectfour");
        seedGame("Sudoku", "Fill the 9x9 grid so every row, column, and box contains 1-9!", "sudoku");
        seedGame("Blackjack", "Beat the dealer to 21! Classic casino card game.", "blackjack");
        seedGame("Uno", "Classic card game against 3 bots! Match colors and numbers.", "uno");
        seedGame("Solitaire", "Classic Klondike patience card game.", "solitaire");
        seedGame("Whack-a-Mole", "Whack the moles as they pop up! Fast-paced arcade fun.", "whackamole");
        seedGame("Minesweeper", "Reveal squares without hitting mines. Classic puzzle!", "minesweeper");
        seedGame("Reversi", "Flip your opponent's pieces to dominate the board!", "reversi");
        seedGame("Battleship", "Sink the enemy fleet! Place ships and fire away.", "battleship");
        seedGame("Flappy Bird", "Tap to fly through the pipes. How far can you go?", "flappybird");
        seedGame("Brick Breaker", "Destroy all bricks with the ball. Don't lose the ball!", "brickbreaker");
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
