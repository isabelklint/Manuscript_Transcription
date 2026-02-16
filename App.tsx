import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Metadata, TranscriptionEntry, TranscriptionState, NOTE_TYPES } from './types';
import MetadataForm from './components/MetadataForm';
import EntryItem from './components/EntryItem';
import XMLPreview from './components/XMLPreview';

const INITIAL_METADATA: Metadata = {
  title_orig: 'Vocabulario en Ydioma Mazateco',
  title_norm: 'Cuaderno de idioma mazateco comenzado en el año de 1796',
  title_gloss: 'Booklet of Mazatec language begun in the year 1796',
  title_note: 'comenzado en el año de 1796',
  author: 'Ygnacio Arrona',
  editor: 'Isabel Klint',
  affiliation: 'Lancaster University / ILV A.C.',
  pub_date: '2026-01',
  settlement: 'Charlottesville',
  institution: 'University of Virginia',
  repository: 'Special Collections',
  shelfmark: 'UVA MSS 01784',
  collection: 'Gates Collection, 941 Manuscript',
  summary: 'Bilingual Mazatec-Spanish vocabulary list, compiled for missionary or linguistic purposes.',
  orig_date: '1796',
  orig_place: 'Oaxaca, Mexico',
  pb_n: '1',
  image_source: '000032278_0001.jpg',
  phys_extent: '18 pages, 4to',
  phys_layout: 'Double column',
  hand_note: 'Single hand, late 18th century',
  project_desc: 'Transcription prepared for Lancaster University PGCERT in Corpus Linguistics.',
  filename_keyword: 'vocabulario'
};

const createNewEntry = (lastEntry?: TranscriptionEntry): TranscriptionEntry => {
  let nextLine = '1';
  if (lastEntry) {
    const parts = lastEntry.line.split('.');
    if (parts.length === 2) {
      nextLine = `${parseInt(parts[0]) + 1}.${parts[1]}`;
    } else {
      nextLine = `${parseInt(parts[0]) + 1}`;
    }
  }
  return {
    id: crypto.randomUUID(),
    layout: lastEntry?.layout || 'col1',
    line: nextLine,
    old_maz: '',
    new_maz: '',
    uncertain_maz: false,
    old_spa: '',
    new_spa: '',
    uncertain_spa: false,
    eng_gloss: '',
    uncertain_eng: false,
    notes: [],
  };
};

const App: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  
  const [state, setState] = useState<TranscriptionState>(() => {
    const saved = localStorage.getItem('tei_p5_v8_state');
    if (saved) return JSON.parse(saved);
    return { metadata: INITIAL_METADATA, entries: [createNewEntry()] };
  });

  useEffect(() => {
    localStorage.setItem('tei_p5_v8_state', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (importSuccess) {
      const timer = setTimeout(() => setImportSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [importSuccess]);

  const updateMetadata = (field: keyof Metadata, value: string) => {
    setState(prev => ({ ...prev, metadata: { ...prev.metadata, [field]: value } }));
  };

  const updateEntry = (id: string, updates: Partial<TranscriptionEntry>) => {
    setState(prev => ({
      ...prev,
      entries: prev.entries.map(e => e.id === id ? { ...e, ...updates } : e)
    }));
  };

  const addEntry = () => {
    const last = state.entries[state.entries.length - 1];
    setState(prev => ({ ...prev, entries: [...prev.entries, createNewEntry(last)] }));
  };

  const removeEntry = (id: string) => {
    if (state.entries.length <= 1) return;
    setState(prev => ({ ...prev, entries: prev.entries.filter(e => e.id !== id) }));
  };

  const exportFileName = useMemo(() => {
    const sanitize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // 1. Author (Last name)
    const authorParts = state.metadata.author.trim().split(/\s+/);
    const author = sanitize(authorParts[authorParts.length - 1] || 'unknown');
    
    // 2. Keyword (Priority to dedicated field)
    const keyword = sanitize(state.metadata.filename_keyword || state.metadata.title_orig.split(/\s+/)[0] || 'keyword');
    
    // 3. Date (Year)
    const yearMatch = state.metadata.orig_date.match(/\d{4}/);
    const date = yearMatch ? yearMatch[0] : 'date';
    
    // 4. Page
    const page = `p${state.metadata.pb_n || '0'}`;
    
    return `${author}_${keyword}_${date}_${page}.xml`;
  }, [state.metadata]);

  const generatedXML = useMemo(() => {
    const { metadata, entries } = state;
    const cert = (u: boolean) => u ? ' certain="no"' : '';

    const renderEntry = (e: TranscriptionEntry) => {
      const entryIdx = entries.indexOf(e) + 1;
      const eid = `p1e${entryIdx.toString().padStart(3, '0')}`;
      let xml = `          <entry xml:id="${eid}">\n`;
      xml += `            <form type="lemma">\n`;
      xml += `              <orth type="orig" xml:lang="maz"${cert(e.uncertain_maz)}>${e.old_maz}</orth>\n`;
      xml += `              <orth type="norm" xml:lang="maz">${e.new_maz}</orth>\n`;
      xml += `            </form>\n`;

      if (e.variant) {
        xml += `            <form type="variant">\n`;
        xml += `              <usg type="textual" xml:lang="lat">${e.variant.usg}</usg>\n`;
        xml += `              <orth type="orig" xml:lang="maz">${e.variant.orig}</orth>\n`;
        xml += `              <orth type="norm" xml:lang="maz">${e.variant.norm}</orth>\n`;
        xml += `            </form>\n`;
      }

      xml += `            <sense>\n`;
      xml += `              <def type="orig" xml:lang="spa"${cert(e.uncertain_spa)}>${e.old_spa}</def>\n`;
      xml += `              <def type="norm" xml:lang="spa">${e.new_spa}</def>\n`;
      xml += `              <def type="gloss" xml:lang="eng"${cert(e.uncertain_eng)}>${e.eng_gloss}</def>\n`;
      xml += `            </sense>\n`;
      
      e.notes.forEach(n => {
        const typeAttr = n.type && n.type !== 'none' ? ` type="${n.type}"` : '';
        xml += `            <note${typeAttr} resp="#${n.resp}">${n.text}</note>\n`;
      });
      
      xml += `            <lb n="${e.line}"/>\n`;
      xml += `          </entry>\n`;
      return xml;
    };

    const renderColumn = (layoutType: 'col1' | 'col2', n: string) => {
      const filtered = entries.filter(e => e.layout === layoutType);
      if (filtered.length === 0) return `        <div type="column" n="${n}"></div>`;
      return `        <div type="column" n="${n}">\n${filtered.map(renderEntry).join('\n')}\n        </div>`;
    };

    return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-model href="http://www.tei-c.org/release/xml/tei/custom/schema/relaxng/tei_all.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <teiHeader>
    <fileDesc>
      <titleStmt>
        <title>${metadata.title_orig}</title>
        <author><persName>${metadata.author}</persName></author>
        <editor><persName>${metadata.editor}</persName><affiliation>${metadata.affiliation}</affiliation></editor>
      </titleStmt>
      <editionStmt>
        <edition>First TEI P5 digital edition, <date when="${metadata.pub_date}">${metadata.pub_date}</date></edition>
      </editionStmt>
      <publicationStmt>
        <publisher>${metadata.editor}</publisher>
        <availability><p>For academic use.</p></availability>
      </publicationStmt>
      <sourceDesc>
        <msDesc>
          <msIdentifier>
            <settlement>${metadata.settlement}</settlement>
            <institution>${metadata.institution}</institution>
            <repository>${metadata.repository}</repository>
            <idno type="shelfmark">${metadata.shelfmark}</idno>
            <altIdentifier type="collection"><idno>${metadata.collection}</idno></altIdentifier>
          </msIdentifier>
          <msContents>
            <msItem><title>${metadata.title_orig}</title><note>${metadata.title_note}</note></msItem>
            <summary>${metadata.summary}</summary>
            <textLang mainLang="maz" otherLangs="spa lat eng">maz</textLang>
          </msContents>
          <physDesc>
            <objectDesc form="codex"><supportDesc><extent>${metadata.phys_extent}</extent></supportDesc><layoutDesc><layout columns="2">${metadata.phys_layout}</layout></layoutDesc></objectDesc>
            <handDesc><handNote>${metadata.hand_note}</handNote></handDesc>
          </physDesc>
          <history><origin><origDate>begun ${metadata.orig_date}</origDate><origPlace>${metadata.orig_place}</origPlace></origin></history>
        </msDesc>
      </sourceDesc>
    </fileDesc>
    <encodingDesc>
      <projectDesc><p>${metadata.project_desc}</p></projectDesc>
    </encodingDesc>
  </teiHeader>
  <text>
    <body>
      <div type="vocabulary">
        <pb n="${metadata.pb_n}" facs="${metadata.image_source}"/>
        <head>
          <title type="orig" xml:lang="spa">${metadata.title_orig}</title>
          <title type="norm" xml:lang="spa">${metadata.title_norm}</title>
          <title type="gloss" xml:lang="eng">${metadata.title_gloss}</title>
        </head>
${entries.filter(e => e.layout === 'across').map(renderEntry).join('\n')}
        <!-- COLUMN 1 -->
${renderColumn('col1', '1')}
        <!-- COLUMN 2 -->
${renderColumn('col2', '2')}
      </div>
    </body>
  </text>
</TEI>`;
  }, [state]);

  const parseEntryContent = (content: string, layout: 'col1' | 'col2' | 'across'): TranscriptionEntry => {
    const old_maz = content.match(/<orth type="orig" xml:lang="maz"[^>]*?>(.*?)<\/orth>/i)?.[1] || '';
    const new_maz = content.match(/<orth type="norm" xml:lang="maz"[^>]*?>(.*?)<\/orth>/i)?.[1] || '';
    const unc_maz = /<orth type="orig"[^>]*?certain="no"/i.test(content);
    
    let variant: any = undefined;
    const variantMatch = content.match(/<form type="variant">[\s\S]*?<usg[^>]*?>(.*?)<\/usg>[\s\S]*?<orth type="orig"[^>]*?>(.*?)<\/orth>[\s\S]*?<orth type="norm"[^>]*?>(.*?)<\/orth>/i);
    if (variantMatch) {
      variant = { id: crypto.randomUUID(), usg: variantMatch[1], orig: variantMatch[2], norm: variantMatch[3] };
    } else {
      const legacyVariantMatch = content.match(/<form type="variant">[\s\S]*?<abbr[^>]*?>(.*?)<\/abbr>[\s\S]*?<orth type="orig"[^>]*?>(.*?)<\/orth>[\s\S]*?<orth type="norm"[^>]*?>(.*?)<\/orth>/i);
      if (legacyVariantMatch) {
         variant = { id: crypto.randomUUID(), usg: legacyVariantMatch[1], orig: legacyVariantMatch[2], norm: legacyVariantMatch[3] };
      }
    }

    const old_spa = content.match(/<def type="orig" xml:lang="spa"[^>]*?>(.*?)<\/def>/i)?.[1] || '';
    const new_spa = content.match(/<def type="norm" xml:lang="spa"[^>]*?>(.*?)<\/def>/i)?.[1] || '';
    const unc_spa = /<def type="orig"[^>]*?certain="no"/i.test(content);
    const eng_gloss = content.match(/<def type="gloss" xml:lang="eng"[^>]*?>(.*?)<\/def>/i)?.[1] || '';
    const unc_eng = /<def type="gloss"[^>]*?certain="no"/i.test(content);
    const line = content.match(/<lb n="(.*?)"/i)?.[1] || '';
    
    const notes: any[] = [];
    const noteRegex = /<note(.*?) resp="#(.*?)">(.*?)<\/note>/gi;
    let nMatch;
    while ((nMatch = noteRegex.exec(content)) !== null) {
      const typeMatch = nMatch[1].match(/type="(.*?)"/i);
      notes.push({ 
        id: crypto.randomUUID(), 
        type: typeMatch ? typeMatch[1] : 'editorial', 
        resp: nMatch[2], 
        text: nMatch[3] 
      });
    }
    
    return { 
      id: crypto.randomUUID(), 
      layout, 
      line, 
      old_maz, 
      new_maz, 
      uncertain_maz: unc_maz, 
      old_spa, 
      new_spa, 
      uncertain_spa: unc_spa, 
      eng_gloss, 
      uncertain_eng: unc_eng, 
      variant, 
      notes
    };
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const xml = e.target?.result as string;
      try {
        const metadata: Metadata = {
          title_orig: xml.match(/<titleStmt>[\s\S]*?<title>(.*?)<\/title>/i)?.[1] || INITIAL_METADATA.title_orig,
          title_norm: xml.match(/<title type="norm".*?>(.*?)<\/title>/i)?.[1] || INITIAL_METADATA.title_norm,
          title_gloss: xml.match(/<title type="gloss".*?>(.*?)<\/title>/i)?.[1] || INITIAL_METADATA.title_gloss,
          title_note: xml.match(/<msItem>[\s\S]*?<note>(.*?)<\/note>/i)?.[1] || INITIAL_METADATA.title_note,
          author: xml.match(/<author><persName>(.*?)<\/persName>/i)?.[1] || INITIAL_METADATA.author,
          editor: xml.match(/<editor>[\s\S]*?<persName>(.*?)<\/persName>/i)?.[1] || INITIAL_METADATA.editor,
          affiliation: xml.match(/<affiliation>(.*?)<\/affiliation>/i)?.[1] || INITIAL_METADATA.affiliation,
          pub_date: xml.match(/<date when="(.*?)">/i)?.[1] || INITIAL_METADATA.pub_date,
          settlement: xml.match(/<settlement>(.*?)<\/settlement>/i)?.[1] || INITIAL_METADATA.settlement,
          institution: xml.match(/<institution>(.*?)<\/institution>/i)?.[1] || INITIAL_METADATA.institution,
          repository: xml.match(/<repository>(.*?)<\/repository>/i)?.[1] || INITIAL_METADATA.repository,
          shelfmark: xml.match(/<idno type="shelfmark">(.*?)<\/idno>/i)?.[1] || INITIAL_METADATA.shelfmark,
          collection: xml.match(/<altIdentifier type="collection"><idno>(.*?)<\/idno>/i)?.[1] || INITIAL_METADATA.collection,
          summary: xml.match(/<summary>(.*?)<\/summary>/i)?.[1] || INITIAL_METADATA.summary,
          orig_date: xml.match(/<origDate.*?>(.*?)<\/origDate>/i)?.[1]?.replace('begun ', '') || INITIAL_METADATA.orig_date,
          orig_place: xml.match(/<origPlace>(.*?)<\/origPlace>/i)?.[1] || INITIAL_METADATA.orig_place,
          pb_n: xml.match(/<pb n="(.*?)"/i)?.[1] || INITIAL_METADATA.pb_n,
          image_source: xml.match(/facs="(.*?)"/i)?.[1] || INITIAL_METADATA.image_source,
          phys_extent: xml.match(/<extent>(.*?)<\/extent>/i)?.[1] || INITIAL_METADATA.phys_extent,
          phys_layout: xml.match(/<layout.*?> (.*?)<\/layout>/i)?.[1] || INITIAL_METADATA.phys_layout,
          hand_note: xml.match(/<handNote>(.*?)<\/handNote>/i)?.[1] || INITIAL_METADATA.hand_note,
          project_desc: xml.match(/<projectDesc><p>(.*?)<\/p>/i)?.[1] || INITIAL_METADATA.project_desc,
          filename_keyword: INITIAL_METADATA.filename_keyword
        };

        const entries: TranscriptionEntry[] = [];
        const entryRegex = /<entry xml:id=".*?">([\s\S]*?)<\/entry>/gis;
        const vocabularyBody = xml.split(/<div type="vocabulary">/i)[1]?.split(/<\/body>/i)[0] || '';
        const acrossContent = vocabularyBody.split(/<div type="column"/i)[0];
        
        let acrossMatch;
        entryRegex.lastIndex = 0;
        while ((acrossMatch = entryRegex.exec(acrossContent)) !== null) {
          entries.push(parseEntryContent(acrossMatch[1], 'across'));
        }
        
        const colRegex = /<div type="column" n="(1|2)">([\s\S]*?)<\/div>/gis;
        let colMatch;
        while ((colMatch = colRegex.exec(xml)) !== null) {
          const colLayout = colMatch[1] === '1' ? 'col1' : 'col2';
          const colContent = colMatch[2];
          let eMatch;
          entryRegex.lastIndex = 0; 
          while ((eMatch = entryRegex.exec(colContent)) !== null) {
            entries.push(parseEntryContent(eMatch[1], colLayout));
          }
        }
        setState({ metadata, entries: entries.length ? entries : [createNewEntry()] });
        setImportSuccess(true);
      } catch (err) { console.error(err); alert("Import failed."); }
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
    if (file && file.name.endsWith('.xml')) processFile(file);
  };

  return (
    <div 
      className={`flex h-screen overflow-hidden bg-slate-100 transition-colors ${isDragging ? 'bg-blue-50' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
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

      <div className="flex-1 flex flex-col min-w-0 bg-white shadow-2xl">
        <header className="p-4 border-b flex justify-between items-center bg-white z-10 shrink-0">
          <div>
             <h1 className="text-xl font-black tracking-tight text-slate-800 uppercase">TEI <span className="text-blue-600">Manuscript</span> Workspace</h1>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <i className="fa-solid fa-feather-pointed text-blue-400"></i>
               Lancaster University • Isabel Klint
             </p>
          </div>
          <div className="flex gap-4">
             <button onClick={() => confirm('Clear current workspace and start new?') && setState({ metadata: INITIAL_METADATA, entries: [createNewEntry()] })} className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase hover:text-red-500 transition-colors">Clear All</button>
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
                    onDuplicate={() => {
                      const idx = state.entries.findIndex(e => e.id === entry.id);
                      const copy = { ...entry, id: crypto.randomUUID(), line: (parseFloat(entry.line) + 1).toFixed(1) };
                      const news = [...state.entries]; news.splice(idx + 1, 0, copy);
                      setState(p => ({ ...p, entries: news }));
                    }}
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

      <aside className="w-[520px] bg-[#1a1c23] flex flex-col shrink-0 border-l border-slate-800">
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#1a1c23]">
           <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                TEI P5 Real-time Preview
              </span>
              <span className="text-[9px] font-bold text-blue-400/60 mt-0.5 font-mono truncate">{exportFileName}</span>
           </div>
           <div className="flex gap-2">
              <button onClick={() => {
                const blob = new Blob([generatedXML], { type: 'text/xml' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = exportFileName; a.click();
              }} className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-blue-500 shadow-xl shadow-blue-900/40 transition-transform active:scale-95 whitespace-nowrap">Download XML</button>
           </div>
        </div>
        <XMLPreview content={generatedXML} />
      </aside>
    </div>
  );
};

export default App;