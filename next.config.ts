/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" }, // for your uploaded images
      { protocol: "https", hostname: "picsum.photos" },      // for placeholder/demo images
    ],
  },
};

module.exports = nextConfig;
