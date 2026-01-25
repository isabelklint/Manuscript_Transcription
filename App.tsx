import React, { useState, useMemo, useEffect } from 'react';
import { Metadata, TranscriptionEntry, TranscriptionState } from './types';
import MetadataForm from './components/MetadataForm';
import EntryItem from './components/EntryItem';
import XMLPreview from './components/XMLPreview';

const INITIAL_METADATA: Metadata = {
  docName: 'Unnamed Manuscript',
  date: 'c.1830s',
  genre: 'Vocabularios (Dictionaries/Word Lists)',
  author: 'Ygnacio Arrona',
  source: 'at UVA: UVA MSS 01784, From: Gates collection, 941 Manuscript',
};

const createNewEntry = (lastEntry?: TranscriptionEntry): TranscriptionEntry => ({
  id: crypto.randomUUID(),
  page: lastEntry?.page || '000032278_0004',
  line: lastEntry ? (parseFloat(lastEntry.line) + 1).toFixed(1) : '1.1',
  old_maz: '',
  new_maz: '',
  ipa: '',
  kirk_set: '',
  old_spa: [{ id: crypto.randomUUID(), text: '', note: '' }],
  new_spa: '',
  eng_gloss: '',
  notes: [],
});

const App: React.FC = () => {
  const [state, setState] = useState<TranscriptionState>(() => {
    // Unique key to avoid collisions with previous broken states
    const STORAGE_KEY = 'transcriber_v1.0.3_state';
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load state", e);
      }
    }
    return {
      metadata: INITIAL_METADATA,
      entries: [createNewEntry()],
    };
  });

  useEffect(() => {
    localStorage.setItem('transcriber_v1.0.3_state', JSON.stringify(state));
  }, [state]);

  const updateMetadata = (field: keyof Metadata, value: string) => {
    setState(prev => ({
      ...prev,
      metadata: { ...prev.metadata, [field]: value }
    }));
  };

  const updateEntry = (id: string, updates: Partial<TranscriptionEntry>) => {
    setState(prev => ({
      ...prev,
      entries: prev.entries.map(e => e.id === id ? { ...e, ...updates } : e)
    }));
  };

  const addEntry = () => {
    const lastEntry = state.entries[state.entries.length - 1];
    setState(prev => ({
      ...prev,
      entries: [...prev.entries, createNewEntry(lastEntry)]
    }));
  };

  const removeEntry = (id: string) => {
    if (state.entries.length <= 1) return;
    setState(prev => ({
      ...prev,
      entries: prev.entries.filter(e => e.id !== id)
    }));
  };

  const duplicateEntry = (id: string) => {
    const entryIndex = state.entries.findIndex(e => e.id === id);
    if (entryIndex === -1) return;
    const entryToDuplicate = state.entries[entryIndex];
    const newEntry = { 
      ...entryToDuplicate, 
      id: crypto.randomUUID(),
      // Automatically increment line number for common workflow
      line: (parseFloat(entryToDuplicate.line) + 1.0).toFixed(1)
    };
    const newEntries = [...state.entries];
    newEntries.splice(entryIndex + 1, 0, newEntry);
    setState(prev => ({ ...prev, entries: newEntries }));
  };

  const generatedXML = useMemo(() => {
    const { metadata, entries } = state;
    let xml = '';

    // Metadata Header
    xml += `<date>${metadata.date}</date>\n`;
    xml += `<genre>${metadata.genre}</genre>\n`;
    xml += `<author>${metadata.author}</author>\n`;
    xml += `<source>${metadata.source}</source>\n\n`;

    // Entries
    entries.forEach(entry => {
      // Primary tag: <page=ID line=NUM>
      let lineXml = `<page=${entry.page} line=${entry.line}>`;
      
      // Core fields
      lineXml += `<old_maz>${entry.old_maz}</old_maz>`;
      
      if (entry.new_maz) lineXml += ` <new_maz>${entry.new_maz}</new_maz>`;
      if (entry.ipa) lineXml += ` <ipa>${entry.ipa}</ipa>`;
      if (entry.kirk_set) lineXml += ` <kirk_set>${entry.kirk_set}</kirk_set>`;

      // Historical Spanish entries
      entry.old_spa.forEach(spa => {
        if (spa.text) {
          const noteAttr = spa.note ? ` note='${spa.note}'` : '';
          lineXml += `<old_spa${noteAttr}>${spa.text}</old_spa>`;
        }
      });

      // Modern translations
      if (entry.new_spa) lineXml += `<new_spa>${entry.new_spa}</new_spa>`;
      if (entry.eng_gloss) lineXml += `<eng_gloss>${entry.eng_gloss}</eng_gloss>`;

      lineXml += `</page>`;

      // Analytical Notes (outside the page tag per requirements)
      entry.notes.forEach(note => {
        if (note.text) {
          lineXml += `<note type='${note.type}' resp='${note.resp}'>${note.text}</note>`;
        }
      });

      xml += lineXml + '\n';
    });

    return xml.trim();
  }, [state]);

  const handleDownload = () => {
    const blob = new Blob([generatedXML], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = state.metadata.docName.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'manuscript';
    a.download = `${safeName}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedXML);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 overflow-hidden h-screen">
      {/* Scrollable Editor Area */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-12 bg-white">
        <header className="mb-10 flex justify-between items-center border-b border-slate-100 pb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Manuscript Transcriber</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Linguistic XML Workspace</p>
          </div>
          <button 
            onClick={() => confirm('Clear all data and reset session?') && setState({ metadata: INITIAL_METADATA, entries: [createNewEntry()] })}
            className="text-[10px] font-black text-red-500 uppercase px-3 py-2 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
          >
            Reset
          </button>
        </header>

        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] bg-blue-50 px-2 py-1 rounded">01. Document Metadata</h2>
          </div>
          <MetadataForm metadata={state.metadata} onChange={updateMetadata} />
        </section>

        <section className="mb-24">
          <div className="flex items-center gap-2 mb-8">
            <h2 className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 px-2 py-1 rounded">02. Transcription Entries</h2>
          </div>
          
          <div className="space-y-8">
            {state.entries.map((entry, index) => (
              <EntryItem
                key={entry.id}
                entry={entry}
                index={index}
                onUpdate={(updates) => updateEntry(entry.id, updates)}
                onRemove={() => removeEntry(entry.id)}
                onDuplicate={() => duplicateEntry(entry.id)}
              />
            ))}
          </div>

          <button
            onClick={addEntry}
            className="w-full mt-12 py-12 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 transition-all group shadow-sm"
          >
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors shadow-inner">
              <i className="fa-solid fa-plus text-sm"></i>
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest">Add Next Line</span>
          </button>
        </section>
      </div>

      {/* Persistent Code View Sidebar */}
      <aside className="w-full lg:w-[500px] bg-[#0f172a] flex flex-col h-screen shadow-2xl z-20">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#0f172a]/95 backdrop-blur shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live XML Output</h2>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleCopy} 
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
            >
              Copy
            </button>
            <button 
              onClick={handleDownload} 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/40 active:scale-95"
            >
              Download
            </button>
          </div>
        </div>
        <XMLPreview content={generatedXML} />
      </aside>
    </div>
  );
};

export default App;