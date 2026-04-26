package com.riderenting.bike.web;

import com.riderenting.bike.domain.BikeStatus;
import com.riderenting.bike.dto.BikeDtos.BikePricingResponse;
import com.riderenting.bike.dto.BikeDtos.BikeResponse;
import com.riderenting.bike.dto.BikeDtos.BikeStatsResponse;
import com.riderenting.bike.dto.BikeDtos.CreateBikeRequest;
import com.riderenting.bike.service.BikeService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bikes")
public class BikeController {

    private final BikeService bikeService;

    public BikeController(BikeService bikeService) {
        this.bikeService = bikeService;
    }

    @PostMapping
    public BikeResponse createBike(@Valid @RequestBody CreateBikeRequest request) {
        return bikeService.createBike(request);
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

    @PatchMapping("/{bikeId}/status")
    public BikeResponse updateStatus(@PathVariable("bikeId") Long bikeId,
                                     @RequestParam("status") BikeStatus status) {
        return bikeService.updateStatus(bikeId, status);
    }

    @GetMapping("/stats")
    public BikeStatsResponse getStats() {
        return bikeService.getStats();
    }
}
