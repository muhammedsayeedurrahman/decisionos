'use client';

import React from 'react';

interface BriefBlockProps {
  variant?: 'red' | 'blue' | 'yellow' | 'green';
  label: string;
  text: string;
}

export default function BriefBlock({ variant, label, text }: BriefBlockProps) {
  return (
    <div className="w-full space-y-6 animate-fade-up">
      <div className={`brief-block ${variant && variant !== 'red' ? variant : ''}`}>
        <div className="max-w-3xl">
          <p className="brief-label">{label}</p>
          <p className="brief-text">{text}</p>
        </div>
      </div>
    </div>
  );
}
