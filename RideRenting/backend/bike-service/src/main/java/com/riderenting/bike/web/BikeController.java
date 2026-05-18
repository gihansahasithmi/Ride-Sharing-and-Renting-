package com.riderenting.bike.web;

import com.riderenting.bike.domain.BikeStatus;
import com.riderenting.bike.dto.BikeDtos.BikePricingResponse;
import com.riderenting.bike.dto.BikeDtos.BikeResponse;
import com.riderenting.bike.dto.BikeDtos.BikeStatsResponse;
import com.riderenting.bike.dto.BikeDtos.CreateBikeRequest;
import com.riderenting.bike.dto.BikeDtos.UpdateBikeRequest;
import com.riderenting.bike.service.BikeService;
import java.util.List;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/bikes")
public class BikeController {

    private final BikeService bikeService;

    public BikeController(BikeService bikeService) {
        this.bikeService = bikeService;
    }

    @PostMapping(consumes = {"multipart/form-data"})
    public BikeResponse createBike(@RequestParam("ownerId") Long ownerId,
                                   @RequestParam("ownerName") String ownerName,
                                   @RequestParam("brand") String brand,
                                   @RequestParam("model") String model,
                                   @RequestParam("registrationNumber") String registrationNumber,
                                   @RequestParam("engineCapacityCc") Integer engineCapacityCc,
                                   @RequestParam("hourlyRate") java.math.BigDecimal hourlyRate,
                                   @RequestParam("description") String description,
                                   @RequestParam("location") String location,
                                   @RequestPart("image") MultipartFile imageFile) {
        CreateBikeRequest request = new CreateBikeRequest(
                ownerId,
                ownerName,
                brand,
                model,
                registrationNumber,
                engineCapacityCc,
                hourlyRate,
                description,
                location
        );
        return bikeService.createBike(request, imageFile);
    }

    @GetMapping
    public List<BikeResponse> getAvailableBikes() {
        return bikeService.getAvailableBikes();
    }

    @GetMapping("/owner/{ownerId}")
    public List<BikeResponse> getOwnerBikes(@PathVariable("ownerId") Long ownerId) {
        return bikeService.getOwnerBikes(ownerId);
    }

    @GetMapping("/{bikeId}/pricing")
    public BikePricingResponse getPricing(@PathVariable("bikeId") Long bikeId) {
        return bikeService.getPricing(bikeId);
    }

    @GetMapping("/{bikeId}/image")
    public ResponseEntity<Resource> getBikeImage(@PathVariable("bikeId") Long bikeId) {
        return bikeService.getBikeImage(bikeId);
    }

    @PatchMapping("/{bikeId}/status")
    public BikeResponse updateStatus(@PathVariable("bikeId") Long bikeId,
                                     @RequestParam("status") BikeStatus status) {
        return bikeService.updateStatus(bikeId, status);
    }

    @PutMapping(path = "/{bikeId}", consumes = {"multipart/form-data"})
    public BikeResponse updateBike(@PathVariable("bikeId") Long bikeId,
                                   @RequestParam("ownerId") Long ownerId,
                                   @RequestParam("brand") String brand,
                                   @RequestParam("model") String model,
                                   @RequestParam("engineCapacityCc") Integer engineCapacityCc,
                                   @RequestParam("hourlyRate") java.math.BigDecimal hourlyRate,
                                   @RequestParam("description") String description,
                                   @RequestParam("location") String location,
                                   @RequestPart(value = "image", required = false) MultipartFile imageFile) {
        UpdateBikeRequest request = new UpdateBikeRequest(
                brand,
                model,
                engineCapacityCc,
                hourlyRate,
                description,
                location
        );
        return bikeService.updateBike(bikeId, ownerId, request, imageFile);
    }

    @DeleteMapping("/{bikeId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteBike(@PathVariable("bikeId") Long bikeId,
                          @RequestParam("ownerId") Long ownerId) {
        bikeService.deleteBike(bikeId, ownerId);
    }

    @GetMapping("/stats")
    public BikeStatsResponse getStats() {
        return bikeService.getStats();
    }
}
