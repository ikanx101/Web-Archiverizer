import React, { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Download, Save, Loader2, Play, RefreshCw } from 'lucide-react';
import { FileUploader } from './components/FileUploader';
import { URLList, type ProcessStatus, type URLItem } from './components/URLList';
import { motion } from 'motion/react';

export default function App() {
  const [items, setItems] = useState<URLItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [waitTime, setWaitTime] = useState(2); // Default 2 seconds

  const handleURLsExtracted = (urls: string[]) => {
    const newItems = urls.map((url, index) => ({
      id: `${index}-${Date.now()}`,
      url,
      status: 'pending' as ProcessStatus,
    }));
    setItems(newItems);
  };

  const processURLs = async () => {
    if (items.length === 0) return;
    
    setIsProcessing(true);
    setProgress({ current: 0, total: items.length });

    const updatedItems = [...items];

    for (let i = 0; i < updatedItems.length; i++) {
      const item = updatedItems[i];
      if (item.status === 'success') continue; // Skip already processed

      // Update status to processing
      updatedItems[i] = { ...item, status: 'processing' };
      setItems([...updatedItems]);

      try {
        const response = await fetch('/api/fetch-page', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: item.url, waitTime }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch');
        }

        const data = await response.json();
        updatedItems[i] = { ...item, status: 'success', html: data.html };
      } catch (error: any) {
        updatedItems[i] = { ...item, status: 'error', error: error.message };
      }

      setItems([...updatedItems]);
      setProgress({ current: i + 1, total: items.length });
    }

    setIsProcessing(false);
  };

  const downloadZip = async () => {
    const successfulItems = items.filter(item => item.status === 'success' && item.html);
    if (successfulItems.length === 0) {
      alert('Tidak ada halaman yang berhasil diunduh.');
      return;
    }

    const zip = new JSZip();
    
    successfulItems.forEach((item, index) => {
      try {
        const urlObj = new URL(item.url);
        let filename = urlObj.hostname + urlObj.pathname.replace(/\//g, '_');
        if (filename.endsWith('_')) filename = filename.slice(0, -1);
        if (!filename) filename = `page_${index + 1}`;
        zip.file(`${filename}.html`, item.html!);
      } catch (e) {
        zip.file(`page_${index + 1}.html`, item.html!);
      }
    });

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'webpages.zip');
  };

  const reset = () => {
    setItems([]);
    setProgress({ current: 0, total: 0 });
    setIsProcessing(false);
  };

  const allDone = items.length > 0 && !isProcessing && items.every(i => i.status === 'success' || i.status === 'error');
  const hasSuccess = items.some(i => i.status === 'success');

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 mb-6">
            <Save className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-4">
            Webpage Archiverizer
          </h1>
          <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
            Unggah file teks yang berisi daftar URL. Kami akan mengambil setiap halaman, menyematkan sumber dayanya, dan mengemasnya ke dalam satu file ZIP untuk dilihat secara offline.
          </p>
        </motion.div>

        <div className="space-y-8">
          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <FileUploader onURLsExtracted={handleURLsExtracted} />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <URLList items={items} />

              {isProcessing && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-zinc-700">Memproses...</span>
                    <span className="text-sm font-medium text-zinc-500">{progress.current} / {progress.total}</span>
                  </div>
                  <div className="w-full bg-zinc-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-2.5 rounded-full transition-all duration-300 ease-out" 
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {!allDone && !isProcessing && (
                  <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-lg border border-zinc-200 shadow-sm">
                    <label htmlFor="waitTime" className="text-sm font-medium text-zinc-700 whitespace-nowrap">
                      Waktu Tunggu Render (detik):
                    </label>
                    <input
                      id="waitTime"
                      type="number"
                      min="0"
                      max="30"
                      value={waitTime}
                      onChange={(e) => setWaitTime(Number(e.target.value))}
                      className="w-16 px-2 py-1 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}
                <div className="flex-1"></div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={reset}
                    disabled={isProcessing}
                    className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors disabled:opacity-50 flex items-center"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Mulai Ulang
                  </button>
                  
                  {!allDone && (
                    <button
                      onClick={processURLs}
                      disabled={isProcessing}
                      className="px-6 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center shadow-sm"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Mulai Proses
                        </>
                      )}
                    </button>
                  )}

                  {allDone && hasSuccess && (
                    <button
                      onClick={downloadZip}
                      className="px-6 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center shadow-sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Unduh ZIP
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <footer className="mt-16 text-center text-sm text-zinc-400">
          Dibuat oleh ikanx101.com
        </footer>
      </div>
    </div>
  );
}
