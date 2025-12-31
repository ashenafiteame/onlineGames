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

    @Query("SELECT m FROM GameMatch m WHERE (m.player1 = :user OR m.player2 = :user) AND m.status <> 'FINISHED' AND m.status <> 'CANCELLED'")
    List<GameMatch> findAllActiveByUser(@Param("user") User user);
}
