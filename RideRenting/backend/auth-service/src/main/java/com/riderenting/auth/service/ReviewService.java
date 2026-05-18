package com.riderenting.auth.service;

import com.riderenting.auth.domain.Review;
import com.riderenting.auth.dto.AuthDtos.CreateReviewRequest;
import com.riderenting.auth.dto.AuthDtos.ReviewResponse;
import com.riderenting.auth.dto.AuthDtos.UpdateReviewRequest;
import com.riderenting.auth.repository.ReviewRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;

    public ReviewService(ReviewRepository reviewRepository) {
        this.reviewRepository = reviewRepository;
    }

    public ReviewResponse createReview(Long userId, String userName, String userRole, CreateReviewRequest request) {
        if (request.rating() < 1 || request.rating() > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rating must be between 1 and 5");
        }

        Review review = new Review(userId, userName, userRole, request.rating(), request.comment());
        Review saved = reviewRepository.save(review);
        return toResponse(saved);
    }

    public List<ReviewResponse> getAllReviews() {
        return reviewRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ReviewResponse> getUserReviews(Long userId) {
        return reviewRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ReviewResponse updateReview(Long reviewId, Long userId, UpdateReviewRequest request) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));

        if (!review.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only update your own reviews");
        }

        if (request.rating() < 1 || request.rating() > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rating must be between 1 and 5");
        }

        review.setRating(request.rating());
        review.setComment(request.comment());
        Review updated = reviewRepository.save(review);
        return toResponse(updated);
    }

    public void deleteReview(Long reviewId, Long userId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));

        if (!review.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete your own reviews");
        }

        reviewRepository.deleteById(reviewId);
    }

    private ReviewResponse toResponse(Review review) {
        return new ReviewResponse(
                review.getId(),
                review.getUserId(),
                review.getUserName(),
                review.getUserRole(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt(),
                review.getUpdatedAt()
        );
    }
}
