import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Metadata, TranscriptionEntry, TranscriptionState } from './types';
import { generateId } from './utils';
import { INITIAL_METADATA } from './constants';
import { generateXML, generateExportFilename } from './xmlGenerator';
import { parseXML } from './xmlImporter';
import MetadataForm from './components/MetadataForm';
import EntryItem from './components/EntryItem';
import XMLPreview from './components/XMLPreview';

// ─── State helpers ────────────────────────────────────────────────────────────

const createNewEntry = (lastEntry?: TranscriptionEntry): TranscriptionEntry => {
  let nextLine = '1';
  if (lastEntry) {
    const parts = lastEntry.line.split('.');
    nextLine = parts.length === 2
      ? `${parseInt(parts[0]) + 1}.${parts[1]}`
      : `${parseInt(parts[0]) + 1}`;
  }
  return {
    id: generateId(),
    layout: lastEntry?.layout ?? 'col1',
    line: nextLine,
    old_maz: '', new_maz: '', uncertain_maz: false,
    old_spa: '', new_spa: '', uncertain_spa: false,
    eng_gloss: '', uncertain_eng: false,
    kirk_sets: [], notes: [],
  };
};

const loadInitialState = (): TranscriptionState => {
  try {
    const saved = localStorage.getItem('tei_p5_v8_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.entries)) {
        const validatedEntries = parsed.entries.map((e: any) => {
          let kirk_sets = Array.isArray(e.kirk_sets) ? e.kirk_sets : [];
          // Migration: old single kirk_set → array
          if (e.kirk_set && kirk_sets.length === 0) {
            kirk_sets = [{ ...e.kirk_set, id: e.kirk_set.id || generateId() }];
          }
          return { ...e, id: e.id || generateId(), kirk_sets, notes: Array.isArray(e.notes) ? e.notes : [] };
        });
        return { ...parsed, entries: validatedEntries };
      }
    }
  } catch (err) {
    console.error('Failed to load state from localStorage:', err);
  }
  return { metadata: INITIAL_METADATA, entries: [createNewEntry()] };
};

// ─── App ──────────────────────────────────────────────────────────────────────

const App: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging]     = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [state, setState]               = useState<TranscriptionState>(loadInitialState);

  useEffect(() => {
    try { localStorage.setItem('tei_p5_v8_state', JSON.stringify(state)); }
    catch (e) { console.error('Failed to save state to localStorage:', e); }
  }, [state]);

  useEffect(() => {
    if (!importSuccess) return;
    const t = setTimeout(() => setImportSuccess(false), 3000);
    return () => clearTimeout(t);
  }, [importSuccess]);

  // ── Updaters ───────────────────────────────────────────────────────────────

  const updateMetadata = (field: keyof Metadata, value: string) =>
    setState(prev => ({ ...prev, metadata: { ...prev.metadata, [field]: value } }));

  const updateEntry = (id: string, updates: Partial<TranscriptionEntry>) =>
    setState(prev => ({
      ...prev,
      entries: prev.entries.map(e => e.id === id ? { ...e, ...updates } : e),
    }));

  const addEntry = () => {
    const last = state.entries[state.entries.length - 1];
    setState(prev => ({ ...prev, entries: [...prev.entries, createNewEntry(last)] }));
  };

  const removeEntry = (id: string) => {
    if (state.entries.length <= 1) return;
    setState(prev => ({ ...prev, entries: prev.entries.filter(e => e.id !== id) }));
  };

  const duplicateEntry = (id: string) => {
    setState(prev => {
      const idx = prev.entries.findIndex(e => e.id === id);
      if (idx === -1) return prev;
      const src = prev.entries[idx];
      const copy: TranscriptionEntry = {
        ...src,
        id: generateId(),
        line: (parseFloat(src.line) + 1).toFixed(1),
      };
      const next = [...prev.entries];
      next.splice(idx + 1, 0, copy);
      return { ...prev, entries: next };
    });
  };

  const clearAll = () => {
    if (confirm('Clear current workspace and start new?')) {
      setState({ metadata: INITIAL_METADATA, entries: [createNewEntry()] });
    }
  };

  // ── Import ─────────────────────────────────────────────────────────────────

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const xml = e.target?.result as string;
      try {
        const parsed = parseXML(xml);
        setState({
          ...parsed,
          entries: parsed.entries.length ? parsed.entries : [createNewEntry()],
        });
        setImportSuccess(true);
      } catch (err) {
        console.error(err);
        alert('Import failed.');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith('.xml')) processFile(file);
  };

  // ── Derived values ─────────────────────────────────────────────────────────

  const generatedXML   = useMemo(() => generateXML(state),                    [state]);
  const exportFileName = useMemo(() => generateExportFilename(state.metadata), [state.metadata]);

  const downloadXML = () => {
    const blob = new Blob([generatedXML], { type: 'text/xml' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = exportFileName; a.click();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className={`flex h-screen overflow-hidden bg-slate-100 transition-colors ${isDragging ? 'bg-blue-50' : ''}`}
      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input type="file" ref={fileInputRef} onChange={handleImport} accept=".xml" className="hidden" />

      {importSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-bounce">
          <i className="fa-solid fa-circle-check"></i>
          <span className="text-xs font-black uppercase tracking-widest">Transcription Imported Successfully</span>
        </div>
      )}

      {isDragging && (
        <div className="fixed inset-0 z-50 bg-blue-600/20 backdrop-blur-sm border-4 border-dashed border-blue-500 flex items-center justify-center pointer-events-none">
          <div className="bg-white p-10 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
            <i className="fa-solid fa-file-import text-5xl text-blue-500 animate-bounce"></i>
            <span className="text-xl font-black text-slate-800 uppercase tracking-tighter">Drop XML to Resume Work</span>
          </div>
        </div>
      )}

      {/* ── Left panel: form ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white shadow-2xl">
        <header className="p-4 border-b flex justify-between items-center bg-white z-10 shrink-0">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-800 uppercase">
              TEI <span className="text-blue-600">Manuscript</span> Workspace
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <i className="fa-solid fa-feather-pointed text-blue-400"></i>
              Lancaster University • Isabel Klint
            </p>
          </div>
          <div className="flex gap-4">
            <button onClick={clearAll} className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase hover:text-red-500 transition-colors">Clear All</button>
            <button onClick={() => fileInputRef.current?.click()} className="px-4 py-1.5 bg-slate-100 text-slate-700 text-[10px] font-black uppercase rounded-lg hover:bg-slate-200 transition-all">Open XML</button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-12 space-y-12 bg-slate-50/30">
          <section className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-px bg-slate-200"></span>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">01 Manuscript Identity</h3>
              <span className="flex-1 h-px bg-slate-200"></span>
            </div>
            <MetadataForm metadata={state.metadata} onChange={updateMetadata} />
          </section>

          <section className="max-w-6xl mx-auto space-y-8 pb-32">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-px bg-slate-200"></span>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">02 Transcription Flow</h3>
              <span className="flex-1 h-px bg-slate-200"></span>
            </div>
            <div className="grid gap-6">
              {state.entries.map((entry, index) => (
                <EntryItem
                  key={entry.id}
                  entry={entry}
                  index={index}
                  onUpdate={u => updateEntry(entry.id, u)}
                  onRemove={() => removeEntry(entry.id)}
                  onDuplicate={() => duplicateEntry(entry.id)}
                />
              ))}
            </div>

            <button onClick={addEntry} className="w-full py-16 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-300 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all group">
              <div className="w-12 h-12 rounded-full border-2 border-slate-200 flex items-center justify-center group-hover:border-blue-400 transition-colors">
                <i className="fa-solid fa-plus text-xl group-hover:scale-110 transition-transform"></i>
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest">New Transcription Record</span>
            </button>
          </section>
        </main>
      </div>

      {/* ── Right panel: XML preview ── */}
      <aside className="w-[520px] bg-[#1a1c23] flex flex-col shrink-0 border-l border-slate-800">
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#1a1c23]">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              TEI P5 Real-time Preview
            </span>
            <span className="text-[9px] font-bold text-blue-400/60 mt-0.5 font-mono truncate">{exportFileName}</span>
          </div>
          <button onClick={downloadXML} className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-blue-500 shadow-xl shadow-blue-900/40 transition-transform active:scale-95 whitespace-nowrap">
            Download XML
          </button>
        </div>
        <XMLPreview content={generatedXML} />
      </aside>
    </div>
  );
};

export default App;
