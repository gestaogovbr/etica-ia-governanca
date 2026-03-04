package com.aie.backend.modules.govbr.service;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import com.aie.backend.config.GovbrProperties;
import com.aie.backend.config.JwtProperties;
import com.aie.backend.modules.admin.repository.AdminRepository;
import com.aie.backend.modules.auth.dto.MenuItem;
import com.aie.backend.modules.auth.entities.Administrador;
import com.aie.backend.modules.auth.security.JwtTokenService;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.http.HttpStatus;

@Service
public class GovbrService {

    private static final Logger LOGGER = LoggerFactory.getLogger(GovbrService.class);
    private final GovbrProperties properties;
    private final AdminRepository adminRepository;
    private final JwtTokenService tokenService;
    private final RestTemplate restTemplate = new RestTemplate();
    private final byte[] stateSecret;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, PkceEntry> pkceStore = new ConcurrentHashMap<>();

    private final List<MenuItem> govbrMenu = List.of(
            new MenuItem("fas fa-chart-bar", "home", "sidebar.home", 0, ""),
            new MenuItem("fas fa-folder", "projects", "sidebar.projects", 1, "projects")
    );

    public GovbrService(GovbrProperties properties,
                        AdminRepository adminRepository,
                        JwtTokenService tokenService,
                        JwtProperties jwtProperties) {
        this.properties = properties;
        this.adminRepository = adminRepository;
        this.tokenService = tokenService;
        String secret = properties.getStateSecret() != null && !properties.getStateSecret().isBlank()
                ? properties.getStateSecret()
                : jwtProperties.getSecret();
        this.stateSecret = secret.getBytes(StandardCharsets.UTF_8);
    }

    public String buildAuthorizeUrl(String origin) {
        if (isBlank(properties.getClientId()) || isBlank(properties.getClientSecret())) {
            throw badRequest("Defina GOVBR_CLIENT_ID e GOVBR_CLIENT_SECRET para habilitar o login com gov.br");
        }

        String resolvedOrigin = resolveOrigin(origin);
        String codeVerifier = generateCodeVerifier();
        String codeChallenge = toCodeChallenge(codeVerifier);
        String state = signState(Map.of(
                "origin", resolvedOrigin,
                "ts", System.currentTimeMillis()
        ));
        storePkce(state, codeVerifier);

        String baseAuthUrl = notBlank(properties.getAuthUrl())
                ? properties.getAuthUrl()
                : String.format("%s/authorize", baseOrDefault(properties.getBaseUrl(), "https://sso.acesso.gov.br"));

        String nonce = randomHex(16);
        String params = "response_type=code" +
                "&client_id=" + url(properties.getClientId()) +
                "&redirect_uri=" + url(resolveRedirect()) +
                "&scope=" + url(properties.getScope()) +
                "&state=" + url(state) +
                "&nonce=" + url(nonce) +
                "&code_challenge=" + url(codeChallenge) +
                "&code_challenge_method=S256";

        return baseAuthUrl + "?" + params;
    }

    public Map<String, Object> handleCallback(String code, String state) {
        if (isBlank(code)) {
            throw badRequest("Código de autorização ausente no retorno do gov.br");
        }
        Map<String, Object> statePayload = verifyState(state);

        String codeVerifier = consumePkce(state);
        Map<String, Object> tokenSet = exchangeCodeForTokens(code, codeVerifier);
        Map<String, Object> profile = resolveProfile(tokenSet);
        Administrador user = findOrCreateUser(profile);

        Map<String, Object> payload = new HashMap<>();
        payload.put("id", user.getId());
        payload.put("name", user.getName());
        payload.put("email", user.getEmail());
        payload.put("social_number", user.getSocialNumber());
        payload.put("admin", Boolean.FALSE);
        payload.put("menu", govbrMenu);

        String token = tokenService.generateToken(payload);

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("user", payload);
        response.put("origin", statePayload.getOrDefault("origin", resolveOrigin(null)));
        return response;
    }

    public String renderPopupClosePage(String origin, Map<String, Object> payload) {
        String target = origin != null ? origin : "*";
        String serialized = payloadToJson(payload);
        return "<!DOCTYPE html>\n" +
                "<html lang=\"pt-BR\">\n" +
                "<head><meta charset=\"utf-8\" /><title>gov.br</title></head>\n" +
                "<body>\n" +
                "  <script>\n" +
                "    (function() {\n" +
                "      const data = " + serialized + ";\n" +
                "      const targetOrigin = " + quote(target) + ";\n" +
                "      if (window.opener && !window.opener.closed) {\n" +
                "        try { window.opener.postMessage(data, targetOrigin === '*' ? '*' : targetOrigin); } catch (err) { console.error(err); }\n" +
                "      }\n" +
                "      window.close();\n" +
                "    })();\n" +
                "  </script>\n" +
                "  <p>Você pode fechar esta janela.</p>\n" +
                "</body>\n" +
                "</html>";
    }

    public String extractOriginFromState(String state) {
        try {
            Claims decoded = decodeToken(state);
            return decoded.get("origin", String.class);
        } catch (Exception ex) {
            LOGGER.warn("Não foi possível ler origin do state: {}", ex.getMessage());
            return null;
        }
    }

    private Map<String, Object> exchangeCodeForTokens(String code, String codeVerifier) {
        String tokenUrl = notBlank(properties.getTokenUrl())
                ? properties.getTokenUrl()
                : String.format("%s/token", baseOrDefault(properties.getBaseUrl(), "https://sso.acesso.gov.br"));

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "authorization_code");
        body.add("code", code);
        body.add("redirect_uri", resolveRedirect());
        body.add("client_id", properties.getClientId());
        body.add("client_secret", properties.getClientSecret());
        body.add("code_verifier", codeVerifier);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.set(HttpHeaders.AUTHORIZATION, resolveBasicAuthorization());

        HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(URI.create(tokenUrl), entity, Map.class);
            Map<String, Object> data = response.getBody();
            if (data == null || isBlank((String) data.get("access_token"))) {
                throw unauthorized("Não recebemos access_token do gov.br");
            }
            return data;
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (HttpStatusCodeException ex) {
            LOGGER.error("Falha ao trocar code por token gov.br status={} body={}",
                    ex.getStatusCode().value(),
                    sanitizeTokenErrorBody(ex.getResponseBodyAsString()));
            throw unauthorized("Falha ao autenticar no gov.br");
        } catch (Exception ex) {
            LOGGER.error("Falha ao trocar code por token gov.br", ex);
            throw unauthorized("Falha ao autenticar no gov.br");
        }
    }

    private Map<String, Object> resolveProfile(Map<String, Object> tokenSet) {
        Map<String, Object> decoded = decodeIdToken((String) tokenSet.get("id_token"));
        Map<String, Object> userinfo = fetchUserinfo((String) tokenSet.get("access_token"));

        Map<String, Object> data = new HashMap<>();
        if (userinfo != null) data.putAll(userinfo);
        if (decoded != null) data.putAll(decoded);

        String name = optionalString(data, "name", "nome", "given_name");
        if (isBlank(name)) name = "Usuário gov.br";

        String email = optionalString(data, "email", "preferred_username");
        String social = formatCpf(optionalString(data, "cpf", "social_number", "sub"));

        Map<String, Object> profile = new HashMap<>();
        profile.put("name", name);
        profile.put("email", email);
        profile.put("social_number", social);
        profile.put("raw", Map.of("id_token", decoded, "userinfo", userinfo));
        return profile;
    }

    private Administrador findOrCreateUser(Map<String, Object> profile) {
        String social = (String) profile.get("social_number");
        String email = (String) profile.get("email");

        Optional<Administrador> existing = Optional.empty();
        if (!isBlank(email) || !isBlank(social)) {
            existing = adminRepository.findByEmailIgnoreCaseOrSocialNumber(
                    email != null ? email : "",
                    social != null ? social : "");
        }

        if (existing.isPresent()) {
            Administrador admin = existing.get();
            admin.setName((String) profile.getOrDefault("name", admin.getName()));
            if (!isBlank(email)) admin.setEmail(email);
            if (!isBlank(social)) admin.setSocialNumber(social);
            admin.setLastAccess(Instant.now());
            return adminRepository.save(admin);
        }

        Administrador admin = new Administrador();
        admin.setName((String) profile.getOrDefault("name", "Usuário gov.br"));
        admin.setEmail(!isBlank(email) ? email : placeholderEmail());
        admin.setSocialNumber(!isBlank(social) ? social : generateFallbackSocial());
        admin.setPosition("gov.br");
        admin.setActive(Boolean.TRUE);
        admin.setPassword(null);
        admin.setLastAccess(Instant.now());
        return adminRepository.save(admin);
    }

    private Map<String, Object> fetchUserinfo(String accessToken) {
        if (isBlank(accessToken)) return null;

        String url = notBlank(properties.getUserinfoUrl())
                ? properties.getUserinfoUrl()
                : String.format("%s/userinfo", baseOrDefault(properties.getApiBaseUrl(), "https://api.acesso.gov.br"));

        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        try {
            ResponseEntity<Map> response = restTemplate.exchange(URI.create(url), HttpMethod.GET, entity, Map.class);
            return response.getBody();
        } catch (Exception ex) {
            LOGGER.warn("Não foi possível obter userinfo gov.br: {}", ex.getMessage());
            return null;
        }
    }

    private Map<String, Object> decodeIdToken(String idToken) {
        if (isBlank(idToken)) return null;
        try {
            String[] parts = idToken.split("\\.");
            if (parts.length < 2) return null;
            String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            return objectMapper.readValue(payloadJson, Map.class);
        } catch (Exception ex) {
            LOGGER.warn("Falha ao decodificar id_token gov.br: {}", ex.getMessage());
            return null;
        }
    }

    private String signState(Map<String, Object> payload) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(600);
        return Jwts.builder()
                .setClaims(payload)
                .setIssuedAt(java.util.Date.from(now))
                .setExpiration(java.util.Date.from(exp))
                .signWith(Keys.hmacShaKeyFor(stateSecret))
                .compact();
    }

    private Map<String, Object> verifyState(String state) {
        if (isBlank(state)) throw badRequest("State não recebido do gov.br");
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(Keys.hmacShaKeyFor(stateSecret))
                    .build()
                    .parseClaimsJws(state)
                    .getBody();
            Map<String, Object> map = new HashMap<>();
            claims.forEach(map::put);
            return map;
        } catch (Exception ex) {
            LOGGER.warn("State inválido ou expirado: {}", ex.getMessage());
            throw badRequest("State inválido ou expirado");
        }
    }

    private String resolveRedirect() {
        return notBlank(properties.getRedirectUri())
                ? properties.getRedirectUri()
                : "http://localhost:8080/retornoWebHook";
    }

    private String resolveOrigin(String origin) {
        if (notBlank(origin)) return origin;
        if (notBlank(properties.getFrontendOrigin())) return properties.getFrontendOrigin();
        return "http://localhost:3000";
    }

    private String payloadToJson(Map<String, Object> payload) {
        Map<String, Object> enriched = new HashMap<>(payload);
        enriched.put("source", "govbr-login");
        try {
            return objectMapper.writeValueAsString(enriched);
        } catch (Exception ex) {
            return "{\"status\":\"error\",\"message\":\"Falha ao serializar resposta\"}";
        }
    }

    private String optionalString(Map<String, Object> map, String... keys) {
        for (String key : keys) {
            Object val = map.get(key);
            if (val != null && !String.valueOf(val).isBlank()) {
                return String.valueOf(val);
            }
        }
        return null;
    }

    private String formatCpf(String value) {
        if (isBlank(value)) return null;
        String digits = value.replaceAll("\\D", "");
        if (digits.length() < 11) return digits;
        String trimmed = digits.substring(0, 11);
        return trimmed.replaceAll("(\\d{3})(\\d{3})(\\d{3})(\\d{2})", "$1.$2.$3-$4");
    }

    private String generateFallbackSocial() {
        Random random = new Random();
        StringBuilder digits = new StringBuilder();
        for (int i = 0; i < 11; i++) digits.append(random.nextInt(10));
        return formatCpf(digits.toString());
    }

    private String placeholderEmail() {
        return "govbr-" + Long.toHexString(System.currentTimeMillis()) + "@placeholder.local";
    }

    private String url(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private boolean notBlank(String value) {
        return !isBlank(value);
    }

    private String baseOrDefault(String value, String fallback) {
        return notBlank(value) ? value : fallback;
    }

    private String randomHex(int bytes) {
        byte[] buffer = new byte[bytes];
        new Random().nextBytes(buffer);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buffer);
    }

    private void storePkce(String state, String codeVerifier) {
        cleanupExpiredPkce();
        pkceStore.put(state, new PkceEntry(codeVerifier, System.currentTimeMillis() + 10 * 60 * 1000));
    }

    private String consumePkce(String state) {
        if (isBlank(state)) {
            throw badRequest("State não recebido do gov.br");
        }
        cleanupExpiredPkce();
        PkceEntry entry = pkceStore.remove(state);
        if (entry == null || entry.expiresAt() < System.currentTimeMillis()) {
            throw badRequest("Sessão PKCE não encontrada ou expirada. Inicie o login novamente.");
        }
        return entry.codeVerifier();
    }

    private void cleanupExpiredPkce() {
        long now = System.currentTimeMillis();
        pkceStore.entrySet().removeIf(e -> e.getValue().expiresAt() < now);
    }

    private String generateCodeVerifier() {
        byte[] bytes = new byte[32];
        new Random().nextBytes(bytes);
        return base64Url(bytes);
    }

    private String toCodeChallenge(String codeVerifier) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(codeVerifier.getBytes(StandardCharsets.UTF_8));
            return base64Url(hash);
        } catch (Exception ex) {
            throw new IllegalStateException("Não foi possível gerar code_challenge PKCE", ex);
        }
    }

    private String base64Url(byte[] value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value);
    }

    private String resolveBasicAuthorization() {
        if (notBlank(properties.getBasicAuth())) {
            String basic = properties.getBasicAuth();
            return basic.startsWith("Basic ") ? basic : "Basic " + basic;
        }
        String raw = properties.getClientId() + ":" + properties.getClientSecret();
        return "Basic " + Base64.getEncoder().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    private String sanitizeTokenErrorBody(String body) {
        if (body == null) return null;
        if (body.length() > 1000) {
            return body.substring(0, 1000);
        }
        return body;
    }

    private ResponseStatusException badRequest(String msg) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }

    private ResponseStatusException unauthorized(String msg) {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, msg);
    }

    private Claims decodeToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(Keys.hmacShaKeyFor(stateSecret))
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private String quote(String value) {
        return "\"" + escape(value) + "\"";
    }

    private String escape(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private record PkceEntry(String codeVerifier, long expiresAt) {}
}
