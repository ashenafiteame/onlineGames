package com.example.backend.controller;

import com.example.backend.entity.GameMatch;
import com.example.backend.entity.User;
import com.example.backend.service.MatchService;
import com.example.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/matches")
public class MatchController {

    @Autowired
    private MatchService matchService;

    @Autowired
    private UserService userService;

    @GetMapping("/my")
    public List<GameMatch> getMyMatches(Authentication auth) {
        User user = userService.findByUsername(auth.getName()).get();
        return matchService.getMyMatches(user);
    }

    @PostMapping("/invite/{username}")
    public ResponseEntity<?> invite(@PathVariable String username, @RequestBody Map<String, String> body,
            Authentication auth) {
        User user = userService.findByUsername(auth.getName()).get();
        String gameType = body.getOrDefault("gameType", "checkers");
        String initialBoard = body.get("initialBoard");
        try {
            return ResponseEntity.ok(matchService.createMatchInvite(user, username, gameType, initialBoard));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{matchId}/accept")
    public ResponseEntity<?> accept(@PathVariable Long matchId, Authentication auth) {
        User user = userService.findByUsername(auth.getName()).get();
        try {
            return ResponseEntity.ok(matchService.acceptMatch(matchId, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{matchId}/move")
    public ResponseEntity<?> move(@PathVariable Long matchId, @RequestBody Map<String, String> body,
            Authentication auth) {
        User user = userService.findByUsername(auth.getName()).get();
        String boardData = body.get("boardData");
        String nextTurn = body.get("nextTurn");
        try {
            return ResponseEntity.ok(matchService.updateMove(matchId, boardData, nextTurn, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{matchId}")
    public ResponseEntity<?> getMatch(@PathVariable Long matchId) {
        return matchService.getMatch(matchId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{matchId}/finish")
    public ResponseEntity<?> finish(@PathVariable Long matchId, @RequestBody Map<String, String> body) {
        String status = body.getOrDefault("status", "FINISHED");
        return ResponseEntity.ok(matchService.finishMatch(matchId, status));
    }

    @PostMapping("/{matchId}/decline")
    public ResponseEntity<?> decline(@PathVariable Long matchId, Authentication auth) {
        User user = userService.findByUsername(auth.getName()).get();
        try {
            return ResponseEntity.ok(matchService.declineMatch(matchId, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{matchId}/forfeit")
    public ResponseEntity<?> forfeit(@PathVariable Long matchId, Authentication auth) {
        User user = userService.findByUsername(auth.getName()).get();
        try {
            return ResponseEntity.ok(matchService.forfeitMatch(matchId, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
