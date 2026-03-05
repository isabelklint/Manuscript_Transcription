import React from 'react';
import type { DriveFile } from '../driveClient';

interface Props {
  files: DriveFile[];
  loading: boolean;
  onSelect: (file: DriveFile) => void;
  onClose: () => void;
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const DriveModal: React.FC<Props> = ({ files, loading, onSelect, onClose }) => (
  <div
    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center"
    onClick={onClose}
  >
    <div
      className="bg-white rounded-2xl shadow-2xl w-[480px] max-h-[70vh] flex flex-col overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="p-5 border-b flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <i className="fa-brands fa-google-drive text-blue-500 text-lg"></i>
          <span className="font-black text-slate-800 uppercase text-sm tracking-tight">Open from Drive</span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
          <i className="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <i className="fa-solid fa-spinner fa-spin text-2xl mb-3 block"></i>
            <span className="text-xs font-bold uppercase tracking-widest">Loading files…</span>
          </div>
        ) : files.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <i className="fa-solid fa-folder-open text-2xl mb-3 block"></i>
            <span className="text-xs font-bold uppercase tracking-widest">No XML files found in Drive</span>
            <p className="text-[10px] mt-2 text-slate-300">Files must have been created by this app<br/>(drive.file scope)</p>
          </div>
        ) : (
          files.map(f => (
            <button
              key={f.id}
              onClick={() => onSelect(f)}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-blue-50 transition-colors text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-200 transition-colors">
                <i className="fa-solid fa-file-code text-blue-500 text-sm"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{f.name}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{fmt(f.modifiedTime)}</p>
              </div>
              <i className="fa-solid fa-arrow-right text-slate-300 group-hover:text-blue-400 transition-colors"></i>
            </button>
          ))
        )}
      </div>
    </div>
  </div>
);

export default DriveModal;
