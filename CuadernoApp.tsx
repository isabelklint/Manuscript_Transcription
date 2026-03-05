import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PhraseEntry, PhraseMetadata, PhraseState, NoteEntry, NOTE_TYPES } from './types';
import { generateId } from './utils';
import PhraseItem from './components/PhraseItem';
import PhraseMetadataForm from './components/PhraseMetadataForm';
import XMLPreview from './components/XMLPreview';

const INITIAL_METADATA: PhraseMetadata = {
  title_orig: 'Cuaderno de frases en Ydioma Mazateco',
  title_norm: 'Cuaderno de frases mazatecas del año de 1827',
  title_gloss: 'Booklet of Mazatec phrases from the year 1827',
  title_note: 'del año de 1827',
  author: 'Anónimo',
  editor: 'Isabel Klint',
  affiliation: 'Lancaster University / ILV A.C.',
  pub_date: '2026-01',
  settlement: 'Charlottesville',
  institution: 'University of Virginia',
  repository: 'Special Collections',
  shelfmark: 'UVA MSS 01784',
  collection: 'Gates Collection, 941 Manuscript',
  summary: 'Single-column Mazatec phrase list with Spanish equivalents, likely compiled for missionary use.',
  orig_date: '1827',
  orig_place: 'Oaxaca, Mexico',
  pb_n: '1',
  image_source: '000032278_0002.jpg',
  phys_extent: '12 pages, 4to',
  phys_layout: 'Single column',
  hand_note: 'Single hand, early 19th century',
  project_desc: 'Transcription prepared for Lancaster University PGCERT in Corpus Linguistics.',
  filename_keyword: 'cuaderno'
};

const createNewEntry = (lastEntry?: PhraseEntry): PhraseEntry => {
  let nextLine = '1';
  if (lastEntry) {
    nextLine = `${parseInt(lastEntry.line || '0') + 1}`;
  }
  return {
    id: generateId(),
    line: nextLine,
    orig_spa: '',
    new_spa: '',
    orig_maz: '',
    new_maz: '',
    eng_gloss: '',
    uncertain_spa: false,
    uncertain_maz: false,
    uncertain_eng: false,
    category: 'other',
    notes: [],
  };
};

const CuadernoApp: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  const [state, setState] = useState<PhraseState>(() => {
    try {
      const saved = localStorage.getItem('tei_cuaderno_1827_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.entries)) {
          const validatedEntries = parsed.entries.map((e: any) => ({
            ...e,
            id: e.id || generateId(),
            notes: Array.isArray(e.notes) ? e.notes : [],
          }));
          return { ...parsed, entries: validatedEntries };
        }
      }
    } catch (err) {
      console.error("Failed to load Cuaderno state:", err);
    }
    return { metadata: INITIAL_METADATA, entries: [createNewEntry()] };
  });

  useEffect(() => {
    try {
      localStorage.setItem('tei_cuaderno_1827_state', JSON.stringify(state));
    } catch (e) {
      console.error("Failed to save Cuaderno state:", e);
    }
  }, [state]);

  useEffect(() => {
    if (importSuccess) {
      const timer = setTimeout(() => setImportSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [importSuccess]);

  const updateMetadata = (field: keyof PhraseMetadata, value: string) => {
    setState(prev => ({ ...prev, metadata: { ...prev.metadata, [field]: value } }));
  };

  const updateEntry = (id: string, updates: Partial<PhraseEntry>) => {
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
    const authorParts = state.metadata.author.trim().split(/\s+/);
    const author = sanitize(authorParts[authorParts.length - 1] || 'anon');
    const keyword = sanitize(state.metadata.filename_keyword || 'cuaderno');
    const yearMatch = state.metadata.orig_date.match(/\d{4}/);
    const date = yearMatch ? yearMatch[0] : 'date';
    const page = `p${state.metadata.pb_n || '0'}`;
    return `${author}_${keyword}_${date}_${page}.xml`;
  }, [state.metadata]);

  const generatedXML = useMemo(() => {
    const { metadata, entries } = state;
    const cert = (u: boolean) => u ? ' certain="no"' : '';

    const renderEntry = (e: PhraseEntry, idx: number) => {
      const eid = `p1ph${(idx + 1).toString().padStart(3, '0')}`;
      let xml = `          <item xml:id="${eid}" ana="${e.category}">\n`;
      xml += `            <seg type="phrase">\n`;
      xml += `              <s type="orig" xml:lang="spa"${cert(e.uncertain_spa)}>${e.orig_spa}</s>\n`;
      xml += `              <s type="norm" xml:lang="spa">${e.new_spa}</s>\n`;
      xml += `            </seg>\n`;
      xml += `            <seg type="response">\n`;
      xml += `              <s type="orig" xml:lang="maz"${cert(e.uncertain_maz)}>${e.orig_maz}</s>\n`;
      xml += `              <s type="norm" xml:lang="maz">${e.new_maz}</s>\n`;
      xml += `            </seg>\n`;
      if (e.eng_gloss) {
        xml += `            <gloss xml:lang="eng"${cert(e.uncertain_eng)}>${e.eng_gloss}</gloss>\n`;
      }
      e.notes.forEach(n => {
        const typeAttr = n.type && n.type !== 'none' ? ` type="${n.type}"` : '';
        xml += `            <note${typeAttr} resp="#${n.resp}">${n.text}</note>\n`;
      });
      xml += `            <lb n="${e.line}"/>\n`;
      xml += `          </item>\n`;
      return xml;
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
            <textLang mainLang="maz" otherLangs="spa eng">maz</textLang>
          </msContents>
          <physDesc>
            <objectDesc form="codex"><supportDesc><extent>${metadata.phys_extent}</extent></supportDesc><layoutDesc><layout columns="1">${metadata.phys_layout}</layout></layoutDesc></objectDesc>
            <handDesc><handNote>${metadata.hand_note}</handNote></handDesc>
          </physDesc>
          <history><origin><origDate>${metadata.orig_date}</origDate><origPlace>${metadata.orig_place}</origPlace></origin></history>
        </msDesc>
      </sourceDesc>
    </fileDesc>
    <encodingDesc>
      <projectDesc><p>${metadata.project_desc}</p></projectDesc>
    </encodingDesc>
  </teiHeader>
  <text>
    <body>
      <div type="phrasebook">
        <pb n="${metadata.pb_n}" facs="${metadata.image_source}"/>
        <head>
          <title type="orig" xml:lang="spa">${metadata.title_orig}</title>
          <title type="norm" xml:lang="spa">${metadata.title_norm}</title>
          <title type="gloss" xml:lang="eng">${metadata.title_gloss}</title>
        </head>
        <list type="phrases">
${entries.map((e, i) => renderEntry(e, i)).join('\n')}
        </list>
      </div>
    </body>
  </text>
</TEI>`;
  }, [state]);

  const parsePhraseEntry = (content: string): PhraseEntry => {
    const orig_spa = content.match(/<s type="orig" xml:lang="spa"[^>]*?>(.*?)<\/s>/i)?.[1] || '';
    const new_spa = content.match(/<s type="norm" xml:lang="spa"[^>]*?>(.*?)<\/s>/i)?.[1] || '';
    const orig_maz = content.match(/<s type="orig" xml:lang="maz"[^>]*?>(.*?)<\/s>/i)?.[1] || '';
    const new_maz = content.match(/<s type="norm" xml:lang="maz"[^>]*?>(.*?)<\/s>/i)?.[1] || '';
    const eng_gloss = content.match(/<gloss xml:lang="eng"[^>]*?>(.*?)<\/gloss>/i)?.[1] || '';
    const uncertain_spa = /<s type="orig" xml:lang="spa"[^>]*?certain="no"/i.test(content);
    const uncertain_maz = /<s type="orig" xml:lang="maz"[^>]*?certain="no"/i.test(content);
    const uncertain_eng = /<gloss[^>]*?certain="no"/i.test(content);
    const line = content.match(/<lb n="(.*?)"/i)?.[1] || '';
    const category = content.match(/ana="(.*?)"/i)?.[1] || 'other';

    const notes: NoteEntry[] = [];
    const noteRegex = /<note(.*?) resp="#(.*?)">(.*?)<\/note>/gi;
    let nMatch;
    while ((nMatch = noteRegex.exec(content)) !== null) {
      const typeMatch = nMatch[1].match(/type="(.*?)"/i);
      notes.push({
        id: generateId(),
        type: typeMatch ? typeMatch[1] : 'editorial',
        resp: nMatch[2],
        text: nMatch[3]
      });
    }

    return { id: generateId(), line, orig_spa, new_spa, orig_maz, new_maz, eng_gloss, uncertain_spa, uncertain_maz, uncertain_eng, category, notes };
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const xml = e.target?.result as string;
      try {
        const metadata: PhraseMetadata = {
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
          orig_date: xml.match(/<origDate.*?>(.*?)<\/origDate>/i)?.[1] || INITIAL_METADATA.orig_date,
          orig_place: xml.match(/<origPlace>(.*?)<\/origPlace>/i)?.[1] || INITIAL_METADATA.orig_place,
          pb_n: xml.match(/<pb n="(.*?)"/i)?.[1] || INITIAL_METADATA.pb_n,
          image_source: xml.match(/facs="(.*?)"/i)?.[1] || INITIAL_METADATA.image_source,
          phys_extent: xml.match(/<extent>(.*?)<\/extent>/i)?.[1] || INITIAL_METADATA.phys_extent,
          phys_layout: xml.match(/<layout.*?>(.*?)<\/layout>/i)?.[1] || INITIAL_METADATA.phys_layout,
          hand_note: xml.match(/<handNote>(.*?)<\/handNote>/i)?.[1] || INITIAL_METADATA.hand_note,
          project_desc: xml.match(/<projectDesc><p>(.*?)<\/p>/i)?.[1] || INITIAL_METADATA.project_desc,
          filename_keyword: INITIAL_METADATA.filename_keyword
        };

        const entries: PhraseEntry[] = [];
        const itemRegex = /<item xml:id=".*?"([\s\S]*?)<\/item>/gis;
        let iMatch;
        while ((iMatch = itemRegex.exec(xml)) !== null) {
          entries.push(parsePhraseEntry(iMatch[0]));
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
      className={`flex h-full overflow-hidden bg-rose-50/20 transition-colors ${isDragging ? 'bg-rose-50' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input type="file" ref={fileInputRef} onChange={handleImport} accept=".xml" className="hidden" />

      {importSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-rose-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-bounce">
          <i className="fa-solid fa-circle-check"></i>
          <span className="text-xs font-black uppercase tracking-widest">Phrase List Imported Successfully</span>
        </div>
      )}

      {isDragging && (
        <div className="fixed inset-0 z-50 bg-rose-600/20 backdrop-blur-sm border-4 border-dashed border-rose-500 flex items-center justify-center pointer-events-none">
          <div className="bg-white p-10 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
            <i className="fa-solid fa-file-import text-5xl text-rose-500 animate-bounce"></i>
            <span className="text-xl font-black text-slate-800 uppercase tracking-tighter">Drop XML to Resume Work</span>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 bg-white shadow-2xl">
        <header className="p-4 border-b flex justify-between items-center bg-white z-10 shrink-0">
          <div>
            <h2 className="text-base font-black tracking-tight text-slate-800 uppercase">Cuaderno <span className="text-rose-600">1827</span> — Phrase List</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <i className="fa-solid fa-list text-rose-400"></i>
              Single-column Mazatec-Spanish phrasebook
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
            <PhraseMetadataForm metadata={state.metadata} onChange={updateMetadata} />
          </section>

          <section className="max-w-6xl mx-auto space-y-8 pb-32">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-px bg-slate-200"></span>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">02 Phrase List</h3>
              <span className="flex-1 h-px bg-slate-200"></span>
            </div>
            <div className="grid gap-4">
              {state.entries.map((entry, index) => (
                <PhraseItem
                  key={entry.id}
                  entry={entry}
                  index={index}
                  onUpdate={u => updateEntry(entry.id, u)}
                  onRemove={() => removeEntry(entry.id)}
                  onDuplicate={() => {
                    const idx = state.entries.findIndex(e => e.id === entry.id);
                    const copy = { ...entry, id: generateId(), line: `${parseInt(entry.line) + 1}` };
                    const news = [...state.entries]; news.splice(idx + 1, 0, copy);
                    setState(p => ({ ...p, entries: news }));
                  }}
                />
              ))}
            </div>

            <button onClick={addEntry} className="w-full py-12 border-2 border-dashed border-rose-100 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-300 hover:border-rose-400 hover:text-rose-500 hover:bg-rose-50 transition-all group">
              <div className="w-12 h-12 rounded-full border-2 border-slate-200 flex items-center justify-center group-hover:border-rose-400 transition-colors">
                <i className="fa-solid fa-plus text-xl group-hover:scale-110 transition-transform"></i>
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest">New Phrase Entry</span>
            </button>
          </section>
        </main>
      </div>

      <aside className="w-[520px] bg-[#1a1c23] flex flex-col shrink-0 border-l border-slate-800">
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#1a1c23]">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
              TEI P5 Real-time Preview
            </span>
            <span className="text-[9px] font-bold text-rose-400/60 mt-0.5 font-mono truncate">{exportFileName}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => {
              const blob = new Blob([generatedXML], { type: 'text/xml' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = exportFileName; a.click();
            }} className="px-4 py-2 bg-rose-700 text-white text-[10px] font-black uppercase rounded-lg hover:bg-rose-600 shadow-xl shadow-rose-900/40 transition-transform active:scale-95 whitespace-nowrap">Download XML</button>
          </div>
        </div>
        <XMLPreview content={generatedXML} />
      </aside>
    </div>
  );
};

export default CuadernoApp;
