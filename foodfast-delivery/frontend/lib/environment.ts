// API endpoints configuration
export const API_CONFIG = {
  USER_SERVICE: process.env.NEXT_PUBLIC_USER_SERVICE_URL || "http://localhost:3001",
  PRODUCT_SERVICE: process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || "http://localhost:3002",
  ORDER_SERVICE: process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || "http://localhost:8082",
  PAYMENT_SERVICE: process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL || "http://localhost:8081",
}

export const API_ENDPOINTS = {
  // Auth
  AUTH_REGISTER: "/api/v1/auth/register",
  AUTH_LOGIN: "/api/v1/auth/login",
  AUTH_REGISTER_RESTAURANT: "/api/v1/auth/register-restaurant",
  AUTH_LOGOUT: "/api/v1/auth/logout",

  // Products
  GET_PRODUCTS: "/api/v1/products",
  CREATE_PRODUCT: "/api/v1/products",
  UPDATE_PRODUCT: "/api/v1/products/:id",
  DELETE_PRODUCT: "/api/v1/products/:id",
  GET_MY_PRODUCTS: "/api/v1/products/my-products",

  // Restaurants
  GET_RESTAURANTS: "/api/v1/restaurants",
  GET_RESTAURANT: "/api/v1/restaurants/:id",
  CREATE_RESTAURANT: "/api/v1/restaurants",
  GET_MY_RESTAURANT: "/api/v1/restaurants/my-restaurant",

  // Orders
  CREATE_ORDER: "/api/order",
  GET_ORDER: "/api/order/:id",
  GET_USER_ORDERS: "/api/order/user/:userId",
  UPDATE_ORDER_STATUS: "/api/order/:id",

  // Users
  GET_USERS: "/api/v1/users",
  GET_USER: "/api/v1/users/:id",
}
