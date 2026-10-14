
package com.ktx.ktx.controller;

import com.ktx.ktx.entity.Contract;
import com.ktx.ktx.entity.Registration;
import com.ktx.ktx.repository.ContractRepository;
import com.ktx.ktx.repository.RegistrationRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.*;

@RestController
@RequestMapping("/api/admin/contracts")
public class AdminContractController {

    private final ContractRepository contractRepository;
    private final RegistrationRepository registrationRepository;

    public AdminContractController(
            ContractRepository contractRepository,
            RegistrationRepository registrationRepository) {
        this.contractRepository = contractRepository;
        this.registrationRepository = registrationRepository;
    }

    // Chuyển hợp đồng thành dữ liệu JSON đơn giản
    private Map<String, Object> toContractMap(Contract contract) {
        Registration registration = contract.getRegistration();

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", contract.getId());
        data.put("contractNumber", contract.getContractNumber());
        data.put("registrationId", registration.getId());
        data.put("startDate", contract.getStartDate());
        data.put("endDate", contract.getEndDate());
        data.put("monthlyFee", contract.getMonthlyFee());
        data.put("status", contract.getStatus());
        data.put("createdAt", contract.getCreatedAt());

        if (registration.getStudent() != null) {
            data.put("studentId", registration.getStudent().getId());
            data.put("username", registration.getStudent().getUsername());
            data.put("fullName", registration.getStudent().getFullName());
            data.put("email", registration.getStudent().getEmail());
            data.put("phone", registration.getStudent().getPhone());
        }

        if (registration.getRoom() != null) {
            data.put("roomId", registration.getRoom().getId());
            data.put("roomNumber", registration.getRoom().getRoomNumber());

            if (registration.getRoom().getBuilding() != null) {
                data.put("buildingCode",
                        registration.getRoom().getBuilding().getCode());
                data.put("buildingName",
                        registration.getRoom().getBuilding().getName());
            }
        }

        if (registration.getBed() != null) {
            data.put("bedId", registration.getBed().getId());
            data.put("bedNumber", registration.getBed().getBedNumber());
        }

        return data;
    }

    // 1. Xem tất cả hợp đồng
    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<?> getAllContracts() {
        List<Map<String, Object>> result =
                contractRepository.findAllByOrderByCreatedAtDesc()
                        .stream()
                        .map(this::toContractMap)
                        .toList();

        return ResponseEntity.ok(result);
    }

    // 2. Danh sách đơn đã duyệt nhưng chưa có hợp đồng
    @GetMapping("/eligible-registrations")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getEligibleRegistrations() {
        List<Map<String, Object>> result = new ArrayList<>();

        List<Registration> registrations =
                registrationRepository.findByStatusOrderByCreatedAtDesc(
                        "APPROVED"
                );

        for (Registration registration : registrations) {
            if (contractRepository.existsByRegistrationId(
                    registration.getId())) {
                continue;
            }

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("registrationId", registration.getId());
            data.put("createdAt", registration.getCreatedAt());

            if (registration.getStudent() != null) {
                data.put("studentId", registration.getStudent().getId());
                data.put("username", registration.getStudent().getUsername());
                data.put("fullName", registration.getStudent().getFullName());
                data.put("email", registration.getStudent().getEmail());
                data.put("phone", registration.getStudent().getPhone());
            }

            if (registration.getRoom() != null) {
                data.put("roomId", registration.getRoom().getId());
                data.put("roomNumber",
                        registration.getRoom().getRoomNumber());

                if (registration.getRoom().getBuilding() != null) {
                    data.put("buildingCode",
                            registration.getRoom().getBuilding().getCode());
                    data.put("buildingName",
                            registration.getRoom().getBuilding().getName());
                }
            }

            if (registration.getBed() != null) {
                data.put("bedId", registration.getBed().getId());
                data.put("bedNumber",
                        registration.getBed().getBedNumber());
            }

            result.add(data);
        }

        return ResponseEntity.ok(result);
    }

    // 3. Tạo hợp đồng từ đơn đăng ký đã được duyệt
    @PostMapping
    @Transactional
    public ResponseEntity<?> createContract(
            @RequestBody Map<String, Object> request) {

        try {
            Object registrationIdValue = request.get("registrationId");
            Object startDateValue = request.get("startDate");
            Object endDateValue = request.get("endDate");
            Object monthlyFeeValue = request.get("monthlyFee");

//            ktra buoc dien day du
            if (registrationIdValue == null
                    || startDateValue == null
                    || endDateValue == null
                    || monthlyFeeValue == null) {
                return ResponseEntity.badRequest()
                        .body("Vui lòng nhập đầy đủ đơn đăng ký, ngày bắt đầu, ngày kết thúc và tiền thuê.");
            }

            Long registrationId =
                    Long.valueOf(registrationIdValue.toString());

            LocalDate startDate =
                    LocalDate.parse(startDateValue.toString());

            LocalDate endDate =
                    LocalDate.parse(endDateValue.toString());

            BigDecimal monthlyFee =
                    new BigDecimal(monthlyFeeValue.toString());

            if (!endDate.isAfter(startDate)) {
                return ResponseEntity.badRequest()
                        .body("Ngày kết thúc phải sau ngày bắt đầu.");
            }

            if (monthlyFee.compareTo(BigDecimal.ZERO) < 0) {
                return ResponseEntity.badRequest()
                        .body("Tiền thuê không được âm.");
            }

            Optional<Registration> optionalRegistration =
                    registrationRepository.findById(registrationId);

            if (optionalRegistration.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Không tìm thấy đơn đăng ký.");
            }

            Registration registration = optionalRegistration.get();

            if (!"APPROVED".equalsIgnoreCase(registration.getStatus())) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("Chỉ có thể tạo hợp đồng từ đơn đã được duyệt.");
            }

            if (contractRepository.existsByRegistrationId(registrationId)) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("Đơn đăng ký này đã có hợp đồng.");
            }

            String contractNumber = request.get("contractNumber") == null
                    ? ""
                    : request.get("contractNumber").toString().trim();

            if (contractNumber.isEmpty()) {
                contractNumber = "HD-" + UUID.randomUUID()
                        .toString().substring(0, 8).toUpperCase();
            }

            if (contractRepository.existsByContractNumber(contractNumber)) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("Mã hợp đồng đã tồn tại.");
            }

            Contract contract = new Contract();
            contract.setContractNumber(contractNumber);
            contract.setRegistration(registration);
            contract.setStartDate(startDate);
            contract.setEndDate(endDate);
            contract.setMonthlyFee(monthlyFee);
            contract.setStatus("ACTIVE");

            Contract saved = contractRepository.save(contract);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(toContractMap(saved));

        } catch (NumberFormatException | DateTimeParseException e) {
            return ResponseEntity.badRequest()
                    .body("Dữ liệu không hợp lệ. Kiểm tra ID, ngày tháng và tiền thuê.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Không thể tạo hợp đồng. Vui lòng kiểm tra dữ liệu và cấu hình hệ thống.");
        }
    }

    // 4. Hủy hợp đồng
    // PUT /api/admin/contracts/{id}/cancel
    @PutMapping("/{id}/cancel")
    @Transactional
    public ResponseEntity<?> cancelContract(@PathVariable Long id) {

        Optional<Contract> optionalContract =
                contractRepository.findById(id);

        if (optionalContract.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "message",
                            "Không tìm thấy hợp đồng."
                    ));
        }

        Contract contract = optionalContract.get();

        // Không hủy lại hợp đồng đã hủy
        if ("CANCELLED".equalsIgnoreCase(contract.getStatus())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "message",
                            "Hợp đồng này đã được hủy trước đó."
                    ));
        }

        contract.setStatus("CANCELLED");

        Contract savedContract = contractRepository.save(contract);

        return ResponseEntity.ok(
                Map.of(
                        "message", "Hủy hợp đồng thành công.",
                        "contract", toContractMap(savedContract)
                )
        );
    }

}
