import React, { useState } from 'react';
import { 
  FileText, Download, Eye, Mail, Search, 
  ExternalLink, CheckCircle2, DollarSign, Printer
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { formatCurrency, formatDate, callApi } from '../../api/client';

export function SalarySlipsView({ slips = [], isLoading, month, year, onRefresh }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSlipForPreview, setSelectedSlipForPreview] = useState(null);
  const [downloadingSlip, setDownloadingSlip] = useState(null);

  const handlePrintSlip = async (slip) => {
    try {
      setDownloadingSlip(slip.name);
      const res = await callApi('st_automation.api.payroll.get_salary_slip_print_html', {
        salary_slip: slip.name
      }, 'GET');

      if (!res.data?.html) {
        throw new Error('Failed to render print format');
      }

      // Format custom document title for clean PDF filename when saved:
      // "Salary-Slip-[Employee-Name]-[Period/SlipID]"
      const safeEmpName = (slip.employee_name || slip.employee || 'Employee').replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeSlipId = slip.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const docTitle = `Salary-Slip_${safeEmpName}_${safeSlipId}`;

      // Open print window
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        // Fallback to hidden iframe if popups blocked
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);
        iframe.contentDocument.write(res.data.html);
        iframe.contentDocument.title = docTitle;
        iframe.contentDocument.close();
        iframe.contentWindow.focus();
        setTimeout(() => {
          iframe.contentWindow.print();
          document.body.removeChild(iframe);
        }, 500);
        return;
      }

      printWindow.document.open();
      printWindow.document.write(res.data.html);
      printWindow.document.title = docTitle;
      printWindow.document.close();
      printWindow.focus();

      // Trigger print dialog once loaded
      setTimeout(() => {
        printWindow.print();
      }, 500);

    } catch (err) {
      console.error('Failed to print slip:', err);
      // Fallback to opening raw printview in new tab
      window.open(slip.pdf_url, '_blank');
    } finally {
      setDownloadingSlip(null);
    }
  };

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
          <h2 className="text-2xl font-heading font-bold text-brand-black dark:text-slate-50 tracking-tight">Salary Slips Hub</h2>
          <p className="text-sm text-brand-grey">
            Preview branded salary slips, verify net payout calculations, and deliver payslips.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-grey" />
          <input
            type="text"
            placeholder="Search employee name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm font-semibold text-brand-black dark:text-slate-50 placeholder-slate-400 focus:outline-none focus:border-brand-red"
          />
        </div>
      </div>

      {/* Slips Table Card */}
      <div className="glass-panel rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700 text-brand-grey font-bold uppercase bg-gray-50 dark:bg-slate-900/60">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Gross Payout</th>
                <th className="py-3 px-4">Deductions</th>
                <th className="py-3 px-4">Net Payout</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredSlips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-brand-grey">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm font-semibold">No salary slips found for this period</p>
                  </td>
                </tr>
              ) : (
                filteredSlips.map((slip) => (
                  <tr key={slip.name} className="hover:bg-white dark:bg-slate-800/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-brand-black dark:text-slate-50 text-sm">{slip.employee_name}</div>
                      <div className="text-[13px] text-brand-grey">{slip.employee}</div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 dark:text-slate-200">
                      {slip.designation || 'Staff'}
                    </td>
                    <td className="py-3.5 px-4 text-brand-grey text-[13px]">
                      {formatDate(slip.start_date)} - {formatDate(slip.end_date)}
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 dark:text-slate-200 font-semibold">
                      {formatCurrency(slip.gross_pay)}
                    </td>
                    <td className="py-3.5 px-4 text-rose-600 font-semibold">
                      {formatCurrency(slip.total_deduction)}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-600 font-heading font-bold text-sm">
                      {formatCurrency(slip.net_pay)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedSlipForPreview(slip)}
                          className="p-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 text-brand-red hover:text-brand-black dark:text-slate-50 hover:bg-brand-red transition-colors"
                          title="Preview Salary Slip"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handlePrintSlip(slip)}
                          disabled={downloadingSlip === slip.name}
                          className="p-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 text-brand-grey hover:text-brand-black dark:text-slate-50 hover:bg-gray-200 transition-colors"
                          title="Print / Save as PDF"
                        >
                          <Download className={`h-4 w-4 ${downloadingSlip === slip.name ? 'animate-bounce text-brand-red' : ''}`} />
                        </button>
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
            <div className="h-[600px] w-full rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 overflow-hidden">
              <iframe
                src={selectedSlipForPreview.pdf_url}
                title="Salary Slip PDF"
                className="w-full h-full border-0 bg-white dark:bg-slate-800"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-brand-grey">
                Net Pay: <span className="text-emerald-600 font-bold text-sm">{formatCurrency(selectedSlipForPreview.net_pay)}</span>
              </div>
              <Button
                variant="primary"
                icon={Download}
                onClick={() => handlePrintSlip(selectedSlipForPreview)}
                isLoading={downloadingSlip === selectedSlipForPreview.name}
              >
                Print / Save PDF
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
