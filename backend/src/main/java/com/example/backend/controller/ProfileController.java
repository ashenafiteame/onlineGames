package com.example.backend.controller;

import com.example.backend.dto.UserProfileDTO;
import com.example.backend.entity.User;
import com.example.backend.repository.ActivityRepository;
import com.example.backend.service.AchievementService;
import com.example.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/profiles")
public class ProfileController {

    @Autowired
    private UserService userService;

    @Autowired
    private AchievementService achievementService;

    @Autowired
    private ActivityRepository activityRepository;

    @GetMapping("/{username}")
    public ResponseEntity<UserProfileDTO> getProfile(@PathVariable String username) {
        User user = userService.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        UserProfileDTO dto = new UserProfileDTO();
        dto.setUser(user);
        dto.setAchievements(achievementService.getUserAchievements(user));
        dto.setRecentActivities(activityRepository.findByUserOrderByCreatedAtDesc(user).stream().limit(10).toList());

        return ResponseEntity.ok(dto);
    }

    @PutMapping("/me")
    public ResponseEntity<User> updateProfile(@RequestBody Map<String, String> payload, Principal principal) {
        User user = userService.findByUsername(principal.getName())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (payload.containsKey("bio"))
            user.setBio(payload.get("bio"));
        if (payload.containsKey("twitter"))
            user.setTwitter(payload.get("twitter"));
        if (payload.containsKey("discord"))
            user.setDiscord(payload.get("discord"));
        if (payload.containsKey("github"))
            user.setGithub(payload.get("github"));

        return ResponseEntity.ok(userService.saveUser(user));
    }
}
