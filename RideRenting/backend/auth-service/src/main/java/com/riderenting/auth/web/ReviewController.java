package com.riderenting.auth.web;

import com.riderenting.auth.domain.UserAccount;
import com.riderenting.auth.repository.UserAccountRepository;
import com.riderenting.auth.dto.AuthDtos.CreateReviewRequest;
import com.riderenting.auth.dto.AuthDtos.ReviewResponse;
import com.riderenting.auth.dto.AuthDtos.UpdateReviewRequest;
import com.riderenting.auth.service.ReviewService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;
    private final UserAccountRepository userAccountRepository;

    public ReviewController(ReviewService reviewService, UserAccountRepository userAccountRepository) {
        this.reviewService = reviewService;
        this.userAccountRepository = userAccountRepository;
    }

    @PostMapping("/{userId}")
    public ReviewResponse createReview(
            @PathVariable Long userId,
            @Valid @RequestBody CreateReviewRequest request) {
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return reviewService.createReview(userId, user.getFullName(), user.getRole().toString(), request);
    }

    @GetMapping
    public List<ReviewResponse> getAllReviews() {
        return reviewService.getAllReviews();
    }

    @GetMapping("/user/{userId}")
    public List<ReviewResponse> getUserReviews(@PathVariable Long userId) {
        return reviewService.getUserReviews(userId);
    }

    @PutMapping("/{reviewId}/{userId}")
    public ReviewResponse updateReview(
            @PathVariable Long reviewId,
            @PathVariable Long userId,
            @Valid @RequestBody UpdateReviewRequest request) {
        return reviewService.updateReview(reviewId, userId, request);
    }

    @DeleteMapping("/{reviewId}/{userId}")
    public void deleteReview(
            @PathVariable Long reviewId,
            @PathVariable Long userId) {
        reviewService.deleteReview(reviewId, userId);
    }
}
