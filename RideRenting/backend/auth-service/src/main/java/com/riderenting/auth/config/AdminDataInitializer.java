package com.riderenting.auth.config;

import com.riderenting.auth.domain.UserAccount;
import com.riderenting.auth.domain.UserRole;
import com.riderenting.auth.repository.UserAccountRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminDataInitializer {

    @Bean
    CommandLineRunner seedAdmin(UserAccountRepository userAccountRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (userAccountRepository.existsByUsername("admin")) {
                return;
            }

            UserAccount admin = new UserAccount();
            admin.setUsername("admin");
            admin.setFullName("Platform Admin");
            admin.setEmail("admin@riderenting.com");
            admin.setPasswordHash(passwordEncoder.encode("Admin@123"));
            admin.setRole(UserRole.ADMIN);
            admin.setPhoneNumber("+94-77-000-0000");
            admin.setActive(true);
            userAccountRepository.save(admin);
        };
    }
}
