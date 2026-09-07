import React, { useState } from 'react';
import { ExceptionRecord, ExceptionCategory, ExceptionSeverity, ExceptionStatus } from '../types/reconciliation';
import {
  Filter,
  Search,
  AlertTriangle,
  Clock,
  ArrowUpDown,
  FileText,
  Building2,
  CheckCircle2,
  Eye,
  SlidersHorizontal,
  Layers
} from 'lucide-react';

interface ExceptionQueueViewProps {
  exceptions: ExceptionRecord[];
  onSelectException: (exception: ExceptionRecord) => void;
}

export const ExceptionQueueView: React.FC<ExceptionQueueViewProps> = ({
  exceptions,
  onSelectException
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'discrepancyAmount' | 'createdAt'>('discrepancyAmount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const categories: Array<{ id: string; label: string }> = [
    { id: 'ALL', label: 'All 10 Categories' },
    { id: 'DATA_ENTRY_ERROR', label: '5. Data Entry Errors' },
    { id: 'CROSS_BANK_SPECIFIC', label: '8. Cross-Bank Routing' },
    { id: 'REVERSAL_DISPUTE', label: '6. Reversals & Disputes' },
    { id: 'COMPLIANCE_AML', label: '9. Compliance / AML Holds' },
    { id: 'MISSING_COUNTERPART', label: '3. Missing Counterparts' },
    { id: 'TIMING_BASED', label: '1. Timing & Cutoff Lag' },
    { id: 'AMOUNT_MISMATCH', label: '2. Amount & Partial' },
    { id: 'DUPLICATE_ENTRY', label: '4. Duplicate Entries' },
    { id: 'STRUCTURAL_FORMAT', label: '7. Structural Format' },
    { id: 'TEMPLATE_FORMAT', label: '10. Bank CAMT/MT940' }
  ];

  const filtered = exceptions.filter(e => {
    const matchesSearch =
      e.exceptionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.subType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.rootCauseAnalysis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.businessRecord?.documentId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.bankRecord?.bankName || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || e.categoryId === selectedCategory;
    const matchesSeverity = selectedSeverity === 'ALL' || e.severity === selectedSeverity;
    const matchesStatus = selectedStatus === 'ALL' || e.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesSeverity && matchesStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortField === 'discrepancyAmount') {
      return sortOrder === 'desc'
        ? b.discrepancyAmount - a.discrepancyAmount
        : a.discrepancyAmount - b.discrepancyAmount;
    } else {
      return sortOrder === 'desc'
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Filter Bar */}
      <div className="bg-[#16161A] p-6 rounded-xl border border-gray-800 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-800">
          <div>
            <h2 className="text-base font-bold text-gray-100 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-amber-500" /> Exception Queue & Discrepancy Desk
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Categorized queue supporting all 10 fintech discrepancy scenarios with multi-level filtering
            </p>
          </div>
          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <span className="text-xs font-mono font-bold text-gray-300 bg-gray-900/90 px-3 py-1 rounded-lg border border-gray-800">
              Showing {sorted.length} of {exceptions.length} Exceptions
            </span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-gray-500" />
            <input
              type="text"
              placeholder="Search reference, bank, sub-type..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-gray-800 focus:outline-none focus:border-amber-500 bg-[#0F0F12] text-gray-200 placeholder-gray-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-gray-800 focus:outline-none focus:border-amber-500 bg-[#0F0F12] text-gray-200 font-medium"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id} className="bg-[#0F0F12] text-gray-200">
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={selectedSeverity}
              onChange={e => setSelectedSeverity(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-gray-800 focus:outline-none focus:border-amber-500 bg-[#0F0F12] text-gray-200 font-medium"
            >
              <option value="ALL" className="bg-[#0F0F12]">All Severities</option>
              <option value="CRITICAL" className="bg-[#0F0F12]">Critical (AML & Risk)</option>
              <option value="HIGH" className="bg-[#0F0F12]">High (Transposed/Routing)</option>
              <option value="MEDIUM" className="bg-[#0F0F12]">Medium (Voided records)</option>
              <option value="LOW" className="bg-[#0F0F12]">Low (Routine Fees)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-gray-800 focus:outline-none focus:border-amber-500 bg-[#0F0F12] text-gray-200 font-medium"
            >
              <option value="ALL" className="bg-[#0F0F12]">All Statuses</option>
              <option value="OPEN" className="bg-[#0F0F12]">Open</option>
              <option value="INVESTIGATING" className="bg-[#0F0F12]">Investigating</option>
              <option value="PENDING_CHECKER_APPROVAL" className="bg-[#0F0F12]">Pending Checker Signoff</option>
              <option value="RESOLVED" className="bg-[#0F0F12]">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Exception Table */}
      <div className="bg-[#16161A] rounded-xl border border-gray-800 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0F0F12] border-b border-gray-800 text-gray-500 text-[10px] uppercase font-bold tracking-widest">
              <tr>
                <th className="py-3.5 px-4">Exception ID & Category</th>
                <th className="py-3.5 px-4">Sub-Type & Cause</th>
                <th className="py-3.5 px-4">Ledger vs Bank</th>
                <th
                  className="py-3.5 px-4 cursor-pointer hover:text-gray-300 select-none"
                  onClick={() => {
                    if (sortField === 'discrepancyAmount') {
                      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                    } else {
                      setSortField('discrepancyAmount');
                      setSortOrder('desc');
                    }
                  }}
                >
                  <div className="flex items-center space-x-1">
                    <span>Variance</span>
                    <ArrowUpDown className="w-3 h-3 text-gray-500" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Severity</th>
                <th className="py-3.5 px-4">Status & Workflow</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-800/60">
              {sorted.map(exc => (
                <tr
                  key={exc.exceptionId}
                  className="hover:bg-white/[0.03] transition-colors cursor-pointer"
                  onClick={() => onSelectException(exc)}
                >
                  {/* Exception ID & Category */}
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-amber-500">{exc.exceptionId}</div>
                    <div className="text-[11px] text-gray-400 font-medium">{exc.categoryName}</div>
                  </td>

                  {/* Sub-Type & Diagnosis */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <span className="font-semibold text-gray-200 block">{exc.subType}</span>
                    <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                      {exc.rootCauseAnalysis}
                    </p>
                  </td>

                  {/* Ledger vs Bank */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5 text-[11px]">
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-500">ERP:</span>
                        <span className="font-mono font-semibold text-gray-300">
                          {exc.businessRecord ? exc.businessRecord.documentId : 'N/A (Missing)'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-500">Bank:</span>
                        <span className="font-mono text-gray-300">
                          {exc.bankRecord ? exc.bankRecord.bankName.split(' ')[0] : 'N/A (Missing)'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Variance */}
                  <td className="py-3.5 px-4 font-mono font-bold text-gray-100">
                    {exc.businessRecord?.currency || exc.bankRecord?.currency || 'INR'}{' '}
                    {exc.discrepancyAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>

                  {/* Severity */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        exc.severity === 'CRITICAL'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : exc.severity === 'HIGH'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : exc.severity === 'MEDIUM'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : 'bg-gray-800 text-gray-400 border-gray-700'
                      }`}
                    >
                      {exc.severity}
                    </span>
                  </td>

                  {/* Status & Workflow */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        exc.status === 'RESOLVED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : exc.status === 'PENDING_CHECKER_APPROVAL'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {exc.status.replace(/_/g, ' ')}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectException(exc);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-amber-400 hover:text-amber-300 text-xs font-semibold border border-gray-700 inline-flex items-center space-x-1 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
