import React from 'react';
import { TranscriptionEntry, NoteEntry, NOTE_TYPES } from '../types';

interface EntryItemProps {
  entry: TranscriptionEntry;
  index: number;
  onUpdate: (updates: Partial<TranscriptionEntry>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

const EntryItem: React.FC<EntryItemProps> = ({ entry, index, onUpdate, onRemove, onDuplicate }) => {
  const Toggle = ({ active, onClick, label }: { active?: boolean, onClick: () => void, label: string }) => (
    <button onClick={onClick} className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${active ? 'bg-orange-500 border-orange-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>{label}</button>
  );

  return (
    <div className="group relative bg-white border border-slate-200 rounded-xl shadow-sm p-5 hover:shadow-md transition-all">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <span className="w-6 h-6 bg-slate-800 text-white rounded-full flex items-center justify-center text-[10px] font-black">{index + 1}</span>
          <div className="flex gap-2">
            <input type="text" value={entry.page} onChange={e => onUpdate({ page: e.target.value })} className="w-24 px-2 py-1 bg-slate-50 border rounded text-[10px] font-bold uppercase" placeholder="Page" />
            <select value={entry.column} onChange={e => onUpdate({ column: e.target.value as "1" | "2" })} className="px-2 py-1 bg-slate-50 border rounded text-[10px] font-bold uppercase">
              <option value="1">Col 1</option>
              <option value="2">Col 2</option>
            </select>
            <input type="text" value={entry.line} onChange={e => onUpdate({ line: e.target.value })} className="w-16 px-2 py-1 bg-slate-50 border rounded text-[10px] font-bold" placeholder="Line" />
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onDuplicate} className="p-1.5 text-slate-400 hover:text-blue-500"><i className="fa-solid fa-clone"></i></button>
          <button onClick={onRemove} className="p-1.5 text-slate-400 hover:text-red-500"><i className="fa-solid fa-trash"></i></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-blue-600 uppercase">Mazatec (Lemma)</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center"><label className="text-[9px] font-bold text-slate-400 uppercase">Original</label><Toggle label="UNCERTAIN" active={entry.uncertain_maz} onClick={() => onUpdate({ uncertain_maz: !entry.uncertain_maz })} /></div>
            <input type="text" value={entry.maz_orig} onChange={e => onUpdate({ maz_orig: e.target.value })} className="w-full px-3 py-2 border border-blue-100 rounded-lg text-sm font-medium" />
            <label className="block text-[9px] font-bold text-slate-400 uppercase">Normalized</label>
            <input type="text" value={entry.maz_norm} onChange={e => onUpdate({ maz_norm: e.target.value })} className="w-full px-3 py-2 border border-slate-100 bg-slate-50 rounded-lg text-sm italic" />
          </div>
          <button onClick={() => onUpdate({ has_variant: !entry.has_variant })} className="text-[9px] font-bold text-blue-400 hover:underline">{entry.has_variant ? "- Remove Variant" : "+ Add Variant (vel)"}</button>
          {entry.has_variant && (
            <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 space-y-2">
              <input type="text" placeholder="Variant Orig" value={entry.variant_maz_orig} onChange={e => onUpdate({ variant_maz_orig: e.target.value })} className="w-full px-2 py-1 text-xs border rounded" />
              <input type="text" placeholder="Variant Norm" value={entry.variant_maz_norm} onChange={e => onUpdate({ variant_maz_norm: e.target.value })} className="w-full px-2 py-1 text-xs border rounded" />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-emerald-600 uppercase">Spanish Sense</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center"><label className="text-[9px] font-bold text-slate-400 uppercase">Orig (Colonial)</label><Toggle label="UNCERTAIN" active={entry.uncertain_spa} onClick={() => onUpdate({ uncertain_spa: !entry.uncertain_spa })} /></div>
            <input type="text" value={entry.spa_orig} onChange={e => onUpdate({ spa_orig: e.target.value })} className="w-full px-3 py-2 border border-emerald-100 rounded-lg text-sm" />
            <label className="block text-[9px] font-bold text-slate-400 uppercase">Norm (Modern)</label>
            <input type="text" value={entry.spa_norm} onChange={e => onUpdate({ spa_norm: e.target.value })} className="w-full px-3 py-2 border border-slate-100 bg-slate-50 rounded-lg text-sm" />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-purple-600 uppercase">English Gloss</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center"><label className="text-[9px] font-bold text-slate-400 uppercase">Translation</label><Toggle label="UNCERTAIN" active={entry.uncertain_eng} onClick={() => onUpdate({ uncertain_eng: !entry.uncertain_eng })} /></div>
            <input type="text" value={entry.eng_gloss} onChange={e => onUpdate({ eng_gloss: e.target.value })} className="w-full px-3 py-2 border border-purple-100 rounded-lg text-sm" />
          </div>
          <div className="pt-4 space-y-2">
            <div className="flex justify-between items-center"><label className="text-[9px] font-bold text-slate-400 uppercase">Notes</label><button onClick={() => onUpdate({ notes: [...entry.notes, { id: crypto.randomUUID(), type: 'editorial', resp: 'IK', text: '' }] })} className="text-[9px] font-black text-blue-500">+</button></div>
            {entry.notes.map(n => (
              <div key={n.id} className="flex gap-1">
                <select value={n.type} onChange={e => onUpdate({ notes: entry.notes.map(note => note.id === n.id ? { ...note, type: e.target.value } : note) })} className="text-[8px] border rounded bg-slate-50 uppercase font-bold px-1">
                  {NOTE_TYPES.map(nt => <option key={nt.id} value={nt.id}>{nt.id}</option>)}
                </select>
                <input type="text" value={n.text} onChange={e => onUpdate({ notes: entry.notes.map(note => note.id === n.id ? { ...note, text: e.target.value } : note) })} className="flex-1 text-[10px] border rounded px-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntryItem;