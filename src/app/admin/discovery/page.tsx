'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, type SelectOption } from '@/components/ui/Select';
import { getThumbnailUrl } from '@/lib/youtube';
import { getYearRange } from '@/lib/utils';
import type { ApiResponse, DiscoveredVideo, DiscoveryStatus, Act, Performer } from '@/types';

type FilterStatus = 'ALL' | DiscoveryStatus;

interface DiscoveryStats {
  pending: number;
  approved: number;
  rejected: number;
  pushed: number;
}

const showTypeOptions: SelectOption[] = [
  { value: '', label: 'Unknown' },
  { value: 'HOME', label: 'Home Show' },
  { value: 'CALLAWAY', label: 'Callaway Show' },
];

export default function DiscoveryAdminPage() {
  const [items, setItems] = useState<DiscoveredVideo[]>([]);
  const [stats, setStats] = useState<DiscoveryStats | null>(null);
  const [acts, setActs] = useState<Act[]>([]);
  const [users, setUsers] = useState<Performer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('PENDING');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pushingToProd, setPushingToProd] = useState(false);

  // Editing state
  const [editYear, setEditYear] = useState<number | null>(null);
  const [editShowType, setEditShowType] = useState<string>('');
  const [editActNames, setEditActNames] = useState<string[]>([]);
  const [editPerformerIds, setEditPerformerIds] = useState<string[]>([]);
  const [performerSearch, setPerformerSearch] = useState('');

  const years = getYearRange(1950);
  const yearOptions: SelectOption[] = [
    { value: '', label: 'Unknown' },
    ...years.map((year) => ({ value: year.toString(), label: year.toString() })),
  ];

  const fetchItems = useCallback(async () => {
    try {
      const params = new URLSearchParams({ stats: 'true' });
      if (filterStatus !== 'ALL') {
        params.set('status', filterStatus);
      }

      const response = await fetch(`/api/discovery?${params}`);
      const result: ApiResponse<{ items: DiscoveredVideo[]; stats: DiscoveryStats }> = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch items');
      }

      if (result.data) {
        setItems(result.data.items || []);
        setStats(result.data.stats || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load items');
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus]);

  const fetchActs = async () => {
    try {
      const response = await fetch('/api/acts');
      const result = await response.json();
      if (result.data) {
        setActs(result.data);
      }
    } catch (err) {
      // Acts are optional for display
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users?limit=500');
      const result = await response.json();
      if (result.data) {
        setUsers(result.data);
      }
    } catch (err) {
      // Users are optional for display
    }
  };

  useEffect(() => {
    fetchItems();
    fetchActs();
    fetchUsers();
  }, [fetchItems]);

  const handleUpdateStatus = async (id: string, status: DiscoveryStatus) => {
    setProcessingId(id);
    try {
      const response = await fetch(`/api/discovery/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to update');
      }

      await fetchItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSaveEdit = async (id: string) => {
    setProcessingId(id);
    try {
      const response = await fetch(`/api/discovery/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inferredYear: editYear,
          inferredShowType: editShowType || null,
          inferredActNames: editActNames,
          inferredPerformerIds: editPerformerIds,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to save');
      }

      setEditingId(null);
      await fetchItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this discovered video?')) return;

    setProcessingId(id);
    try {
      const response = await fetch(`/api/discovery/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete');
      }

      await fetchItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setProcessingId(null);
    }
  };

  const handlePushToProd = async () => {
    const approvedIds = items
      .filter(item => item.status === 'APPROVED')
      .map(item => item.id);

    if (approvedIds.length === 0) {
      alert('No approved videos to push');
      return;
    }

    if (!confirm(`Push ${approvedIds.length} approved video(s) to production?`)) {
      return;
    }

    setPushingToProd(true);
    try {
      const response = await fetch('/api/discovery/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: approvedIds }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to push to production');
      }

      const { summary, results } = result.data;
      alert(`Pushed to production:\n- Success: ${summary.success}\n- Failed: ${summary.failed}`);

      await fetchItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to push to production');
    } finally {
      setPushingToProd(false);
    }
  };

  const startEditing = (item: DiscoveredVideo) => {
    setEditingId(item.id);
    setEditYear(item.inferredYear || null);
    setEditShowType(item.inferredShowType || '');
    setEditActNames(item.inferredActNames || []);
    setEditPerformerIds(item.inferredPerformerIds || []);
    setPerformerSearch('');
  };

  const toggleActName = (actName: string) => {
    setEditActNames(prev =>
      prev.includes(actName)
        ? prev.filter(a => a !== actName)
        : [...prev, actName]
    );
  };

  const togglePerformer = (userId: string) => {
    setEditPerformerIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredUsers = users.filter(u => {
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    return fullName.includes(performerSearch.toLowerCase());
  });

  const getStatusBadge = (status: DiscoveryStatus) => {
    const styles: Record<DiscoveryStatus, string> = {
      PENDING: 'bg-gold/20 text-gold-dark',
      APPROVED: 'bg-success-light text-success',
      REJECTED: 'bg-error-light text-error',
      PUSHED: 'bg-garnet/20 text-garnet',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(i => i.id)));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;

    for (const id of selectedIds) {
      await handleUpdateStatus(id, 'APPROVED');
    }
    setSelectedIds(new Set());
  };

  const handleBulkReject = async () => {
    if (selectedIds.size === 0) return;

    for (const id of selectedIds) {
      await handleUpdateStatus(id, 'REJECTED');
    }
    setSelectedIds(new Set());
  };

  return (
    <div className="min-h-[80vh]">
      {/* Page Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-garnet rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-text">Video Discovery</h1>
              </div>
              <p className="text-text-muted">
                Review discovered videos and push approved ones to production.
              </p>
              {/* Local-only warning */}
              <div className="mt-2 px-3 py-1.5 bg-gold/10 border border-gold/30 rounded-lg inline-flex items-center gap-2">
                <svg className="w-4 h-4 text-gold-dark" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gold-dark font-medium">Local Database Only</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => fetchItems()}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </Button>
              {stats && stats.approved > 0 && (
                <Button
                  onClick={handlePushToProd}
                  isLoading={pushingToProd}
                  disabled={pushingToProd}
                >
                  Push to Prod ({stats.approved})
                </Button>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="bg-gold/10 rounded-lg p-4">
                <div className="text-2xl font-bold text-gold-dark">{stats.pending}</div>
                <div className="text-sm text-text-muted">Pending Review</div>
              </div>
              <div className="bg-success-light rounded-lg p-4">
                <div className="text-2xl font-bold text-success">{stats.approved}</div>
                <div className="text-sm text-text-muted">Approved</div>
              </div>
              <div className="bg-error-light rounded-lg p-4">
                <div className="text-2xl font-bold text-error">{stats.rejected}</div>
                <div className="text-sm text-text-muted">Rejected</div>
              </div>
              <div className="bg-garnet/10 rounded-lg p-4">
                <div className="text-2xl font-bold text-garnet">{stats.pushed}</div>
                <div className="text-sm text-text-muted">Pushed to Prod</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['PENDING', 'APPROVED', 'REJECTED', 'PUSHED', 'ALL'] as FilterStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filterStatus === status
                  ? 'bg-garnet text-white'
                  : 'bg-surface text-text-secondary hover:bg-border'
              }`}
            >
              {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-4 mb-6 p-4 bg-surface rounded-lg border border-border">
            <span className="text-sm text-text-secondary">{selectedIds.size} selected</span>
            <Button size="sm" onClick={handleBulkApprove}>Approve All</Button>
            <Button size="sm" variant="danger" onClick={handleBulkReject}>Reject All</Button>
            <Button size="sm" variant="secondary" onClick={() => setSelectedIds(new Set())}>Clear</Button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-error-light border border-error/20 rounded-xl p-4 mb-6">
            <p className="text-error">{error}</p>
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} variant="elevated">
                <CardContent className="p-6">
                  <div className="h-6 skeleton rounded w-1/3 mb-4" />
                  <div className="h-4 skeleton rounded w-1/2 mb-2" />
                  <div className="h-4 skeleton rounded w-1/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card variant="elevated">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-text mb-2">No videos found</h3>
              <p className="text-text-muted mb-4">
                Run the discovery script to find videos:
              </p>
              <code className="px-3 py-2 bg-surface rounded text-sm font-mono">
                npx tsx tools/discovery/discover.ts
              </code>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Select All */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedIds.size === items.length && items.length > 0}
                onChange={selectAll}
                className="w-4 h-4 rounded border-border"
              />
              <span className="text-sm text-text-secondary">Select All</span>
            </div>

            {items.map((item) => (
              <Card key={item.id} variant="elevated">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Checkbox */}
                    <div className="flex items-start pt-1">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        className="w-4 h-4 rounded border-border"
                      />
                    </div>

                    {/* Thumbnail */}
                    <div className="shrink-0">
                      <a
                        href={item.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={item.thumbnailUrl || getThumbnailUrl(item.youtubeId, 'medium')}
                          alt={item.rawTitle}
                          className="w-40 h-24 object-cover rounded-lg"
                        />
                      </a>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <a
                            href={item.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-text hover:text-garnet line-clamp-2"
                          >
                            {item.rawTitle}
                          </a>
                          {item.channelName && (
                            <p className="text-sm text-text-muted">{item.channelName}</p>
                          )}
                        </div>
                        {getStatusBadge(item.status)}
                      </div>

                      {editingId === item.id ? (
                        /* Edit Mode */
                        <div className="space-y-3 mt-4 p-4 bg-surface rounded-lg">
                          <div className="grid grid-cols-2 gap-4">
                            <Select
                              id={`year-${item.id}`}
                              label="Year"
                              options={yearOptions}
                              value={editYear?.toString() || ''}
                              onChange={(e) => setEditYear(e.target.value ? parseInt(e.target.value) : null)}
                            />
                            <Select
                              id={`showType-${item.id}`}
                              label="Show Type"
                              options={showTypeOptions}
                              value={editShowType}
                              onChange={(e) => setEditShowType(e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">
                              Acts
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {acts.map((act) => {
                                const isSelected = editActNames.includes(act.name);
                                return (
                                  <button
                                    key={act.id}
                                    type="button"
                                    onClick={() => toggleActName(act.name)}
                                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all border ${
                                      isSelected
                                        ? 'bg-garnet text-white border-garnet'
                                        : 'bg-card text-text-secondary border-border hover:border-garnet'
                                    }`}
                                  >
                                    {act.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Performers Section */}
                          <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">
                              Performers
                            </label>
                            {/* Selected performers */}
                            {editPerformerIds.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-2">
                                {editPerformerIds.map(id => {
                                  const user = users.find(u => u.id === id);
                                  if (!user) return null;
                                  return (
                                    <span
                                      key={id}
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-garnet text-white rounded-lg text-sm"
                                    >
                                      {user.firstName} {user.lastName}
                                      <button
                                        type="button"
                                        onClick={() => togglePerformer(id)}
                                        className="hover:bg-white/20 rounded p-0.5"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                            {/* Search input */}
                            <input
                              type="text"
                              placeholder="Search performers..."
                              value={performerSearch}
                              onChange={(e) => setPerformerSearch(e.target.value)}
                              className="w-full px-3 py-2 border border-border rounded-lg text-sm mb-2 bg-card"
                            />
                            {/* Filtered user list (show when searching) */}
                            {performerSearch && (
                              <div className="max-h-40 overflow-y-auto border border-border rounded-lg bg-card">
                                {filteredUsers.slice(0, 20).map(user => {
                                  const isSelected = editPerformerIds.includes(user.id);
                                  return (
                                    <button
                                      key={user.id}
                                      type="button"
                                      onClick={() => {
                                        togglePerformer(user.id);
                                        setPerformerSearch('');
                                      }}
                                      className={`w-full text-left px-3 py-2 text-sm hover:bg-surface ${
                                        isSelected ? 'bg-garnet/10 text-garnet' : ''
                                      }`}
                                    >
                                      {user.firstName} {user.lastName}
                                      {isSelected && ' ✓'}
                                    </button>
                                  );
                                })}
                                {filteredUsers.length === 0 && (
                                  <div className="px-3 py-2 text-sm text-text-muted">No matches</div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(item.id)}
                              isLoading={processingId === item.id}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* View Mode */
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2 text-sm">
                            {item.inferredYear && (
                              <span className="px-2 py-0.5 bg-surface rounded text-text-secondary">
                                {item.inferredYear}
                              </span>
                            )}
                            {item.inferredShowType && (
                              <span className="px-2 py-0.5 bg-surface rounded text-text-secondary">
                                {item.inferredShowType === 'HOME' ? 'Home Show' : 'Callaway'}
                              </span>
                            )}
                            {item.inferredActNames.map((act, i) => (
                              <span key={i} className="px-2 py-0.5 bg-garnet/10 rounded text-garnet">
                                {act}
                              </span>
                            ))}
                          </div>

                          {item.rawDescription && (
                            <p className="text-sm text-text-muted line-clamp-2">{item.rawDescription}</p>
                          )}

                          {item.inferredPerformers.length > 0 && (
                            <p className="text-sm text-text-secondary">
                              Possible performers: {item.inferredPerformers.join(', ')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {!editingId && item.status !== 'PUSHED' && (
                      <div className="flex flex-col gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => startEditing(item)}
                        >
                          Edit
                        </Button>
                        {item.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(item.id, 'APPROVED')}
                              disabled={processingId === item.id}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleUpdateStatus(item.id, 'REJECTED')}
                              disabled={processingId === item.id}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {item.status === 'APPROVED' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleUpdateStatus(item.id, 'PENDING')}
                            disabled={processingId === item.id}
                          >
                            Unapprove
                          </Button>
                        )}
                        {item.status === 'REJECTED' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleUpdateStatus(item.id, 'PENDING')}
                            disabled={processingId === item.id}
                          >
                            Reconsider
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(item.id)}
                          disabled={processingId === item.id}
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
