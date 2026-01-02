package com.example.backend.controller;

import com.example.backend.entity.Score;
import com.example.backend.entity.User;
import com.example.backend.service.ScoreService;
import com.example.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/scores")
public class ScoreController {

    @Autowired
    private ScoreService scoreService;

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<?> submitScore(
            @jakarta.validation.Valid @RequestBody com.example.backend.dto.SubmitScoreRequest request,
            Principal principal) {
        User user = userService.findByUsername(principal.getName())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        try {
            User updatedUser = scoreService.submitScore(user, request.getGameType(), request.getScore());
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/my")
    public List<Score> getMyScores(Principal principal) {
        User user = userService.findByUsername(principal.getName())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return scoreService.getUserScores(user);
    }

    @GetMapping("/leaderboard")
    public List<User> getLeaderboard() {
        return userService.getTopUsersByScore();
    }
}
