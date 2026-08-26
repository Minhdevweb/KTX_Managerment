package com.ktx.ktx.controller;

import com.ktx.ktx.entity.User;
import com.ktx.ktx.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final UserRepository userRepository;

    public ProfileController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    // LẤY THÔNG TIN CÁ NHÂN
    // GET /api/profile

    @GetMapping
    public ResponseEntity<?> getProfile(Principal principal) {

        if (principal == null) {
            return ResponseEntity
                    .status(401)
                    .body(Map.of("message", "Chưa đăng nhập")
                    );
        }

        String username = principal.getName();

        User user = userRepository
                .findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy người dùng")
                );

        return ResponseEntity.ok(
                Map.of(
                        "id", user.getId(),
                        "username", user.getUsername(),
                        "email", user.getEmail(),
                        "fullName", user.getFullName(),
                        "phone", user.getPhone(),
                        "role", user.getRole().getName()
                )
        );
    }

    // CẬP NHẬT THÔNG TIN CÁ NHÂN
    // PUT /api/profile

    @PutMapping
    public ResponseEntity<?> updateProfile(
            Principal principal,
            @RequestBody Map<String, String> request
    ) {

        if (principal == null) {
            return ResponseEntity
                    .status(401)
                    .body(Map.of("message", "Chưa đăng nhập")
                    );
        }

        String username = principal.getName();

        User user = userRepository
                .findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy người dùng")
                );

        // Họ tên

        if (request.containsKey("fullName")) {

            user.setFullName(request.get("fullName")
            );
        }

        // Email

        if (request.containsKey("email")) {

            String email = request.get("email");

            // Nếu đổi email
            if (!email.equals(user.getEmail())) {

                if (userRepository.existsByEmail(email)) {

                    return ResponseEntity
                            .badRequest()
                            .body(Map.of(
                                    "message",
                                    "Email đã được sử dụng"
                            ));
                }
                user.setEmail(email);
            }
        }

        // Số điện thoại

        if (request.containsKey("phone")) {

            user.setPhone(request.get("phone")
            );
        }

        User savedUser = userRepository.save(user);

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Cập nhật thông tin thành công",

                        "id",
                        savedUser.getId(),

                        "username",
                        savedUser.getUsername(),

                        "email",
                        savedUser.getEmail(),

                        "fullName",
                        savedUser.getFullName(),

                        "phone",
                        savedUser.getPhone(),

                        "role",
                        savedUser.getRole().getName()
                )
        );
    }
}