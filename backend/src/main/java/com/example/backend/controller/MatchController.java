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
    public ResponseEntity<?> invite(@PathVariable String username,
            @jakarta.validation.Valid @RequestBody com.example.backend.dto.InviteRequest request,
            Authentication auth) {
        User user = userService.findByUsername(auth.getName()).get();
        try {
            return ResponseEntity.ok(
                    matchService.createMatchInvite(user, username, request.getGameType(), request.getInitialBoard()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{matchId}/accept")
    public ResponseEntity<?> accept(@PathVariable @org.springframework.lang.NonNull Long matchId, Authentication auth) {
        User user = userService.findByUsername(auth.getName()).get();
        try {
            return ResponseEntity.ok(matchService.acceptMatch(matchId, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{matchId}/move")
    public ResponseEntity<?> move(@PathVariable @org.springframework.lang.NonNull Long matchId,
            @jakarta.validation.Valid @RequestBody com.example.backend.dto.MoveRequest request,
            Authentication auth) {
        User user = userService.findByUsername(auth.getName()).get();
        try {
            return ResponseEntity
                    .ok(matchService.updateMove(matchId, request.getBoardData(), request.getNextTurn(), user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{matchId}")
    public ResponseEntity<?> getMatch(@PathVariable @org.springframework.lang.NonNull Long matchId) {
        return matchService.getMatch(matchId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{matchId}/finish")
    public ResponseEntity<?> finish(@PathVariable @org.springframework.lang.NonNull Long matchId,
            @RequestBody com.example.backend.dto.FinishMatchRequest request) {
        return ResponseEntity.ok(matchService.finishMatch(matchId, request.getStatus()));
    }

    @PostMapping("/{matchId}/decline")
    public ResponseEntity<?> decline(@PathVariable @org.springframework.lang.NonNull Long matchId,
            Authentication auth) {
        User user = userService.findByUsername(auth.getName()).get();
        try {
            return ResponseEntity.ok(matchService.declineMatch(matchId, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{matchId}/forfeit")
    public ResponseEntity<?> forfeit(@PathVariable @org.springframework.lang.NonNull Long matchId,
            Authentication auth) {
        User user = userService.findByUsername(auth.getName()).get();
        try {
            return ResponseEntity.ok(matchService.forfeitMatch(matchId, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{matchId}/replay")
    public ResponseEntity<?> replay(@PathVariable @org.springframework.lang.NonNull Long matchId,
            Authentication auth) {
        User user = userService.findByUsername(auth.getName()).get();
        try {
            return ResponseEntity.ok(matchService.requestReplay(matchId, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
