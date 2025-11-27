'use client';

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  type RowSelectionState,
  useReactTable,
} from '@tanstack/react-table';
import { Filter, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  type DataExplorerFilters,
  type DataExplorerItemType,
  useDataExplorer,
  useDataExplorerBulkUpdate,
} from '@/lib/hooks/useDataExplorer';
import type { JiraTicket, LifecyclePhase } from '@/lib/types';
import { LIFECYCLE_PHASE_LABELS, LIFECYCLE_PHASES } from '@/lib/types';
import { BulkActionsToolbar } from './BulkActionsToolbar';

interface DataExplorerViewProps {
  caseStudyId: string;
}

const PAGE_SIZE = 25;

export function DataExplorerView({ caseStudyId }: DataExplorerViewProps) {
  const [type, setType] = useState<DataExplorerItemType>('ticket');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [phaseFilter, setPhaseFilter] = useState<string>('');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('');
  const [excludedOnly, setExcludedOnly] = useState(false);
  const [hasOverrides, setHasOverrides] = useState(false);
  const [page, setPage] = useState(0);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const filters: DataExplorerFilters = {
    caseStudyId,
    type,
    search: debouncedSearch || undefined,
    phase: phaseFilter || undefined,
    discipline: disciplineFilter || undefined,
    excludedOnly: excludedOnly || undefined,
    hasOverrides: hasOverrides || undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  };

  const { data, isLoading, error } = useDataExplorer<JiraTicket>(filters);
  const bulkUpdate = useDataExplorerBulkUpdate();

  const handleSearchChange = (value: string) => {
    setSearch(value);
    const timer = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  };

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setPhaseFilter('');
    setDisciplineFilter('');
    setExcludedOnly(false);
    setHasOverrides(false);
    setPage(0);
  };

  const hasActiveFilters =
    debouncedSearch || phaseFilter || disciplineFilter || excludedOnly || hasOverrides;

  const columns: ColumnDef<JiraTicket>[] = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'jiraKey',
        header: 'Key',
        cell: ({ row }) => <span className="font-mono text-sm">{row.getValue('jiraKey')}</span>,
      },
      {
        accessorKey: 'summary',
        header: 'Summary',
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-[300px]">{row.getValue('summary')}</span>
        ),
      },
      {
        accessorKey: 'currentStatus',
        header: 'Status',
        cell: ({ row }) => <Badge variant="outline">{row.getValue('currentStatus')}</Badge>,
      },
      {
        id: 'effectivePhase',
        header: 'Phase',
        cell: ({ row }) => {
          const ticket = row.original;
          const phase = ticket.phaseOverride;
          const isOverride = !!ticket.phaseOverride;
          return (
            <Badge variant={isOverride ? 'default' : 'secondary'}>
              {phase ? LIFECYCLE_PHASE_LABELS[phase as LifecyclePhase] || phase : 'Auto'}
            </Badge>
          );
        },
      },
      {
        id: 'effectiveDiscipline',
        header: 'Discipline',
        cell: ({ row }) => {
          const ticket = row.original;
          const discipline = ticket.disciplineOverride || ticket.discipline;
          const isOverride = !!ticket.disciplineOverride;
          return discipline ? (
            <Badge variant={isOverride ? 'default' : 'secondary'}>{discipline}</Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        id: 'effectiveComplexity',
        header: 'Complexity',
        cell: ({ row }) => {
          const ticket = row.original;
          const complexity = ticket.complexityOverride || ticket.complexitySize;
          const isOverride = !!ticket.complexityOverride;
          return complexity ? (
            <Badge variant={isOverride ? 'default' : 'secondary'}>{complexity}</Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: 'excludedFromMetrics',
        header: 'Excluded',
        cell: ({ row }) =>
          row.getValue('excludedFromMetrics') ? (
            <Badge variant="destructive">Excluded</Badge>
          ) : null,
      },
    ],
    []
  );

  const tableData = useMemo(() => data?.data || [], [data?.data]);

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
    getRowId: (row) => row.id,
    manualPagination: true,
    pageCount: Math.ceil((data?.total || 0) / PAGE_SIZE),
  });

  const selectedIds = Object.keys(rowSelection);
  const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE);

  const handleBulkAction = async (updates: {
    phaseOverride?: string | null;
    disciplineOverride?: string | null;
    complexityOverride?: string | null;
    excludedFromMetrics?: boolean;
  }) => {
    if (selectedIds.length === 0) return;
    await bulkUpdate.mutateAsync({
      type,
      ids: selectedIds,
      updates,
    });
    setRowSelection({});
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <Select
              value={type}
              onValueChange={(v) => {
                setType(v as DataExplorerItemType);
                setPage(0);
                setRowSelection({});
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Data type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ticket">Tickets</SelectItem>
                <SelectItem value="event">Lifecycle Events</SelectItem>
                <SelectItem value="normalized_event">Normalized Events</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by key or summary..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={phaseFilter}
              onValueChange={(v) => {
                setPhaseFilter(v === 'all' ? '' : v);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Phase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Phases</SelectItem>
                {LIFECYCLE_PHASES.map((phase) => (
                  <SelectItem key={phase} value={phase}>
                    {LIFECYCLE_PHASE_LABELS[phase]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={disciplineFilter}
              onValueChange={(v) => {
                setDisciplineFilter(v === 'all' ? '' : v);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Discipline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Disciplines</SelectItem>
                <SelectItem value="backend">Backend</SelectItem>
                <SelectItem value="frontend">Frontend</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
                <SelectItem value="data">Data</SelectItem>
                <SelectItem value="devops">DevOps</SelectItem>
                <SelectItem value="qa">QA</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={excludedOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setExcludedOnly(!excludedOnly);
                setPage(0);
              }}
            >
              <Filter className="mr-1 h-4 w-4" />
              Excluded Only
            </Button>

            <Button
              variant={hasOverrides ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setHasOverrides(!hasOverrides);
                setPage(0);
              }}
            >
              <Filter className="mr-1 h-4 w-4" />
              Has Overrides
            </Button>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {selectedIds.length > 0 && (
            <BulkActionsToolbar
              selectedCount={selectedIds.length}
              onAction={handleBulkAction}
              isLoading={bulkUpdate.isPending}
            />
          )}

          {isLoading ? (
            <div className="flex h-[400px] items-center justify-center">
              <span className="text-muted-foreground">Loading...</span>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-dashed border-destructive p-8 text-center text-destructive">
              Failed to load data. Please try again.
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 text-center">
                          No results.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {data?.offset || 0 + 1} to{' '}
                  {Math.min((data?.offset || 0) + PAGE_SIZE, data?.total || 0)} of{' '}
                  {data?.total || 0} results
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages - 1}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
