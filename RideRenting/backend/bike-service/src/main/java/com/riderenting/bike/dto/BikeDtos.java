package com.riderenting.bike.dto;

import com.riderenting.bike.domain.Bike;
import com.riderenting.bike.domain.BikeStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public final class BikeDtos {

    private BikeDtos() {
    }

    public record CreateBikeRequest(
            @NotNull Long ownerId,
            @NotBlank String ownerName,
            @NotBlank String brand,
            @NotBlank String model,
            @NotBlank String registrationNumber,
            @NotNull @Min(50) Integer engineCapacityCc,
            @NotNull @DecimalMin("0.01") BigDecimal hourlyRate,
            @NotBlank String description,
            @NotBlank String location,
            @NotBlank String imageUrl
    ) {
    }

    public record BikeResponse(
            Long id,
            Long ownerId,
            String ownerName,
            String brand,
            String model,
            String registrationNumber,
            Integer engineCapacityCc,
            BigDecimal hourlyRate,
            String description,
            String location,
            String imageUrl,
            BikeStatus status
    ) {
        public static BikeResponse fromEntity(Bike bike) {
            return new BikeResponse(
                    bike.getId(),
                    bike.getOwnerId(),
                    bike.getOwnerName(),
                    bike.getBrand(),
                    bike.getModel(),
                    bike.getRegistrationNumber(),
                    bike.getEngineCapacityCc(),
                    bike.getHourlyRate(),
                    bike.getDescription(),
                    bike.getLocation(),
                    bike.getImageUrl(),
                    bike.getStatus()
            );
        }
    }

    public record BikePricingResponse(
            Long bikeId,
            String bikeName,
            Long ownerId,
            BigDecimal hourlyRate,
            BikeStatus status
    ) {
    }

    public record BikeStatsResponse(
            long totalBikes,
            long availableBikes,
            long rentedBikes,
            List<BikeResponse> bikes
    ) {
    }
}
