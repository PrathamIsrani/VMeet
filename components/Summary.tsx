'use client';
import React, { useState } from 'react';

export default function Summary({ transcript }: { transcript: string }) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!transcript.trim()) {
      setError('No transcript to summarize');
      return;
    }
    
    if (transcript.length > 10000) {
      setError('Transcript too long (max 10,000 characters)');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });
      
      if (!res.ok) throw new Error('Summarization failed');
      
      const data = await res.json();
      setSummary(data.summary || 'No summary generated');
    } catch (err) {
      setError('Failed to generate summary');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 max-w-2xl mx-auto">
      <button 
        onClick={generate} 
        disabled={!transcript || loading} 
        className="bg-green-600 px-4 py-2 rounded text-white disabled:bg-gray-400"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin">↻</span>
            Summarizing...
          </span>
        ) : 'Generate Summary'}
      </button>
      
      {error && (
        <p className="mt-2 text-red-500">{error}</p>
      )}
      
      {summary && (
        <div className="mt-4 p-4 bg-gray-800 rounded-lg text-white">
          <h3 className="font-bold mb-2">Meeting Summary:</h3>
          <p>{summary}</p>
        </div>
      )}
    </div>
  );
}