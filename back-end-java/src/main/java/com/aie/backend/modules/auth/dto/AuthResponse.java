package com.aie.backend.modules.auth.dto;

import java.util.List;

import com.aie.backend.modules.admin.dto.AdminResponse;

public record AuthResponse(AdminResponse user, String token, List<MenuItem> menu) {
}
