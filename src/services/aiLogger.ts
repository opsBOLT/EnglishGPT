/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * AI Logger Service
 * Logs all AI prompts and responses for debugging and analysis
 */

export type AILogEntry = {
  id: string;
  timestamp: string;
  category: 'onboarding' | 'study_plan' | 'study_content' | 'marking' | 'ai_chat' | 'other';
  model: string;
  prompt: string;
  response: string;
  metadata?: {
    userId?: string;
    duration_ms?: number;
    tokens?: number;
    error?: string;
    [key: string]: any;
  };
};

class AILogger {
  private logs: AILogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory
  private logToConsole = true;
  private logToLocalStorage = true;

  constructor() {
    // Load existing logs from localStorage on init
    this.loadFromLocalStorage();
  }

  /**
   * Log an AI interaction
   */
  log(entry: Omit<AILogEntry, 'id' | 'timestamp'>): void {
    const logEntry: AILogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      ...entry,
    };

    // Add to memory
    this.logs.push(logEntry);

    // Keep only last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log to console
    if (this.logToConsole) {
      this.logToConsoleFormatted(logEntry);
    }

    // Save to localStorage
    if (this.logToLocalStorage) {
      this.saveToLocalStorage();
    }
  }

  /**
   * Log a prompt before sending to AI
   */
  logPrompt(
    category: AILogEntry['category'],
    model: string,
    prompt: string,
    metadata?: AILogEntry['metadata']
  ): string {
    const id = this.generateId();
    const logEntry: AILogEntry = {
      id,
      timestamp: new Date().toISOString(),
      category,
      model,
      prompt,
      response: '[PENDING]',
      metadata: {
        ...metadata,
        status: 'pending',
      },
    };

    this.logs.push(logEntry);

    if (this.logToConsole) {
      console.group(`🤖 [AI ${category.toUpperCase()}] Prompt Sent`);
      console.log('ID:', id);
      console.log('Model:', model);
      console.log('Timestamp:', logEntry.timestamp);
      console.log('Prompt:', prompt);
      if (metadata) console.log('Metadata:', metadata);
      console.groupEnd();
    }

    return id;
  }

  /**
   * Log a response after receiving from AI
   */
  logResponse(
    id: string,
    response: string,
    metadata?: { duration_ms?: number; tokens?: number; error?: string; [key: string]: any }
  ): void {
    const logEntry = this.logs.find(log => log.id === id);
    if (!logEntry) {
      console.warn('[AILogger] Could not find log entry with id:', id);
      return;
    }

    logEntry.response = response;
    logEntry.metadata = {
      ...logEntry.metadata,
      ...metadata,
      status: metadata?.error ? 'error' : 'success',
    };

    if (this.logToConsole) {
      console.group(`✅ [AI ${logEntry.category.toUpperCase()}] Response Received`);
      console.log('ID:', id);
      console.log('Duration:', metadata?.duration_ms ? `${metadata.duration_ms}ms` : 'N/A');
      console.log('Response:', response);
      if (metadata?.error) console.error('Error:', metadata.error);
      console.groupEnd();
    }

    if (this.logToLocalStorage) {
      this.saveToLocalStorage();
    }
  }

  /**
   * Get all logs
   */
  getLogs(): AILogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs by category
   */
  getLogsByCategory(category: AILogEntry['category']): AILogEntry[] {
    return this.logs.filter(log => log.category === category);
  }

  /**
   * Get logs by user ID
   */
  getLogsByUserId(userId: string): AILogEntry[] {
    return this.logs.filter(log => log.metadata?.userId === userId);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    if (this.logToLocalStorage) {
      localStorage.removeItem('ai_logs');
    }
    console.log('[AILogger] All logs cleared');
  }

  /**
   * Export logs as JSON
   */
  exportLogsAsJSON(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Export logs as CSV
   */
  exportLogsAsCSV(): string {
    const headers = ['ID', 'Timestamp', 'Category', 'Model', 'Prompt', 'Response', 'Duration (ms)', 'Error'];
    const rows = this.logs.map(log => [
      log.id,
      log.timestamp,
      log.category,
      log.model,
      `"${log.prompt.replace(/"/g, '""')}"`,
      `"${log.response.replace(/"/g, '""')}"`,
      log.metadata?.duration_ms || '',
      log.metadata?.error || '',
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Download logs as file
   */
  downloadLogs(format: 'json' | 'csv' = 'json'): void {
    const content = format === 'json' ? this.exportLogsAsJSON() : this.exportLogsAsCSV();
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_logs_${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Get statistics
   */
  getStats(): {
    total: number;
    byCategory: Record<string, number>;
    avgDuration: number;
    successRate: number;
  } {
    const total = this.logs.length;
    const byCategory: Record<string, number> = {};
    let totalDuration = 0;
    let successCount = 0;
    let durationCount = 0;

    this.logs.forEach(log => {
      // Count by category
      byCategory[log.category] = (byCategory[log.category] || 0) + 1;

      // Calculate duration
      if (log.metadata?.duration_ms) {
        totalDuration += log.metadata.duration_ms;
        durationCount++;
      }

      // Count successes
      if (log.metadata?.status === 'success') {
        successCount++;
      }
    });

    return {
      total,
      byCategory,
      avgDuration: durationCount > 0 ? totalDuration / durationCount : 0,
      successRate: total > 0 ? (successCount / total) * 100 : 0,
    };
  }

  /**
   * Private: Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Private: Log to console with formatting
   */
  private logToConsoleFormatted(entry: AILogEntry): void {
    const emoji = this.getCategoryEmoji(entry.category);
    console.group(`${emoji} [AI ${entry.category.toUpperCase()}] ${entry.id}`);
    console.log('Timestamp:', entry.timestamp);
    console.log('Model:', entry.model);
    console.log('Prompt:', entry.prompt);
    console.log('Response:', entry.response);
    if (entry.metadata) console.log('Metadata:', entry.metadata);
    console.groupEnd();
  }

  /**
   * Private: Get emoji for category
   */
  private getCategoryEmoji(category: AILogEntry['category']): string {
    const emojis: Record<AILogEntry['category'], string> = {
      onboarding: '👋',
      study_plan: '📋',
      study_content: '📚',
      marking: '✍️',
      ai_chat: '💬',
      other: '🤖',
    };
    return emojis[category] || '🤖';
  }

  /**
   * Private: Save logs to localStorage
   */
  private saveToLocalStorage(): void {
    try {
      localStorage.setItem('ai_logs', JSON.stringify(this.logs));
    } catch (error) {
      console.error('[AILogger] Failed to save logs to localStorage:', error);
    }
  }

  /**
   * Private: Load logs from localStorage
   */
  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('ai_logs');
      if (stored) {
        this.logs = JSON.parse(stored);
        console.log(`[AILogger] Loaded ${this.logs.length} logs from localStorage`);
      }
    } catch (error) {
      console.error('[AILogger] Failed to load logs from localStorage:', error);
    }
  }
}

// Export singleton instance
export const aiLogger = new AILogger();

// Helper function for quick logging
export function logAIInteraction(
  category: AILogEntry['category'],
  model: string,
  prompt: string,
  response: string,
  metadata?: AILogEntry['metadata']
): void {
  aiLogger.log({ category, model, prompt, response, metadata });
}
