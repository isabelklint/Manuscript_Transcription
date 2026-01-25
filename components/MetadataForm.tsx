import React from 'react';
import { Metadata } from '../types';

interface Props {
  metadata: Metadata;
  onChange: (field: keyof Metadata, value: string) => void;
}

const MetadataForm: React.FC<Props> = ({ metadata, onChange }) => {
  const Field = ({ label, field, placeholder }: { label: string, field: keyof Metadata, placeholder?: string }) => (
    <div className="space-y-1">
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{label}</label>
      <input
        type="text"
        value={metadata[field]}
        onChange={e => onChange(field, e.target.value)}
        placeholder={placeholder}
        className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs font-medium focus:border-blue-400 transition-colors"
      />
    </div>
  );

  return (
    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Title (Original)" field="title_orig" />
        <Field label="Title (Normalized)" field="title_norm" />
        <Field label="Title (Gloss)" field="title_gloss" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Field label="Author" field="author" />
        <Field label="Editor" field="editor" />
        <Field label="Affiliation" field="affiliation" />
        <Field label="Pub Date (YYYY-MM)" field="pub_date" />
      </div>
      <div className="border-t border-slate-200 pt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Field label="Settlement" field="settlement" />
        <Field label="Institution" field="institution" />
        <Field label="Repository" field="repository" />
        <Field label="Shelfmark" field="shelfmark" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Collection" field="collection" />
        <Field label="Origin Place" field="orig_place" />
        <Field label="Origin Date" field="orig_date" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Page ID (pb n=)" field="pb_n" />
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Summary</label>
          <textarea
            value={metadata.summary}
            onChange={e => onChange('summary', e.target.value)}
            className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs font-medium focus:border-blue-400 transition-colors h-[31px] resize-none"
          />
        </div>
      </div>
    </div>
  );
};

export default MetadataForm;