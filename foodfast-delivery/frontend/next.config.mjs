/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  watchOptions: {
    // Cấu hình này bảo Next.js bỏ qua việc theo dõi các thư mục backend
    // Điều này sẽ ngăn server dev (Turbopack) bị crash
    ignored: [
      "**/node_modules/**",
      "**/.next/**",
      "**/services/**", // 👈 Dòng quan trọng nhất
    ],
  },
}

export default nextConfig
