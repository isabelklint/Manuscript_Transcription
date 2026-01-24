
import React from 'react';
import { TranscriptionEntry, OldSpaEntry, NoteEntry, NOTE_TYPES } from '../types';

interface EntryItemProps {
  entry: TranscriptionEntry;
  index: number;
  onUpdate: (updates: Partial<TranscriptionEntry>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

const EntryItem: React.FC<EntryItemProps> = ({ entry, index, onUpdate, onRemove, onDuplicate }) => {
  const updateSpa = (id: string, text: string, note?: string) => {
    const newOldSpa = entry.old_spa.map(item => 
      item.id === id ? { ...item, text, note } : item
    );
    onUpdate({ old_spa: newOldSpa });
  };

  const addSpa = () => {
    onUpdate({ 
      old_spa: [...entry.old_spa, { id: crypto.randomUUID(), text: '', note: '' }] 
    });
  };

  const removeSpa = (id: string) => {
    if (entry.old_spa.length <= 1) return;
    onUpdate({ old_spa: entry.old_spa.filter(item => item.id !== id) });
  };

  const addNote = () => {
    onUpdate({
      notes: [...entry.notes, { id: crypto.randomUUID(), type: 'editorial', resp: 'IK', text: '' }]
    });
  };

  const updateNote = (id: string, updates: Partial<NoteEntry>) => {
    onUpdate({
      notes: entry.notes.map(n => n.id === id ? { ...n, ...updates } : n)
    });
  };

  const removeNote = (id: string) => {
    onUpdate({
      notes: entry.notes.filter(n => n.id !== id)
    });
  };

  return (
    <div className="group relative bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all p-5">
      {/* Index Badge & Actions */}
      <div className="absolute -left-3 top-4 w-7 h-7 bg-slate-800 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg ring-4 ring-white">
        {index + 1}
      </div>
      
      <div className="flex justify-end gap-2 mb-4">
        <button onClick={onDuplicate} title="Duplicate Entry" className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors">
          <i className="fa-solid fa-clone"></i>
        </button>
        <button onClick={onRemove} title="Delete Entry" className="p-1.5 text-slate-400 hover:text-red-600 transition-colors">
          <i className="fa-solid fa-trash"></i>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Locators & Meta */}
        <div className="md:col-span-2 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Page</label>
            <input
              type="text"
              value={entry.page}
              onChange={(e) => onUpdate({ page: e.target.value })}
              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Line</label>
            <input
              type="text"
              value={entry.line}
              onChange={(e) => onUpdate({ line: e.target.value })}
              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-orange-600 uppercase">Kirk Set</label>
            <input
              type="text"
              value={entry.kirk_set || ''}
              onChange={(e) => onUpdate({ kirk_set: e.target.value })}
              className="w-full px-2 py-1.5 border border-orange-100 bg-orange-50/30 rounded text-sm focus:ring-1 focus:ring-orange-400 outline-none"
              placeholder="e.g. 460"
            />
          </div>
        </div>

        {/* Linguistic Fields */}
        <div className="md:col-span-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-blue-600 uppercase">Old Mazatec</label>
              <input
                type="text"
                value={entry.old_maz}
                onChange={(e) => onUpdate({ old_maz: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. Cham"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-blue-400 uppercase">New Mazatec</label>
              <input
                type="text"
                value={entry.new_maz || ''}
                onChange={(e) => onUpdate({ new_maz: e.target.value })}
                className="w-full px-3 py-2 border border-slate-100 bg-slate-50 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                placeholder="Modern spelling"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-cyan-600 uppercase flex items-center gap-1">
              <i className="fa-solid fa-ear-listen text-[8px]"></i> IPA
            </label>
            <input
              type="text"
              value={entry.ipa || ''}
              onChange={(e) => onUpdate({ ipa: e.target.value })}
              className="w-full px-3 py-2 border border-cyan-100 bg-cyan-50/20 rounded-lg text-sm font-mono focus:ring-2 focus:ring-cyan-500 outline-none"
              placeholder="e.g. [se˦˨]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-purple-600 uppercase">Eng. Gloss</label>
            <input
              type="text"
              value={entry.eng_gloss || ''}
              onChange={(e) => onUpdate({ eng_gloss: e.target.value })}
              className="w-full px-3 py-2 border border-purple-100 bg-purple-50/20 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="English translation"
            />
          </div>
        </div>

        {/* Spanish terms */}
        <div className="md:col-span-5 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-emerald-600 uppercase">Spanish Glosses (Historical)</label>
              <button onClick={addSpa} className="text-[10px] font-bold text-blue-500 hover:text-blue-700 uppercase">
                + Add Term
              </button>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
              {entry.old_spa.map((spa) => (
                <div key={spa.id} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      value={spa.text}
                      onChange={(e) => updateSpa(spa.id, e.target.value, spa.note)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                      placeholder="Spanish term"
                    />
                    <input
                      type="text"
                      value={spa.note || ''}
                      onChange={(e) => updateSpa(spa.id, spa.text, e.target.value)}
                      className="w-full px-2 py-0.5 text-[10px] bg-amber-50 border border-amber-100 rounded italic focus:outline-none"
                      placeholder="Note (e.g. crossed out)"
                    />
                  </div>
                  {entry.old_spa.length > 1 && (
                    <button onClick={() => removeSpa(spa.id)} className="p-1 text-slate-300 hover:text-red-500">
                      <i className="fa-solid fa-xmark text-xs"></i>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-emerald-400 uppercase">Modern Spanish Translation</label>
            <input
              type="text"
              value={entry.new_spa || ''}
              onChange={(e) => onUpdate({ new_spa: e.target.value })}
              className="w-full px-3 py-2 border border-slate-100 bg-slate-50 rounded-lg text-sm focus:ring-2 focus:ring-emerald-200 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Complex Categorized Notes */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Observations & Analytical Notes</label>
          <button 
            onClick={addNote}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-[10px] font-bold transition-colors"
          >
            <i className="fa-solid fa-comment-medical text-slate-400"></i> ADD NOTE
          </button>
        </div>
        
        {entry.notes.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            No specific analytical notes added yet.
          </p>
        ) : (
          <div className="space-y-3">
            {entry.notes.map((note) => (
              <div key={note.id} className="flex gap-3 items-start bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                <div className="w-32 flex-shrink-0">
                  <select
                    value={note.type}
                    onChange={(e) => updateNote(note.id, { type: e.target.value })}
                    className="w-full text-[10px] font-bold bg-white border border-slate-200 rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {NOTE_TYPES.map(t => (
                      <option key={t.id} value={t.id}>{t.id.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div className="w-16 flex-shrink-0">
                  <input
                    type="text"
                    value={note.resp}
                    onChange={(e) => updateNote(note.id, { resp: e.target.value })}
                    className="w-full text-[10px] font-bold text-center bg-white border border-slate-200 rounded px-1 py-1 focus:outline-none"
                    placeholder="Resp."
                  />
                </div>
                <div className="flex-1">
                  <textarea
                    value={note.text}
                    onChange={(e) => updateNote(note.id, { text: e.target.value })}
                    rows={1}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none resize-none overflow-hidden"
                    placeholder="Enter observation..."
                  />
                </div>
                <button 
                  onClick={() => removeNote(note.id)}
                  className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <i className="fa-solid fa-xmark text-xs"></i>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EntryItem;
