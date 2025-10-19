"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HorizontalScrollTable } from "@/components/ui/horizontal-scroll-table";
import { Table } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Database, AlertTriangle, Search, Edit, Save, Download, Upload, HardDrive, Clock, FileDown } from "lucide-react";
import { toast } from "sonner";

interface TableData {
  data: Record<string, unknown>[];
  totalCount: number;
}

interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
}

interface BackupFile {
  name: string;
  size: string;
  created: string;
}

export default function DatabaseManagementContent() {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [tableColumns, setTableColumns] = useState<TableColumn[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editDialog, setEditDialog] = useState(false);
  const [editRecord, setEditRecord] = useState<Record<string, unknown> | null>(null);
  const [editableFields, setEditableFields] = useState<Record<string, unknown>>({});
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [backupDialog, setBackupDialog] = useState(false);
  const [restoreDialog, setRestoreDialog] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    fetchTables();
    fetchBackups();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetchTableData();
      fetchTableSchema();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTable, search]);

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
      const params = new URLSearchParams();
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
      "pricingconfig",
      "notification",
    ];
    return editableTables.includes(tableName);
  };

  const isHidden = (tableName: string) => {
    const hiddenTables = [
      "warehouse",
      "warehousematerial",
      "projectmaterial",
    ];
    return hiddenTables.includes(tableName);
  };

  const formatValue = (value: unknown) => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "object") return JSON.stringify(value);
    if (value instanceof Date) return new Date(value).toLocaleString();
    return String(value);
  };

  const fetchBackups = async () => {
    try {
      const response = await fetch("/api/database/backup");
      if (!response.ok) throw new Error("Failed to fetch backups");
      const data = await response.json();
      setBackups(data.backups || []);
    } catch {
      console.error("Failed to load backups");
    }
  };

  const handleCreateBackup = async () => {
    try {
      setBackupLoading(true);
      toast.info("Creating backup...");
      
      const response = await fetch("/api/database/backup", {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to create backup");
      
      const data = await response.json();
      
      // Automatically download the backup file (important for serverless)
      if (data.content) {
        const blob = new Blob([data.content], { type: "application/sql" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success(`Backup created and downloaded: ${data.filename} (${data.size} MB)`);
      } else {
        toast.success(`Backup created: ${data.filename} (${data.size} MB)`);
      }
      
      await fetchBackups();
      setBackupDialog(false);
    } catch {
      toast.error("Failed to create backup");
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    try {
      setBackupLoading(true);
      
      if (!uploadFile) {
        toast.error("Please upload a backup file");
        setBackupLoading(false);
        return;
      }

      toast.info("Restoring database...");
      
      const formData = new FormData();
      formData.append("file", uploadFile);
      
      const response = await fetch("/api/database/restore/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to restore backup");
      }
      
      toast.success("Database restored successfully!");
      setRestoreDialog(false);
      setUploadFile(null);
      
      // Refresh current table data
      if (selectedTable) {
        fetchTableData();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to restore database";
      toast.error(message);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleDownloadBackup = (filename: string) => {
    const url = `/api/database/backup/download?file=${encodeURIComponent(filename)}`;
    window.open(url, "_blank");
    toast.success("Downloading backup file...");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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

      {/* Backup Management */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Database Backup & Restore
                </CardTitle>
                <CardDescription>
                  Create backups and restore your database
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setBackupDialog(true)}
                  variant="default"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Create Backup
                </Button>
                <Button
                  onClick={() => {
                    fetchBackups();
                    setRestoreDialog(true);
                  }}
                  variant="outline"
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Restore Backup
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {backups.length > 0
                    ? `${backups.length} backup${backups.length !== 1 ? "s" : ""} available`
                    : "No backups available"}
                </span>
              </div>
              {backups.length > 0 && (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Backup File</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {backups.slice(0, 5).map((backup) => (
                        <TableRow key={backup.name}>
                          <TableCell className="font-mono text-sm">
                            {backup.name}
                          </TableCell>
                          <TableCell>{backup.size} MB</TableCell>
                          <TableCell>{formatDate(backup.created)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadBackup(backup.name)}
                                className="gap-1"
                              >
                                <FileDown className="h-3 w-3" />
                                Download
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  handleDownloadBackup(backup.name);
                                  toast.info("Download the file, then use 'Restore Backup' to upload it");
                                }}
                                className="gap-1"
                              >
                                <Upload className="h-3 w-3" />
                                Use for Restore
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
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
              {tables
                .filter((table) => !isHidden(table))
                .map((table) => (
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
                    {tableData.totalCount} total records
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
              <HorizontalScrollTable className="w-full" showScrollControls={false}>
                <div className="min-w-full rounded-md border">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        {tableColumns.map((col) => (
                          <TableHead key={col.name} className="capitalize whitespace-nowrap min-w-[200px] bg-muted/50">
                            <div className="flex items-center gap-2">
                              <span>{col.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {col.type}
                              </Badge>
                              {col.nullable && (
                                <Badge variant="secondary" className="text-xs">
                                  Nullable
                                </Badge>
                              )}
                            </div>
                          </TableHead>
                        ))}
                        {isEditable(selectedTable) && (
                          <TableHead className="w-32 whitespace-nowrap sticky right-0 bg-white border-l">
                            Actions
                          </TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        // Loading skeleton rows
                        Array.from({ length: 5 }).map((_, index) => (
                          <TableRow key={index}>
                            {tableColumns.map((col) => (
                              <TableCell key={col.name} className="whitespace-nowrap min-w-[200px]">
                                <Skeleton className="h-4 w-32" />
                              </TableCell>
                            ))}
                            {isEditable(selectedTable) && (
                              <TableCell className="w-32 whitespace-nowrap sticky right-0 bg-white border-l">
                                <Skeleton className="h-8 w-16" />
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      ) : tableData.data.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={tableColumns.length + (isEditable(selectedTable) ? 1 : 0)}
                            className="text-center text-muted-foreground py-8"
                          >
                            No records found
                          </TableCell>
                        </TableRow>
                      ) : (
                        tableData.data.map((record, idx) => (
                            <TableRow key={(record.id as string) || idx} className="hover:bg-muted/30 transition-colors">
                              {tableColumns.map((col) => (
                                <TableCell key={col.name} className="whitespace-nowrap min-w-[200px]">
                                  <div className="max-w-[400px]">
                                    <div className="truncate font-mono text-sm" title={formatValue(record[col.name])}>
                                      {formatValue(record[col.name])}
                                    </div>
                                  </div>
                                </TableCell>
                              ))}
                              {isEditable(selectedTable) && (
                                <TableCell className="whitespace-nowrap sticky right-0 bg-white border-l">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEdit(record)}
                                    className="hover:bg-primary hover:text-primary-foreground transition-colors"
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
                </HorizontalScrollTable>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Backup Dialog */}
      <Dialog open={backupDialog} onOpenChange={setBackupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Create Database Backup
            </DialogTitle>
            <DialogDescription>
              This will create a complete backup of your database including all tables and data.
              The backup file will be saved and can be downloaded or used for restoration.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Creating a backup may take a few moments depending on your database size.
                The backup will be automatically downloaded to your computer.
                <br />
                <span className="text-xs mt-1 block">
                  Note: On serverless platforms, backups are not stored permanently on the server.
                </span>
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBackupDialog(false)} disabled={backupLoading}>
              Cancel
            </Button>
            <Button onClick={handleCreateBackup} disabled={backupLoading}>
              {backupLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating Backup...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Create Backup
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Backup Dialog */}
      <Dialog open={restoreDialog} onOpenChange={setRestoreDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Restore Database Backup
            </DialogTitle>
            <DialogDescription>
              Select a backup file to restore. This will replace ALL current data in your database.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> Restoring a backup will replace all current data in your database.
                This action cannot be undone. Consider creating a backup of your current database first.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              {/* Upload File Option */}
              <div className="space-y-2">
                <Label>Upload Backup File (.sql)</Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept=".sql"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadFile(file);
                      }
                    }}
                    className="flex-1"
                  />
                  {uploadFile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUploadFile(null)}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                {uploadFile ? (
                  <p className="text-sm text-muted-foreground">
                    Selected: {uploadFile.name} ({(uploadFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Upload a .sql backup file that was previously downloaded
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setRestoreDialog(false);
                setUploadFile(null);
              }} 
              disabled={backupLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRestoreBackup} 
              disabled={backupLoading || !uploadFile}
              variant="destructive"
            >
              {backupLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Restoring...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Restore Database
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Record
              {editRecord?.id ? (
                <Badge variant="outline" className="ml-2">
                  ID: {String(editRecord.id)}
                </Badge>
              ) : null}
            </DialogTitle>
            <DialogDescription>
              Make changes to the selected record. Required fields are marked with an asterisk (*).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {editRecord &&
              Object.entries(editableFields)
                .filter(([key]) => key !== "id" && key !== "created_at" && key !== "updated_at")
                .map(([key, value]) => {
                  const column = tableColumns.find(col => col.name === key);
                  const isRequired = !column?.nullable;
                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={key} className="text-sm font-medium capitalize">
                          {key}
                          {isRequired && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <div className="flex gap-1">
                          {column && (
                            <Badge variant="outline" className="text-xs">
                              {column.type}
                            </Badge>
                          )}
                          {!isRequired && (
                            <Badge variant="secondary" className="text-xs">
                              Optional
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Input
                        id={key}
                        value={String(value || "")}
                        onChange={(e) =>
                          setEditableFields({ ...editableFields, [key]: e.target.value })
                        }
                        placeholder={`Enter ${key}${isRequired ? ' (required)' : ' (optional)'}`}
                        className="w-full font-mono text-sm"
                      />
                    </div>
                  );
                })}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

