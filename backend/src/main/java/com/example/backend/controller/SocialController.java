package com.example.backend.controller;

import com.example.backend.entity.Activity;
import com.example.backend.entity.FriendRequest;
import com.example.backend.entity.User;
import com.example.backend.service.SocialService;
import com.example.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/social")
public class SocialController {

    @Autowired
    private SocialService socialService;

    @Autowired
    private UserService userService;

    @PostMapping("/request/{username}")
    public ResponseEntity<?> sendRequest(@PathVariable String username, Principal principal) {
        User sender = userService.findByUsername(principal.getName())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        try {
            socialService.sendFriendRequest(sender, username);
            return ResponseEntity.ok("Request sent");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/accept/{requestId}")
    public ResponseEntity<?> acceptRequest(@PathVariable Long requestId, Principal principal) {
        User receiver = userService.findByUsername(principal.getName())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        try {
            socialService.acceptFriendRequest(receiver, requestId);
            return ResponseEntity.ok("Request accepted");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/requests/pending")
    public List<FriendRequest> getPendingRequests(Principal principal) {
        User user = userService.findByUsername(principal.getName())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return socialService.getPendingRequests(user);
    }

    @GetMapping("/friends")
    public List<User> getFriends(Principal principal) {
        User user = userService.findByUsername(principal.getName())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return socialService.getFriends(user);
    }

    @GetMapping("/feed")
    public List<Activity> getGlobalFeed() {
        return socialService.getGlobalFeed();
    }
}
