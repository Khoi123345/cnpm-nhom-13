// foodfast-delivery/frontend/lib/environment.ts

// ⭐️ TOÀN BỘ API_CONFIG ĐÃ BỊ XOÁ

export const API_ENDPOINTS = {
  // Auth (from user-service, via API Gateway)
  AUTH_REGISTER: "/api/auth/register",
  AUTH_LOGIN: "/api/auth/login",
  AUTH_REGISTER_RESTAURANT: "/api/auth/register-restaurant",
  AUTH_LOGOUT: "/api/auth/logout",

  // Products (from product-service, via API Gateway)
  GET_PRODUCTS: "/api/products",
  GET_PRODUCT_DETAIL: "/api/products/:id",
  CREATE_PRODUCT: "/api/products",
  UPDATE_PRODUCT: "/api/products/:id",
  DELETE_PRODUCT: "/api/products/:id",
  GET_MY_PRODUCTS: "/api/products/my-products",

  // Restaurants (from product-service, via API Gateway)
  GET_RESTAURANTS: "/api/restaurants",
  GET_RESTAURANT: "/api/restaurants/:id",
  CREATE_RESTAURANT: "/api/restaurants",
  GET_MY_RESTAURANT: "/api/restaurants/my-restaurant",

  // Orders (from order-service, via API Gateway)
  CREATE_ORDER: "/api/orders/create",
  GET_ALL_ORDERS: "/api/orders/get/all",
  GET_USER_ORDERS: "/api/orders/get/byUser",
  GET_RESTAURANT_ORDERS: "/api/orders/get/byRestaurant",
  UPDATE_ORDER_STATUS: "/api/orders/:id/status",

  // Users (from user-service, via API Gateway)
  GET_USERS: "/api/users",
  GET_USER: "/api/users/:id",

  // Payments (from payment-service, via API Gateway)
  CREATE_VNPAY_PAYMENT: "/api/payments/vnpay/create",
  GET_MY_PAYMENTS: "/api/payments/me",
  GET_PAYMENT: "/api/payments/:id",
  GET_ALL_PAYMENTS_ADMIN: "/api/payments/admin/all",
}
