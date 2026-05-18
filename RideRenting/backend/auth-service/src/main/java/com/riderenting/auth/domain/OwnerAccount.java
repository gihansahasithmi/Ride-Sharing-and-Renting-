package com.riderenting.auth.domain;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("OWNER")
public class OwnerAccount extends UserAccount {

    public OwnerAccount() {
        setRole(UserRole.OWNER);
    }
}
