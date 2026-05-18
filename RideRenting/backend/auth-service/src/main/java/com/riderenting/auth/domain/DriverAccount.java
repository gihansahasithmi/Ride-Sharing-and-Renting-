package com.riderenting.auth.domain;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("DRIVER")
public class DriverAccount extends UserAccount {

    public DriverAccount() {
        setRole(UserRole.DRIVER);
    }
}
