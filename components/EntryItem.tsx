import React from 'react';
import { TranscriptionEntry, NoteEntry, NOTE_TYPES, KirkSet, DaughterWord } from '../types';
import { generateId } from '../utils';

interface Props {
  entry: TranscriptionEntry;
  index: number;
  onUpdate: (updates: Partial<TranscriptionEntry>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

const UncertainBox = ({ label, active, onChange }: { label: string, active: boolean, onChange: (v: boolean) => void }) => (
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

const EntryItem: React.FC<Props> = ({ entry, index, onUpdate, onRemove, onDuplicate }) => {
  const addNote = () => onUpdate({ notes: [...entry.notes, { id: generateId(), type: 'editorial', resp: 'IK', text: '' }] });
  const updateNote = (id: string, u: Partial<NoteEntry>) => onUpdate({ notes: entry.notes.map(n => n.id === id ? { ...n, ...u } : n) });
  const removeNote = (id: string) => onUpdate({ notes: entry.notes.filter(n => n.id !== id) });

  const toggleVariant = () => {
    onUpdate({ variant: entry.variant ? undefined : { id: generateId(), usg: 'v.l.', orig: '', norm: '' } });
  };

  const addKirkSet = () => {
    const newSet: KirkSet = {
      id: generateId(),
      number: '',
      protoForm: '',
      page: '',
      daughters: []
    };
    onUpdate({ kirk_sets: [...entry.kirk_sets, newSet] });
  };

  const updateKirkSet = (id: string, u: Partial<KirkSet>) => {
    onUpdate({ kirk_sets: entry.kirk_sets.map(ks => ks.id === id ? { ...ks, ...u } : ks) });
  };

  const removeKirkSet = (id: string) => {
    onUpdate({ kirk_sets: entry.kirk_sets.filter(ks => ks.id !== id) });
  };

  const addDaughter = (ksId: string) => {
    const targetSet = entry.kirk_sets.find(ks => ks.id === ksId);
    if (targetSet) {
      updateKirkSet(ksId, { daughters: [...targetSet.daughters, { id: generateId(), text: '', matches: false }] });
    }
  };

  const updateDaughter = (ksId: string, dId: string, u: Partial<DaughterWord>) => {
    const targetSet = entry.kirk_sets.find(ks => ks.id === ksId);
    if (targetSet) {
      updateKirkSet(ksId, { 
        daughters: targetSet.daughters.map(d => d.id === dId ? { ...d, ...u } : d) 
      });
    }
  };

  const removeDaughter = (ksId: string, dId: string) => {
    const targetSet = entry.kirk_sets.find(ks => ks.id === ksId);
    if (targetSet) {
      updateKirkSet(ksId, { 
        daughters: targetSet.daughters.filter(d => d.id !== dId) 
      });
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all relative">
      <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 bg-slate-800 text-white rounded-full flex items-center justify-center text-[10px] font-black">{index + 1}</div>
          <div className="flex bg-white border border-slate-200 rounded-lg p-0.5">
             {(['across', 'col1', 'col2'] as const).map(l => (
               <button
                 key={l}
                 onClick={() => onUpdate({ layout: l })}
                 className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${entry.layout === l ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
               >
                 {l === 'across' ? 'Across' : l.toUpperCase()}
               </button>
             ))}
          </div>
          <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
             <span className="text-[9px] font-black text-slate-400 uppercase">LB N=</span>
             <input 
               type="text" 
               value={entry.line} 
               onChange={e => onUpdate({ line: e.target.value })} 
               className="w-16 text-[10px] font-black text-center border-b border-slate-200 focus:border-blue-500 outline-none"
             />
          </div>
        </div>
        <div className="flex gap-2 text-xs">
           <button onClick={onDuplicate} title="Duplicate Entry" className="text-slate-300 hover:text-blue-500 p-1"><i className="fa-solid fa-clone"></i></button>
           <button onClick={onRemove} title="Delete Entry" className="text-slate-300 hover:text-red-500 p-1"><i className="fa-solid fa-trash"></i></button>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4 space-y-4">
          <div className="flex justify-between items-center">
             <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Mazatec (Orth)</h4>
             <UncertainBox label="Uncertain" active={entry.uncertain_maz} onChange={v => onUpdate({ uncertain_maz: v })} />
          </div>
          
          <div className="space-y-3">
             <div className="space-y-1">
                <label className="text-[8px] font-bold text-slate-400 uppercase">Original (Orig)</label>
                <input 
                  type="text" 
                  value={entry.old_maz} 
                  onChange={e => onUpdate({ old_maz: e.target.value })} 
                  className="w-full px-3 py-1.5 border border-slate-100 bg-slate-50/50 rounded text-sm font-medium focus:bg-white focus:border-blue-300 outline-none"
                />
             </div>
             <div className="space-y-1">
                <label className="text-[8px] font-bold text-slate-400 uppercase">Normalized (Norm)</label>
                <input 
                  type="text" 
                  value={entry.new_maz} 
                  onChange={e => onUpdate({ new_maz: e.target.value })} 
                  className="w-full px-3 py-1.5 border border-slate-100 rounded text-sm outline-none focus:border-blue-200"
                />
             </div>

             <div className="pt-2">
                <button 
                  onClick={toggleVariant}
                  className={`text-[9px] font-black uppercase px-2 py-1 rounded border transition-colors ${entry.variant ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                >
                  {entry.variant ? 'Remove Variant' : '+ Add Variant (vel)'}
                </button>
                
                {entry.variant && (
                  <div className="mt-3 p-3 bg-amber-50/30 border border-amber-100 rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-bold text-amber-600 uppercase italic">Label:</span>
                      <input 
                        type="text" 
                        value={entry.variant.usg} 
                        onChange={e => onUpdate({ variant: { ...entry.variant!, usg: e.target.value } })}
                        className="w-12 text-[9px] bg-white border border-amber-200 rounded px-1 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">Variant Orig</label>
                      <input 
                        type="text" 
                        value={entry.variant.orig} 
                        onChange={e => onUpdate({ variant: { ...entry.variant!, orig: e.target.value } })}
                        className="w-full text-xs px-2 py-1 bg-white border border-amber-200 rounded focus:outline-none"
                      />
                    </div>
                  </div>
                )}
             </div>
          </div>
        </div>

        <div className="md:col-span-4 space-y-4">
          <div className="flex justify-between items-center">
             <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Spanish (Def)</h4>
             <UncertainBox label="Uncertain" active={entry.uncertain_spa} onChange={v => onUpdate({ uncertain_spa: v })} />
          </div>
          <div className="space-y-3">
             <div className="space-y-1">
                <label className="text-[8px] font-bold text-slate-400 uppercase">Original Manuscript Def</label>
                <input 
                  type="text" 
                  value={entry.old_spa} 
                  onChange={e => onUpdate({ old_spa: e.target.value })} 
                  className="w-full px-3 py-1.5 border border-slate-100 bg-slate-50/50 rounded text-sm focus:bg-white outline-none"
                />
             </div>
             <div className="space-y-1">
                <label className="text-[8px] font-bold text-slate-400 uppercase">Modern Normalization</label>
                <input 
                  type="text" 
                  value={entry.new_spa} 
                  onChange={e => onUpdate({ new_spa: e.target.value })} 
                  className="w-full px-3 py-1.5 border border-slate-100 rounded text-sm outline-none focus:border-emerald-200"
                />
             </div>
          </div>
        </div>

        <div className="md:col-span-4 space-y-4">
          <div className="flex justify-between items-center">
             <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Analysis</h4>
             <UncertainBox label="Uncertain" active={entry.uncertain_eng} onChange={v => onUpdate({ uncertain_eng: v })} />
          </div>
          <div className="space-y-3">
             <div className="space-y-1">
                <label className="text-[8px] font-bold text-slate-400 uppercase">English Gloss</label>
                <input 
                  type="text" 
                  value={entry.eng_gloss} 
                  onChange={e => onUpdate({ eng_gloss: e.target.value })} 
                  className="w-full px-3 py-1.5 border border-slate-100 bg-purple-50/10 rounded text-sm outline-none focus:border-purple-300"
                />
             </div>
             
             <div className="space-y-1">
                <label className="text-[8px] font-bold text-slate-400 uppercase">IPA Transcription</label>
                <input 
                  type="text" 
                  value={entry.ipa || ''} 
                  onChange={e => onUpdate({ ipa: e.target.value })} 
                  className="w-full text-xs px-2 py-1.5 border border-slate-100 rounded font-mono focus:outline-none focus:border-purple-300" 
                  placeholder="/.../"
                />
             </div>

             <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-[8px] font-black text-purple-600 uppercase tracking-widest">Kirk Sets</h5>
                  <button 
                    onClick={addKirkSet}
                    className="text-[9px] font-black uppercase text-purple-600 hover:underline"
                  >
                    + Add New Set
                  </button>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {entry.kirk_sets.map((ks) => (
                    <div key={ks.id} className="p-3 bg-purple-50/50 border border-purple-200 rounded-lg space-y-4 relative group/kirk">
                      <button 
                        onClick={() => removeKirkSet(ks.id)}
                        className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover/kirk:opacity-100 transition-opacity"
                      >
                        <i className="fa-solid fa-trash-can text-[10px]"></i>
                      </button>
                      
                      <div className="grid grid-cols-2 gap-2 pr-6">
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-purple-600 uppercase">Set #</label>
                          <input 
                            type="text" 
                            value={ks.number} 
                            onChange={e => updateKirkSet(ks.id, { number: e.target.value })}
                            className="w-full text-[10px] px-2 py-1 bg-white border border-purple-200 rounded focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-purple-600 uppercase">Kirk Page</label>
                          <input 
                            type="text" 
                            value={ks.page} 
                            onChange={e => updateKirkSet(ks.id, { page: e.target.value })}
                            className="w-full text-[10px] px-2 py-1 bg-white border border-purple-200 rounded focus:outline-none"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-purple-600 uppercase">Proto-Form (Headword)</label>
                        <input 
                          type="text" 
                          value={ks.protoForm} 
                          onChange={e => updateKirkSet(ks.id, { protoForm: e.target.value })}
                          className="w-full text-xs font-bold px-2 py-1 bg-white border border-purple-200 rounded focus:outline-none"
                          placeholder="*proto"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[8px] font-bold text-slate-500 uppercase">Daughter Forms</label>
                          <button onClick={() => addDaughter(ks.id)} className="text-[8px] font-black text-purple-600 uppercase hover:underline">+ Add</button>
                        </div>
                        <div className="space-y-1">
                          {ks.daughters.map(d => (
                            <div key={d.id} className="flex items-center gap-1.5 bg-white p-1 rounded border border-purple-100">
                               <button 
                                 onClick={() => updateDaughter(ks.id, d.id, { matches: !d.matches })}
                                 className={`w-4 h-4 rounded-sm flex items-center justify-center transition-colors ${d.matches ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300'}`}
                               >
                                 <i className="fa-solid fa-check text-[8px]"></i>
                               </button>
                               <input 
                                 type="text" 
                                 value={d.text} 
                                 onChange={e => updateDaughter(ks.id, d.id, { text: e.target.value })}
                                 className="flex-1 text-[10px] outline-none"
                               />
                               <button onClick={() => removeDaughter(ks.id, d.id)} className="text-slate-200 hover:text-red-400">
                                 <i className="fa-solid fa-times text-[10px]"></i>
                               </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {entry.kirk_sets.length === 0 && (
                    <div className="text-center py-4 border border-dashed border-slate-200 rounded-lg">
                      <p className="text-[10px] font-bold text-slate-400 uppercase italic">No Kirk Sets Added</p>
                    </div>
                  )}
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="px-5 pb-4 border-t border-slate-50 pt-3 flex flex-col gap-6">
        <div>
          <div className="flex justify-between items-center mb-2">
             <h5 className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <i className="fa-solid fa-comment-dots text-slate-300"></i>
               Editorial Observations
             </h5>
             <button onClick={addNote} className="text-[9px] font-bold text-blue-500 uppercase">+ Add Observation</button>
          </div>
          <div className="space-y-2">
            {entry.notes.map(note => (
              <div key={note.id} className="flex gap-2 items-start bg-slate-50/50 p-2 rounded-lg border border-slate-100 group">
                <select 
                  value={note.type} 
                  onChange={e => {
                    if (e.target.value === 'none') {
                      removeNote(note.id);
                    } else {
                      updateNote(note.id, { type: e.target.value });
                    }
                  }} 
                  className="text-[9px] font-bold bg-white border border-slate-200 px-1 py-1 rounded outline-none w-36 shadow-sm focus:border-blue-400"
                >
                  {NOTE_TYPES.map(t => (
                    <option key={t.id} value={t.id} className={t.id === 'none' ? 'text-red-500' : ''}>
                      {t.desc}
                    </option>
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
    </div>
  );
};

export default EntryItem;
