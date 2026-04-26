package com.riderenting.auth.web;

import com.riderenting.auth.dto.AuthDtos.AuthResponse;
import com.riderenting.auth.dto.AuthDtos.LoginRequest;
import com.riderenting.auth.dto.AuthDtos.RegisterRequest;
import com.riderenting.auth.dto.AuthDtos.StatsResponse;
import com.riderenting.auth.dto.AuthDtos.UserResponse;
import com.riderenting.auth.service.AuthService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/users")
    public List<UserResponse> getUsers() {
        return authService.getAllUsers();
    }

    @GetMapping("/stats")
    public StatsResponse getStats() {
        return authService.getStats();
    }
}
