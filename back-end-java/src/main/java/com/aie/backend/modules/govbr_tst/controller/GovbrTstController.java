package com.aie.backend.modules.govbr_tst.controller;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aie.backend.modules.govbr_tst.dto.GovbrLoginRequest;
import com.aie.backend.modules.govbr_tst.service.GovbrTstService;

@RestController
@RequestMapping("/govbr-tst")
@Validated
public class GovbrTstController {

    private final GovbrTstService service;

    public GovbrTstController(GovbrTstService service) {
        this.service = service;
    }

    @PostMapping("/login")
    public Object login(@RequestBody(required = false) GovbrLoginRequest request) {
        return service.login(request);
    }
}
