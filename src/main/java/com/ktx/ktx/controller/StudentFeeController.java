
package com.ktx.ktx.controller;

import com.ktx.ktx.entity.Fee;
import com.ktx.ktx.entity.Payment;
import com.ktx.ktx.entity.User;
import com.ktx.ktx.repository.FeeRepository;
import com.ktx.ktx.repository.PaymentRepository;
import com.ktx.ktx.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.security.Principal;
import java.util.*;

@RestController
@RequestMapping("/api/student/fees")
public class StudentFeeController {

    private final FeeRepository feeRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;

    public StudentFeeController(
            FeeRepository feeRepository,
            PaymentRepository paymentRepository,
            UserRepository userRepository) {
        this.feeRepository = feeRepository;
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
    }

    private BigDecimal getPaidAmount(Long feeId) {
        return paymentRepository.findByFeeIdOrderByPaidAtDesc(feeId)
                .stream()
                .map(Payment::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private Map<String, Object> toFeeMap(Fee fee) {
        BigDecimal amount = fee.getAmount() == null
                ? BigDecimal.ZERO : fee.getAmount();

        BigDecimal paid = getPaidAmount(fee.getId());
        BigDecimal remaining = amount.subtract(paid);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", fee.getId());
        data.put("feeName", fee.getFeeName());
        data.put("billingMonth", fee.getBillingMonth());
        data.put("dueDate", fee.getDueDate());
        data.put("amount", amount);
        data.put("paidAmount", paid);
        data.put("remainingAmount", remaining);
        data.put("status", fee.getStatus());

        if (fee.getContract() != null) {
            data.put("contractNumber",
                    fee.getContract().getContractNumber());
        }

        return data;
    }

    /*
     * GET /api/student/fees
     * Chỉ lấy khoản phí thuộc tài khoản đang đăng nhập.
     */
    @GetMapping
    public ResponseEntity<?> getMyFees(Principal principal) {
        if (principal == null || principal.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Vui lòng đăng nhập."));
        }

        Optional<User> optionalUser =
                userRepository.findByUsername(principal.getName());

        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message",
                            "Không tìm thấy tài khoản đang đăng nhập."));
        }

        User student = optionalUser.get();

        List<Map<String, Object>> result =
                feeRepository
                        .findByContractRegistrationStudentIdOrderByBillingMonthDesc(
                                student.getId())
                        .stream()
                        .map(this::toFeeMap)
                        .toList();

        return ResponseEntity.ok(result);
    }

    /*
     * GET /api/student/fees/{id}/payments
     * Chỉ trả lịch sử khi khoản phí thuộc sinh viên hiện tại.
     */
    @GetMapping("/{id}/payments")
    public ResponseEntity<?> getMyPaymentHistory(
            @PathVariable Long id,
            Principal principal) {

        if (principal == null || principal.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Vui lòng đăng nhập."));
        }

        Optional<User> optionalUser =
                userRepository.findByUsername(principal.getName());

        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message",
                            "Không tìm thấy tài khoản đang đăng nhập."));
        }

        User student = optionalUser.get();

        Optional<Fee> optionalFee = feeRepository.findById(id);

        if (optionalFee.isEmpty()
                || optionalFee.get().getContract() == null
                || optionalFee.get().getContract().getRegistration() == null
                || optionalFee.get().getContract()
                .getRegistration().getStudent() == null
                || !Objects.equals(
                optionalFee.get().getContract()
                        .getRegistration().getStudent().getId(),
                student.getId())) {

            // Không tiết lộ khoản phí có thuộc người khác hay không.
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message",
                            "Không tìm thấy khoản phí."));
        }

        List<Map<String, Object>> result =
                paymentRepository.findByFeeIdOrderByPaidAtDesc(id)
                        .stream()
                        .map(payment -> {
                            Map<String, Object> item =
                                    new LinkedHashMap<>();

                            item.put("id", payment.getId());
                            item.put("amount", payment.getAmount());
                            item.put("paymentMethod",
                                    payment.getPaymentMethod());
                            item.put("referenceCode",
                                    payment.getReferenceCode());
                            item.put("note", payment.getNote());
                            item.put("paidAt", payment.getPaidAt());
                            item.put("receivedBy",
                                    payment.getReceivedBy());

                            return item;
                        })
                        .toList();

        return ResponseEntity.ok(result);
    }
}
