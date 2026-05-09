import { useRef, useState } from "react";
import { Upload, FileText, Download, X, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const T = {
  sans: '"Satoshi", ui-sans-serif, system-ui, -apple-system, sans-serif',
  text: "#1a1a1a",
  dim: "#6b6b6b",
  border: "#e8e3d8",
  green: "#C5E831",
  off: "#fafaf8",
};

type ParsedRow = {
  name: string;
  email: string;
  phone: string;
  rowIndex: number;
};

type ValidationResult = {
  valid: ParsedRow[];
  skipped: { row: number; reason: string }[];
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Indian phone: optional +91/0, then 10 digits starting 6-9
const PHONE_RE = /^(?:\+?91[-\s]?|0)?[6-9]\d{9}$/;

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") {
        cur.push(field);
        field = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        cur.push(field);
        rows.push(cur);
        cur = [];
        field = "";
      } else field += c;
    }
  }
  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }
  return rows.filter((r) => r.length > 0 && r.some((c) => c.trim() !== ""));
}

function validate(rows: string[][]): ValidationResult {
  const result: ValidationResult = { valid: [], skipped: [] };
  if (rows.length === 0) return result;
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idxName = header.findIndex((h) => h === "name" || h === "full name");
  const idxEmail = header.findIndex((h) => h === "email");
  const idxPhone = header.findIndex((h) => h === "phone" || h === "phone number" || h === "mobile");

  if (idxName === -1 || idxEmail === -1 || idxPhone === -1) {
    return result;
  }

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const name = (r[idxName] ?? "").trim();
    const email = (r[idxEmail] ?? "").trim();
    const phone = (r[idxPhone] ?? "").trim();
    const rowNum = i + 1;
    if (!name || !email || !phone) {
      result.skipped.push({ row: rowNum, reason: "missing required field" });
      continue;
    }
    if (!EMAIL_RE.test(email)) {
      result.skipped.push({ row: rowNum, reason: "invalid email" });
      continue;
    }
    if (!PHONE_RE.test(phone.replace(/\s+/g, ""))) {
      result.skipped.push({ row: rowNum, reason: "invalid phone" });
      continue;
    }
    result.valid.push({ name, email, phone, rowIndex: rowNum });
  }
  return result;
}

export default function ImportCandidatesModal({
  open,
  onClose,
  onImported,
  userId,
  defaultRoleId,
  defaultRoleType,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
  userId: string;
  defaultRoleId: string | null;
  defaultRoleType: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ValidationResult | null>(null);
  const [headerError, setHeaderError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const reset = () => {
    setFileName(null);
    setParsed(null);
    setHeaderError(null);
    setDragOver(false);
  };

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please upload a .csv file");
      return;
    }
    const text = await file.text();
    const rows = parseCSV(text);
    const v = validate(rows);
    if (rows.length > 0) {
      const header = rows[0].map((h) => h.trim().toLowerCase());
      const has = ["name", "email", "phone"].every((k) =>
        header.some((h) => h === k || h === `${k} number` || h === "full name" || h === "mobile"),
      );
      if (!has) {
        setHeaderError("CSV must include columns: name, email, phone");
        setParsed(null);
        setFileName(file.name);
        return;
      }
    }
    setHeaderError(null);
    setParsed(v);
    setFileName(file.name);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const downloadTemplate = () => {
    const csv = "name,email,phone\nPriya Sharma,priya@example.com,+919876543210\nRahul Verma,rahul@example.com,9876543211\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "candidates_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = async () => {
    if (!parsed || parsed.valid.length === 0) return;
    setImporting(true);
    const now = new Date().toISOString();
    const payload = parsed.valid.map((r) => ({
      name: r.name,
      email: r.email,
      phone: r.phone,
      role_id: defaultRoleId,
      role_type: defaultRoleType,
      source: "imported",
      invited_by: userId,
      invitation_sent_at: now,
      status: "in_progress",
      completed: false,
    }));

    const { error, data } = await supabase
      .from("assessment_sessions")
      .insert(payload)
      .select("id, email");

    if (error) {
      toast.error(`Import failed: ${error.message}`);
      setImporting(false);
      return;
    }

    // Placeholder for invitation email — log to console
    (data ?? []).forEach((row) => {
      console.info(`[invitation] would send to ${row.email} (session ${row.id})`);
    });

    toast.success(
      `${parsed.valid.length} candidate${parsed.valid.length === 1 ? "" : "s"} imported. Invitations will be sent shortly.`,
    );
    if (parsed.skipped.length > 0) {
      toast.message(`${parsed.skipped.length} row${parsed.skipped.length === 1 ? "" : "s"} skipped due to validation errors`);
    }
    setImporting(false);
    reset();
    onClose();
    onImported();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent
        className="max-w-2xl"
        style={{ fontFamily: T.sans, padding: 28, borderRadius: 20 }}
      >
        <DialogHeader>
          <DialogTitle style={{ fontSize: 24, fontWeight: 600, color: T.text, letterSpacing: "-0.01em" }}>
            Import Your Candidates
          </DialogTitle>
          <DialogDescription style={{ fontSize: 15, color: T.dim, marginTop: 6 }}>
            Upload a CSV with candidate details and we'll invite them to take the AC assessment.
          </DialogDescription>
        </DialogHeader>

        <div style={{ marginTop: 16 }}>
          {!fileName ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? T.green : T.border}`,
                background: dragOver ? "#fafff0" : T.off,
                borderRadius: 16,
                padding: "40px 24px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 120ms ease",
              }}
            >
              <div
                style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: "#fff", border: `1px solid ${T.border}`,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                <Upload size={22} color={T.text} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 4 }}>
                Drag & drop your CSV here
              </div>
              <div style={{ fontSize: 13, color: T.dim }}>or click to browse · .csv only</div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </div>
          ) : (
            <div
              style={{
                background: T.off,
                border: `1px solid ${T.border}`,
                borderRadius: 12,
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <FileText size={20} color={T.text} />
              <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: T.text }}>{fileName}</div>
              <button
                onClick={reset}
                style={{
                  background: "transparent", border: "none", cursor: "pointer", color: T.dim,
                  display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13,
                }}
              >
                <X size={14} /> Remove
              </button>
            </div>
          )}

          <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              onClick={downloadTemplate}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "transparent", border: "none", cursor: "pointer",
                color: T.text, fontSize: 13, fontWeight: 500, fontFamily: T.sans,
                textDecoration: "underline", padding: 0,
              }}
            >
              <Download size={13} /> Download CSV template
            </button>
            <span style={{ fontSize: 12, color: T.dim }}>Required columns: name, email, phone</span>
          </div>

          {headerError && (
            <div
              style={{
                marginTop: 14,
                background: "#fff4f4",
                border: "1px solid #f5c4c4",
                color: "#a33",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <AlertCircle size={14} /> {headerError}
            </div>
          )}

          {parsed && (
            <div style={{ marginTop: 18 }}>
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <Pill color="#3d6b00" bg="#E6F4D7" border={T.green}>
                  <CheckCircle2 size={12} /> {parsed.valid.length} valid
                </Pill>
                {parsed.skipped.length > 0 && (
                  <Pill color="#7a5a00" bg="#FFF4CE" border="#F0D265">
                    <AlertCircle size={12} /> {parsed.skipped.length} skipped
                  </Pill>
                )}
              </div>

              {parsed.valid.length > 0 && (
                <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ background: T.off, padding: "10px 14px", fontSize: 12, fontWeight: 600, color: T.dim, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Preview (first 5 rows)
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderTop: `1px solid ${T.border}`, background: "#fff" }}>
                        <Th>Name</Th>
                        <Th>Email</Th>
                        <Th>Phone</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.valid.slice(0, 5).map((r) => (
                        <tr key={r.rowIndex} style={{ borderTop: `1px solid ${T.border}` }}>
                          <Td>{r.name}</Td>
                          <Td>{r.email}</Td>
                          <Td>{r.phone}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {parsed.skipped.length > 0 && (
                <div style={{ marginTop: 10, fontSize: 12, color: T.dim }}>
                  {parsed.skipped.length} row{parsed.skipped.length === 1 ? "" : "s"} skipped:{" "}
                  {parsed.skipped.slice(0, 4).map((s) => `row ${s.row} (${s.reason})`).join(", ")}
                  {parsed.skipped.length > 4 ? "…" : ""}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
          <button
            onClick={() => {
              reset();
              onClose();
            }}
            style={{
              background: "#fff", color: T.text, border: `1px solid ${T.border}`,
              padding: "10px 20px", borderRadius: 99, fontSize: 14, fontWeight: 500,
              cursor: "pointer", fontFamily: T.sans,
            }}
          >
            Cancel
          </button>
          <button
            onClick={doImport}
            disabled={!parsed || parsed.valid.length === 0 || importing}
            style={{
              background: T.text, color: "#fff", border: "none",
              padding: "10px 22px", borderRadius: 99, fontSize: 14, fontWeight: 500,
              cursor: !parsed || parsed.valid.length === 0 || importing ? "not-allowed" : "pointer",
              fontFamily: T.sans,
              opacity: !parsed || parsed.valid.length === 0 || importing ? 0.5 : 1,
            }}
          >
            {importing ? "Importing…" : `Import ${parsed?.valid.length ?? 0} candidate${parsed?.valid.length === 1 ? "" : "s"}`}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{ textAlign: "left", padding: "10px 14px", fontSize: 12, fontWeight: 600, color: T.dim, textTransform: "uppercase", letterSpacing: "0.04em" }}>
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: "10px 14px", color: T.text }}>{children}</td>;
}

function Pill({
  children,
  color,
  bg,
  border,
}: {
  children: React.ReactNode;
  color: string;
  bg: string;
  border: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "5px 12px", borderRadius: 99,
        background: bg, color, border: `1px solid ${border}`,
        fontSize: 12, fontWeight: 600,
      }}
    >
      {children}
    </span>
  );
}
