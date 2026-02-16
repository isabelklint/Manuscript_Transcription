import React from 'react';
import { Metadata } from '../types';

interface Props {
  metadata: Metadata;
  onChange: (field: keyof Metadata, value: string) => void;
}

const MetadataForm: React.FC<Props> = ({ metadata, onChange }) => {
  const Field = ({ label, field, full = false }: { label: string, field: keyof Metadata, full?: boolean }) => (
    <div className={`space-y-1 ${full ? 'col-span-full' : ''}`}>
      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">{label}</label>
      <input
        type="text"
        value={metadata[field]}
        onChange={e => onChange(field, e.target.value)}
        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
      />
    </div>
  );

  return (
    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-8 shadow-inner">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Field label="Original Header Title" field="title_orig" />
        <Field label="Normalized Spanish Title" field="title_norm" />
        <Field label="English Gloss Title" field="title_gloss" />
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Field label="Author (Manuscript)" field="author" />
        <Field label="Editor (Digital)" field="editor" />
        <Field label="Institutional Affiliation" field="affiliation" />
        <Field label="Edition Date" field="pub_date" />
      </div>

      <div className="border-t border-slate-100 pt-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        <Field label="Settlement" field="settlement" />
        <Field label="Institution" field="institution" />
        <Field label="Repository" field="repository" />
        <Field label="Shelfmark / ID" field="shelfmark" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Field label="Collection / Alternate ID" field="collection" />
        <Field label="Place of Origin" field="orig_place" />
        <Field label="Date of Origin" field="orig_date" />
        <Field label="Page Break ID (pb n=)" field="pb_n" />
      </div>

      <div className="space-y-1">
        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Document Summary</label>
        <textarea
          value={metadata.summary}
          onChange={e => onChange('summary', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:border-blue-500 transition-all resize-none"
        />
      </div>
    </div>
  );
};

export default MetadataForm;