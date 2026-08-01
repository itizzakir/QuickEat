package com.quickbite.food_delivery_backend.security.jwt;

import java.io.IOException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quickbite.food_delivery_backend.payload.response.ApiError;

/**
 * Writes a JSON 401 body.
 *
 * <p>This used to call {@code response.sendError(...)}, which hands off to the servlet
 * container's HTML error page. The frontend calls {@code response.json()} on failed logins, so
 * that produced an unhelpful JSON parse error instead of the real reason.
 */
@Component
public class AuthEntryPointJwt implements AuthenticationEntryPoint {

  private static final Logger logger = LoggerFactory.getLogger(AuthEntryPointJwt.class);

  private final ObjectMapper objectMapper;

  public AuthEntryPointJwt(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  @Override
  public void commence(HttpServletRequest request, HttpServletResponse response,
      AuthenticationException authException) throws IOException {
    logger.warn("Unauthorized request to {} {}: {}",
        request.getMethod(), request.getRequestURI(), authException.getMessage());

    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    response.setCharacterEncoding("UTF-8");

    ApiError body = new ApiError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized",
        "Authentication is required to access this resource", request.getRequestURI());
    objectMapper.writeValue(response.getOutputStream(), body);
  }
}
