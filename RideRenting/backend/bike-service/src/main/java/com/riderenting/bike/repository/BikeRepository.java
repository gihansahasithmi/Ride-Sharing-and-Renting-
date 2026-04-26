package com.riderenting.bike.repository;

import com.riderenting.bike.domain.Bike;
import com.riderenting.bike.domain.BikeStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BikeRepository extends JpaRepository<Bike, Long> {

    List<Bike> findByStatus(BikeStatus status);

    List<Bike> findByOwnerId(Long ownerId);
}
