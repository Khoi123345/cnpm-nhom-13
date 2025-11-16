@echo off
echo ====================================
echo Testing VNPay Payment Integration
echo ====================================
echo.

set BASE_URL=http://localhost:8085

echo 1. Creating VNPay Payment (100,000 VND)...
echo.
curl -X POST "%BASE_URL%/api/payments/vnpay/create?amount=100000&orderInfo=Test payment for order 123" ^
  -H "X-User-Id: 1" ^
  -H "X-User-Role: ROLE_USER"
echo.
echo.
echo Copy the "paymentUrl" from response and open in browser to complete payment
echo.
pause

echo.
echo 2. Get My Payments...
echo.
curl -s "%BASE_URL%/api/payments/me" ^
  -H "X-User-Id: 1" ^
  -H "X-User-Role: ROLE_USER"
echo.
echo.

echo 3. Get All Payments (Admin)...
echo.
curl -s "%BASE_URL%/api/payments/admin/all" ^
  -H "X-User-Id: 999" ^
  -H "X-User-Role: ROLE_ADMIN"
echo.
echo.

echo ====================================
echo Testing Complete!
echo ====================================
echo.
echo Next steps:
echo 1. Copy the paymentUrl from step 1
echo 2. Open it in browser
echo 3. Use VNPay test card to complete payment
echo.
echo Test Card Info (NCB):
echo Card Number: 9704198526191432198
echo Card Holder: NGUYEN VAN A
echo Issue Date: 07/15
echo OTP: 123456
echo.
pause

