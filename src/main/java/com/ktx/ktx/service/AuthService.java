package com.ktx.ktx.service;

import com.ktx.ktx.entity.Role;
import com.ktx.ktx.entity.User;
import com.ktx.ktx.repository.RoleRepository;
import com.ktx.ktx.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public User register(
            String username,
            String password,
            String email,
            String fullName,
            String phone
    ) {

        // Kiểm tra username
        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("Username đã tồn tại");
        }

        // Kiểm tra email
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email đã tồn tại");
        }

        // Lấy role STUDENT
        Role studentRole = roleRepository
                .findByName("STUDENT")
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy role STUDENT")
                );

        // Tạo User
        User user = new User();

        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setEmail(email);
        user.setFullName(fullName);
        user.setPhone(phone);
        user.setRole(studentRole);

        return userRepository.save(user);
    }

    // login
    public String login(String username, String password) {

        User user = userRepository
                .findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException("Username không tồn tại")
                );

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Mật khẩu không đúng");
        }

        return jwtService.generateToken(user);
    }
}