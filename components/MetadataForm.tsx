
import React from 'react';
import { Metadata, GENRE_OPTIONS } from '../types';

interface MetadataFormProps {
  metadata: Metadata;
  onChange: (field: keyof Metadata, value: string) => void;
}

const MetadataForm: React.FC<MetadataFormProps> = ({ metadata, onChange }) => {
  return (
    <div className="grid grid-cols-1 gap-4 bg-slate-50 p-6 rounded-xl border border-slate-200">
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Document Name</label>
        <input
          type="text"
          value={metadata.docName}
          onChange={(e) => onChange('docName', e.target.value)}
          placeholder="e.g. Arrona Mazatec Manuscript"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Date</label>
          <input
            type="text"
            value={metadata.date}
            onChange={(e) => onChange('date', e.target.value)}
            placeholder="e.g. c.1830s"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Genre</label>
          <select
            value={metadata.genre}
            onChange={(e) => onChange('genre', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
          >
            {GENRE_OPTIONS.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Author</label>
          <input
            type="text"
            value={metadata.author}
            onChange={(e) => onChange('author', e.target.value)}
            placeholder="Author name"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Source</label>
          <input
            type="text"
            value={metadata.source}
            onChange={(e) => onChange('source', e.target.value)}
            placeholder="Collection, collection ID, etc."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>
      </div>
    </div>
  );
};

export default MetadataForm;
