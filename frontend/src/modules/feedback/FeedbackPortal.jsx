import React, { useState } from 'react';
import { FeedbackLandingView } from './FeedbackLandingView';
import { FeedbackFormView } from './FeedbackFormView';
import { FeedbackThankYouView } from './FeedbackThankYouView';
import { MyFeedbackListView } from './MyFeedbackListView';
import { FeedbackOverviewAdminView } from './FeedbackOverviewAdminView';
import { FeedbackCardLayoutView } from './FeedbackCardLayoutView';
import { Sparkles, LayoutTemplate, Layers } from 'lucide-react';

export function FeedbackPortal({ 
  viewMode = 'staff-feedback', // 'staff-feedback' | 'my-feedback' | 'feedback-analytics'
  selectedCompany, 
  userProfile,
  onNavigateTab
}) {
  // Navigation states within staff-feedback: Set Option 3 (Card Layout) as default
  const [subView, setSubView] = useState('card-layout'); // 'card-layout' (Option 3 default) | 'form' | 'landing' | 'thank-you'
  const [selectedCategory, setSelectedCategory] = useState('Work Environment');
  const [formLayoutMode, setFormLayoutMode] = useState('cards'); // 'cards' (default) | 'standard'

  // Direct tab views
  if (viewMode === 'my-feedback') {
    return (
      <MyFeedbackListView 
        onNewFeedback={() => {
          if (onNavigateTab) {
            onNavigateTab('staff-feedback');
          }
          setSubView('card-layout');
        }} 
      />
    );
  }

  if (viewMode === 'feedback-analytics') {
    return (
      <FeedbackOverviewAdminView 
        selectedCompany={selectedCompany} 
      />
    );
  }

  // Staff Feedback flow
  if (subView === 'thank-you') {
    return (
      <FeedbackThankYouView
        onHome={() => setSubView('landing')}
        onNewFeedback={() => setSubView('form')}
      />
    );
  }

  if (subView === 'card-layout' || (subView === 'form' && formLayoutMode === 'cards')) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end gap-2 max-w-4xl mx-auto">
          <button
            onClick={() => {
              setFormLayoutMode('standard');
              setSubView('form');
            }}
            className="text-xs font-semibold text-brand-grey hover:text-brand-red flex items-center gap-1.5 transition-colors"
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            Switch to Standard Form
          </button>
        </div>
        <FeedbackCardLayoutView
          selectedCompany={selectedCompany}
          userProfile={userProfile}
          onSuccess={() => setSubView('thank-you')}
        />
      </div>
    );
  }

  if (subView === 'form') {
    return (
      <div className="space-y-4">
        <div className="flex justify-end gap-2 max-w-2xl mx-auto">
          <button
            onClick={() => {
              setFormLayoutMode('cards');
              setSubView('card-layout');
            }}
            className="text-xs font-semibold text-brand-grey hover:text-brand-red flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            Switch to All-in-One Card Layout
          </button>
        </div>
        <FeedbackFormView
          initialCategory={selectedCategory}
          selectedCompany={selectedCompany}
          userProfile={userProfile}
          onBack={() => setSubView('landing')}
          onSuccess={() => setSubView('thank-you')}
        />
      </div>
    );
  }

  // Landing view (Option 1 Dashboard)
  return (
    <FeedbackLandingView
      onStartForm={(category = 'General Feedback') => {
        setSelectedCategory(category);
        setSubView('form');
      }}
      onCategorySelect={(category) => {
        setSelectedCategory(category);
        setSubView('form');
      }}
    />
  );
}
