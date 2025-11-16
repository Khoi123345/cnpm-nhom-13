package com.nhom13.paymentservice.vnpay;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
public class VNPayService {

    @Value("${vnpay.url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}")
    private String vnpUrl;

    @Value("${vnpay.returnUrl:http://localhost:3000/customer/payment-return}")
    private String vnpReturnUrl;

    @Value("${vnpay.tmnCode:YOUR_TMN_CODE}")
    private String vnpTmnCode;

    @Value("${vnpay.hashSecret:YOUR_HASH_SECRET}")
    private String vnpHashSecret;

    @Value("${vnpay.apiUrl:https://sandbox.vnpayment.vn/merchant_webapi/api/transaction}")
    private String vnpApiUrl;

    /**
     * Tạo URL thanh toán VNPay
     * @param orderId Mã đơn hàng
     * @param amount Số tiền (VNĐ)
     * @param orderInfo Thông tin đơn hàng
     * @param ipAddress IP của khách hàng
     * @return URL thanh toán
     */
    public String createPaymentUrl(String orderId, long amount, String orderInfo, String ipAddress) throws Exception {
        Map<String, String> vnpParams = new HashMap<>();
        
        vnpParams.put("vnp_Version", "2.1.0");
        vnpParams.put("vnp_Command", "pay");
        vnpParams.put("vnp_TmnCode", vnpTmnCode);
        vnpParams.put("vnp_Amount", String.valueOf(amount * 100)); // VNPay yêu cầu amount * 100
        vnpParams.put("vnp_CurrCode", "VND");
        vnpParams.put("vnp_TxnRef", orderId);
        vnpParams.put("vnp_OrderInfo", orderInfo);
        vnpParams.put("vnp_OrderType", "other");
        vnpParams.put("vnp_Locale", "vn");
        vnpParams.put("vnp_ReturnUrl", vnpReturnUrl);
        vnpParams.put("vnp_IpAddr", ipAddress);

        // Thời gian tạo và hết hạn
        Calendar calendar = Calendar.getInstance(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        formatter.setTimeZone(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        String vnpCreateDate = formatter.format(calendar.getTime());
        vnpParams.put("vnp_CreateDate", vnpCreateDate);

        calendar.add(Calendar.MINUTE, 15); // Hết hạn sau 15 phút
        String vnpExpireDate = formatter.format(calendar.getTime());
        vnpParams.put("vnp_ExpireDate", vnpExpireDate);

        // Tạo query string và hash
        List<String> fieldNames = new ArrayList<>(vnpParams.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnpParams.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                // Build hash data
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                
                // Build query
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII.toString()));
                query.append('=');
                query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                
                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }

        String queryUrl = query.toString();
        String vnpSecureHash = hmacSHA512(vnpHashSecret, hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnpSecureHash;

        String fullUrl = vnpUrl + "?" + queryUrl;
        System.out.println("🔗 VNPay Payment URL created for order: " + orderId);
        System.out.println("📍 Return URL configured: " + vnpReturnUrl);
        
        return fullUrl;
    }

    /**
     * Xác thực response từ VNPay
     * @param params Parameters từ VNPay callback
     * @return true nếu hợp lệ
     */
    public boolean validateResponse(Map<String, String> params) {
        try {
            String vnpSecureHash = params.get("vnp_SecureHash");
            params.remove("vnp_SecureHash");
            params.remove("vnp_SecureHashType");

            // Sắp xếp params và tạo hash data
            List<String> fieldNames = new ArrayList<>(params.keySet());
            Collections.sort(fieldNames);

            StringBuilder hashData = new StringBuilder();
            Iterator<String> itr = fieldNames.iterator();
            while (itr.hasNext()) {
                String fieldName = itr.next();
                String fieldValue = params.get(fieldName);
                if ((fieldValue != null) && (fieldValue.length() > 0)) {
                    hashData.append(fieldName);
                    hashData.append('=');
                    hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                    if (itr.hasNext()) {
                        hashData.append('&');
                    }
                }
            }

            String calculatedHash = hmacSHA512(vnpHashSecret, hashData.toString());
            return calculatedHash.equals(vnpSecureHash);
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Tính HMAC SHA512
     */
    private String hmacSHA512(String key, String data) throws Exception {
        Mac hmac512 = Mac.getInstance("HmacSHA512");
        SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
        hmac512.init(secretKey);
        byte[] hash = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));
        
        StringBuilder result = new StringBuilder();
        for (byte b : hash) {
            result.append(String.format("%02x", b));
        }
        return result.toString();
    }

    /**
     * Query payment status từ VNPay
     */
    public Map<String, String> queryPayment(String orderId, String transDate) throws Exception {
        Map<String, String> vnpParams = new HashMap<>();
        
        vnpParams.put("vnp_Version", "2.1.0");
        vnpParams.put("vnp_Command", "querydr");
        vnpParams.put("vnp_TmnCode", vnpTmnCode);
        vnpParams.put("vnp_TxnRef", orderId);
        vnpParams.put("vnp_OrderInfo", "Query payment: " + orderId);
        vnpParams.put("vnp_TransactionDate", transDate);
        
        Calendar calendar = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String vnpCreateDate = formatter.format(calendar.getTime());
        vnpParams.put("vnp_CreateDate", vnpCreateDate);
        vnpParams.put("vnp_IpAddr", "127.0.0.1");

        // Create secure hash
        List<String> fieldNames = new ArrayList<>(vnpParams.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnpParams.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                if (itr.hasNext()) {
                    hashData.append('&');
                }
            }
        }

        String vnpSecureHash = hmacSHA512(vnpHashSecret, hashData.toString());
        vnpParams.put("vnp_SecureHash", vnpSecureHash);

        return vnpParams;
    }
}
