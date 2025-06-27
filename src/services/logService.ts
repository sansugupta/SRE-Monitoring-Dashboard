import { format } from 'date-fns';

export interface LogMessage {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
}

type Subscriber = (log: LogMessage) => void;

class LogService {
  private logs: LogMessage[] = [];
  private subscribers: Subscriber[] = [];
  private maxLogs = 200;

  log(message: string) {
    this.addLog({ level: 'INFO', message });
  }

  warn(message: string) {
    this.addLog({ level: 'WARN', message });
  }

  error(message: string, error?: any) {
    let fullMessage = message;
    if (error) {
      fullMessage += ` | Details: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
    }
    this.addLog({ level: 'ERROR', fullMessage });
  }

  private addLog({ level, message }: { level: 'INFO' | 'WARN' | 'ERROR', fullMessage: string }) {
    const newLog: LogMessage = {
      timestamp: format(new Date(), 'HH:mm:ss.SSS'),
      level,
      message: fullMessage,
    };

    this.logs.push(newLog);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    this.subscribers.forEach(subscriber => subscriber(newLog));
  }
  
  getLogs(): LogMessage[] {
    return [...this.logs];
  }

  subscribe(callback: Subscriber) {
    this.subscribers.push(callback);
  }

  unsubscribe(callback: Subscriber) {
    this.subscribers = this.subscribers.filter(sub => sub !== callback);
  }
}

// Export a singleton instance
export const logService = new LogService();