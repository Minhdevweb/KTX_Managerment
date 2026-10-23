
package com.ktx.ktx.controller;

import com.ktx.ktx.entity.Contract;
import com.ktx.ktx.entity.Fee;
import com.ktx.ktx.entity.Payment;
import com.ktx.ktx.repository.ContractRepository;
import com.ktx.ktx.repository.FeeRepository;
import com.ktx.ktx.repository.PaymentRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/admin/fees")
public class AdminFeeController {

    private final FeeRepository feeRepository;
    private final PaymentRepository paymentRepository;
    private final ContractRepository contractRepository;

    public AdminFeeController(
            FeeRepository feeRepository,
            PaymentRepository paymentRepository,
            ContractRepository contractRepository) {
        this.feeRepository = feeRepository;
        this.paymentRepository = paymentRepository;
        this.contractRepository = contractRepository;
    }

    private BigDecimal getPaidAmount(Long feeId) {
        return paymentRepository.findByFeeIdOrderByPaidAtDesc(feeId)
                .stream()
                .map(Payment::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private Map<String, Object> toMap(Fee fee) {
        BigDecimal paid = getPaidAmount(fee.getId());
        BigDecimal amount = fee.getAmount() == null
                ? BigDecimal.ZERO : fee.getAmount();

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", fee.getId());
        data.put("contractId", fee.getContract().getId());
        data.put("contractNumber", fee.getContract().getContractNumber());
        data.put("feeName", fee.getFeeName());
        data.put("billingMonth", fee.getBillingMonth());
        data.put("dueDate", fee.getDueDate());
        data.put("amount", amount);
        data.put("paidAmount", paid);
        data.put("remainingAmount", amount.subtract(paid));
        data.put("status", fee.getStatus());

        // Thông tin sinh viên gắn với hợp đồng, nếu có
        if (fee.getContract().getRegistration() != null
                && fee.getContract().getRegistration().getStudent() != null) {
            var student = fee.getContract()
                    .getRegistration()
                    .getStudent();

            data.put("studentId", student.getId());
            data.put("studentName", student.getFullName());
            data.put("studentUsername", student.getUsername());
        }

        return data;
    }

    private void refreshStatus(Fee fee) {
        BigDecimal paid = getPaidAmount(fee.getId());

        if (paid.compareTo(fee.getAmount()) >= 0) {
            fee.setStatus("PAID");
        } else if (paid.compareTo(BigDecimal.ZERO) > 0) {
            fee.setStatus("PARTIAL");
        } else {
            fee.setStatus("UNPAID");
        }

        feeRepository.save(fee);
    }

    /**
     * Danh sách hợp đồng đang hoạt động để admin chọn khi tạo khoản phí.
     * GET /api/admin/fees/active-contracts
     */
    @GetMapping("/active-contracts")
    public ResponseEntity<?> getActiveContracts() {
        List<Map<String, Object>> result = contractRepository.findAll()
                .stream()
                .filter(Objects::nonNull)
                .filter(contract -> "ACTIVE".equalsIgnoreCase(
                        contract.getStatus()))
                .filter(contract -> contract.getRegistration() != null)
                .filter(contract -> contract.getRegistration().getStudent() != null)
                .map(contract -> {
                    var student = contract.getRegistration().getStudent();

                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", contract.getId());
                    item.put("contractNumber", contract.getContractNumber());
                    item.put("monthlyFee", contract.getMonthlyFee());
                    item.put("startDate", contract.getStartDate());
                    item.put("endDate", contract.getEndDate());
                    item.put("status", contract.getStatus());
                    item.put("studentId", student.getId());
                    item.put("studentName", student.getFullName());
                    item.put("studentUsername", student.getUsername());
                    item.put("studentEmail", student.getEmail());
                    item.put("studentPhone", student.getPhone());

                    return item;
                })
                .toList();

        return ResponseEntity.ok(result);
    }

    // Admin xem danh sách khoản phí
    @GetMapping
    public List<Map<String, Object>> getAllFees() {
        return feeRepository.findAllByOrderByBillingMonthDesc()
                .stream()
                .map(this::toMap)
                .toList();
    }

    // Admin tạo khoản phí theo tháng
    @PostMapping
    public ResponseEntity<?> createFee(
            @RequestBody Map<String, Object> body) {

        try {
            if (body.get("contractId") == null
                    || body.get("billingMonth") == null
                    || body.get("dueDate") == null) {
                return ResponseEntity.badRequest().body(
                        Map.of("message",
                                "Vui lòng chọn hợp đồng, tháng tính phí và hạn thanh toán."));
            }

            Long contractId = Long.valueOf(
                    body.get("contractId").toString());

            // HTML input type="month" gửi dạng yyyy-MM
            String monthText = body.get("billingMonth").toString();
            LocalDate billingMonth = monthText.length() == 7
                    ? LocalDate.parse(monthText + "-01")
                    : LocalDate.parse(monthText).withDayOfMonth(1);

            LocalDate dueDate = LocalDate.parse(
                    body.get("dueDate").toString());

            String feeName = Objects.toString(
                    body.get("feeName"), "Tiền phòng").trim();

            if (feeName.isBlank()) {
                return ResponseEntity.badRequest().body(
                        Map.of("message",
                                "Tên khoản thu không được để trống."));
            }

            if (dueDate.isBefore(billingMonth)) {
                return ResponseEntity.badRequest().body(
                        Map.of("message",
                                "Hạn thanh toán không được trước tháng tính phí."));
            }

            Optional<Contract> optional =
                    contractRepository.findById(contractId);

            if (optional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Không tìm thấy hợp đồng."));
            }

            Contract contract = optional.get();

            if (!"ACTIVE".equalsIgnoreCase(contract.getStatus())) {
                return ResponseEntity.badRequest().body(
                        Map.of("message",
                                "Chỉ tạo khoản thu cho hợp đồng đang hoạt động."));
            }

            if (contract.getStartDate() == null
                    || contract.getEndDate() == null
                    || contract.getMonthlyFee() == null
                    || contract.getMonthlyFee().compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().body(
                        Map.of("message",
                                "Hợp đồng thiếu thời hạn hoặc mức phí tháng hợp lệ."));
            }

            LocalDate monthEnd = billingMonth
                    .withDayOfMonth(billingMonth.lengthOfMonth());

            if (billingMonth.isBefore(
                    contract.getStartDate().withDayOfMonth(1))
                    || monthEnd.isAfter(contract.getEndDate())) {
                return ResponseEntity.badRequest().body(
                        Map.of("message",
                                "Tháng tính phí nằm ngoài thời hạn hợp đồng."));
            }

            if (feeRepository.existsByContractIdAndBillingMonth(
                    contractId, billingMonth)) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("message",
                                "Hợp đồng đã có khoản phí trong tháng này."));
            }

            Fee fee = new Fee();
            fee.setContract(contract);
            fee.setFeeName(feeName);
            fee.setBillingMonth(billingMonth);
            fee.setDueDate(dueDate);

            // Số tiền lấy từ hợp đồng trong database
            fee.setAmount(contract.getMonthlyFee());
            fee.setStatus("UNPAID");

            Fee saved = feeRepository.save(fee);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(toMap(saved));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    Map.of("message",
                            "Dữ liệu không hợp lệ. Vui lòng kiểm tra hợp đồng và ngày tháng."));
        }
    }

    // Admin ghi nhận một lần thanh toán
    @PostMapping("/{id}/payments")
    @Transactional
    public ResponseEntity<?> recordPayment(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            Principal principal) {

        Optional<Fee> optional = feeRepository.findById(id);

        if (optional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Không tìm thấy khoản phí."));
        }

        try {
            if (body.get("amount") == null) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Vui lòng nhập số tiền thanh toán."));
            }

            Fee fee = optional.get();

            BigDecimal amount = new BigDecimal(
                    body.get("amount").toString());

            String method = Objects.toString(
                            body.get("paymentMethod"), "")
                    .trim().toUpperCase();

            if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Số tiền phải lớn hơn 0."));
            }

            if (!List.of("CASH", "BANK_TRANSFER").contains(method)) {
                return ResponseEntity.badRequest().body(
                        Map.of("message",
                                "Phương thức phải là CASH hoặc BANK_TRANSFER."));
            }

            BigDecimal paid = getPaidAmount(id);
            BigDecimal remaining = fee.getAmount().subtract(paid);

            if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Khoản phí này đã được thanh toán đủ."));
            }

            if (amount.compareTo(remaining) > 0) {
                return ResponseEntity.badRequest().body(
                        Map.of(
                                "message", "Số tiền nộp vượt số tiền còn nợ.",
                                "remainingAmount", remaining));
            }

            Payment payment = new Payment();
            payment.setFee(fee);
            payment.setAmount(amount);
            payment.setPaymentMethod(method);
            payment.setReferenceCode(Objects.toString(
                    body.get("referenceCode"), "").trim());
            payment.setNote(Objects.toString(
                    body.get("note"), "").trim());
            payment.setReceivedBy(
                    principal == null ? "ADMIN" : principal.getName());

            paymentRepository.save(payment);
            refreshStatus(fee);

            return ResponseEntity.ok(toMap(fee));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    Map.of("message",
                            "Không thể ghi nhận thanh toán. Vui lòng kiểm tra dữ liệu."));
        }
    }

    // Xem lịch sử thanh toán của một khoản phí
    @GetMapping("/{id}/payments")
    public ResponseEntity<?> getPaymentHistory(
            @PathVariable Long id) {

        if (!feeRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Không tìm thấy khoản phí."));
        }

        List<Map<String, Object>> result =
                paymentRepository.findByFeeIdOrderByPaidAtDesc(id)
                        .stream()
                        .map(payment -> {
                            Map<String, Object> item = new LinkedHashMap<>();
                            item.put("id", payment.getId());
                            item.put("amount", payment.getAmount());
                            item.put("paymentMethod",
                                    payment.getPaymentMethod());
                            item.put("referenceCode",
                                    payment.getReferenceCode());
                            item.put("note", payment.getNote());
                            item.put("paidAt", payment.getPaidAt());
                            item.put("receivedBy", payment.getReceivedBy());
                            return item;
                        })
                        .toList();

        return ResponseEntity.ok(result);
    }
}
