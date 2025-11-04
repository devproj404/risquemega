module.exports = {
  apps: [{
    name: 'leakynew',
    script: 'server.js',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    // Performance optimizations
    node_args: '--max-old-space-size=2048',
    max_memory_restart: '1G',

    // Graceful reload
    kill_timeout: 5000,
    listen_timeout: 3000,

    // Logging
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

    // Auto restart on file changes (disable in production)
    watch: false,

    // Exponential backoff restart delay
    exp_backoff_restart_delay: 100,

    // Health check
    health_check: {
      enable: true,
      interval: 5000,
      threshold: 3
    }
  }]
};
