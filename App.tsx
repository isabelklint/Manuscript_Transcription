import React, { useState, useMemo, useEffect } from 'react';
import { Metadata, TranscriptionEntry, TranscriptionState } from './types';
import MetadataForm from './components/MetadataForm';
import EntryItem from './components/EntryItem';
import XMLPreview from './components/XMLPreview';

const INITIAL_METADATA: Metadata = {
  docName: 'Unnamed Manuscript',
  date: 'c.1830s',
  genre: 'accounts',
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
    const saved = localStorage.getItem('transcription_data_v7');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load saved data", e);
      }
    }
    return {
      metadata: INITIAL_METADATA,
      entries: [createNewEntry()],
    };
  });

  useEffect(() => {
    localStorage.setItem('transcription_data_v7', JSON.stringify(state));
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
      // User format: <page=ID line=NUM><old_maz>...</old_maz> <new_maz>...</new_maz><old_spa>...</old_spa>...
      let lineXml = `<page=${entry.page} line=${entry.line}>`;
      
      lineXml += `<old_maz>${entry.old_maz}</old_maz>`;
      
      if (entry.new_maz) {
        lineXml += ` <new_maz>${entry.new_maz}</new_maz>`;
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

      // Analytical notes go OUTSIDE the page tag per requested format
      entry.notes.forEach(note => {
        if (note.text) {
          lineXml += `<note>${note.text}</note>`;
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
    a.download = `transcription_${new Date().toISOString().split('T')[0]}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedXML);
    alert('Copied to clipboard!');
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all data?')) {
      setState({
        metadata: INITIAL_METADATA,
        entries: [createNewEntry()],
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      <div className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto bg-white border-r border-slate-200">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Manuscript Transcriber</h1>
            <p className="text-slate-500 mt-1 font-medium">Linguistic XML generation without manual tags.</p>
          </div>
          <button 
            onClick={handleClear}
            className="px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 border border-red-100 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-eraser"></i> Reset Data
          </button>
        </header>

        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-100">
              <i className="fa-solid fa-file-invoice"></i>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">1. Document Metadata</h2>
          </div>
          <MetadataForm metadata={state.metadata} onChange={updateMetadata} />
        </section>

        <section className="mb-24">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-100">
                <i className="fa-solid fa-list-check"></i>
              </div>
              <h2 className="text-2xl font-bold text-slate-800">2. Transcription Entries</h2>
            </div>
            <button
              onClick={addEntry}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg"
            >
              <i className="fa-solid fa-plus"></i> Add Entry
            </button>
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

          <div className="mt-12 flex justify-center">
            <button
              onClick={addEntry}
              className="group flex flex-col items-center gap-3 px-12 py-8 border-2 border-dashed border-slate-200 text-slate-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 rounded-2xl transition-all w-full"
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                <i className="fa-solid fa-plus text-xl"></i>
              </div>
              <span className="font-bold tracking-wide">CLICK TO ADD NEXT LINE</span>
            </button>
          </div>
        </section>
      </div>

      <div className="lg:w-[500px] xl:w-[650px] h-screen lg:sticky lg:top-0 bg-[#0f172a] flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.1)]">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#0f172a]/80 backdrop-blur-xl z-10">
          <h3 className="text-white font-bold flex items-center gap-3">
            <i className="fa-solid fa-terminal text-blue-400"></i> Output XML
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="px-4 py-2 text-xs font-bold bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all border border-white/10"
            >
              Copy
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all"
            >
              Download .xml
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <XMLPreview content={generatedXML} />
        </div>
      </div>
    </div>
  );
};

export default App;