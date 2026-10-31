module.exports = {
  apps: [
    {
      name: "jbs-backend-api",
      script: "index.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      restart_delay: 2000,
      env: {
        NODE_ENV: "production",
        PORT: 4800,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 4800,
      },
      error_file: "logs/err.log",
      out_file: "logs/out.log",
      time: true,
      merge_logs: true,
    },
  ],
};
