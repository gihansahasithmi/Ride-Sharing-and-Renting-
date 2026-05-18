package com.riderenting.auth.domain;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("ADMIN")
public class AdminAccount extends UserAccount {

    public AdminAccount() {
        setRole(UserRole.ADMIN);
    }
}
