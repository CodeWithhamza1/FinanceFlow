"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import Header from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Filter, Calendar, X, Search, Activity } from 'lucide-react';
import api from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { LogActions } from '@/lib/log-actions';

interface LogEntry {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  description: string;
  metadata: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export default function LogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [mounted, setMounted] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Prevent hydration mismatch by only rendering dates after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchLogs = useCallback(async (pageNum: number = 1, reset: boolean = true) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
      });

      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (actionFilter) params.append('action', actionFilter);

      const response = await api.get(`/api/logs?${params.toString()}`);
      const data = response.data;

      if (reset) {
        setLogs(data.logs);
      } else {
        setLogs(prev => [...prev, ...data.logs]);
      }

      setPagination(data.pagination);
      setPage(data.pagination.page);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [dateFrom, dateTo, actionFilter]);

  useEffect(() => {
    fetchLogs(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo, actionFilter]);

  // Log that logs page was viewed (only once on mount)
  useEffect(() => {
    if (user) {
      api.post('/api/logs', {
        action: LogActions.LOGS_VIEW,
        description: 'Viewed activity logs page',
      }).catch(() => {}); // Silently fail
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Infinite scroll setup
  useEffect(() => {
    if (!pagination?.hasMore || loading || loadingMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && pagination?.hasMore && !loadingMore) {
          fetchLogs(page + 1, false);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current && loadMoreRef.current) {
        observerRef.current.unobserve(loadMoreRef.current);
      }
    };
  }, [pagination, loading, loadingMore, page, fetchLogs]);

  const handleFilter = () => {
    setPage(1);
    fetchLogs(1, true);
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setActionFilter('');
    setPage(1);
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('LOGIN') || action.includes('SIGNUP')) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
    if (action.includes('UPDATE') || action.includes('CHANGE')) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
    if (action.includes('DELETE') || action.includes('LOGOUT')) {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  const formatAction = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getActionIcon = (action: string) => {
    if (action.includes('LOGIN') || action.includes('SIGNUP')) return '🔐';
    if (action.includes('LOGOUT')) return '🚪';
    if (action.includes('EXPENSE')) return '💰';
    if (action.includes('BUDGET')) return '📊';
    if (action.includes('INCOME')) return '💵';
    if (action.includes('CATEGORY')) return '🏷️';
    if (action.includes('PROFILE') || action.includes('AVATAR')) return '👤';
    if (action.includes('AI')) return '🤖';
    return '📝';
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6 md:gap-8 md:p-8">
        <div className="container mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Activity Logs</h1>
          <p className="text-muted-foreground mt-1">
            Track all your account activities and changes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-muted-foreground" />
          {pagination && (
            <span className="text-sm text-muted-foreground">
              {pagination.total} total entries
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>Filter logs by date and action type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="action">Action Type</Label>
              <Select value={actionFilter || undefined} onValueChange={(value) => setActionFilter(value || '')}>
                <SelectTrigger id="action">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(LogActions).map((action) => (
                    <SelectItem key={action} value={action}>
                      {formatAction(action)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex items-end">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle>Activity History</CardTitle>
          <CardDescription>
            {pagination && `Showing ${logs.length} of ${pagination.total} entries`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No logs found for the selected filters.</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4 pr-4">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getActionIcon(log.action)}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`px-2 py-1 rounded-md text-xs font-medium ${getActionBadgeColor(log.action)}`}
                              >
                                {formatAction(log.action)}
                              </span>
                              {log.entityType && (
                                <span className="text-xs text-muted-foreground">
                                  {log.entityType}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-medium mt-1">{log.description}</p>
                          </div>
                        </div>

                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div className="ml-9 mt-2 p-2 bg-muted/50 rounded text-xs">
                            <details className="cursor-pointer">
                              <summary className="font-medium text-muted-foreground">
                                View Details
                              </summary>
                              <pre className="mt-2 whitespace-pre-wrap text-xs">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}

                        <div className="ml-9 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          {mounted ? (
                            <>
                              <span>
                                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                              </span>
                              <span>•</span>
                              <span>{new Date(log.createdAt).toLocaleString()}</span>
                            </>
                          ) : (
                            <>
                              <span>Loading...</span>
                              <span>•</span>
                              <span>{new Date(log.createdAt).toISOString().replace('T', ' ').slice(0, 19)}</span>
                            </>
                          )}
                          {log.ipAddress && (
                            <>
                              <span>•</span>
                              <span>IP: {log.ipAddress}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Infinite scroll trigger */}
                {pagination?.hasMore && (
                  <div ref={loadMoreRef} className="flex justify-center py-4">
                    {loadingMore ? (
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Scroll down to load more...
                      </span>
                    )}
                  </div>
                )}

                {!pagination?.hasMore && logs.length > 0 && (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No more logs to load
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
        </div>
      </main>
    </div>
  );
}

