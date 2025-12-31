package com.example.backend.repository;

import com.example.backend.entity.Game;
import com.example.backend.entity.Score;
import com.example.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScoreRepository extends JpaRepository<Score, Long> {
    List<Score> findByUser(User user);

    void deleteByUser(User user);

    List<Score> findTop10ByOrderByScoreValueDesc();

    void deleteByGame(Game game);
}
