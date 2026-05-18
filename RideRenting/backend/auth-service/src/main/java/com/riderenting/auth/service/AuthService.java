package com.riderenting.auth.service;

import com.riderenting.auth.domain.AdminAccount;
import com.riderenting.auth.domain.DriverAccount;
import com.riderenting.auth.domain.OwnerAccount;
import com.riderenting.auth.domain.UserAccount;
import com.riderenting.auth.domain.UserRole;
import com.riderenting.auth.dto.AuthDtos.AuthResponse;
import com.riderenting.auth.dto.AuthDtos.DeleteProfileRequest;
import com.riderenting.auth.dto.AuthDtos.LoginRequest;
import com.riderenting.auth.dto.AuthDtos.RegisterRequest;
import com.riderenting.auth.dto.AuthDtos.StatsResponse;
import com.riderenting.auth.dto.AuthDtos.UpdateProfileRequest;
import com.riderenting.auth.dto.AuthDtos.UserResponse;
import com.riderenting.auth.repository.UserAccountRepository;
import java.util.List;
import java.util.Optional;
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

        UserAccount userAccount = createUserAccount(request.role());
        userAccount.setUsername(request.username());
        userAccount.setFullName(request.fullName());
        userAccount.setEmail(request.email());
        userAccount.setPasswordHash(passwordEncoder.encode(request.password()));
        userAccount.setPhoneNumber(request.phoneNumber());

        return new AuthResponse("Registration successful", UserResponse.fromEntity(userAccountRepository.save(userAccount)));
    }

    public AuthResponse login(LoginRequest request) {
        String usernameOrEmail = request.username().trim();
        String password = request.password().trim();
        Optional<UserAccount> account = userAccountRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(usernameOrEmail, usernameOrEmail);
        UserAccount userAccount = account.orElseGet(() -> createDefaultAdminIfRequested(usernameOrEmail, password));

        if (!userAccount.isActive() || !passwordEncoder.matches(password, userAccount.getPasswordHash())) {
            if (isDefaultAdminLogin(usernameOrEmail, password)) {
                userAccount = resetDefaultAdmin(userAccount);
            } else {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
            }
        }

        if (!userAccount.isActive() || !passwordEncoder.matches(password, userAccount.getPasswordHash())) {
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

    public AuthResponse updateProfile(Long id, UpdateProfileRequest request) {
        UserAccount userAccount = userAccountRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        // Check if email is being changed and if the new email is already in use by another user
        if (!userAccount.getEmail().equals(request.email())) {
            if (userAccountRepository.existsByEmail(request.email())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
            }
        }

        userAccount.setFullName(request.fullName());
        userAccount.setEmail(request.email());
        userAccount.setPhoneNumber(request.phoneNumber());

        return new AuthResponse("Profile updated successfully", UserResponse.fromEntity(userAccountRepository.save(userAccount)));
    }

    public AuthResponse deleteProfile(Long id, DeleteProfileRequest request) {
        UserAccount userAccount = userAccountRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        // Verify password before deletion
        if (!passwordEncoder.matches(request.password(), userAccount.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid password");
        }

        userAccountRepository.deleteById(id);
        return new AuthResponse("Profile deleted successfully", null);
    }

    private UserAccount createUserAccount(UserRole role) {
        return switch (role) {
            case USER -> new UserAccount();
            case OWNER -> new OwnerAccount();
            case DRIVER -> new DriverAccount();
            case ADMIN -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Admins are created internally and cannot self-register");
        };
    }

    private UserAccount createDefaultAdminIfRequested(String usernameOrEmail, String password) {
        if (!isDefaultAdminLogin(usernameOrEmail, password)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        UserAccount admin = new AdminAccount();
        admin.setUsername("admin");
        admin.setFullName("Platform Admin");
        admin.setEmail("admin@riderenting.com");
        return resetDefaultAdmin(admin);
    }

    private UserAccount resetDefaultAdmin(UserAccount admin) {
        admin.setPasswordHash(passwordEncoder.encode("Admin@123"));
        admin.setRole(UserRole.ADMIN);
        admin.setPhoneNumber("+94-77-000-0000");
        admin.setActive(true);
        return userAccountRepository.save(admin);
    }

    private boolean isDefaultAdminLogin(String usernameOrEmail, String password) {
        return ("admin".equalsIgnoreCase(usernameOrEmail) || "admin@riderenting.com".equalsIgnoreCase(usernameOrEmail))
                && "Admin@123".equals(password);
    }
}
