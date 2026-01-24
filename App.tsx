
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Metadata, TranscriptionEntry, TranscriptionState, NOTE_TYPES, GENRE_OPTIONS } from './types';
import MetadataForm from './components/MetadataForm';
import EntryItem from './components/EntryItem';
import XMLPreview from './components/XMLPreview';

const INITIAL_METADATA: Metadata = {
  docName: 'Unnamed Manuscript',
  date: 'c.1830s',
  genre: GENRE_OPTIONS[0],
  author: 'Ygnacio Arrona',
  source: 'at UVA: UVA MSS 01784, From: Gates collection, 941 Manuscript',
};

const createNewEntry = (lastEntry?: TranscriptionEntry): TranscriptionEntry => ({
  id: crypto.randomUUID(),
  page: lastEntry?.page || '000000000_0000',
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
    const saved = localStorage.getItem('transcription_data_v3');
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
    localStorage.setItem('transcription_data_v3', JSON.stringify(state));
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
      line: (parseFloat(entryToDuplicate.line) + 0.1).toFixed(1)
    };
    const newEntries = [...state.entries];
    newEntries.splice(entryIndex + 1, 0, newEntry);
    setState(prev => ({ ...prev, entries: newEntries }));
  };

  const generatedXML = useMemo(() => {
    const { metadata, entries } = state;
    
    let xml = `<encodingDesc>\n  <classDecl>\n    <taxonomy xml:id="noteTypes">\n`;
    NOTE_TYPES.forEach(nt => {
      xml += `      <category xml:id="${nt.id}"><catDesc>${nt.desc}</catDesc></category>\n`;
    });
    xml += `    </taxonomy>\n  </classDecl>\n</encodingDesc>\n\n`;

    xml += `<title>${metadata.docName}</title>\n`;
    xml += `<date>${metadata.date}</date>\n`;
    xml += `<genre>${metadata.genre}</genre>\n`;
    xml += `<author>${metadata.author}</author>\n`;
    xml += `<source>${metadata.source}</source>\n\n`;

    entries.forEach(entry => {
      let lineXml = `<page=${entry.page} line=${entry.line}>`;
      lineXml += `<old_maz>${entry.old_maz}</old_maz>`;
      
      if (entry.new_maz) {
        lineXml += ` <new_maz>${entry.new_maz}</new_maz>`;
      }

      if (entry.ipa) {
        lineXml += `<ipa>${entry.ipa}</ipa>`;
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

      if (entry.kirk_set) {
        lineXml += `<kirk_set>${entry.kirk_set}</kirk_set>`;
      }

      entry.notes.forEach(note => {
        if (note.text) {
          const respAttr = note.resp ? ` resp="${note.resp.startsWith('#') ? note.resp : '#' + note.resp}"` : '';
          lineXml += `<note type="${note.type}"${respAttr}>${note.text}</note>`;
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
    a.download = `${state.metadata.docName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedXML);
    alert('Copied to clipboard!');
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      setState({
        metadata: INITIAL_METADATA,
        entries: [createNewEntry()],
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel: Input Forms */}
      <div className="flex-1 p-6 lg:p-10 overflow-y-auto bg-white border-r border-slate-200">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Manuscript Transcription</h1>
            <p className="text-slate-500 mt-1">Linguistic encoding tool with categorized metadata.</p>
          </div>
          <button 
            onClick={handleClear}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors flex items-center gap-2"
          >
            <i className="fa-solid fa-trash-can"></i> Clear All
          </button>
        </header>

        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">1</div>
            <h2 className="text-xl font-semibold text-slate-800">Document Metadata</h2>
          </div>
          <MetadataForm metadata={state.metadata} onChange={updateMetadata} />
        </section>

        <section className="mb-20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">2</div>
              <h2 className="text-xl font-semibold text-slate-800">Entries</h2>
            </div>
            <button
              onClick={addEntry}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-md shadow-blue-100"
            >
              <i className="fa-solid fa-plus"></i> Add Entry
            </button>
          </div>

          <div className="space-y-6">
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

          <div className="mt-8 flex justify-center">
            <button
              onClick={addEntry}
              className="flex items-center gap-2 px-8 py-3 border-2 border-dashed border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-500 rounded-xl font-medium transition-all"
            >
              <i className="fa-solid fa-plus"></i> Append New Line
            </button>
          </div>
        </section>
      </div>

      {/* Right Panel: XML Preview */}
      <div className="lg:w-[450px] xl:w-[600px] h-screen lg:sticky lg:top-0 bg-slate-900 flex flex-col">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-slate-200 font-semibold flex items-center gap-2">
            <i className="fa-solid fa-code text-blue-400"></i> Live XML Preview
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors"
            >
              <i className="fa-solid fa-copy mr-1.5"></i> Copy
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors"
            >
              <i className="fa-solid fa-download mr-1.5"></i> Download
            </button>
          </div>
        </div>
        <XMLPreview content={generatedXML} />
      </div>
    </div>
  );
};

export default App;
