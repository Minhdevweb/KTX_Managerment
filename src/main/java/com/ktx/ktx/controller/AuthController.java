package com.ktx.ktx.controller;

import com.ktx.ktx.entity.User;
import com.ktx.ktx.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestBody Map<String, String> request
    ) {

        User user = authService.register(
                request.get("username"),
                request.get("password"),
                request.get("email"),
                request.get("fullName"),
                request.get("phone")
        );

        return ResponseEntity.ok(
                "Đăng ký tài khoản thành công"
        );
    }

    //login
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody Map<String, String> request
    ) {
        try {

            String username = request.get("username");
            String password = request.get("password");

            String token = authService.login(username, password);

            return ResponseEntity.ok(
                    Map.of(
                            "message", "Đăng nhập thành công",
                            "token", token
                    )
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .status(401)
                    .body(Map.of(
                            "message", e.getMessage()
                    ));
        }
    }
}