package com.aie.backend.modules.auth.security;

import java.util.List;

import com.aie.backend.modules.auth.dto.MenuItem;

public record AuthenticatedAdmin(Long id,
                                 String name,
                                 String email,
                                 String socialNumber,
                                 boolean admin,
                                 List<MenuItem> menu) {
}
