package com.example.backend.service;

import com.example.backend.entity.Game;
import com.example.backend.entity.Score;
import com.example.backend.entity.User;
import com.example.backend.repository.ScoreRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ScoreService {

    @Autowired
    private ScoreRepository scoreRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private GameService gameService;

    @Autowired
    private AchievementService achievementService;

    @Autowired
    private SocialService socialService;

    @Transactional
    public User submitScore(User user, String gameType, int scoreValue) {
        Game game = gameService.getGameByType(gameType)
                .orElseThrow(() -> new RuntimeException("Game not found: " + gameType));

        Score score = new Score();
        score.setUser(user);
        score.setGame(game);
        score.setScoreValue(scoreValue);
        scoreRepository.save(score);

        // Update User stats
        user.setTotalScore(user.getTotalScore() + scoreValue);
        user.setLevel(1 + user.getTotalScore() / 1000); // Simple level logic
        User savedUser = userService.saveUser(user);

        // Check for achievements
        achievementService.checkAchievements(savedUser, game, scoreValue);

        // Log activity
        socialService.logActivity(savedUser, "SCORE", "scored " + scoreValue + " in " + game.getName());

        return savedUser;
    }

    public List<Score> getUserScores(User user) {
        return scoreRepository.findByUser(user);
    }

    public List<Score> getLeaderboard() {
        return scoreRepository.findTop10ByOrderByScoreValueDesc();
    }

    public long countScores() {
        return scoreRepository.count();
    }
}
