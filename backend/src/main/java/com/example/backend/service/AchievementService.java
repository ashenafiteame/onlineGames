package com.example.backend.service;

import com.example.backend.entity.Achievement;
import com.example.backend.entity.Game;
import com.example.backend.entity.User;
import com.example.backend.entity.UserAchievement;
import com.example.backend.repository.AchievementRepository;
import com.example.backend.repository.ScoreRepository;
import com.example.backend.repository.UserAchievementRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AchievementService {

    @Autowired
    private AchievementRepository achievementRepository;

    @Autowired
    private UserAchievementRepository userAchievementRepository;

    @Autowired
    private ScoreRepository scoreRepository;

    @Autowired
    private SocialService socialService;

    @PostConstruct
    public void seedAchievements() {
        seedAchievement("First Game", "Play any game for the first time.", "FIRST_GAME", 1, "🎯");
        seedAchievement("Scout", "Reach a total score of 1,000.", "TOTAL_SCORE", 1000, "🥈");
        seedAchievement("Elite Player", "Reach a total score of 5,000.", "TOTAL_SCORE", 5000, "🥇");
        seedAchievement("High Score", "Get a score of 100 or more in a single game.", "SINGLE_SCORE", 100, "🔥");
    }

    private void seedAchievement(String name, String description, String type, Integer criteria, String badge) {
        if (achievementRepository.findByTypeAndCriteria(type, criteria).isEmpty()) {
            achievementRepository.save(new Achievement(null, name, description, type, criteria, badge));
        }
    }

    @Transactional
    public List<Achievement> checkAchievements(User user, Game game, int scoreValue) {
        // We return the newly earned achievements
        List<Achievement> allAchievements = achievementRepository.findAll();
        List<Achievement> earnedSoFar = userAchievementRepository.findByUser(user)
                .stream().map(UserAchievement::getAchievement).collect(Collectors.toList());

        return allAchievements.stream()
                .filter(a -> !earnedSoFar.contains(a))
                .filter(a -> isCriteriaMet(user, game, scoreValue, a))
                .map(a -> {
                    awardAchievement(user, a);
                    socialService.logActivity(user, "ACHIEVEMENT",
                            "earned the badge " + a.getBadge() + " (" + a.getName() + ")");
                    return a;
                })
                .collect(Collectors.toList());
    }

    private boolean isCriteriaMet(User user, Game game, int scoreValue, Achievement achievement) {
        switch (achievement.getType()) {
            case "FIRST_GAME":
                return scoreRepository.findByUser(user).size() >= achievement.getCriteria();
            case "TOTAL_SCORE":
                return user.getTotalScore() >= achievement.getCriteria();
            case "SINGLE_SCORE":
                return scoreValue >= achievement.getCriteria();
            default:
                return false;
        }
    }

    private void awardAchievement(User user, Achievement achievement) {
        UserAchievement ua = new UserAchievement(null, user, achievement, LocalDateTime.now());
        userAchievementRepository.save(ua);
    }

    public List<Achievement> getUserAchievements(User user) {
        return userAchievementRepository.findByUser(user).stream()
                .map(UserAchievement::getAchievement)
                .collect(Collectors.toList());
    }
}
