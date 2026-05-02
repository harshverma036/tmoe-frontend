"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Check,
  ChevronsUpDown,
  Filter,
  Loader2,
  Search,
  Square,
} from "lucide-react"
import { useState, useEffect } from "react"

export interface iHandleFetchParams {
  sorting_col: string
  sorting_order: string
}

interface DataTableProps {
  data: any[]
  columns: { accessorKey: string; header: string }[]
  sorting?: any[]
  setSorting?: any // function type
  pagination: iPagination
  setPagination?: any
  totalCount: number // client-side case me yeh data.length ke equal hona chahiye ideally
  count: number
  title?: string
  setQuery?: any
  query?: string
  actionButtons?: React.ReactNode
  isFetching?: boolean // info: pass only when search query is being fetched
  isCustomFilter?: boolean
  customFilter?: React.ReactNode
  enableMultiSelect?: boolean
  customFilterOpen?: boolean
  setCustomFilterOpen?: (open: boolean) => void
  onDeleteSelected?: (id: string[]) => void
}

export interface iTableSorting {
  id: string
  desc: boolean
}

export interface iPagination {
  pageIndex: number // info: page number
  pageSize: number // info: number of items per page
}

const DataTable = ({
  data,
  columns,
  enableMultiSelect = false,
  ...props
}: DataTableProps) => {
  "use no memo"

  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({})

  const hasAnySelected = Object.values(selectedRows).some(Boolean)

  const getRowId = (row: any) => String(row.original.id)

  const total = Number(props.totalCount ?? 0)
  const pageCount = Math.ceil(total / props.pagination.pageSize) || 1

  // eslint-disable-next-line react-hooks/incompatible-library
  const reactTable = useReactTable({
    data,
    columns,
    state: {
      sorting: props?.sorting,
      pagination: props?.pagination,
    },
    getRowId: (originalRow: any) => String(originalRow.id),
    onPaginationChange: props?.setPagination,
    onSortingChange: props?.setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(), // IMPORTANT: client-side pagination
    manualPagination: true,
    pageCount,
  })

  const selectedId = Object.keys(selectedRows).filter((id) => selectedRows[id])

  const currentPageIndex = reactTable.getState().pagination.pageIndex
  const pageSize = reactTable.getState().pagination.pageSize
  const pageRows = reactTable.getRowModel().rows
  const hasRows = pageRows.length > 0
  const isAllOnPageSelected =
    hasRows && pageRows.every((row) => selectedRows[getRowId(row)])

  useEffect(() => {
    setSelectedRows({})
  }, [props?.pagination?.pageIndex, props?.pagination?.pageSize])

  const handleSelectAll = () => {
    const newValue = !isAllOnPageSelected

    setSelectedRows((prev) => {
      const updated: Record<string, boolean> = { ...prev }

      // only current page rows
      reactTable.getRowModel().rows.forEach((row) => {
        const rowId = getRowId(row)
        updated[rowId] = newValue
      })

      return updated
    })
  }

  const handleRowSelect = (rowId: string) => {
    setSelectedRows((prev) => {
      const updated: Record<string, boolean> = {
        ...prev,
        [rowId]: !prev[rowId],
      }
      return updated
    })
  }
  // <Card className="py-3 shadow-none ring-1 ring-border/50">
  //   <CardContent className="px-3 md:px-4">
  //   </CardContent>
  // </Card>

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-sm">
            <div className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground">
              {props?.isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </div>
            <Input
              placeholder={`Search ${props?.title}...`}
              className="pl-8"
              onChange={(e) => props?.setQuery(e.target.value)}
              value={props?.query}
            />
          </div>
          {props.isCustomFilter && (
            <Button
              variant={props?.customFilterOpen ? "secondary" : "outline"}
              size="sm"
              onClick={() =>
                props?.setCustomFilterOpen
                  ? props?.setCustomFilterOpen(!props?.customFilterOpen)
                  : null
              }
              className="w-full sm:w-auto"
            >
              <Filter className="h-4 w-4" />
              {/* Filters */}
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {enableMultiSelect && hasAnySelected && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (props.onDeleteSelected) {
                  props.onDeleteSelected(selectedId)
                }
                setSelectedRows({})
              }}
            >
              Delete Selected ({selectedId.length})
            </Button>
          )}

          {props?.actionButtons}
        </div>
      </div>

      {props?.customFilterOpen && (
        <div className="rounded-md bg-muted/30 px-3 py-3">
          {props?.customFilter}
        </div>
      )}

      <div className="overflow-x-auto rounded-md shadow-sm border border-border/50">
        <Table className="min-w-full">
          <TableHeader className="bg-muted/40">
            {reactTable?.getHeaderGroups()?.map((headerGroup, index) => (
              <TableRow key={headerGroup.id ?? index}>
                {enableMultiSelect && (
                  <TableHead className="w-12">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleSelectAll}
                      aria-label="Select all rows"
                    >
                      {isAllOnPageSelected ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                )}

                {headerGroup?.headers?.map((header, header_i) => (
                  <TableHead
                    className="whitespace-nowrap"
                    onClick={header?.column?.getToggleSortingHandler()}
                    key={header_i}
                  >
                    <div className="flex cursor-pointer items-center gap-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      {flexRender(
                        header?.column?.columnDef?.header,
                        header.getContext()
                      )}
                      <ChevronsUpDown className="h-3.5 w-3.5" />
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {hasRows ? (
              pageRows.map((row, index: number) => (
                <TableRow key={row?.id ?? index}>
                  {enableMultiSelect && (
                    <TableCell className="w-12">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleRowSelect(getRowId(row))}
                        aria-label="Select row"
                      >
                        {selectedRows[getRowId(row)] ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  )}

                  {row?.getVisibleCells()?.map((cell) => (
                    <TableCell key={cell.id} className="py-3 whitespace-nowrap">
                      {flexRender(
                        cell?.column?.columnDef?.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (enableMultiSelect ? 1 : 0)}
                  className="h-24 text-center text-muted-foreground"
                >
                  No records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 border-t border-border/60 pt-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Select
            defaultValue={String(pageSize)}
            onValueChange={(e) =>
              props?.setPagination((prev: iPagination) => ({
                ...prev,
                pageSize: Number(e),
                pageIndex: 0,
              }))
            }
          >
            <SelectTrigger className="h-9 w-[130px]">
              <SelectValue
                placeholder={`${props?.pagination?.pageSize} / Page`}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {[10, 25, 50, 100]?.map((pageSizeOption, index) => (
                  <SelectItem value={pageSizeOption?.toString()} key={index}>
                    {`${pageSizeOption} / Page`}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">
            {total} total records
          </span>
        </div>

        <div className="text-sm text-muted-foreground">
          Page {pageCount ? currentPageIndex + 1 : 0} of {pageCount || 0}
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => reactTable?.previousPage()}
            size={"sm"}
            variant={"outline"}
            disabled={!reactTable?.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            onClick={() => reactTable?.nextPage()}
            size={"sm"}
            variant={"outline"}
            disabled={!reactTable?.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

export default DataTable
