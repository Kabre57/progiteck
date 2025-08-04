interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

interface LogEntry {
  level: string;
  message: string;
  data?: unknown;
  timestamp: string;
  url?: string;
  userAgent?: string;
}

class Logger {
  private logLevel: string;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  constructor() {
    this.logLevel = import.meta.env.VITE_DEBUG_MODE === 'true' ? 'debug' : 'error';
  }

  private shouldLog(level: string): boolean {
    const levels = ['error', 'warn', 'info', 'debug'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  private createLogEntry(level: string, message: string, data?: unknown): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // En production, envoyer les erreurs critiques au serveur
    if (import.meta.env.PROD && entry.level === 'error') {
      this.sendToServer(entry);
    }
  }

  private async sendToServer(entry: LogEntry): Promise<void> {
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry)
      });
    } catch (error) {
      console.error('Failed to send log to server:', error);
    }
  }

  error(message: string, data?: unknown): void {
    const entry = this.createLogEntry('error', message, data);
    this.addLog(entry);
    
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, data);
    }
  }

  warn(message: string, data?: unknown): void {
    const entry = this.createLogEntry('warn', message, data);
    this.addLog(entry);
    
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, data);
    }
  }

  info(message: string, data?: unknown): void {
    const entry = this.createLogEntry('info', message, data);
    this.addLog(entry);
    
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, data);
    }
  }

  debug(message: string, data?: unknown): void {
    const entry = this.createLogEntry('debug', message, data);
    this.addLog(entry);
    
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, data);
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): void {
    const logsData = JSON.stringify(this.logs, null, 2);
    const blob = new Blob([logsData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `progitek-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }
}

export const logger = new Logger();
export default logger;