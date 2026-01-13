/**
 * Simple health monitor for /health endpoint
 * Polls every 10s and logs failures
 */
const http = require('http');
const logger = require('./utils/logger');

const HEALTH_ENDPOINT = `http://localhost:${process.env.PORT || 3000}/health`;
const POLL_INTERVAL = 10000; // 10 seconds
const MAX_RETRIES = 3;

let consecutiveFailures = 0;

function checkHealth() {
  http.get(HEALTH_ENDPOINT, (res) => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
      if (res.statusCode === 200) {
        const health = JSON.parse(data);
        if (consecutiveFailures > 0) {
          logger.info('✓ Health check recovered after %d failures. Uptime: %ds', consecutiveFailures, health.uptime);
          consecutiveFailures = 0;
        }
      } else {
        consecutiveFailures++;
        logger.warn('✗ Health check failed (status %d), attempt %d', res.statusCode, consecutiveFailures);
      }
    });
  }).on('error', (err) => {
    consecutiveFailures++;
    logger.error('✗ Health check error: %s, attempt %d', err.message, consecutiveFailures);
    
    if (consecutiveFailures >= MAX_RETRIES) {
      logger.error('✗✗✗ Health check failed %d times. Consider restarting.', consecutiveFailures);
    }
  }).setTimeout(5000);
}

logger.info('Starting health monitor for %s (polling every %dms)', HEALTH_ENDPOINT, POLL_INTERVAL);
setInterval(checkHealth, POLL_INTERVAL);
checkHealth(); // Run once immediately
