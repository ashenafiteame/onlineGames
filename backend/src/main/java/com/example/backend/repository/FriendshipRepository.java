package com.example.backend.repository;

import com.example.backend.entity.Friendship;
import com.example.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {
    @Query("SELECT f FROM Friendship f WHERE f.user1 = :user OR f.user2 = :user")
    List<Friendship> findByAnyUser(@org.springframework.data.repository.query.Param("user") User user);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM Friendship f WHERE f.user1 = :user OR f.user2 = :user")
    void deleteByAnyUser(@org.springframework.data.repository.query.Param("user") User user);

    @Query("SELECT f FROM Friendship f WHERE (f.user1 = :u1 AND f.user2 = :u2) OR (f.user1 = :u2 AND f.user2 = :u1)")
    java.util.Optional<Friendship> findByUsers(@org.springframework.data.repository.query.Param("u1") User u1,
            @org.springframework.data.repository.query.Param("u2") User u2);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM Friendship f WHERE (f.user1 = :u1 AND f.user2 = :u2) OR (f.user1 = :u2 AND f.user2 = :u1)")
    void deleteByUsers(@org.springframework.data.repository.query.Param("u1") User u1,
            @org.springframework.data.repository.query.Param("u2") User u2);
}
