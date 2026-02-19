import React from 'react';
import { Metadata } from '../types';

interface Props {
  metadata: Metadata;
  onChange: (field: keyof Metadata, value: string) => void;
}

interface FieldProps {
  label: string;
  field: keyof Metadata;
  metadata: Metadata;
  onChange: (field: keyof Metadata, value: string) => void;
  placeholder?: string;
}

const Field: React.FC<FieldProps> = ({ label, field, metadata, onChange, placeholder = "" }) => (
  <div className="space-y-1">
    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">{label}</label>
    <input
      type="text"
      value={metadata[field]}
      placeholder={placeholder}
      onChange={e => onChange(field, e.target.value)}
      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
    />
  </div>
);

const MetadataForm: React.FC<Props> = ({ metadata, onChange }) => {
  return (
    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-8 shadow-inner">
      {/* Title Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Field label="Original Title" field="title_orig" metadata={metadata} onChange={onChange} />
        <Field label="Title Note (Subtitle)" field="title_note" metadata={metadata} onChange={onChange} />
        <Field label="Normalized Title" field="title_norm" metadata={metadata} onChange={onChange} />
        <Field label="Gloss Title (Eng)" field="title_gloss" metadata={metadata} onChange={onChange} />
      </div>
      
      {/* Responsibility Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Field label="Author (Manuscript)" field="author" metadata={metadata} onChange={onChange} />
        <Field label="Editor (Digital)" field="editor" metadata={metadata} onChange={onChange} />
        <Field label="Institutional Affiliation" field="affiliation" metadata={metadata} onChange={onChange} />
        <Field label="Edition Date" field="pub_date" metadata={metadata} onChange={onChange} />
      </div>

      {/* Repository Section */}
      <div className="border-t border-slate-100 pt-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        <Field label="Settlement" field="settlement" metadata={metadata} onChange={onChange} />
        <Field label="Institution" field="institution" metadata={metadata} onChange={onChange} />
        <Field label="Repository" field="repository" metadata={metadata} onChange={onChange} />
        <Field label="Shelfmark / ID" field="shelfmark" metadata={metadata} onChange={onChange} />
      </div>

      {/* Archival Source Linkage */}
      <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100/50 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-2">
           <Field label="Library Image Filename (facs)" field="image_source" metadata={metadata} onChange={onChange} placeholder="e.g. 000032278_0001.jpg" />
           <p className="text-[8px] font-bold text-blue-400 mt-1 uppercase italic">Used for standard TEI @facs attribute and filename generation.</p>
        </div>
        <Field label="Folio / Page Number" field="pb_n" metadata={metadata} onChange={onChange} placeholder="e.g. 1" />
        <Field label="Collection ID" field="collection" metadata={metadata} onChange={onChange} />
      </div>

      {/* Export Settings */}
      <div className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100/50 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-2">
           <Field label="Filename Keyword" field="filename_keyword" metadata={metadata} onChange={onChange} placeholder="e.g. vocabulario" />
           <p className="text-[8px] font-bold text-emerald-500 mt-1 uppercase italic">Controls the 'keyword' part of author_keyword_date_page.xml</p>
        </div>
        <div className="md:col-span-2 flex items-center pt-3">
           <div className="bg-emerald-100/30 rounded px-2 py-1 border border-emerald-200/50">
             <span className="text-[9px] font-black text-emerald-600 uppercase">Preview:</span>
             <span className="text-[9px] font-mono text-emerald-700 ml-2 italic">..._{metadata.filename_keyword || 'keyword'}_...</span>
           </div>
        </div>
      </div>

      {/* Physical Description Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Field label="Physical Extent" field="phys_extent" metadata={metadata} onChange={onChange} />
        <Field label="Physical Layout" field="phys_layout" metadata={metadata} onChange={onChange} />
        <Field label="Handwriting Note" field="hand_note" metadata={metadata} onChange={onChange} />
        <Field label="Place of Origin" field="orig_place" metadata={metadata} onChange={onChange} />
      </div>

      {/* History & Encoding Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Field label="Date of Origin" field="orig_date" metadata={metadata} onChange={onChange} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Document Summary</label>
          <textarea
            value={metadata.summary}
            onChange={e => onChange('summary', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:border-blue-500 transition-all resize-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Project Description (Encoding)</label>
          <textarea
            value={metadata.project_desc}
            onChange={e => onChange('project_desc', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:border-blue-500 transition-all resize-none"
          />
        </div>
      </div>
    </div>
  );
};

export default MetadataForm;
