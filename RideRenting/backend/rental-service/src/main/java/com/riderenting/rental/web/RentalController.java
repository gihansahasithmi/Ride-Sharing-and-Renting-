package com.riderenting.rental.web;

import com.riderenting.rental.domain.RentalStatus;
import com.riderenting.rental.domain.SlipUploaderRole;
import com.riderenting.rental.dto.RentalDtos.CreateRentalRequest;
import com.riderenting.rental.dto.RentalDtos.RentalResponse;
import com.riderenting.rental.dto.RentalDtos.RentalStatsResponse;
import com.riderenting.rental.service.RentalService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/rentals")
public class RentalController {

    private final RentalService rentalService;

    public RentalController(RentalService rentalService) {
        this.rentalService = rentalService;
    }

    @PostMapping
    public RentalResponse createRental(@Valid @RequestBody CreateRentalRequest request) {
        return rentalService.createRental(request);
    }

    @PostMapping(path = "/{rentalId}/slip", consumes = {"multipart/form-data"})
    public RentalResponse uploadSlip(@PathVariable("rentalId") Long rentalId,
                                     @RequestPart("file") MultipartFile file,
                                     @RequestParam("uploaderRole") SlipUploaderRole uploaderRole,
                                     @RequestParam("paymentReference") String paymentReference,
                                     @RequestParam(value = "notes", required = false) String notes) {
        return rentalService.uploadSlip(rentalId, file, uploaderRole, paymentReference, notes);
    }

    @PatchMapping("/{rentalId}/status")
    public RentalResponse updateStatus(@PathVariable("rentalId") Long rentalId,
                                       @RequestParam("status") RentalStatus status,
                                       @RequestParam(value = "notes", required = false) String notes) {
        return rentalService.updateStatus(rentalId, status, notes);
    }

    @GetMapping
    public List<RentalResponse> getAllRentals() {
        return rentalService.getAllRentals();
    }

    @GetMapping("/user/{userId}")
    public List<RentalResponse> getUserRentals(@PathVariable("userId") Long userId) {
        return rentalService.getUserRentals(userId);
    }

    @GetMapping("/owner/{ownerId}")
    public List<RentalResponse> getOwnerRentals(@PathVariable("ownerId") Long ownerId) {
        return rentalService.getOwnerRentals(ownerId);
    }

    @GetMapping("/{rentalId}/slip")
    public ResponseEntity<Resource> getPaymentSlip(@PathVariable("rentalId") Long rentalId) {
        return rentalService.getPaymentSlip(rentalId);
    }

    @GetMapping("/stats")
    public RentalStatsResponse getStats() {
        return rentalService.getStats();
    }
}
