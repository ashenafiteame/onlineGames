package com.example.backend.repository;

import com.example.backend.entity.Achievement;
import com.example.backend.entity.User;
import com.example.backend.entity.UserAchievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserAchievementRepository extends JpaRepository<UserAchievement, Long> {
    List<UserAchievement> findByUser(User user);

    void deleteByUser(User user);

    Optional<UserAchievement> findByUserAndAchievement(User user, Achievement achievement);
}
