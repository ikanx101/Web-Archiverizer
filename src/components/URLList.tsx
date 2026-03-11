import React from 'react';
import { CheckCircle2, Circle, Loader2, XCircle, Download } from 'lucide-react';
import { cn } from './FileUploader';

export type ProcessStatus = 'pending' | 'processing' | 'success' | 'error';

export interface URLItem {
  id: string;
  url: string;
  status: ProcessStatus;
  error?: string;
  html?: string;
}

interface URLListProps {
  items: URLItem[];
}

export function URLList({ items }: URLListProps) {
  const downloadSingle = (item: URLItem) => {
    if (!item.html) return;
    
    try {
      const urlObj = new URL(item.url);
      let filename = urlObj.hostname + urlObj.pathname.replace(/\//g, '_');
      if (filename.endsWith('_')) filename = filename.slice(0, -1);
      if (!filename) filename = `page_${item.id}`;
      
      const blob = new Blob([item.html], { type: 'text/html;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      const blob = new Blob([item.html], { type: 'text/html;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `page_${item.id}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50">
        <h3 className="text-sm font-medium text-zinc-900">URL untuk Diproses ({items.length})</h3>
      </div>
      <ul className="divide-y divide-zinc-200 max-h-[400px] overflow-y-auto">
        {items.map((item) => (
          <li key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
            <div className="flex items-center space-x-3 truncate flex-1">
              {item.status === 'pending' && <Circle className="w-5 h-5 text-zinc-300 flex-shrink-0" />}
              {item.status === 'processing' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />}
              {item.status === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
              {item.status === 'error' && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
              <span className={cn(
                "text-sm truncate",
                item.status === 'error' ? "text-red-600" : "text-zinc-700"
              )}>
                {item.url}
              </span>
            </div>
            <div className="flex items-center ml-4 flex-shrink-0">
              {item.error && (
                <span className="text-xs text-red-500 truncate max-w-[200px]" title={item.error}>
                  {item.error}
                </span>
              )}
              {item.status === 'success' && item.html && (
                <button
                  onClick={() => downloadSingle(item)}
                  className="p-1.5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors ml-2"
                  title="Unduh HTML"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
