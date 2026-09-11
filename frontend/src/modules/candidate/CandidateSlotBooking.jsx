import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, CheckCircle2, AlertCircle, 
  Sparkles, ShieldCheck, Download, ChevronRight, User, ChevronLeft
} from 'lucide-react';
import { recruitmentApi } from '../../api/recruitmentApi';
import { Button } from '../../components/common/Button';

export function CandidateSlotBooking() {
  const [token, setToken] = useState('');
  const [slotData, setSlotData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  useEffect(() => {
    // Extract token from search params or hash
    const urlParams = new URLSearchParams(window.location.search);
    let tok = urlParams.get('token');

    if (!tok && window.location.hash.includes('token=')) {
      const hashParams = new URLSearchParams(window.location.hash.split('?')[1]);
      tok = hashParams.get('token');
    }

    if (!tok) {
      // Demo fallback token for UI preview if opened without token
      tok = 'demo_token';
    }

    setToken(tok);
    loadSlots(tok);
  }, []);

  const loadSlots = async (tok) => {
    if (tok === 'demo_token') {
      setSlotData({
        applicant_name: 'John Doe (Demo Viewer)',
        job_title: 'Senior Software Engineer',
        days: [
          {
            date: '2026-08-28',
            date_formatted: 'Aug 28, Friday',
            slots: [
              { time_label: '10:00 AM', datetime: '2026-08-28 10:00:00' },
              { time_label: '11:00 AM', datetime: '2026-08-28 11:00:00' },
              { time_label: '02:00 PM', datetime: '2026-08-28 14:00:00' },
            ]
          },
          {
            date: '2026-08-29',
            date_formatted: 'Aug 29, Saturday',
            slots: [
              { time_label: '09:00 AM', datetime: '2026-08-29 09:00:00' },
              { time_label: '01:00 PM', datetime: '2026-08-29 13:00:00' },
            ]
          }
        ]
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await recruitmentApi.getAvailableSlots(tok);
      setSlotData(res.data);
      if (res.data?.already_booked) {
        setBookingSuccess({
          applicant_name: res.data.applicant_name,
          job_title: res.data.job_title,
          formatted_time: res.data.booked_slot_time,
        });
      }
    } catch (err) {
      setError(err.message || 'Unable to load interview slots. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot || !token) return;
    
    if (token === 'demo_token') {
      setError('This is a preview of the candidate experience. Real bookings must be made via the unique link sent to candidates.');
      return;
    }
    
    setIsBooking(true);
    try {
      const res = await recruitmentApi.bookSlot(token, selectedSlot.datetime);
      setBookingSuccess(res.data);
    } catch (err) {
      setError(err.message || 'Failed to book slot. Please try another slot.');
    } finally {
      setIsBooking(false);
    }
  };

  // Generate .ics calendar download
  const downloadIcsFile = () => {
    if (!bookingSuccess) return;
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Standard Touch//HR Ops//EN
BEGIN:VEVENT
SUMMARY:Interview: ${bookingSuccess.job_title} at Standard Touch
DESCRIPTION:Interview for ${bookingSuccess.applicant_name} for the position of ${bookingSuccess.job_title}.
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'interview-standard-touch.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-brand-black dark:text-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-brand-red border-t-transparent animate-spin mx-auto" />
          <p className="text-sm font-semibold text-brand-grey">Loading interview calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-brand-black dark:text-slate-50 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full mx-auto space-y-6">
        
        {/* Internal Navigation (only useful when previewing in admin app) */}
        <div className="flex justify-start">
           <Button variant="outline" size="sm" onClick={() => window.location.href = '/hr-ops'} className="gap-1.5 border-gray-200 dark:border-slate-700 text-brand-grey hover:text-brand-black dark:text-slate-50 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
             <ChevronLeft className="h-4 w-4" /> Back to Dashboard
           </Button>
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-brand-red to-red-700 flex items-center justify-center shadow-lg shadow-glow-red mx-auto">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-brand-black dark:text-slate-50 tracking-tight">Standard Touch</h1>
          <p className="text-sm font-bold text-brand-red uppercase tracking-widest">Candidate Interview Scheduler</p>
        </div>

        {/* Error Card */}
        {error && (
          <div className="glass-panel border-rose-200 bg-rose-50 rounded-2xl p-5 text-center space-y-3">
            <AlertCircle className="h-8 w-8 text-rose-600 mx-auto" />
            <h3 className="text-base font-bold text-brand-black dark:text-slate-50">Booking Link Notice</h3>
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        )}

        {/* Booking Confirmed State */}
        {bookingSuccess ? (
          <div className="glass-panel border-emerald-200 bg-emerald-50 rounded-3xl p-8 text-center space-y-6 animate-fade-in shadow-2xl">
            <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-glow-emerald">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-heading font-bold text-brand-black dark:text-slate-50">Interview Confirmed!</h2>
              <p className="text-sm text-emerald-700">
                We're excited to speak with you, <span className="font-bold text-brand-black dark:text-slate-50">{bookingSuccess.applicant_name}</span>.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-slate-900/80 rounded-2xl p-5 border border-gray-200 dark:border-slate-700 space-y-2 text-left">
              <div className="text-sm text-brand-grey">Position: <strong className="text-brand-black dark:text-slate-50">{bookingSuccess.job_title}</strong></div>
              <div className="text-sm text-brand-grey">Scheduled Time: <strong className="text-brand-red">{bookingSuccess.formatted_time || bookingSuccess.slot_datetime}</strong></div>
            </div>

            <Button
              variant="primary"
              icon={Download}
              onClick={downloadIcsFile}
              className="w-full"
            >
              Add to Calendar (.ics)
            </Button>
          </div>
        ) : slotData && slotData.days ? (
          /* Slot Selection Wizard */
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border space-y-6 shadow-2xl">
            {/* Candidate Welcome Banner */}
            <div className="border-b border-gray-200 dark:border-slate-700 pb-4">
              <h2 className="text-xl font-bold text-brand-black dark:text-slate-50">
                Hi {slotData.applicant_name}!
              </h2>
              <p className="text-sm text-brand-grey mt-1">
                Please pick a convenient time slot for your interview for <strong>{slotData.job_title}</strong>.
              </p>
            </div>

            {/* Date Tabs */}
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-brand-grey mb-2">
                1. Select Date
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {slotData.days.map((day, idx) => (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => {
                      setSelectedDateIndex(idx);
                      setSelectedSlot(null);
                    }}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      selectedDateIndex === idx
                        ? 'bg-brand-red border-brand-red text-brand-black dark:text-slate-50 shadow-lg shadow-glow-red'
                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-brand-grey hover:text-brand-black dark:text-slate-50 hover:bg-gray-50 dark:hover:bg-slate-700/50 dark:bg-slate-900'
                    }`}
                  >
                    <span className="text-sm font-bold block">{day.date_formatted.split(',')[0]}</span>
                    <span className="text-[13px] opacity-80 block">{day.date_formatted.split(',')[1]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slot Buttons */}
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-brand-grey mb-2">
                2. Select Available Time
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {slotData.days[selectedDateIndex]?.slots.map((slot) => {
                  const isSelected = selectedSlot?.datetime === slot.datetime;

                  return (
                    <button
                      key={slot.datetime}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-3 px-2 rounded-xl border text-sm font-heading font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-emerald-600 border-emerald-500 text-brand-black dark:text-slate-50 shadow-lg shadow-emerald-600/30 scale-[1.02]'
                          : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 hover:text-brand-black dark:text-slate-50 hover:border-gray-300 dark:border-slate-600'
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <span>{slot.time_label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Confirm Button */}
            <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
              <Button
                variant="success"
                size="lg"
                className="w-full shadow-glow-emerald"
                disabled={!selectedSlot}
                isLoading={isBooking}
                onClick={handleConfirmBooking}
              >
                {selectedSlot ? `Confirm Slot: ${selectedSlot.time_label}` : 'Select a Time Slot'}
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <footer className="text-center text-[13px] text-slate-600 mt-8">
        Powered by Standard Touch HR Operations
      </footer>
    </div>
  );
}
