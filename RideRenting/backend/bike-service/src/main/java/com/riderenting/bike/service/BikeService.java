package com.riderenting.bike.service;

import com.riderenting.bike.domain.Bike;
import com.riderenting.bike.domain.BikeStatus;
import com.riderenting.bike.dto.BikeDtos.BikePricingResponse;
import com.riderenting.bike.dto.BikeDtos.BikeResponse;
import com.riderenting.bike.dto.BikeDtos.BikeStatsResponse;
import com.riderenting.bike.dto.BikeDtos.CreateBikeRequest;
import com.riderenting.bike.repository.BikeRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class BikeService {

    private final BikeRepository bikeRepository;

    public BikeService(BikeRepository bikeRepository) {
        this.bikeRepository = bikeRepository;
    }

    public BikeResponse createBike(CreateBikeRequest request) {
        Bike bike = new Bike();
        bike.setOwnerId(request.ownerId());
        bike.setOwnerName(request.ownerName());
        bike.setBrand(request.brand());
        bike.setModel(request.model());
        bike.setRegistrationNumber(request.registrationNumber());
        bike.setEngineCapacityCc(request.engineCapacityCc());
        bike.setHourlyRate(request.hourlyRate());
        bike.setDescription(request.description());
        bike.setLocation(request.location());
        bike.setImageUrl(request.imageUrl());
        bike.setStatus(BikeStatus.AVAILABLE);
        return BikeResponse.fromEntity(bikeRepository.save(bike));
    }

    public List<BikeResponse> getAvailableBikes() {
        return bikeRepository.findByStatus(BikeStatus.AVAILABLE).stream()
                .map(BikeResponse::fromEntity)
                .toList();
    }

    public List<BikeResponse> getOwnerBikes(Long ownerId) {
        return bikeRepository.findByOwnerId(ownerId).stream()
                .map(BikeResponse::fromEntity)
                .toList();
    }

    public BikePricingResponse getPricing(Long bikeId) {
        Bike bike = bikeRepository.findById(bikeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bike not found"));
        return new BikePricingResponse(
                bike.getId(),
                bike.getBrand() + " " + bike.getModel(),
                bike.getOwnerId(),
                bike.getHourlyRate(),
                bike.getStatus()
        );
    }

    public BikeResponse updateStatus(Long bikeId, BikeStatus status) {
        Bike bike = bikeRepository.findById(bikeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bike not found"));
        bike.setStatus(status);
        return BikeResponse.fromEntity(bikeRepository.save(bike));
    }

    public BikeStatsResponse getStats() {
        List<BikeResponse> bikes = bikeRepository.findAll().stream()
                .map(BikeResponse::fromEntity)
                .toList();
        return new BikeStatsResponse(
                bikes.size(),
                bikeRepository.findByStatus(BikeStatus.AVAILABLE).size(),
                bikeRepository.findByStatus(BikeStatus.RENTED).size(),
                bikes
        );
    }
}
