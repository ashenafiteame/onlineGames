package com.example.backend.controller;

import com.example.backend.entity.User;
import com.example.backend.service.AchievementService;
import com.example.backend.service.UserService;
import com.example.backend.repository.ActivityRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.security.Principal;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class ProfileControllerTest {

    private MockMvc mockMvc;

    @Mock
    private UserService userService;

    @Mock
    private AchievementService achievementService;

    @Mock
    private ActivityRepository activityRepository;

    @InjectMocks
    private ProfileController profileController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(profileController).build();
    }

    @Test
    void getProfile_Success() throws Exception {
        // Arrange
        User user = new User();
        user.setUsername("testuser");
        when(userService.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(achievementService.getUserAchievements(user)).thenReturn(Collections.emptyList());
        when(activityRepository.findByUserOrderByCreatedAtDesc(user)).thenReturn(Collections.emptyList());

        // Act & Assert
        mockMvc.perform(get("/api/profiles/testuser"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.username").value("testuser"));
    }

    @Test
    void updateProfile_Success() throws Exception {
        // Arrange
        Principal principal = mock(Principal.class);
        when(principal.getName()).thenReturn("testuser");
        User user = new User();
        user.setUsername("testuser");
        when(userService.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(userService.saveUser(any(User.class))).thenReturn(user);

        Map<String, String> payload = new HashMap<>();
        payload.put("bio", "New Bio");
        payload.put("twitter", "@tester");

        // Act & Assert
        mockMvc.perform(put("/api/profiles/me")
                .principal(principal)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                        "{\"bio\":\"New Bio\", \"twitter\":\"@tester\", \"displayName\":\"Test User\", \"avatarEmoji\":\"🐱\"}"))
                .andExpect(status().isOk());

        verify(userService).saveUser(argThat(u -> "New Bio".equals(u.getBio()) && "@tester".equals(u.getTwitter()) &&
                "Test User".equals(u.getDisplayName()) && "🐱".equals(u.getAvatarEmoji())));
    }
}
