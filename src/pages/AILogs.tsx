/**
 * AI Logs Viewer
 * View all AI prompts and responses for debugging
 */

import { useState, useEffect } from 'react';
import { aiLogger, type AILogEntry } from '../services/aiLogger';
import MainLayout from '../components/Layout/MainLayout';
import { Button } from '../components/ui/3d-button';
import { Download, Trash2, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AILogs() {
  const [logs, setLogs] = useState<AILogEntry[]>([]);
  const [filter, setFilter] = useState<AILogEntry['category'] | 'all'>('all');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<ReturnType<typeof aiLogger.getStats>>();

  const loadLogs = () => {
    const allLogs = aiLogger.getLogs();
    setLogs(allLogs);
    setStats(aiLogger.getStats());
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = filter === 'all'
    ? logs
    : logs.filter(log => log.category === filter);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedLogs(newExpanded);
  };

  const handleClearLogs = () => {
    if (confirm('Are you sure you want to clear all logs?')) {
      aiLogger.clearLogs();
      loadLogs();
    }
  };

  const handleDownloadJSON = () => {
    aiLogger.downloadLogs('json');
  };

  const handleDownloadCSV = () => {
    aiLogger.downloadLogs('csv');
  };

  const getCategoryColor = (category: AILogEntry['category']) => {
    const colors: Record<AILogEntry['category'], string> = {
      onboarding: '#3b82f6',
      study_plan: '#aa08f3',
      study_content: '#10b981',
      marking: '#f59e0b',
      ai_chat: '#ec4899',
      other: '#64748b',
    };
    return colors[category];
  };

  const getCategoryLabel = (category: AILogEntry['category']) => {
    const labels: Record<AILogEntry['category'], string> = {
      onboarding: 'Onboarding',
      study_plan: 'Study Plan',
      study_content: 'Study Content',
      marking: 'Marking',
      ai_chat: 'AI Chat',
      other: 'Other',
    };
    return labels[category];
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 sulphur-point-bold">
              AI Logs
            </h1>
            <p className="text-slate-600 sulphur-point-regular mt-1">
              View all AI prompts and responses for debugging
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadLogs} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button onClick={handleDownloadJSON} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" /> JSON
            </Button>
            <Button onClick={handleDownloadCSV} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" /> CSV
            </Button>
            <Button onClick={handleClearLogs} variant="outline_destructive" size="sm">
              <Trash2 className="w-4 h-4 mr-1" /> Clear
            </Button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border-2 border-slate-200 shadow-sm">
              <p className="text-sm text-slate-600 sulphur-point-regular">Total Logs</p>
              <p className="text-3xl font-bold text-slate-900 sulphur-point-bold">
                {stats.total}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border-2 border-slate-200 shadow-sm">
              <p className="text-sm text-slate-600 sulphur-point-regular">Avg Duration</p>
              <p className="text-3xl font-bold text-slate-900 sulphur-point-bold">
                {Math.round(stats.avgDuration)}ms
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border-2 border-slate-200 shadow-sm">
              <p className="text-sm text-slate-600 sulphur-point-regular">Success Rate</p>
              <p className="text-3xl font-bold text-emerald-600 sulphur-point-bold">
                {Math.round(stats.successRate)}%
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border-2 border-slate-200 shadow-sm">
              <p className="text-sm text-slate-600 sulphur-point-regular">Categories</p>
              <p className="text-3xl font-bold text-slate-900 sulphur-point-bold">
                {Object.keys(stats.byCategory).length}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl font-semibold sulphur-point-bold transition-all ${
              filter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All ({logs.length})
          </button>
          {(['onboarding', 'study_plan', 'study_content', 'marking', 'ai_chat', 'other'] as const).map(
            category => {
              const count = logs.filter(log => log.category === category).length;
              if (count === 0) return null;
              return (
                <button
                  key={category}
                  onClick={() => setFilter(category)}
                  className={`px-4 py-2 rounded-xl font-semibold sulphur-point-bold transition-all`}
                  style={{
                    backgroundColor: filter === category ? getCategoryColor(category) : '#f1f5f9',
                    color: filter === category ? 'white' : '#334155',
                  }}
                >
                  {getCategoryLabel(category)} ({count})
                </button>
              );
            }
          )}
        </div>

        {/* Logs */}
        <div className="space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border-2 border-slate-200">
              <p className="text-slate-600 sulphur-point-regular text-lg">
                No logs found. AI interactions will appear here.
              </p>
            </div>
          ) : (
            filteredLogs.reverse().map((log, idx) => {
              const isExpanded = expandedLogs.has(log.id);
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-xl border-2 border-slate-200 shadow-sm overflow-hidden"
                >
                  <div
                    className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => toggleExpand(log.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getCategoryColor(log.category) }}
                        />
                        <div>
                          <p className="font-semibold text-slate-900 sulphur-point-bold">
                            {getCategoryLabel(log.category)} - {log.model}
                          </p>
                          <p className="text-sm text-slate-600 sulphur-point-regular">
                            {new Date(log.timestamp).toLocaleString()}
                            {log.metadata?.duration_ms && (
                              <span className="ml-2">• {log.metadata.duration_ms}ms</span>
                            )}
                            {log.metadata?.error && (
                              <span className="ml-2 text-red-600">• Error</span>
                            )}
                          </p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <EyeOff className="w-5 h-5 text-slate-400" />
                      ) : (
                        <Eye className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-200 p-4 space-y-4 bg-slate-50">
                      {/* Prompt */}
                      <div>
                        <p className="text-sm font-semibold text-slate-900 mb-2 sulphur-point-bold">
                          PROMPT:
                        </p>
                        <pre className="bg-white p-4 rounded-lg text-xs overflow-x-auto border border-slate-200 sulphur-point-regular">
                          {log.prompt}
                        </pre>
                      </div>

                      {/* Response */}
                      <div>
                        <p className="text-sm font-semibold text-slate-900 mb-2 sulphur-point-bold">
                          RESPONSE:
                        </p>
                        <pre className="bg-white p-4 rounded-lg text-xs overflow-x-auto border border-slate-200 sulphur-point-regular max-h-96">
                          {log.response}
                        </pre>
                      </div>

                      {/* Metadata */}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-slate-900 mb-2 sulphur-point-bold">
                            METADATA:
                          </p>
                          <pre className="bg-white p-4 rounded-lg text-xs overflow-x-auto border border-slate-200 sulphur-point-regular">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </MainLayout>
  );
}
