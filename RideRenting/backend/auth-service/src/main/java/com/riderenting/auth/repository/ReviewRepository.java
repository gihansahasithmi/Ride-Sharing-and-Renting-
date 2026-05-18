package com.riderenting.auth.repository;

import com.riderenting.auth.domain.Review;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findAllByOrderByCreatedAtDesc();
    List<Review> findByUserIdOrderByCreatedAtDesc(Long userId);
}
