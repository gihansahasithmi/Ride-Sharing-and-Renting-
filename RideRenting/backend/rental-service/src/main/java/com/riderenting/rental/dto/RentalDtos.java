package com.riderenting.rental.dto;

import com.riderenting.rental.domain.Rental;
import com.riderenting.rental.domain.RentalStatus;
import com.riderenting.rental.domain.SlipUploaderRole;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class RentalDtos {

    private RentalDtos() {
    }

    public record CreateRentalRequest(
            @NotNull Long bikeId,
            @NotNull Long userId,
            @NotBlank String userName,
            @NotNull @Min(1) Integer hoursBooked,
            @NotNull LocalDateTime pickupTime
    ) {
    }

    public record RentalResponse(
            Long id,
            Long bikeId,
            String bikeName,
            Long ownerId,
            Long userId,
            String userName,
            Integer hoursBooked,
            BigDecimal hourlyRate,
            BigDecimal totalAmount,
            RentalStatus status,
            LocalDateTime pickupTime,
            LocalDateTime returnTime,
            String paymentReference,
            String slipOriginalFileName,
            String slipContentType,
            boolean hasPaymentSlip,
            SlipUploaderRole slipUploadedBy,
            String notes
    ) {
        public static RentalResponse fromEntity(Rental rental) {
            return new RentalResponse(
                    rental.getId(),
                    rental.getBikeId(),
                    rental.getBikeName(),
                    rental.getOwnerId(),
                    rental.getUserId(),
                    rental.getUserName(),
                    rental.getHoursBooked(),
                    rental.getHourlyRate(),
                    rental.getTotalAmount(),
                    rental.getStatus(),
                    rental.getPickupTime(),
                    rental.getReturnTime(),
                    rental.getPaymentReference(),
                    rental.getSlipOriginalFileName(),
                    rental.getSlipContentType(),
                    rental.getPaymentSlip() != null && rental.getPaymentSlip().length > 0,
                    rental.getSlipUploadedBy(),
                    rental.getNotes()
            );
        }
    }

    public record RentalStatsResponse(
            long totalRentals,
            BigDecimal totalRevenue,
            long pendingPayments,
            long approvedRentals,
            List<RentalResponse> rentals
    ) {
    }

    public record BikePricingResponse(
            Long bikeId,
            String bikeName,
            Long ownerId,
            BigDecimal hourlyRate,
            String status
    ) {
    }
}
