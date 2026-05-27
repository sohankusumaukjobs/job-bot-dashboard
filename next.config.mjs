/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static-friendly defaults; per-page revalidate handled in app code.
  reactStrictMode: true,
  // Disable image optimization (we don't ship images other than emoji).
  images: { unoptimized: true },
};

export default nextConfig;
