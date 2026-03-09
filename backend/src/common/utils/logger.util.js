/**
 * Logger Utility
 * Simple logging utility for the application
 */

/**
 * Log levels
 */
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

/**
 * Current log level (can be set via environment variable)
 */
const currentLogLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] || LOG_LEVELS.INFO;

/**
 * Format timestamp
 */
function formatTimestamp() {
  return new Date().toISOString();
}

/**
 * Format log message
 */
function formatMessage(level, message, ...args) {
  const timestamp = formatTimestamp();
  const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ') : '';
  
  return `[${timestamp}] ${level}: ${message}${formattedArgs}`;
}

/**
 * Log error messages
 */
function error(message, ...args) {
  if (currentLogLevel >= LOG_LEVELS.ERROR) {
    console.error(formatMessage('ERROR', message, ...args));
  }
}

/**
 * Log warning messages
 */
function warn(message, ...args) {
  if (currentLogLevel >= LOG_LEVELS.WARN) {
    console.warn(formatMessage('WARN', message, ...args));
  }
}

/**
 * Log info messages
 */
function info(message, ...args) {
  if (currentLogLevel >= LOG_LEVELS.INFO) {
    console.log(formatMessage('INFO', message, ...args));
  }
}

/**
 * Log debug messages
 */
function debug(message, ...args) {
  if (currentLogLevel >= LOG_LEVELS.DEBUG) {
    console.log(formatMessage('DEBUG', message, ...args));
  }
}

module.exports = {
  error,
  warn,
  info,
  debug,
  LOG_LEVELS
};