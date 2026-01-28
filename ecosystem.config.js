module.exports = {
  apps: [
    {
      name: "smart-rabbit",
      script: "dist/index.js",        // compiled output
      instances: 1,                   // single instance for 1GB RAM VPS
      autorestart: true,
      max_memory_restart: "300M",     // restart if memory usage is too high
      env: {
        NODE_ENV: "production",
        PORT: 3005                     // must match Docker expose & Nginx proxy
      }
    }
  ]
};
