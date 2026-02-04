/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Packages that should not be bundled by Webpack and instead imported by Node.js
  serverExternalPackages: [
    '@remotion/renderer',
    '@remotion/bundler',
    '@remotion/compositor-win32-x64-msvc',
    '@remotion/compositor-darwin-x64',
    '@remotion/compositor-darwin-arm64',
    '@remotion/compositor-linux-x64-gnu',
    '@remotion/compositor-linux-x64-musl',
    '@remotion/compositor-linux-arm64-gnu',
    '@remotion/compositor-linux-arm64-musl'
  ],
};

module.exports = nextConfig;
