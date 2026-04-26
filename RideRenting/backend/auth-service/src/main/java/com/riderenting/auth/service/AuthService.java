package com.riderenting.auth.service;

import com.riderenting.auth.domain.UserAccount;
import com.riderenting.auth.domain.UserRole;
import com.riderenting.auth.dto.AuthDtos.AuthResponse;
import com.riderenting.auth.dto.AuthDtos.LoginRequest;
import com.riderenting.auth.dto.AuthDtos.RegisterRequest;
import com.riderenting.auth.dto.AuthDtos.StatsResponse;
import com.riderenting.auth.dto.AuthDtos.UserResponse;
import com.riderenting.auth.repository.UserAccountRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserAccountRepository userAccountRepository, PasswordEncoder passwordEncoder) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse register(RegisterRequest request) {
        if (request.role() == UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Admins are created internally and cannot self-register");
        }
        if (userAccountRepository.existsByUsername(request.username())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
        }
        if (userAccountRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        UserAccount userAccount = new UserAccount();
        userAccount.setUsername(request.username());
        userAccount.setFullName(request.fullName());
        userAccount.setEmail(request.email());
        userAccount.setPasswordHash(passwordEncoder.encode(request.password()));
        userAccount.setRole(request.role());
        userAccount.setPhoneNumber(request.phoneNumber());

        return new AuthResponse("Registration successful", UserResponse.fromEntity(userAccountRepository.save(userAccount)));
    }

    public AuthResponse login(LoginRequest request) {
        UserAccount userAccount = userAccountRepository.findByUsername(request.username())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!userAccount.isActive() || !passwordEncoder.matches(request.password(), userAccount.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        return new AuthResponse("Login successful", UserResponse.fromEntity(userAccount));
    }

    public List<UserResponse> getAllUsers() {
        return userAccountRepository.findAll().stream()
                .map(UserResponse::fromEntity)
                .toList();
    }

    public StatsResponse getStats() {
        return new StatsResponse(
                userAccountRepository.findByRole(UserRole.USER).size(),
                userAccountRepository.findByRole(UserRole.OWNER).size(),
                userAccountRepository.findByRole(UserRole.DRIVER).size(),
                userAccountRepository.findByRole(UserRole.ADMIN).size()
        );
    }
}
