import React from 'react';
import { TranscriptionEntry, NoteEntry, NOTE_TYPES } from '../types';

interface Props {
  entry: TranscriptionEntry;
  index: number;
  onUpdate: (updates: Partial<TranscriptionEntry>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

const Uncertain = ({ active, onClick }: { active?: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-4 h-4 rounded text-[8px] font-bold flex items-center justify-center border transition-all ${
      active ? 'bg-orange-500 border-orange-600 text-white' : 'bg-white border-slate-200 text-slate-400 hover:text-orange-500'
    }`}
  >?</button>
);

const EntryItem: React.FC<Props> = ({ entry, index, onUpdate, onRemove, onDuplicate }) => {
  const addNote = () => onUpdate({ notes: [...entry.notes, { id: crypto.randomUUID(), type: 'editorial', resp: 'IK', text: '' }] });
  const updateNote = (id: string, u: Partial<NoteEntry>) => onUpdate({ notes: entry.notes.map(n => n.id === id ? { ...n, ...u } : n) });
  const removeNote = (id: string) => onUpdate({ notes: entry.notes.filter(n => n.id !== id) });

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-all bg-white relative">
      <div className="flex bg-slate-50 border-b border-slate-200 p-2 justify-between items-center">
        <div className="flex gap-4 items-center">
          <span className="text-[10px] font-black bg-slate-800 text-white w-5 h-5 flex items-center justify-center rounded-full shadow">{index + 1}</span>
          <div className="flex items-center gap-2">
            <select value={entry.column} onChange={e => onUpdate({ column: e.target.value as '1' | '2' })} className="text-[9px] font-bold uppercase bg-white border border-slate-200 px-2 py-0.5 rounded outline-none">
              <option value="1">Column 1</option>
              <option value="2">Column 2</option>
            </select>
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-bold text-slate-400">LINE:</span>
              <input type="text" value={entry.line} onChange={e => onUpdate({ line: e.target.value })} className="w-12 text-[9px] font-bold text-center border border-slate-200 rounded py-0.5 outline-none" />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onDuplicate} className="text-slate-400 hover:text-blue-500 transition-colors"><i className="fa-solid fa-clone text-xs"></i></button>
          <button onClick={onRemove} className="text-slate-400 hover:text-red-500 transition-colors"><i className="fa-solid fa-trash text-xs"></i></button>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Mazatec Orthography */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Mazatec (Orth)</h4>
            <Uncertain active={entry.uncertain_maz} onClick={() => onUpdate({ uncertain_maz: !entry.uncertain_maz })} />
          </div>
          <div className="space-y-2">
            <div className="space-y-1">
               <label className="text-[8px] font-bold text-slate-400 uppercase">Original (Orig)</label>
               <input type="text" value={entry.old_maz} onChange={e => onUpdate({ old_maz: e.target.value })} className="w-full text-xs font-semibold px-2 py-1.5 border border-slate-100 bg-slate-50/50 rounded focus:bg-white transition-all" />
            </div>
            <div className="space-y-1">
               <label className="text-[8px] font-bold text-slate-400 uppercase">Normalized (Norm)</label>
               <input type="text" value={entry.new_maz} onChange={e => onUpdate({ new_maz: e.target.value })} className="w-full text-xs px-2 py-1.5 border border-slate-100 rounded" />
            </div>
          </div>
        </div>

        {/* Spanish Definition */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Spanish (Def)</h4>
            <Uncertain active={entry.uncertain_spa} onClick={() => onUpdate({ uncertain_spa: !entry.uncertain_spa })} />
          </div>
          <div className="space-y-2">
            <div className="space-y-1">
               <label className="text-[8px] font-bold text-slate-400 uppercase">Original (Orig)</label>
               <input type="text" value={entry.old_spa} onChange={e => onUpdate({ old_spa: e.target.value })} className="w-full text-xs px-2 py-1.5 border border-slate-100 bg-slate-50/50 rounded" />
            </div>
            <div className="space-y-1">
               <label className="text-[8px] font-bold text-slate-400 uppercase">Normalized (Norm)</label>
               <input type="text" value={entry.new_spa} onChange={e => onUpdate({ new_spa: e.target.value })} className="w-full text-xs px-2 py-1.5 border border-slate-100 rounded" />
            </div>
          </div>
        </div>

        {/* English & Analysis */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-[9px] font-black text-purple-600 uppercase tracking-widest">English & Meta</h4>
            <Uncertain active={entry.uncertain_eng} onClick={() => onUpdate({ uncertain_eng: !entry.uncertain_eng })} />
          </div>
          <div className="space-y-2">
            <div className="space-y-1">
               <label className="text-[8px] font-bold text-slate-400 uppercase">English Gloss</label>
               <input type="text" value={entry.eng_gloss} onChange={e => onUpdate({ eng_gloss: e.target.value })} className="w-full text-xs px-2 py-1.5 border border-purple-50 rounded" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                 <label className="text-[8px] font-bold text-slate-400 uppercase">IPA</label>
                 <input type="text" value={entry.ipa || ''} onChange={e => onUpdate({ ipa: e.target.value })} className="w-full text-xs px-2 py-1.5 border border-slate-100 rounded font-mono" />
              </div>
              <div className="space-y-1">
                 <label className="text-[8px] font-bold text-slate-400 uppercase">Kirk Set</label>
                 <input type="text" value={entry.kirk_set || ''} onChange={e => onUpdate({ kirk_set: e.target.value })} className="w-full text-xs px-2 py-1.5 border border-slate-100 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 border-t border-slate-50 pt-3">
        <div className="flex justify-between items-center mb-2">
          <h5 className="text-[8px] font-black text-slate-400 uppercase">Editorial Notes</h5>
          <button onClick={addNote} className="text-[8px] font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase">+ Add Note</button>
        </div>
        <div className="space-y-2">
          {entry.notes.map(note => (
            <div key={note.id} className="flex gap-2 items-start bg-slate-50/50 p-2 rounded-lg border border-slate-100">
              <select value={note.type} onChange={e => updateNote(note.id, { type: e.target.value })} className="text-[9px] font-bold uppercase bg-white border border-slate-200 p-0.5 rounded outline-none w-24">
                {NOTE_TYPES.map(t => <option key={t.id} value={t.id}>{t.id}</option>)}
              </select>
              <input type="text" value={note.resp} onChange={e => updateNote(note.id, { resp: e.target.value })} className="w-10 text-[9px] font-bold text-center border border-slate-200 rounded py-0.5" placeholder="Resp" />
              <textarea value={note.text} onChange={e => updateNote(note.id, { text: e.target.value })} className="flex-1 text-[10px] bg-white border border-slate-200 rounded px-1.5 py-0.5 outline-none resize-none h-6" placeholder="Observation..." />
              <button onClick={() => removeNote(note.id)} className="text-slate-300 hover:text-red-500"><i className="fa-solid fa-xmark text-xs"></i></button>
            </div>
          ))}
          {entry.notes.length === 0 && <p className="text-[10px] text-slate-300 italic">No notes.</p>}
        </div>
      </div>
    </div>
  );
};

export default EntryItem;