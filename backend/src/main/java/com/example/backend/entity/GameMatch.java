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
@Table(name = "game_matches")
public class GameMatch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "player1_id")
    private User player1; // The inviter (Red)

    @ManyToOne
    @JoinColumn(name = "player2_id")
    private User player2; // The invited (White)

    @Column(columnDefinition = "TEXT")
    private String boardData; // JSON string of the board state

    private String currentTurn; // username of player whose turn it is
    private String status; // PENDING, ACTIVE, FINISHED, CANCELLED
    private String gameType; // checkers, etc.

    private LocalDateTime createdAt;
    private LocalDateTime lastMoveAt;
}
