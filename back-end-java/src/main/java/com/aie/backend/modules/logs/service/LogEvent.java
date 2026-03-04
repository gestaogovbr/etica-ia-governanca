package com.aie.backend.modules.logs.service;

import java.util.Map;

public record LogEvent(Long userId,
                       String userEmail,
                       String ip,
                       String action,
                       String module,
                       String route,
                       String method,
                       String status,
                       Map<String, Object> detail,
                       String userAgent,
                       String recordId) {
}
