module.exports = {
  apps: [
    {
      name: "smart-rabbit",
      script: "dist/index.js",  // adjust if main file is different
      instances: 1,
      autorestart: true,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
        PORT: 3005
      }
    }
  ]
};
