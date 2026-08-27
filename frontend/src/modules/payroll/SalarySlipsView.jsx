import React, { useState } from 'react';
import { 
  FileText, Download, Eye, Mail, Search, 
  ExternalLink, CheckCircle2, DollarSign
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { formatCurrency, formatDate } from '../../api/client';

export function SalarySlipsView({ slips = [], isLoading, month, year, onRefresh }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSlipForPreview, setSelectedSlipForPreview] = useState(null);

  const filteredSlips = slips.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (s.employee_name || '').toLowerCase().includes(q) ||
      (s.employee || '').toLowerCase().includes(q) ||
      (s.name || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Salary Slips Hub</h2>
          <p className="text-sm text-slate-400">
            Preview branded salary slips, verify net payout calculations, and deliver payslips.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Slips Table Card */}
      <div className="glass-panel rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase bg-slate-950/60">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Gross Earnings</th>
                <th className="py-3 px-4">Deductions</th>
                <th className="py-3 px-4">Net Payout</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredSlips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm font-semibold">No salary slips found for this period</p>
                  </td>
                </tr>
              ) : (
                filteredSlips.map((slip) => (
                  <tr key={slip.name} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{slip.employee_name}</div>
                      <div className="text-[11px] text-slate-400">{slip.employee}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {slip.designation || 'Staff'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {formatDate(slip.start_date)} - {formatDate(slip.end_date)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-semibold">
                      {formatCurrency(slip.gross_pay)}
                    </td>
                    <td className="py-3.5 px-4 text-rose-400 font-semibold">
                      {formatCurrency(slip.total_deduction)}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-400 font-extrabold text-sm">
                      {formatCurrency(slip.net_pay)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedSlipForPreview(slip)}
                          className="p-1.5 rounded-lg bg-slate-800 text-indigo-400 hover:text-white hover:bg-indigo-600 transition-colors"
                          title="Preview Salary Slip PDF"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <a
                          href={slip.pdf_url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {selectedSlipForPreview && (
        <Modal
          isOpen={!!selectedSlipForPreview}
          onClose={() => setSelectedSlipForPreview(null)}
          title={`Salary Slip — ${selectedSlipForPreview.employee_name}`}
          subtitle={`${selectedSlipForPreview.name}`}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-4">
            <div className="h-[600px] w-full rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
              <iframe
                src={selectedSlipForPreview.pdf_url}
                title="Salary Slip PDF"
                className="w-full h-full border-0 bg-white"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-slate-400">
                Net Pay: <span className="text-emerald-400 font-bold text-sm">{formatCurrency(selectedSlipForPreview.net_pay)}</span>
              </div>
              <a
                href={selectedSlipForPreview.pdf_url}
                download
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
              >
                <Download className="h-4 w-4" />
                <span>Download PDF</span>
              </a>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
