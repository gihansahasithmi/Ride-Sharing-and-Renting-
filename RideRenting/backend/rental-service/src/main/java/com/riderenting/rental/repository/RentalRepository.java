package com.riderenting.rental.repository;

import com.riderenting.rental.domain.Rental;
import com.riderenting.rental.domain.RentalStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RentalRepository extends JpaRepository<Rental, Long> {

    List<Rental> findByUserId(Long userId);

    List<Rental> findByOwnerId(Long ownerId);

    List<Rental> findByStatus(RentalStatus status);
}
