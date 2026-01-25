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
    const saved = localStorage.getItem('manuscript_editor_state_v1');
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
    localStorage.setItem('manuscript_editor_state_v1', JSON.stringify(state));
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
      line: (parseFloat(entryToDuplicate.line) + 1.0).toFixed(1)
    };
    const newEntries = [...state.entries];
    newEntries.splice(entryIndex + 1, 0, newEntry);
    setState(prev => ({ ...prev, entries: newEntries }));
  };

  const generatedXML = useMemo(() => {
    const { metadata, entries } = state;
    let xml = '';

    // Metadata Block
    xml += `<date>${metadata.date}</date>\n`;
    xml += `<genre>${metadata.genre}</genre>\n`;
    xml += `<author>${metadata.author}</author>\n`;
    xml += `<source>${metadata.source}</source>\n\n`;

    // Entries
    entries.forEach(entry => {
      // Custom format: <page=ID line=NUM>
      let lineXml = `<page=${entry.page} line=${entry.line}>`;
      
      lineXml += `<old_maz>${entry.old_maz}</old_maz>`;
      
      if (entry.new_maz) {
        lineXml += ` <new_maz>${entry.new_maz}</new_maz>`;
      }

      if (entry.ipa) {
        lineXml += ` <ipa>${entry.ipa}</ipa>`;
      }

      if (entry.kirk_set) {
        lineXml += ` <kirk_set>${entry.kirk_set}</kirk_set>`;
      }

      entry.old_spa.forEach(spa => {
        if (spa.text) {
          const noteAttr = spa.note ? ` note='${spa.note}'` : '';
          lineXml += `<old_spa${noteAttr}>${spa.text}</old_spa>`;
        }
      });

      if (entry.new_spa) {
        lineXml += `<new_spa>${entry.new_spa}</new_spa>`;
      }

      if (entry.eng_gloss) {
        lineXml += `<eng_gloss>${entry.eng_gloss}</eng_gloss>`;
      }

      lineXml += `</page>`;

      // Notes go outside the page tag
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
    const fileName = state.metadata.docName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    a.download = `${fileName || 'transcription'}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedXML);
    alert('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      {/* Editor Side */}
      <div className="flex-1 p-6 lg:p-12 overflow-y-auto bg-white border-r border-slate-200">
        <header className="mb-10 flex justify-between items-center border-b border-slate-100 pb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Manuscript Editor</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Linguistic Transcription Suite</p>
          </div>
          <button 
            onClick={() => confirm('Clear all data?') && setState({ metadata: INITIAL_METADATA, entries: [createNewEntry()] })}
            className="text-[10px] font-black text-red-500 uppercase px-3 py-2 hover:bg-red-50 rounded-lg transition-colors"
          >
            Clear All
          </button>
        </header>

        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] bg-blue-50 px-2 py-1 rounded">01. Metadata</h2>
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
            className="w-full mt-12 py-10 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <i className="fa-solid fa-plus text-sm"></i>
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest">Add New Transcription Line</span>
          </button>
        </section>
      </div>

      {/* Preview Side */}
      <aside className="w-full lg:w-[480px] bg-slate-900 flex flex-col h-screen sticky top-0 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/90 backdrop-blur shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Generated XML</h2>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleCopy}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Copy
            </button>
            <button 
              onClick={handleDownload}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/40"
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