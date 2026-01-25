import React from 'react';
import { Metadata } from '../types';

interface MetadataFormProps {
  metadata: Metadata;
  onChange: (field: keyof Metadata, value: string) => void;
}

const MetadataForm: React.FC<MetadataFormProps> = ({ metadata, onChange }) => {
  const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="space-y-4 pt-4 first:pt-0">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
    </div>
  );

  const Input = ({ label, field, placeholder }: { label: string, field: keyof Metadata, placeholder?: string }) => (
    <div className="space-y-1">
      <label className="block text-[10px] font-bold text-slate-500 uppercase">{label}</label>
      <input
        type="text"
        value={metadata[field] as string}
        onChange={(e) => onChange(field, e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
      />
    </div>
  );

  return (
    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-8">
      <Section title="Title & Responsibility">
        <Input label="Main Title" field="title" />
        <Input label="Original Author" field="author" />
        <Input label="Digital Editor" field="editor" />
        <Input label="Affiliation" field="affiliation" />
      </Section>
      <Section title="Manuscript Identifier">
        <Input label="Institution" field="institution" />
        <Input label="Repository" field="repository" />
        <Input label="Shelfmark (IDNO)" field="shelfmark" />
        <Input label="Collection" field="collection" />
      </Section>
      <Section title="Physical & Historical">
        <Input label="Extent" field="physExtent" />
        <Input label="Form" field="physForm" />
        <Input label="Origins" field="origPlace" />
        <Input label="Date of Origin" field="origDate" />
      </Section>
    </div>
  );
};

export default MetadataForm;