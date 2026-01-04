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
@Table(name = "uno_rooms")
public class UnoRoom {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String inviteCode; // 6-character unique code for joining

    @ManyToOne
    @JoinColumn(name = "host_id")
    private User host; // The room creator

    @Column(columnDefinition = "TEXT")
    private String players; // JSON array of player objects: [{username, displayName, joinedAt}]

    @Column(columnDefinition = "TEXT")
    private String gameState; // JSON: {hands:{}, deck:[], discardPile:[], currentColor, turn, direction,
                              // winners:[]}

    private String status; // WAITING, PLAYING, FINISHED
    private Integer maxPlayers; // 2-6
    private Integer currentPlayerIndex; // Index of current player's turn
    private String currentPlayerUsername; // Username of current player

    @Column(columnDefinition = "TEXT")
    private String sessionWins; // JSON: {username: winCount, ...}

    private Integer gamesPlayed; // Number of games played in this session

    private LocalDateTime createdAt;
    private LocalDateTime lastActivityAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        lastActivityAt = LocalDateTime.now();
    }
}
