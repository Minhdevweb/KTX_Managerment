package com.ktx.ktx.config;

import com.ktx.ktx.entity.Role;
import com.ktx.ktx.entity.User;
import com.ktx.ktx.repository.RoleRepository;
import com.ktx.ktx.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initData(
            RoleRepository roleRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {

            // Tạo ADMIN role nếu chưa có
            Role adminRole = roleRepository
                    .findByName("ADMIN")
                    .orElseGet(() -> {
                        Role role = new Role();
                        role.setName("ADMIN");
                        return roleRepository.save(role);
                    });

            // Tạo STUDENT role nếu chưa có
            roleRepository
                    .findByName("STUDENT")
                    .orElseGet(() -> {
                        Role role = new Role();
                        role.setName("STUDENT");
                        return roleRepository.save(role);
                    });

            // Tạo tài khoản ADMIN nếu chưa có
            if (!userRepository.existsByUsername("admin")) {

                User admin = new User();

                admin.setUsername("admin");
                admin.setPassword(
                        passwordEncoder.encode("admin123")
                );
                admin.setEmail("admin@ktx.com");
                admin.setFullName("Quản trị viên");
                admin.setPhone("0900000000");
                admin.setRole(adminRole);

                userRepository.save(admin);

                System.out.println(
                        "===== TẠO TÀI KHOẢN ADMIN THÀNH CÔNG ====="
                );
            }
        };
    }
}