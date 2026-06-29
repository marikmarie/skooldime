import React, { useState, useRef } from 'react';
import { 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  X, 
  Download, 
  Info, 
  RefreshCw, 
  FileSpreadsheet,
  Check,
  AlertCircle
} from 'lucide-react';
import { useToast } from './ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

interface StudentBulkUploaderProps {
  onUploadSuccess: () => void;
}

interface ParsedRow {
  schoolId: string;
  admissionNo: string;
  name: string;
  class: string;
  parentName: string;
  parentPhone: string;
  parentNin: string;
  isValid: boolean;
  errors: string[];
}

interface HeaderMapping {
  csvHeader: string;
  mappedField: 'admissionNo' | 'name' | 'class' | 'parentPhone' | 'parentName' | 'parentNin' | null;
  label: string;
  isRequired: boolean;
}

export default function StudentBulkUploader({ onUploadSuccess }: StudentBulkUploaderProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [showPaste, setShowPaste] = useState(false);
  
  // Parsed States
  const [headers, setHeaders] = useState<HeaderMapping[]>([]);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Constants
  const SCHOOL_ID = 'S1'; // Kampala Parents Primary School

  // Matching aliases for automatic header detection
  const HEADER_ALIASES = {
    admissionNo: [/admission/i, /adm/i, /student_no/i, /student_number/i, /id/i],
    name: [/name/i, /student/i, /fullname/i, /full_name/i, /child/i],
    class: [/class/i, /grade/i, /level/i, /form/i, /stream/i],
    parentPhone: [/phone/i, /contact/i, /mobile/i, /parent_phone/i, /parent_contact/i, /tel/i, /telephone/i],
    parentName: [/parent_name/i, /parent/i, /guardian/i, /guardian_name/i, /parentname/i],
    parentNin: [/nin/i, /national/i, /id_number/i, /national_id/i, /parent_nin/i]
  };

  // Pre-loaded template CSV content
  const SAMPLE_CSV = `Admission No,Student Name,Class,Parent Name,Parent Phone,Parent NIN
KPS/2026/012,Mugisha Raymond,Primary 5,Sarah Nabossa,0771234567,CM98024112ABCD
KPS/2026/089,Namubiru Diana,Primary 4,Wasswa John,0759876543,CF99015243EFGH
KPS/2026/154,Kato Derrick,Primary 3,Nalule Florence,0701445566,`;

  const copyTemplate = () => {
    navigator.clipboard.writeText(SAMPLE_CSV);
    toast.success('CSV Template copied to clipboard.');
  };

  const parseCsvContent = (text: string) => {
    if (!text.trim()) {
      setHeaders([]);
      setParsedRows([]);
      return;
    }

    // Parse CSV rows, handling quotes and trim spaces
    const lines: string[] = [];
    let currentLine = '';
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === '\n' && !insideQuotes) {
        lines.push(currentLine);
        currentLine = '';
      } else if (char === '\r') {
        // Skip carriage return
      } else {
        currentLine += char;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }

    const filteredLines = lines.map(line => line.trim()).filter(line => line.length > 0);
    if (filteredLines.length === 0) {
      toast.error('The uploaded CSV file is empty.');
      return;
    }

    // Extract Headers
    const firstLine = filteredLines[0];
    const rawHeaders = firstLine.split(',').map(h => {
      // strip quotes if present
      return h.trim().replace(/^"|"$/g, '');
    });

    // Match raw headers to schema fields
    const mappedHeaders: HeaderMapping[] = rawHeaders.map(csvHeader => {
      let mappedField: HeaderMapping['mappedField'] = null;
      
      // Check each field's aliases
      for (const [field, regexes] of Object.entries(HEADER_ALIASES)) {
        if (regexes.some(r => r.test(csvHeader))) {
          mappedField = field as HeaderMapping['mappedField'];
          break;
        }
      }

      // Default labels
      let label = csvHeader;
      let isRequired = false;
      if (mappedField === 'name') { isRequired = true; label = 'Student Name'; }
      else if (mappedField === 'admissionNo') { isRequired = true; label = 'Admission No'; }
      else if (mappedField === 'class') { isRequired = true; label = 'Class'; }
      else if (mappedField === 'parentPhone') { isRequired = true; label = 'Parent Phone'; }
      else if (mappedField === 'parentName') { label = 'Parent Name'; }
      else if (mappedField === 'parentNin') { label = 'Parent NIN'; }

      return {
        csvHeader,
        mappedField,
        label,
        isRequired
      };
    });

    setHeaders(mappedHeaders);

    // Parse Data Rows
    const dataRows = filteredLines.slice(1);
    const parsed: ParsedRow[] = dataRows.map((line, lineIdx) => {
      const values: string[] = [];
      let curVal = '';
      let quotesActive = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          quotesActive = !quotesActive;
        } else if (char === ',' && !quotesActive) {
          values.push(curVal.trim().replace(/^"|"$/g, ''));
          curVal = '';
        } else {
          curVal += char;
        }
      }
      values.push(curVal.trim().replace(/^"|"$/g, ''));

      // Construct student data from mapping
      let admissionNo = '';
      let name = '';
      let className = 'Unassigned';
      let parentName = 'Guardian';
      let parentPhone = '';
      let parentNin = '';

      mappedHeaders.forEach((mapping, index) => {
        const value = values[index] || '';
        if (mapping.mappedField === 'admissionNo') admissionNo = value;
        else if (mapping.mappedField === 'name') name = value;
        else if (mapping.mappedField === 'class') className = value || 'Unassigned';
        else if (mapping.mappedField === 'parentPhone') parentPhone = value;
        else if (mapping.mappedField === 'parentName') parentName = value || 'Guardian';
        else if (mapping.mappedField === 'parentNin') parentNin = value;
      });

      // Validations
      const rowErrors: string[] = [];
      if (!name) rowErrors.push('Missing Student Name');
      if (!admissionNo) rowErrors.push('Missing Admission No');
      if (!parentPhone) {
        rowErrors.push('Missing Parent Phone');
      } else {
        // Clean phone slightly
        const cleanedPhone = parentPhone.replace(/\s+/g, '');
        if (!/^\+?[0-9]{9,15}$/.test(cleanedPhone)) {
          rowErrors.push('Invalid Phone Number format');
        }
      }

      return {
        schoolId: SCHOOL_ID,
        admissionNo,
        name,
        class: className,
        parentName,
        parentPhone,
        parentNin,
        isValid: rowErrors.length === 0,
        errors: rowErrors
      };
    });

    setParsedRows(parsed);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      toast.error('Unsupported file type. Please upload a standard CSV file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      parseCsvContent(text);
    };
    reader.onerror = () => {
      toast.error('Failed to read file.');
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      toast.error('Unsupported file type. Please upload a standard CSV file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      parseCsvContent(text);
    };
    reader.readAsText(file);
  };

  const handleManualPasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    parseCsvContent(csvText);
  };

  const handleHeaderMapChange = (csvHeader: string, newField: HeaderMapping['mappedField']) => {
    // Re-map column and re-trigger parse
    const updatedHeaders = headers.map(h => {
      if (h.csvHeader === csvHeader) {
        let isRequired = false;
        let label = csvHeader;
        if (newField === 'name') { isRequired = true; label = 'Student Name'; }
        else if (newField === 'admissionNo') { isRequired = true; label = 'Admission No'; }
        else if (newField === 'class') { isRequired = true; label = 'Class'; }
        else if (newField === 'parentPhone') { isRequired = true; label = 'Parent Phone'; }
        else if (newField === 'parentName') { label = 'Parent Name'; }
        else if (newField === 'parentNin') { label = 'Parent NIN'; }
        return {
          ...h,
          mappedField: newField,
          isRequired,
          label
        };
      }
      return h;
    });

    setHeaders(updatedHeaders);

    // Re-parse with the new mappings
    // Simply splitting lines and processing again with the new updated headers
    if (!csvText) return;
    const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const dataRows = lines.slice(1);

    const parsed: ParsedRow[] = dataRows.map(line => {
      const values: string[] = [];
      let curVal = '';
      let quotesActive = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          quotesActive = !quotesActive;
        } else if (char === ',' && !quotesActive) {
          values.push(curVal.trim().replace(/^"|"$/g, ''));
          curVal = '';
        } else {
          curVal += char;
        }
      }
      values.push(curVal.trim().replace(/^"|"$/g, ''));

      let admissionNo = '';
      let name = '';
      let className = 'Unassigned';
      let parentName = 'Guardian';
      let parentPhone = '';
      let parentNin = '';

      updatedHeaders.forEach((mapping, index) => {
        const value = values[index] || '';
        if (mapping.mappedField === 'admissionNo') admissionNo = value;
        else if (mapping.mappedField === 'name') name = value;
        else if (mapping.mappedField === 'class') className = value || 'Unassigned';
        else if (mapping.mappedField === 'parentPhone') parentPhone = value;
        else if (mapping.mappedField === 'parentName') parentName = value || 'Guardian';
        else if (mapping.mappedField === 'parentNin') parentNin = value;
      });

      const rowErrors: string[] = [];
      if (!name) rowErrors.push('Missing Student Name');
      if (!admissionNo) rowErrors.push('Missing Admission No');
      if (!parentPhone) {
        rowErrors.push('Missing Parent Phone');
      } else {
        const cleanedPhone = parentPhone.replace(/\s+/g, '');
        if (!/^\+?[0-9]{9,15}$/.test(cleanedPhone)) {
          rowErrors.push('Invalid Phone Number format');
        }
      }

      return {
        schoolId: SCHOOL_ID,
        admissionNo,
        name,
        class: className,
        parentName,
        parentPhone,
        parentNin,
        isValid: rowErrors.length === 0,
        errors: rowErrors
      };
    });

    setParsedRows(parsed);
  };

  const clearUploader = () => {
    setCsvText('');
    setHeaders([]);
    setParsedRows([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCommitUpload = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      toast.error('No valid rows found to register.');
      return;
    }

    setIsUploading(true);
    try {
      const res = await fetch('/api/students/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: validRows,
          agentId: 'S1_ADMIN',
          agentName: 'Kampala Parents School Admin'
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Success! Registered/Updated ${validRows.length} student records.`);
        clearUploader();
        onUploadSuccess();
      } else {
        toast.error(data.error || 'Server error uploading student data.');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred during submission.');
    } finally {
      setIsUploading(false);
    }
  };

  // Check which required fields are mapped
  const missingRequiredFields = [
    { field: 'name', label: 'Student Name' },
    { field: 'admissionNo', label: 'Admission No' },
    { field: 'class', label: 'Class' },
    { field: 'parentPhone', label: 'Parent Phone' }
  ].filter(req => !headers.some(h => h.mappedField === req.field));

  const isValidForUpload = parsedRows.length > 0 && missingRequiredFields.length === 0 && parsedRows.some(r => r.isValid);

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-5 sm:p-6 shadow-xl space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-[#c7515e]" />
            Bulk CSV Student Enrollment
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Validate headers, preview mapped students, and bulk load child cards.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={copyTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-[11px] text-gray-300 font-semibold transition"
          >
            <Download className="h-3.5 w-3.5 text-[#c7515e]" />
            <span>Copy CSV Template</span>
          </button>
        </div>
      </div>

      {/* Upload Zone / Input Modes */}
      {parsedRows.length === 0 && (
        <div className="space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
              isDragging 
                ? 'border-[#c7515e] bg-[#c7515e]/5' 
                : 'border-white/10 bg-[#06080E]/40 hover:bg-[#06080E]/60'
            }`}
          >
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#c7515e]/10 text-[#c7515e] flex items-center justify-center mx-auto">
                <Upload className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-200 font-semibold">
                  Drag and drop student CSV file here
                </p>
                <p className="text-xs text-gray-500">
                  Or select from your files (Must contain: Student Name, Admission No, Class, Parent Phone)
                </p>
              </div>

              <div>
                <input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-[#c7515e] hover:bg-[#b04753] text-white text-xs font-bold rounded-xl transition shadow-lg shadow-[#c7515e]/15"
                >
                  Browse Files
                </button>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => setShowPaste(!showPaste)}
              className="text-xs text-[#c7515e] hover:underline font-semibold"
            >
              {showPaste ? 'Hide Paste Area' : 'Or copy & paste raw CSV content directly'}
            </button>
          </div>

          {showPaste && (
            <form onSubmit={handleManualPasteSubmit} className="space-y-3 animate-in fade-in duration-200">
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Paste your CSV text rows here..."
                rows={5}
                className="w-full rounded-xl border border-white/10 bg-[#06080E] p-3 text-xs text-mono text-gray-300 placeholder-gray-600 focus:border-[#c7515e] outline-none font-mono"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!csvText.trim()}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition"
                >
                  Analyze Pasted Content
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* CSV Parsing and Mapping Center */}
      {parsedRows.length > 0 && (
        <div className="space-y-6">
          
          {/* Validation Banner / Header Mapping Table */}
          <div className="rounded-xl border border-white/5 bg-[#06080E]/60 p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="h-4 w-4 text-[#c7515e]" />
                Interactive Header Match & Validation
              </h4>
              <button
                onClick={clearUploader}
                className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition"
              >
                <X className="h-3.5 w-3.5" />
                Reset Upload
              </button>
            </div>

            {/* Warning if required headers are not mapped */}
            {missingRequiredFields.length > 0 ? (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-amber-400">Incomplete Column Mapping</h5>
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                    Some mandatory columns could not be mapped automatically. Please map columns manually to their target fields below. Missing: <strong className="text-amber-300">{missingRequiredFields.map(f => f.label).join(', ')}</strong>.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-center gap-2.5">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span className="text-[11px] text-emerald-400 font-semibold">
                  Excellent! All mandatory student and parent headers mapped successfully. Ready to import.
                </span>
              </div>
            )}

            {/* Live Column Mapping Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
              {headers.map((h, i) => (
                <div key={i} className="bg-[#0B0F19]/80 border border-white/5 rounded-xl p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 font-bold truncate max-w-30" title={h.csvHeader}>
                      CSV Header: "{h.csvHeader}"
                    </span>
                    {h.mappedField ? (
                      <span className="bg-emerald-500/10 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Check className="h-2.5 w-2.5" /> Mapped
                      </span>
                    ) : (
                      <span className="bg-gray-500/10 text-gray-400 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                        Ignored
                      </span>
                    )}
                  </div>

                  <select
                    value={h.mappedField || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleHeaderMapChange(h.csvHeader, val ? val as any : null);
                    }}
                    className="w-full rounded-lg border border-white/5 bg-[#06080E] px-2 py-1.5 text-xs text-gray-200 focus:border-[#c7515e] outline-none transition"
                  >
                    <option value="">-- Ignore Column --</option>
                    <option value="name">Student Name * (Required)</option>
                    <option value="admissionNo">Admission No * (Required)</option>
                    <option value="class">Class * (Required)</option>
                    <option value="parentPhone">Parent Phone * (Required)</option>
                    <option value="parentName">Parent Name / Guardian</option>
                    <option value="parentNin">Parent NIN (National ID)</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Row Preview Summary and Error Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1">
                Parsed Student Roster Preview ({parsedRows.length} Rows)
              </h4>
              <div className="text-right text-[11px] text-gray-400">
                <span className="text-emerald-400 font-bold">{parsedRows.filter(r => r.isValid).length} Valid</span>
                {' '}/{' '}
                <span className="text-rose-400 font-bold">{parsedRows.filter(r => !r.isValid).length} Error-prone</span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#06080E]/20 max-h-75 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0B0F19] text-gray-400 border-b border-white/5 font-bold">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Admission No</th>
                    <th className="py-2.5 px-3">Class</th>
                    <th className="py-2.5 px-3">Parent Details</th>
                    <th className="py-2.5 px-3">Parent NIN</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {parsedRows.map((row, index) => (
                    <tr 
                      key={index} 
                      className={`hover:bg-white/2 transition-colors ${
                        !row.isValid ? 'bg-rose-500/5' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-gray-500 font-mono">{index + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-white">
                        {row.name || <span className="text-rose-400 italic font-mono">[Missing]</span>}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-300">
                        {row.admissionNo || <span className="text-rose-400 italic font-mono">[Missing]</span>}
                      </td>
                      <td className="py-2.5 px-3 text-gray-300">{row.class}</td>
                      <td className="py-2.5 px-3">
                        <div className="text-gray-300 font-medium">{row.parentName}</div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          {row.parentPhone || <span className="text-rose-400 italic">[Missing]</span>}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-400">
                        {row.parentNin || <span className="text-gray-600">—</span>}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {row.isValid ? (
                          <span className="text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded text-[9px] font-bold">
                            Valid
                          </span>
                        ) : (
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-rose-400 bg-rose-400/10 px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5">
                              <AlertCircle className="h-2.5 w-2.5" /> Error
                            </span>
                            {row.errors.map((err, errIdx) => (
                              <span key={errIdx} className="text-[9px] text-rose-300/80 italic">
                                • {err}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Core Commit Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-white/5 pt-4">
            <div className="text-xs text-gray-400 flex items-center gap-1.5">
              <Info className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>
                Default card limits will automatically be configured to <strong>2,000 UGX</strong> without PIN.
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={clearUploader}
                className="flex-1 sm:flex-initial px-4 py-2.5 border border-white/10 hover:bg-white/5 rounded-xl text-xs text-gray-300 font-semibold transition"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={!isValidForUpload || isUploading}
                onClick={handleCommitUpload}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-[#c7515e] hover:bg-[#b04753] disabled:opacity-40 disabled:hover:bg-[#c7515e] text-white text-xs font-bold rounded-xl transition shadow-lg shadow-[#c7515e]/20"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Commit {parsedRows.filter(r => r.isValid).length} Students</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
