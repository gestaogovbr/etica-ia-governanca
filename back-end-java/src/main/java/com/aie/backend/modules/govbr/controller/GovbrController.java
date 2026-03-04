package com.aie.backend.modules.govbr.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.view.RedirectView;

import com.aie.backend.modules.govbr.service.GovbrService;

@RestController
@Validated
public class GovbrController {

    private final GovbrService service;

    public GovbrController(GovbrService service) {
        this.service = service;
    }

    @GetMapping("/govbr/authorize")
    public RedirectView authorize(@RequestParam(value = "origin", required = false) String origin) {
        String url = service.buildAuthorizeUrl(origin);
        return new RedirectView(url);
    }

    @GetMapping("/govbr/callback")
    public ResponseEntity<String> callbackLegacy(
            @RequestParam(value = "code", required = false) String code,
            @RequestParam(value = "state", required = false) String state,
            @RequestParam(value = "error", required = false) String error,
            @RequestParam(value = "error_description", required = false) String errorDescription
    ) {
        return callbackInternal(code, state, error, errorDescription);
    }

    @GetMapping("/retornoWebHook")
    public ResponseEntity<String> callback(
            @RequestParam(value = "code", required = false) String code,
            @RequestParam(value = "state", required = false) String state,
            @RequestParam(value = "error", required = false) String error,
            @RequestParam(value = "error_description", required = false) String errorDescription
    ) {
        return callbackInternal(code, state, error, errorDescription);
    }

    private ResponseEntity<String> callbackInternal(
            String code,
            String state,
            String error,
            String errorDescription
    ) {
        String origin = service.extractOriginFromState(state);
        if (error != null) {
            String html = service.renderPopupClosePage(origin, java.util.Map.of(
                    "status", "error",
                    "message", errorDescription != null ? errorDescription : error,
                    "error", error
            ));
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.TEXT_HTML_VALUE)
                    .body(html);
        }

        try {
            var result = service.handleCallback(code, state);
            String html = service.renderPopupClosePage(
                    (String) result.get("origin"),
                    java.util.Map.of(
                            "status", "success",
                            "token", result.get("token"),
                            "user", result.get("user")
                    )
            );
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.TEXT_HTML_VALUE)
                    .body(html);
        } catch (Exception ex) {
            String message = ex.getMessage() != null ? ex.getMessage() : "Falha ao autenticar no gov.br";
            String html = service.renderPopupClosePage(origin, java.util.Map.of(
                    "status", "error",
                    "message", message,
                    "error", ex.getClass().getSimpleName()
            ));
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.TEXT_HTML_VALUE)
                    .body(html);
        }
    }
}
