import React from 'react';
import { PhraseEntry, NoteEntry, NOTE_TYPES, PHRASE_CATEGORIES } from '../types';
import { generateId } from '../utils';

interface Props {
  entry: PhraseEntry;
  index: number;
  onUpdate: (updates: Partial<PhraseEntry>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

const UncertainBox = ({ label, active, onChange }: { label: string; active: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-center gap-1.5 cursor-pointer group">
    <div className="relative flex items-center justify-center">
      <input
        type="checkbox"
        checked={active}
        onChange={e => onChange(e.target.checked)}
        className="peer appearance-none w-3.5 h-3.5 border border-slate-300 rounded bg-white checked:bg-orange-500 checked:border-orange-600 transition-all"
      />
      <i className="fa-solid fa-check text-[8px] text-white absolute opacity-0 peer-checked:opacity-100 transition-opacity"></i>
    </div>
    <span className={`text-[9px] font-black uppercase tracking-tighter ${active ? 'text-orange-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
      {label}
    </span>
  </label>
);

const PhraseItem: React.FC<Props> = ({ entry, index, onUpdate, onRemove, onDuplicate }) => {
  const addNote = () => onUpdate({ notes: [...entry.notes, { id: generateId(), type: 'editorial', resp: 'IK', text: '' }] });
  const updateNote = (id: string, u: Partial<NoteEntry>) => onUpdate({ notes: entry.notes.map(n => n.id === id ? { ...n, ...u } : n) });
  const removeNote = (id: string) => onUpdate({ notes: entry.notes.filter(n => n.id !== id) });

  return (
    <div className="bg-white border border-rose-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all relative">
      {/* Row header */}
      <div className="bg-rose-50/60 px-4 py-2 border-b border-rose-100 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 bg-rose-700 text-white rounded-full flex items-center justify-center text-[10px] font-black">{index + 1}</div>
          <div className="flex items-center gap-2 border-l border-rose-100 pl-4">
            <span className="text-[9px] font-black text-slate-400 uppercase">LB N=</span>
            <input
              type="text"
              value={entry.line}
              onChange={e => onUpdate({ line: e.target.value })}
              className="w-14 text-[10px] font-black text-center border-b border-slate-200 focus:border-rose-400 outline-none"
            />
          </div>
          <div className="flex items-center gap-2 border-l border-rose-100 pl-4">
            <span className="text-[9px] font-black text-slate-400 uppercase">Category</span>
            <select
              value={entry.category}
              onChange={e => onUpdate({ category: e.target.value })}
              className="text-[9px] font-bold bg-white border border-rose-200 px-1.5 py-0.5 rounded outline-none focus:border-rose-400"
            >
              {PHRASE_CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.desc}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2 text-xs">
          <button onClick={onDuplicate} title="Duplicate Entry" className="text-slate-300 hover:text-rose-500 p-1"><i className="fa-solid fa-clone"></i></button>
          <button onClick={onRemove} title="Delete Entry" className="text-slate-300 hover:text-red-500 p-1"><i className="fa-solid fa-trash"></i></button>
        </div>
      </div>

      {/* Main fields grid */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Spanish column */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Spanish (Phrase)</h4>
            <UncertainBox label="Uncertain" active={entry.uncertain_spa} onChange={v => onUpdate({ uncertain_spa: v })} />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-bold text-slate-400 uppercase">Original Manuscript</label>
            <textarea
              value={entry.orig_spa}
              onChange={e => onUpdate({ orig_spa: e.target.value })}
              rows={2}
              className="w-full px-3 py-1.5 border border-slate-100 bg-slate-50/50 rounded text-sm font-medium focus:bg-white focus:border-emerald-300 outline-none resize-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-bold text-slate-400 uppercase">Normalized</label>
            <textarea
              value={entry.new_spa}
              onChange={e => onUpdate({ new_spa: e.target.value })}
              rows={2}
              className="w-full px-3 py-1.5 border border-slate-100 rounded text-sm outline-none focus:border-emerald-200 resize-none"
            />
          </div>
        </div>

        {/* Mazatec column */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Mazatec (Response)</h4>
            <UncertainBox label="Uncertain" active={entry.uncertain_maz} onChange={v => onUpdate({ uncertain_maz: v })} />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-bold text-slate-400 uppercase">Original Manuscript</label>
            <textarea
              value={entry.orig_maz}
              onChange={e => onUpdate({ orig_maz: e.target.value })}
              rows={2}
              className="w-full px-3 py-1.5 border border-slate-100 bg-slate-50/50 rounded text-sm font-medium focus:bg-white focus:border-blue-300 outline-none resize-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-bold text-slate-400 uppercase">Normalized</label>
            <textarea
              value={entry.new_maz}
              onChange={e => onUpdate({ new_maz: e.target.value })}
              rows={2}
              className="w-full px-3 py-1.5 border border-slate-100 rounded text-sm outline-none focus:border-blue-200 resize-none"
            />
          </div>
        </div>

        {/* Gloss column */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-widest">English Gloss</h4>
            <UncertainBox label="Uncertain" active={entry.uncertain_eng} onChange={v => onUpdate({ uncertain_eng: v })} />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-bold text-slate-400 uppercase">Translation / Gloss</label>
            <textarea
              value={entry.eng_gloss}
              onChange={e => onUpdate({ eng_gloss: e.target.value })}
              rows={2}
              className="w-full px-3 py-1.5 border border-slate-100 bg-purple-50/10 rounded text-sm outline-none focus:border-purple-300 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="px-5 pb-4 border-t border-rose-50 pt-3">
        <div className="flex justify-between items-center mb-2">
          <h5 className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <i className="fa-solid fa-comment-dots text-slate-300"></i>
            Editorial Observations
          </h5>
          <button onClick={addNote} className="text-[9px] font-bold text-rose-500 uppercase">+ Add Observation</button>
        </div>
        <div className="space-y-2">
          {entry.notes.map(note => (
            <div key={note.id} className="flex gap-2 items-start bg-rose-50/30 p-2 rounded-lg border border-rose-100 group">
              <select
                value={note.type}
                onChange={e => {
                  if (e.target.value === 'none') {
                    removeNote(note.id);
                  } else {
                    updateNote(note.id, { type: e.target.value });
                  }
                }}
                className="text-[9px] font-bold bg-white border border-slate-200 px-1 py-1 rounded outline-none w-36 shadow-sm focus:border-rose-400"
              >
                {NOTE_TYPES.map(t => (
                  <option key={t.id} value={t.id} className={t.id === 'none' ? 'text-red-500' : ''}>{t.desc}</option>
                ))}
              </select>
              <input type="text" value={note.resp} onChange={e => updateNote(note.id, { resp: e.target.value })} className="w-10 text-[9px] font-bold text-center border-b border-slate-200 outline-none h-6" placeholder="Resp" />
              <textarea value={note.text} onChange={e => updateNote(note.id, { text: e.target.value })} className="flex-1 text-[10px] bg-white border border-slate-200 rounded px-2 py-1 outline-none resize-none h-6" placeholder="Enter observation..." />
              <button onClick={() => removeNote(note.id)} className="text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity self-center"><i className="fa-solid fa-xmark"></i></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PhraseItem;
