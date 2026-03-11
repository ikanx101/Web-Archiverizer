import React, { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FileUploaderProps {
  onURLsExtracted: (urls: string[]) => void;
}

export function FileUploader({ onURLsExtracted }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = async (file: File) => {
    if (file.type !== 'text/plain') {
      alert('Harap unggah file .txt');
      return;
    }

    const text = await file.text();
    const urls = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && (line.startsWith('http://') || line.startsWith('https://')));
    
    if (urls.length === 0) {
      alert('Tidak ada URL valid yang ditemukan di dalam file.');
      return;
    }

    onURLsExtracted(urls);
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div
      className={cn(
        'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors',
        isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-zinc-300 hover:border-zinc-400 bg-white'
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => document.getElementById('file-upload')?.click()}
    >
      <input
        id="file-upload"
        type="file"
        accept=".txt"
        className="hidden"
        onChange={onFileChange}
      />
      <UploadCloud className="w-12 h-12 mx-auto text-zinc-400 mb-4" />
      <h3 className="text-lg font-medium text-zinc-900 mb-1">Unggah daftar URL Anda</h3>
      <p className="text-sm text-zinc-500">
        Tarik dan lepas file .txt di sini, atau klik untuk memilih
      </p>
      <p className="text-xs text-zinc-400 mt-2">
        File harus berisi satu URL per baris
      </p>
    </div>
  );
}
