// foodfast-delivery/frontend/lib/environment.ts

export const API_ENDPOINTS = {
  // Auth (from user-service)
  AUTH_REGISTER: "/api/v1/auth/register",
  AUTH_LOGIN: "/api/v1/auth/login",
  AUTH_REGISTER_RESTAURANT: "/api/v1/auth/register-restaurant",
  AUTH_LOGOUT: "/api/v1/auth/logout",

  // Products (from product-service) -> THÊM /v1
  GET_PRODUCTS: "/api/v1/products",
  GET_PRODUCT_DETAIL: "/api/v1/products/:id",
  CREATE_PRODUCT: "/api/v1/products",
  UPDATE_PRODUCT: "/api/v1/products/:id",
  DELETE_PRODUCT: "/api/v1/products/:id",
  GET_MY_PRODUCTS: "/api/v1/products/my-products",

  // Restaurants (from product-service) -> THÊM /v1
  GET_RESTAURANTS: "/api/v1/restaurants",
  GET_RESTAURANT: "/api/v1/restaurants/:id",
  CREATE_RESTAURANT: "/api/v1/restaurants",
  GET_MY_RESTAURANT: "/api/v1/restaurants/my-restaurant",

  // Orders (from order-service) -> THÊM /v1
  CREATE_ORDER: "/api/v1/orders/create",
  GET_ALL_ORDERS: "/api/v1/orders/get/all",
  GET_USER_ORDERS: "/api/v1/orders/get/byUser",
  GET_RESTAURANT_ORDERS: "/api/v1/orders/get/byRestaurant",
  UPDATE_ORDER_STATUS: "/api/v1/orders/:id/status",
  SHIP_ORDER: "/api/v1/orders/:id/ship",

  // Users (from user-service) -> THÊM /v1
  GET_USERS: "/api/v1/users",
  GET_USER: "/api/v1/users/:id",

  // Payments (from payment-service) -> THÊM /v1
  CREATE_VNPAY_PAYMENT: "/api/v1/payments/vnpay/create",
  GET_MY_PAYMENTS: "/api/v1/payments/me",
  GET_PAYMENT: "/api/v1/payments/:id",
  GET_ALL_PAYMENTS_ADMIN: "/api/v1/payments/admin/all",

  // Drones (from drone-service) -> THÊM /v1
  GET_MY_DRONES: "/api/v1/drones/my-restaurant",
  GET_AVAILABLE_DRONES: "/api/v1/drones/my-restaurant/available",
  SUBMIT_DRONE_REQUEST: "/api/v1/drones/registration-requests",
  GET_MY_DRONE_REQUESTS: "/api/v1/drones/my-requests",
  GET_PENDING_DRONE_REQUESTS: "/api/v1/admin/drones/requests/pending",
  APPROVE_DRONE_REQUEST: "/api/v1/admin/drones/requests/:id/approve",
  REJECT_DRONE_REQUEST: "/api/v1/admin/drones/requests/:id/reject",
  GET_ALL_DRONES: "/api/v1/admin/drones/all",
}