package com.riderenting.rental.service;

import com.riderenting.rental.domain.Rental;
import com.riderenting.rental.domain.RentalStatus;
import com.riderenting.rental.domain.SlipUploaderRole;
import com.riderenting.rental.dto.RentalDtos.BikePricingResponse;
import com.riderenting.rental.dto.RentalDtos.CreateRentalRequest;
import com.riderenting.rental.dto.RentalDtos.RentalResponse;
import com.riderenting.rental.dto.RentalDtos.RentalStatsResponse;
import com.riderenting.rental.repository.RentalRepository;
import java.io.IOException;
import java.math.BigDecimal;
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
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RentalService {

    private final RentalRepository rentalRepository;
    private final RestClient.Builder restClientBuilder;
    private final String bikeServiceUrl;

    public RentalService(RentalRepository rentalRepository,
                         RestClient.Builder restClientBuilder,
                         @Value("${services.bike-service.url}") String bikeServiceUrl) {
        this.rentalRepository = rentalRepository;
        this.restClientBuilder = restClientBuilder;
        this.bikeServiceUrl = bikeServiceUrl;
    }

    @Transactional
    public RentalResponse createRental(CreateRentalRequest request) {
        BikePricingResponse pricing = restClientBuilder.build()
                .get()
                .uri(bikeServiceUrl + "/api/bikes/{bikeId}/pricing", request.bikeId())
                .retrieve()
                .body(BikePricingResponse.class);

        if (pricing == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to retrieve bike pricing");
        }
        if (!"AVAILABLE".equals(pricing.status())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bike is not available");
        }

        BigDecimal totalAmount = pricing.hourlyRate().multiply(BigDecimal.valueOf(request.hoursBooked()));

        Rental rental = new Rental();
        rental.setBikeId(pricing.bikeId());
        rental.setBikeName(pricing.bikeName());
        rental.setOwnerId(pricing.ownerId());
        rental.setUserId(request.userId());
        rental.setUserName(request.userName());
        rental.setHoursBooked(request.hoursBooked());
        rental.setHourlyRate(pricing.hourlyRate());
        rental.setTotalAmount(totalAmount);
        rental.setStatus(RentalStatus.PENDING_PAYMENT);
        rental.setPickupTime(request.pickupTime());
        rental.setReturnTime(request.pickupTime().plusHours(request.hoursBooked()));

        Rental savedRental = rentalRepository.save(rental);
        updateBikeStatus(savedRental.getBikeId(), "RENTED");
        return RentalResponse.fromEntity(savedRental);
    }

    @Transactional
    public RentalResponse uploadSlip(Long rentalId,
                                     MultipartFile slipFile,
                                     SlipUploaderRole uploaderRole,
                                     String paymentReference,
                                     String notes) {
        Rental rental = findRental(rentalId);

        try {
            rental.setPaymentSlip(slipFile.getBytes());
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unable to read uploaded slip");
        }

        rental.setSlipOriginalFileName(slipFile.getOriginalFilename());
        rental.setSlipContentType(slipFile.getContentType());
        rental.setSlipUploadedBy(uploaderRole);
        rental.setPaymentReference(paymentReference);
        rental.setNotes(notes);
        rental.setStatus(RentalStatus.PAYMENT_SUBMITTED);
        return RentalResponse.fromEntity(rentalRepository.save(rental));
    }

    @Transactional
    public RentalResponse updateStatus(Long rentalId, RentalStatus status, String notes) {
        Rental rental = findRental(rentalId);
        rental.setStatus(status);
        if (notes != null && !notes.isBlank()) {
            rental.setNotes(notes);
        }
        Rental savedRental = rentalRepository.save(rental);
        if (status == RentalStatus.REJECTED || status == RentalStatus.COMPLETED) {
            updateBikeStatus(savedRental.getBikeId(), "AVAILABLE");
        }
        return RentalResponse.fromEntity(savedRental);
    }

    @Transactional(readOnly = true)
    public List<RentalResponse> getAllRentals() {
        return rentalRepository.findAll().stream().map(RentalResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public List<RentalResponse> getUserRentals(Long userId) {
        return rentalRepository.findByUserId(userId).stream().map(RentalResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public List<RentalResponse> getOwnerRentals(Long ownerId) {
        return rentalRepository.findByOwnerId(ownerId).stream().map(RentalResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public RentalStatsResponse getStats() {
        List<RentalResponse> rentals = getAllRentals();
        BigDecimal totalRevenue = rentalRepository.findByStatus(RentalStatus.APPROVED).stream()
                .map(Rental::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new RentalStatsResponse(
                rentals.size(),
                totalRevenue,
                rentalRepository.findByStatus(RentalStatus.PENDING_PAYMENT).size()
                        + rentalRepository.findByStatus(RentalStatus.PAYMENT_SUBMITTED).size(),
                rentalRepository.findByStatus(RentalStatus.APPROVED).size(),
                rentals
        );
    }

    @Transactional(readOnly = true)
    public ResponseEntity<Resource> getPaymentSlip(Long rentalId) {
        Rental rental = findRental(rentalId);
        byte[] slipBytes = rental.getPaymentSlip();
        if (slipBytes == null || slipBytes.length == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment slip not found");
        }

        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        if (rental.getSlipContentType() != null && !rental.getSlipContentType().isBlank()) {
            mediaType = MediaType.parseMediaType(rental.getSlipContentType());
        }

        String fileName = rental.getSlipOriginalFileName() != null && !rental.getSlipOriginalFileName().isBlank()
                ? rental.getSlipOriginalFileName()
                : "payment-slip-" + rentalId;

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline().filename(fileName).build().toString())
                .body(new ByteArrayResource(slipBytes));
    }

    private Rental findRental(Long rentalId) {
        return rentalRepository.findById(rentalId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rental not found"));
    }

    private void updateBikeStatus(Long bikeId, String status) {
        restClientBuilder.build()
                .patch()
                .uri(bikeServiceUrl + "/api/bikes/{bikeId}/status?status={status}", bikeId, status)
                .retrieve()
                .toBodilessEntity();
    }
}
