module.exports = {
  apps: [
    {
      name: "finance-backend",
      script: "backend\\start.js",
      cwd: "c:\\BACKUP FETSU\\Belajar\\FinancePribadi",
      env: {
        NODE_ENV: "production",
        PORT: 4000,
        NODE_TLS_REJECT_UNAUTHORIZED: "0",
      },
      watch: false,
      max_memory_restart: "500M",
      error_file: "c:\\BACKUP FETSU\\Belajar\\FinancePribadi\\logs\\backend-error.log",
      out_file: "c:\\BACKUP FETSU\\Belajar\\FinancePribadi\\logs\\backend-out.log",
    },
    {
      name: "finance-frontend",
      script: "server.js",
      cwd: "c:\\BACKUP FETSU\\Belajar\\FinancePribadi",
      env: {
        NODE_ENV: "production",
        PORT: 8080,
        BACKEND_PORT: 4000,
      },
      watch: false,
      max_memory_restart: "300M",
      error_file: "c:\\BACKUP FETSU\\Belajar\\FinancePribadi\\logs\\frontend-error.log",
      out_file: "c:\\BACKUP FETSU\\Belajar\\FinancePribadi\\logs\\frontend-out.log",
    },
  ],
};
