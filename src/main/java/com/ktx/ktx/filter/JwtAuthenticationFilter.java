
package com.ktx.ktx.filter;

import com.ktx.ktx.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        // Log thông tin request, không in token
        System.out.println("\n========== JWT DEBUG ==========");
        System.out.println("Request: " + request.getMethod()
                + " " + request.getRequestURI());
        System.out.println("Authorization header present: "
                + (authHeader != null));

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        try {
            String username = jwtService.extractUsername(token);
            String role = jwtService.extractRole(token);

            System.out.println("JWT username: " + username);
            System.out.println("JWT role: " + role);

            if (username != null
                    && SecurityContextHolder.getContext()
                    .getAuthentication() == null) {

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                username,
                                null,
                                List.of(
                                        new SimpleGrantedAuthority(
                                                "ROLE_" + role
                                        )
                                )
                        );

                SecurityContextHolder.getContext()
                        .setAuthentication(authentication);

                System.out.println("Granted authorities: "
                        + authentication.getAuthorities());
            }

        } catch (Exception e) {
            System.out.println("JWT filter error: "
                    + e.getClass().getSimpleName());

            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write(
                    "{\"message\":\"Token không hợp lệ hoặc đã hết hạn\"}"
            );
            return;
        }

        System.out.println("========== END JWT DEBUG ==========\n");

        filterChain.doFilter(request, response);
    }
}
