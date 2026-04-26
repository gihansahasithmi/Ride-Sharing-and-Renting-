package com.riderenting.rental.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import jakarta.persistence.Basic;
import jakarta.persistence.FetchType;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "rentals")
public class Rental {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long bikeId;

    @Column(nullable = false)
    private String bikeName;

    @Column(nullable = false)
    private Long ownerId;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String userName;

    @Column(nullable = false)
    private Integer hoursBooked;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal hourlyRate;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RentalStatus status;

    @Column(nullable = false)
    private LocalDateTime pickupTime;

    @Column(nullable = false)
    private LocalDateTime returnTime;

    private String paymentReference;

    private String slipOriginalFileName;

    private String slipContentType;

    @Enumerated(EnumType.STRING)
    private SlipUploaderRole slipUploadedBy;

    @Lob
    @Basic(fetch = FetchType.LAZY)
    private byte[] paymentSlip;

    @Column(length = 1000)
    private String notes;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getBikeId() {
        return bikeId;
    }

    public void setBikeId(Long bikeId) {
        this.bikeId = bikeId;
    }

    public String getBikeName() {
        return bikeName;
    }

    public void setBikeName(String bikeName) {
        this.bikeName = bikeName;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public Integer getHoursBooked() {
        return hoursBooked;
    }

    public void setHoursBooked(Integer hoursBooked) {
        this.hoursBooked = hoursBooked;
    }

    public BigDecimal getHourlyRate() {
        return hourlyRate;
    }

    public void setHourlyRate(BigDecimal hourlyRate) {
        this.hourlyRate = hourlyRate;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public RentalStatus getStatus() {
        return status;
    }

    public void setStatus(RentalStatus status) {
        this.status = status;
    }

    public LocalDateTime getPickupTime() {
        return pickupTime;
    }

    public void setPickupTime(LocalDateTime pickupTime) {
        this.pickupTime = pickupTime;
    }

    public LocalDateTime getReturnTime() {
        return returnTime;
    }

    public void setReturnTime(LocalDateTime returnTime) {
        this.returnTime = returnTime;
    }

    public String getPaymentReference() {
        return paymentReference;
    }

    public void setPaymentReference(String paymentReference) {
        this.paymentReference = paymentReference;
    }

    public String getSlipOriginalFileName() {
        return slipOriginalFileName;
    }

    public void setSlipOriginalFileName(String slipOriginalFileName) {
        this.slipOriginalFileName = slipOriginalFileName;
    }

    public String getSlipContentType() {
        return slipContentType;
    }

    public void setSlipContentType(String slipContentType) {
        this.slipContentType = slipContentType;
    }

    public SlipUploaderRole getSlipUploadedBy() {
        return slipUploadedBy;
    }

    public void setSlipUploadedBy(SlipUploaderRole slipUploadedBy) {
        this.slipUploadedBy = slipUploadedBy;
    }

    public byte[] getPaymentSlip() {
        return paymentSlip;
    }

    public void setPaymentSlip(byte[] paymentSlip) {
        this.paymentSlip = paymentSlip;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
