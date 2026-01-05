package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "game_rooms")
public class GameRoom {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String inviteCode; // 6-character unique code

    @Column(nullable = false)
    private String gameType; // UNO, CHECKERS, CHESS, etc.

    @ManyToOne
    @JoinColumn(name = "host_id")
    private User host; // Room creator

    @Column(columnDefinition = "TEXT")
    private String players; // JSON: [{username, displayName, avatar, isHost, ...}]

    @Column(columnDefinition = "TEXT")
    private String gameState; // Game-specific JSON state

    private String status; // WAITING, PLAYING, FINISHED
    private Integer maxPlayers;
    private Integer currentPlayerIndex;
    private String currentPlayerUsername;

    @Column(columnDefinition = "TEXT")
    private String sessionWins; // JSON: {username: count}

    private Integer gamesPlayed;

    private LocalDateTime createdAt;
    private LocalDateTime lastActivityAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        lastActivityAt = LocalDateTime.now();
    }
}
