package com.example.backend.repository;

import com.example.backend.entity.GameMatch;
import com.example.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GameMatchRepository extends JpaRepository<GameMatch, Long> {

    @Query("SELECT m FROM GameMatch m WHERE (m.player1 = :user OR m.player2 = :user) AND m.status = :status")
    List<GameMatch> findByUserAndStatus(@Param("user") User user, @Param("status") String status);

    @Query("SELECT m FROM GameMatch m WHERE (m.player1 = :user OR m.player2 = :user) AND m.status <> 'FINISHED' AND m.status <> 'CANCELLED' AND m.status <> 'DECLINED'")
    List<GameMatch> findAllActiveByUser(@Param("user") User user);

    // Check if a pending/active match already exists between two players
    @Query("SELECT m FROM GameMatch m WHERE ((m.player1 = :user1 AND m.player2 = :user2) OR (m.player1 = :user2 AND m.player2 = :user1)) AND (m.status = 'PENDING' OR m.status = 'ACTIVE')")
    List<GameMatch> findExistingMatchBetweenPlayers(@Param("user1") User user1, @Param("user2") User user2);
}
