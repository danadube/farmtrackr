/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable caching for static assets to force fresh builds
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
}

export default nextConfig

