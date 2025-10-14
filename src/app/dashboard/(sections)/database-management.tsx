"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Database, AlertTriangle, Search } from "lucide-react";

interface TableData {
  data: Record<string, unknown>[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
}

export default function DatabaseManagementContent() {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [tableColumns, setTableColumns] = useState<TableColumn[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editDialog, setEditDialog] = useState(false);
  const [editRecord, setEditRecord] = useState<Record<string, unknown> | null>(null);
  const [editableFields, setEditableFields] = useState<Record<string, unknown>>({});

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetchTableData();
      fetchTableSchema();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTable, page, search]);

  const fetchTables = async () => {
    try {
      const response = await fetch("/api/database/tables");
      if (!response.ok) throw new Error("Failed to fetch tables");
      const data = await response.json();
      setTables(data.tables);
    } catch {
      setError("Failed to load tables");
    }
  };

  const fetchTableData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "20",
      });
      if (search) params.append("search", search);

      const response = await fetch(`/api/database/${selectedTable}?${params}`);
      if (!response.ok) throw new Error("Failed to fetch table data");
      const data = await response.json();
      setTableData(data);
    } catch {
      setError("Failed to load table data");
    } finally {
      setLoading(false);
    }
  };

  const fetchTableSchema = async () => {
    try {
      const response = await fetch(`/api/database/${selectedTable}/schema`);
      if (!response.ok) throw new Error("Failed to fetch schema");
      const data = await response.json();
      setTableColumns(data.schema);
    } catch {
      console.error("Failed to load schema");
    }
  };

  const handleEdit = (record: Record<string, unknown>) => {
    setEditRecord(record);
    setEditableFields({ ...record });
    setEditDialog(true);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/database/${selectedTable}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editableFields),
      });

      if (!response.ok) throw new Error("Failed to update record");

      setEditDialog(false);
      fetchTableData();
    } catch {
      setError("Failed to update record");
    } finally {
      setLoading(false);
    }
  };

  const isEditable = (tableName: string) => {
    const editableTables = [
      "user",
      "project",
      "warehouse",
      "pricingconfig",
      "warehousematerial",
      "projectmaterial",
      "notification",
    ];
    return editableTables.includes(tableName);
  };

  const formatValue = (value: unknown) => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "object") return JSON.stringify(value);
    if (value instanceof Date) return new Date(value).toLocaleString();
    return String(value);
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2 px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Database Management</h1>
            <p className="text-sm text-muted-foreground">
              View and manage database tables with read-only and limited edit capabilities
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="px-4 lg:px-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Main Content */}
      <div className="px-4 lg:px-6">
        <Card>
        <CardHeader>
          <CardTitle>Select Table</CardTitle>
          <CardDescription>Choose a database table to view and manage</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedTable} onValueChange={setSelectedTable}>
            <SelectTrigger>
              <SelectValue placeholder="Select a table..." />
            </SelectTrigger>
            <SelectContent>
              {tables.map((table) => (
                <SelectItem key={table} value={table}>
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <span className="capitalize">{table}</span>
                    {isEditable(table) ? (
                      <Badge variant="outline" className="ml-2">
                        Editable
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="ml-2">
                        Read-Only
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      </div>

      {selectedTable && tableData && (
        <div className="px-4 lg:px-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="capitalize">{selectedTable}</CardTitle>
                  <CardDescription>
                    {tableData.pagination.totalCount} total records
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="w-full overflow-x-auto">
                    <div className="min-w-full rounded-md border">
                      <Table className="min-w-full">
                        <TableHeader>
                          <TableRow>
                            {tableColumns.slice(0, 10).map((col) => (
                              <TableHead key={col.name} className="capitalize whitespace-nowrap min-w-[150px]">
                                {col.name}
                              </TableHead>
                            ))}
                            {isEditable(selectedTable) && (
                              <TableHead className="w-24 whitespace-nowrap sticky right-0 bg-background">Actions</TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tableData.data.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={tableColumns.length + 1}
                                className="text-center text-muted-foreground"
                              >
                                No records found
                              </TableCell>
                            </TableRow>
                          ) : (
                            tableData.data.map((record, idx) => (
                              <TableRow key={(record.id as string) || idx}>
                                {tableColumns.slice(0, 10).map((col) => (
                                  <TableCell key={col.name} className="whitespace-nowrap min-w-[150px]">
                                    <div className="max-w-[300px]">
                                      <div className="truncate" title={formatValue(record[col.name])}>
                                        {formatValue(record[col.name])}
                                      </div>
                                    </div>
                                  </TableCell>
                                ))}
                                {isEditable(selectedTable) && (
                                  <TableCell className="whitespace-nowrap sticky right-0 bg-background border-l">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEdit(record)}
                                    >
                                      Edit
                                    </Button>
                                  </TableCell>
                                )}
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Page {tableData.pagination.page} of{" "}
                      {tableData.pagination.totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1 || loading}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPage((p) =>
                            Math.min(tableData.pagination.totalPages, p + 1)
                          )
                        }
                        disabled={
                          page === tableData.pagination.totalPages || loading
                        }
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
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Record</DialogTitle>
            <DialogDescription>
              Make changes to the selected record. Click save when you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {editRecord &&
              Object.entries(editableFields)
                .filter(([key]) => key !== "id" && key !== "created_at" && key !== "updated_at")
                .map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key} className="capitalize">
                      {key}
                    </Label>
                    <Input
                      id={key}
                      value={String(value || "")}
                      onChange={(e) =>
                        setEditableFields({ ...editableFields, [key]: e.target.value })
                      }
                    />
                  </div>
                ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

