
package com.ktx.ktx.controller;

import com.ktx.ktx.entity.Contract;
import com.ktx.ktx.entity.Registration;
import com.ktx.ktx.entity.User;
import com.ktx.ktx.repository.ContractRepository;
import com.ktx.ktx.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/student/contracts")
public class StudentContractController {

    private final ContractRepository contractRepository;
    private final UserRepository userRepository;

    public StudentContractController(
            ContractRepository contractRepository,
            UserRepository userRepository) {
        this.contractRepository = contractRepository;
        this.userRepository = userRepository;
    }

    // GET /api/student/contracts
    // Xem hợp đồng của sinh viên đang đăng nhập
    @GetMapping
    public ResponseEntity<?> getMyContracts(Principal principal) {

        if (principal == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Bạn chưa đăng nhập!"));
        }

        Optional<User> optionalStudent =
                userRepository.findByUsername(principal.getName());

        if (optionalStudent.isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Không tìm thấy sinh viên!"));
        }

        User student = optionalStudent.get();

        // Chỉ tài khoản STUDENT mới được xem hợp đồng
        if (student.getRole() == null
                || !"STUDENT".equalsIgnoreCase(
                student.getRole().getName())) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "message",
                            "Chỉ sinh viên mới được xem hợp đồng của mình!"
                    ));
        }

        List<Contract> contracts =
                contractRepository
                        .findByRegistrationStudentIdOrderByCreatedAtDesc(
                                student.getId()
                        );

        List<Map<String, Object>> result = new ArrayList<>();

        for (Contract contract : contracts) {

            Registration registration = contract.getRegistration();

            Map<String, Object> data = new LinkedHashMap<>();

            data.put("id", contract.getId());
            data.put("contractNumber", contract.getContractNumber());
            data.put("startDate", contract.getStartDate());
            data.put("endDate", contract.getEndDate());
            data.put("monthlyFee", contract.getMonthlyFee());
            data.put("status", contract.getStatus());
            data.put("createdAt", contract.getCreatedAt());

            data.put("studentId", student.getId());
            data.put("username", student.getUsername());
            data.put("fullName", student.getFullName());
            data.put("email", student.getEmail());
            data.put("phone", student.getPhone());

            if (registration != null) {

                data.put("registrationId", registration.getId());
                data.put("registrationStatus", registration.getStatus());

                if (registration.getRoom() != null) {
                    data.put(
                            "roomNumber",
                            registration.getRoom().getRoomNumber()
                    );

                    if (registration.getRoom().getBuilding() != null) {
                        data.put(
                                "buildingName",
                                registration.getRoom()
                                        .getBuilding().getName()
                        );

                        data.put(
                                "buildingCode",
                                registration.getRoom()
                                        .getBuilding().getCode()
                        );
                    }
                }

                if (registration.getBed() != null) {
                    data.put(
                            "bedNumber",
                            registration.getBed().getBedNumber()
                    );
                }
            }

            result.add(data);
        }

        return ResponseEntity.ok(result);
    }
}
