package com.nhom13.paymentservice.momo;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Service
public class MomoService {
    @Value("${momo.endpoint:https://test-payment.momo.vn/v2/gateway/api/create}")
    private String momoEndpoint;

    @Value("${momo.partnerCode:PARTNER_CODE}")
    private String partnerCode;

    @Value("${momo.accessKey:ACCESS_KEY}")
    private String accessKey;

    @Value("${momo.secretKey:SECRET_KEY}")
    private String secretKey;

    @Value("${momo.returnUrl:http://ec2-52-195-195-198.ap-northeast-1.compute.amazonaws.com:8080/api/payments/momo/return}")
    private String returnUrl;

    @Value("${momo.notifyUrl:http://ec2-52-195-195-198.ap-northeast-1.compute.amazonaws.com:8080/api/payments/momo/notify}")
    private String notifyUrl;

    private final RestTemplate rest = new RestTemplate();

    public Map<String, Object> createPayment(String orderId, String amount, String orderInfo) throws Exception {
        // Build payload according to Momo (simplified)
        Map<String, Object> body = new HashMap<>();
        body.put("partnerCode", partnerCode);
        body.put("accessKey", accessKey);
        body.put("requestId", orderId);
        body.put("amount", amount);
        body.put("orderId", orderId);
        body.put("orderInfo", orderInfo);
        body.put("returnUrl", returnUrl);
        body.put("notifyUrl", notifyUrl);
        body.put("requestType", "captureWallet");

        // create raw signature string (Momo expects specific format) - simplified
        String raw = String.format("partnerCode=%s&accessKey=%s&requestId=%s&amount=%s&orderId=%s&orderInfo=%s",
                partnerCode, accessKey, orderId, amount, orderId, orderInfo);

        String signature = hmacSha256(raw, secretKey);
        body.put("signature", signature);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        // call Momo API (in tests this can be mocked)
        Map<String, Object> response = rest.postForObject(momoEndpoint, entity, Map.class);
        return response;
    }

    private String hmacSha256(String data, String key) throws Exception {
        Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
        SecretKeySpec secret_key = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        sha256_HMAC.init(secret_key);
        byte[] hash = sha256_HMAC.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder(2 * hash.length);
        for (byte b : hash) {
            sb.append(String.format("%02x", b & 0xff));
        }
        return sb.toString();
    }
}
