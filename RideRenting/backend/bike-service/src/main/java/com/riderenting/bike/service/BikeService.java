package com.riderenting.bike.service;

import com.riderenting.bike.domain.Bike;
import com.riderenting.bike.domain.BikeStatus;
import com.riderenting.bike.dto.BikeDtos.BikePricingResponse;
import com.riderenting.bike.dto.BikeDtos.BikeResponse;
import com.riderenting.bike.dto.BikeDtos.BikeStatsResponse;
import com.riderenting.bike.dto.BikeDtos.CreateBikeRequest;
import com.riderenting.bike.dto.BikeDtos.UpdateBikeRequest;
import java.io.IOException;
import com.riderenting.bike.repository.BikeRepository;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class BikeService {

    private final BikeRepository bikeRepository;
    private final String publicBaseUrl;

    public BikeService(BikeRepository bikeRepository,
                       @Value("${app.public-base-url}") String publicBaseUrl) {
        this.bikeRepository = bikeRepository;
        this.publicBaseUrl = publicBaseUrl;
    }

    @Transactional
    public BikeResponse createBike(CreateBikeRequest request, MultipartFile imageFile) {
        if (bikeRepository.existsByRegistrationNumber(request.registrationNumber())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Registration number already exists");
        }
        if (imageFile == null || imageFile.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bike image is required");
        }
        if (imageFile.getContentType() == null || !imageFile.getContentType().startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uploaded file must be an image");
        }

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
        bike.setImageUrl("uploading");
        bike.setStatus(BikeStatus.AVAILABLE);

        try {
            bike.setImageData(imageFile.getBytes());
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unable to read uploaded image");
        }

        bike.setImageOriginalFileName(imageFile.getOriginalFilename());
        bike.setImageContentType(imageFile.getContentType());

        Bike savedBike = bikeRepository.save(bike);
        savedBike.setImageUrl(publicBaseUrl + "/api/bikes/" + savedBike.getId() + "/image");
        return BikeResponse.fromEntity(bikeRepository.save(savedBike));
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

    @Transactional(readOnly = true)
    public ResponseEntity<Resource> getBikeImage(Long bikeId) {
        Bike bike = bikeRepository.findById(bikeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bike not found"));

        byte[] imageBytes = bike.getImageData();
        if (imageBytes == null || imageBytes.length == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Bike image not found");
        }

        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        if (bike.getImageContentType() != null && !bike.getImageContentType().isBlank()) {
            mediaType = MediaType.parseMediaType(bike.getImageContentType());
        }

        String fileName = bike.getImageOriginalFileName() != null && !bike.getImageOriginalFileName().isBlank()
                ? bike.getImageOriginalFileName()
                : "bike-image-" + bikeId;

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline().filename(fileName).build().toString())
                .body(new ByteArrayResource(imageBytes));
    }

    @Transactional
    public BikeResponse updateBike(Long bikeId, Long ownerId, UpdateBikeRequest request, MultipartFile imageFile) {
        Bike bike = bikeRepository.findById(bikeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bike not found"));

        // Verify ownership
        if (!bike.getOwnerId().equals(ownerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only update your own bikes");
        }

        // Update bike details
        bike.setBrand(request.brand());
        bike.setModel(request.model());
        bike.setEngineCapacityCc(request.engineCapacityCc());
        bike.setHourlyRate(request.hourlyRate());
        bike.setDescription(request.description());
        bike.setLocation(request.location());

        // Update image if provided
        if (imageFile != null && !imageFile.isEmpty()) {
            if (imageFile.getContentType() == null || !imageFile.getContentType().startsWith("image/")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uploaded file must be an image");
            }

            try {
                bike.setImageData(imageFile.getBytes());
            } catch (IOException exception) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unable to read uploaded image");
            }

            bike.setImageOriginalFileName(imageFile.getOriginalFilename());
            bike.setImageContentType(imageFile.getContentType());
        }

        Bike updatedBike = bikeRepository.save(bike);
        return BikeResponse.fromEntity(updatedBike);
    }

    @Transactional
    public void deleteBike(Long bikeId, Long ownerId) {
        Bike bike = bikeRepository.findById(bikeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bike not found"));

        // Verify ownership
        if (!bike.getOwnerId().equals(ownerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete your own bikes");
        }

        // Prevent deletion if bike is currently rented
        if (bike.getStatus() == BikeStatus.RENTED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot delete a bike that is currently rented");
        }

        bikeRepository.delete(bike);
    }
}
