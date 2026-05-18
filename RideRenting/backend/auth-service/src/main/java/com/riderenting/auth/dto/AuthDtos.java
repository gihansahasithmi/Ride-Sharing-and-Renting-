package com.riderenting.auth.dto;

import com.riderenting.auth.domain.UserAccount;
import com.riderenting.auth.domain.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank String username,
            @NotBlank String fullName,
            @Email @NotBlank String email,
            @NotBlank String password,
            @NotNull UserRole role,
            @NotBlank String phoneNumber
    ) {
    }

    public record LoginRequest(
            @NotBlank String username,
            @NotBlank String password
    ) {
    }

    public record UserResponse(
            Long id,
            String username,
            String fullName,
            String email,
            UserRole role,
            String phoneNumber,
            boolean active
    ) {
        public static UserResponse fromEntity(UserAccount entity) {
            return new UserResponse(
                    entity.getId(),
                    entity.getUsername(),
                    entity.getFullName(),
                    entity.getEmail(),
                    entity.getRole(),
                    entity.getPhoneNumber(),
                    entity.isActive()
            );
        }
    }

    public record AuthResponse(
            String message,
            UserResponse user
    ) {
    }

    public record StatsResponse(
            long totalUsers,
            long totalOwners,
            long totalDrivers,
            long totalAdmins
    ) {
    }

    public record UpdateProfileRequest(
            @NotBlank String fullName,
            @Email @NotBlank String email,
            @NotBlank String phoneNumber
    ) {
    }

    public record DeleteProfileRequest(
            @NotBlank String password
    ) {
    }

    public record CreateReviewRequest(
            @Min(1) @Max(5) Integer rating,
            @NotBlank String comment
    ) {
    }

    public record UpdateReviewRequest(
            @Min(1) @Max(5) Integer rating,
            @NotBlank String comment
    ) {
    }

    public record ReviewResponse(
            Long id,
            Long userId,
            String userName,
            String userRole,
            Integer rating,
            String comment,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
    }
}
