/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      // NextJS <Image> component needs to whitelist domains for src={}
      "lh3.googleusercontent.com",
      "pbs.twimg.com",
      "images.unsplash.com",
      "logos-world.net",
      // Supabase storage domains (add your project-specific domains)
      "supabase.co",
      "supabaseStorage.co",
      // Crisp chat images
      "client.crisp.chat",
      "image.crisp.chat",
      "storage.crisp.chat",
    ],
  },
};

module.exports = nextConfig;
