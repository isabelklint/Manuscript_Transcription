import React from 'react';
import { PhraseMetadata } from '../types';

interface Props {
  metadata: PhraseMetadata;
  onChange: (field: keyof PhraseMetadata, value: string) => void;
}

interface FieldProps {
  label: string;
  field: keyof PhraseMetadata;
  metadata: PhraseMetadata;
  onChange: (field: keyof PhraseMetadata, value: string) => void;
  placeholder?: string;
}

const Field: React.FC<FieldProps> = ({ label, field, metadata, onChange, placeholder = '' }) => (
  <div className="space-y-1">
    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">{label}</label>
    <input type="text" value={metadata[field]} placeholder={placeholder} onChange={e => onChange(field, e.target.value)}
      className="w-full px-3 py-2 bg-white border border-rose-100 rounded-lg text-xs font-semibold focus:border-rose-400 focus:ring-4 focus:ring-rose-500/5 transition-all" />
  </div>
);

const PhraseMetadataForm: React.FC<Props> = ({ metadata, onChange }) => {
  return (
    <div className="bg-rose-50/20 p-6 rounded-2xl border border-rose-100 space-y-8 shadow-inner">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Field label="Original Title" field="title_orig" metadata={metadata} onChange={onChange} />
        <Field label="Normalized Title" field="title_norm" metadata={metadata} onChange={onChange} />
        <Field label="Gloss Title (Eng)" field="title_gloss" metadata={metadata} onChange={onChange} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Field label="Author (Manuscript)" field="author" metadata={metadata} onChange={onChange} />
        <Field label="Editor (Digital)" field="editor" metadata={metadata} onChange={onChange} />
        <Field label="Institutional Affiliation" field="affiliation" metadata={metadata} onChange={onChange} />
        <Field label="Edition Date" field="pub_date" metadata={metadata} onChange={onChange} />
      </div>
      <div className="border-t border-rose-100 pt-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        <Field label="Settlement" field="settlement" metadata={metadata} onChange={onChange} />
        <Field label="Institution" field="institution" metadata={metadata} onChange={onChange} />
        <Field label="Repository" field="repository" metadata={metadata} onChange={onChange} />
        <Field label="Shelfmark / ID" field="shelfmark" metadata={metadata} onChange={onChange} />
      </div>
      <div className="bg-rose-50/40 p-4 rounded-xl border border-rose-100 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-2">
          <Field label="Library Image Filename (facs)" field="image_source" metadata={metadata} onChange={onChange} placeholder="e.g. scan_p1.jpg" />
        </div>
        <Field label="Folio / Page Number" field="pb_n" metadata={metadata} onChange={onChange} placeholder="e.g. 1" />
        <Field label="Collection ID" field="collection" metadata={metadata} onChange={onChange} />
      </div>
      <div className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100/50 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-2">
          <Field label="Filename Keyword" field="filename_keyword" metadata={metadata} onChange={onChange} placeholder="e.g. cuaderno" />
          <p className="text-[8px] font-bold text-emerald-500 mt-1 uppercase italic">Controls the 'keyword' part of author_keyword_date_page.xml</p>
        </div>
        <div className="md:col-span-2 flex items-center pt-3">
          <div className="bg-emerald-100/30 rounded px-2 py-1 border border-emerald-200/50">
            <span className="text-[9px] font-black text-emerald-600 uppercase">Preview:</span>
            <span className="text-[9px] font-mono text-emerald-700 ml-2 italic">..._{metadata.filename_keyword || 'keyword'}_...</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Field label="Physical Extent" field="phys_extent" metadata={metadata} onChange={onChange} />
        <Field label="Handwriting Note" field="hand_note" metadata={metadata} onChange={onChange} />
        <Field label="Place of Origin" field="orig_place" metadata={metadata} onChange={onChange} />
        <Field label="Date of Origin" field="orig_date" metadata={metadata} onChange={onChange} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Document Summary</label>
          <textarea value={metadata.summary} onChange={e => onChange('summary', e.target.value)} rows={2}
            className="w-full px-3 py-2 bg-white border border-rose-100 rounded-lg text-xs font-semibold focus:border-rose-400 transition-all resize-none" />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Project Description</label>
          <textarea value={metadata.project_desc} onChange={e => onChange('project_desc', e.target.value)} rows={2}
            className="w-full px-3 py-2 bg-white border border-rose-100 rounded-lg text-xs font-semibold focus:border-rose-400 transition-all resize-none" />
        </div>
      </div>
    </div>
  );
};

export default PhraseMetadataForm;
