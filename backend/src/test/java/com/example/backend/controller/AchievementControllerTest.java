package com.example.backend.controller;

import com.example.backend.entity.User;
import com.example.backend.service.AchievementService;
import com.example.backend.service.UserService;
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
import java.util.Optional;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AchievementControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AchievementService achievementService;

    @Mock
    private UserService userService;

    @InjectMocks
    private AchievementController achievementController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(achievementController).build();
    }

    @Test
    void getMyAchievements_Success() throws Exception {
        // Arrange
        Principal principal = mock(Principal.class);
        when(principal.getName()).thenReturn("testuser");
        User user = new User();
        user.setUsername("testuser");

        when(userService.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(achievementService.getUserAchievements(user)).thenReturn(Collections.emptyList());

        // Act & Assert
        mockMvc.perform(get("/api/achievements/my").principal(principal))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }
}
