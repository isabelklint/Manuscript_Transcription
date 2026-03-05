import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PhraseEntry, PhraseMetadata, PhraseState } from './types';
import { generateId } from './utils';
import PhraseMetadataForm from './components/PhraseMetadataForm';
import PhraseItem from './components/PhraseItem';
import XMLPreview from './components/XMLPreview';

const INITIAL_METADATA: PhraseMetadata = {
  title_orig: 'Quaderno del Ydioma mazateco de las cosas y terminos mas comunes y usuales pa[r]ª instruccion de principiantes',
  title_norm: 'Cuaderno del idioma mazateco de las cosas y términos más comunes y usuales para instrucción de principiantes',
  title_gloss: 'Notebook of the Mazatec language of the most common and usual things and terms for the instruction of beginners',
  author: 'Anonymous [Vielma?]',
  editor: 'Isabel Klint',
  affiliation: 'Lancaster University / ILV A.C.',
  pub_date: '2026-01',
  settlement: 'Charlottesville',
  institution: 'University of Virginia',
  repository: 'Special Collections',
  shelfmark: 'UVA MSS 01784',
  collection: 'Gates Collection, 941 Manuscript',
  summary: 'Single-column Mazatec phrase and vocabulary list for beginners, compiled for missionary instruction.',
  orig_date: '1827',
  orig_place: 'Oaxaca, Mexico',
  pb_n: '1',
  image_source: 'cuaderno_1827_p1.jpg',
  phys_extent: 'c.100 pages',
  hand_note: 'Single hand, early 19th century',
  project_desc: 'Transcription prepared for Lancaster University PGCERT in Corpus Linguistics.',
  filename_keyword: 'cuaderno'
};

const createNewEntry = (lastEntry?: PhraseEntry): PhraseEntry => {
  let nextLine = '1';
  if (lastEntry) {
    const n = parseInt(lastEntry.line) || 0;
    nextLine = `${n + 1}`;
  }
  return {
    id: generateId(),
    line: nextLine,
    old_spa: '', new_spa: '', uncertain_spa: false,
    old_maz: '', new_maz: '', uncertain_maz: false,
    eng_gloss: '',
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
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.entries)) return parsed;
      }
    } catch (err) { console.error('Failed to load 1827 state:', err); }
    return { metadata: INITIAL_METADATA, entries: [createNewEntry()] };
  });

  useEffect(() => {
    try { localStorage.setItem('tei_cuaderno_1827_state', JSON.stringify(state)); }
    catch (e) { console.error('Failed to save 1827 state:', e); }
  }, [state]);

  useEffect(() => {
    if (importSuccess) {
      const timer = setTimeout(() => setImportSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [importSuccess]);

  const updateMetadata = (field: keyof PhraseMetadata, value: string) =>
    setState(prev => ({ ...prev, metadata: { ...prev.metadata, [field]: value } }));

  const updateEntry = (id: string, updates: Partial<PhraseEntry>) =>
    setState(prev => ({ ...prev, entries: prev.entries.map(e => e.id === id ? { ...e, ...updates } : e) }));

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
    return `${author}_${keyword}_${date}_p${state.metadata.pb_n || '0'}.xml`;
  }, [state.metadata]);

  const generatedXML = useMemo(() => {
    const { metadata, entries } = state;
    const cert = (u: boolean) => u ? ' certain="no"' : '';

    const renderEntry = (e: PhraseEntry, idx: number) => {
      const eid = `c${metadata.pb_n}e${(idx + 1).toString().padStart(3, '0')}`;
      let xml = `          <entry xml:id="${eid}">\n`;

      // Spanish side
      xml += `            <sense>\n`;
      if (e.abbreviation) {
        xml += `              <def type="orig" xml:lang="spa"${cert(e.uncertain_spa)}><choice><abbr>${e.old_spa}</abbr><expan>${e.abbreviation}</expan></choice></def>\n`;
      } else {
        xml += `              <def type="orig" xml:lang="spa"${cert(e.uncertain_spa)}>${e.old_spa}</def>\n`;
      }
      xml += `              <def type="norm" xml:lang="spa">${e.new_spa}</def>\n`;
      xml += `              <def type="gloss" xml:lang="eng">${e.eng_gloss}</def>\n`;
      xml += `            </sense>\n`;

      // Mazatec side (italic in MS = right column)
      xml += `            <form type="lemma">\n`;
      xml += `              <orth type="orig" xml:lang="maz"${cert(e.uncertain_maz)}>${e.old_maz}</orth>\n`;
      xml += `              <orth type="norm" xml:lang="maz">${e.new_maz}</orth>\n`;
      xml += `            </form>\n`;

      // Variant
      if (e.variant_maz) {
        xml += `            <form type="variant">\n`;
        xml += `              <usg type="textual" xml:lang="lat">${e.variant_label || 'v.²'}</usg>\n`;
        xml += `              <orth type="orig" xml:lang="maz">${e.variant_maz}</orth>\n`;
        xml += `            </form>\n`;
      }

      // Notes
      e.notes.forEach(n => {
        const typeAttr = n.type && n.type !== 'none' ? ` type="${n.type}"` : '';
        xml += `            <note${typeAttr} resp="#${n.resp}">${n.text}</note>\n`;
      });

      xml += `            <lb n="${e.line}"/>\n`;
      xml += `          </entry>\n`;
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
            <msItem><title>${metadata.title_orig}</title></msItem>
            <summary>${metadata.summary}</summary>
            <textLang mainLang="maz" otherLangs="spa lat eng">maz</textLang>
          </msContents>
          <physDesc>
            <objectDesc form="codex"><supportDesc><extent>${metadata.phys_extent}</extent></supportDesc><layoutDesc><layout columns="1">Single column, Spanish left with Mazatec right in italics</layout></layoutDesc></objectDesc>
            <handDesc><handNote>${metadata.hand_note}</handNote></handDesc>
          </physDesc>
          <history><origin><origDate when="${metadata.orig_date}">${metadata.orig_date}</origDate><origPlace>${metadata.orig_place}</origPlace></origin></history>
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
        <div type="entries">
${entries.map((e, i) => renderEntry(e, i)).join('\n')}
        </div>
      </div>
    </body>
  </text>
</TEI>`;
  }, [state]);

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const xml = e.target?.result as string;
      try {
        const metadata: PhraseMetadata = {
          title_orig: xml.match(/<titleStmt>[\s\S]*?<title>(.*?)<\/title>/i)?.[1] || INITIAL_METADATA.title_orig,
          title_norm: xml.match(/<title type="norm".*?>(.*?)<\/title>/i)?.[1] || INITIAL_METADATA.title_norm,
          title_gloss: xml.match(/<title type="gloss".*?>(.*?)<\/title>/i)?.[1] || INITIAL_METADATA.title_gloss,
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
          orig_date: xml.match(/<origDate[^>]*>(.*?)<\/origDate>/i)?.[1] || INITIAL_METADATA.orig_date,
          orig_place: xml.match(/<origPlace>(.*?)<\/origPlace>/i)?.[1] || INITIAL_METADATA.orig_place,
          pb_n: xml.match(/<pb n="(.*?)"/i)?.[1] || INITIAL_METADATA.pb_n,
          image_source: xml.match(/facs="(.*?)"/i)?.[1] || INITIAL_METADATA.image_source,
          phys_extent: xml.match(/<extent>(.*?)<\/extent>/i)?.[1] || INITIAL_METADATA.phys_extent,
          hand_note: xml.match(/<handNote>(.*?)<\/handNote>/i)?.[1] || INITIAL_METADATA.hand_note,
          project_desc: xml.match(/<projectDesc><p>(.*?)<\/p>/i)?.[1] || INITIAL_METADATA.project_desc,
          filename_keyword: INITIAL_METADATA.filename_keyword,
        };
        const entries: PhraseEntry[] = [];
        const entryRegex = /<entry xml:id=".*?">([\s\S]*?)<\/entry>/gis;
        let eMatch;
        while ((eMatch = entryRegex.exec(xml)) !== null) {
          const c = eMatch[1];
          const old_spa = c.match(/<def type="orig" xml:lang="spa"[^>]*>(.*?)<\/def>/i)?.[1] || '';
          const new_spa = c.match(/<def type="norm" xml:lang="spa"[^>]*>(.*?)<\/def>/i)?.[1] || '';
          const unc_spa = /<def type="orig"[^>]*?certain="no"/i.test(c);
          const eng_gloss = c.match(/<def type="gloss" xml:lang="eng"[^>]*>(.*?)<\/def>/i)?.[1] || '';
          const old_maz = c.match(/<orth type="orig" xml:lang="maz"[^>]*>(.*?)<\/orth>/i)?.[1] || '';
          const new_maz = c.match(/<orth type="norm" xml:lang="maz"[^>]*>(.*?)<\/orth>/i)?.[1] || '';
          const unc_maz = /<orth type="orig"[^>]*?certain="no"/i.test(c);
          const variant_maz = c.match(/<form type="variant">[\s\S]*?<orth type="orig"[^>]*>(.*?)<\/orth>/i)?.[1];
          const variant_label = c.match(/<form type="variant">[\s\S]*?<usg[^>]*>(.*?)<\/usg>/i)?.[1];
          const abbr = c.match(/<choice><abbr>.*?<\/abbr><expan>(.*?)<\/expan>/i)?.[1];
          const line = c.match(/<lb n="(.*?)"/i)?.[1] || '';
          const notes: any[] = [];
          const noteRegex = /<note(.*?) resp="#(.*?)">(.*?)<\/note>/gi;
          let nMatch;
          while ((nMatch = noteRegex.exec(c)) !== null) {
            const typeMatch = nMatch[1].match(/type="(.*?)"/i);
            notes.push({ id: generateId(), type: typeMatch ? typeMatch[1] : 'editorial', resp: nMatch[2], text: nMatch[3] });
          }
          entries.push({ id: generateId(), line, old_spa, new_spa, uncertain_spa: unc_spa, old_maz, new_maz, uncertain_maz: unc_maz, eng_gloss, variant_maz, variant_label, abbreviation: abbr, notes });
        }
        setState({ metadata, entries: entries.length ? entries : [createNewEntry()] });
        setImportSuccess(true);
      } catch (err) { console.error(err); alert('Import failed.'); }
    };
    reader.readAsText(file);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) processFile(f); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f?.name.endsWith('.xml')) processFile(f); };

  return (
    <div className={`flex h-full overflow-hidden bg-rose-50/20 transition-colors ${isDragging ? 'bg-rose-50' : ''}`}
      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}>
      <input type="file" ref={fileInputRef} onChange={handleImport} accept=".xml" className="hidden" />

      {importSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-rose-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
          <i className="fa-solid fa-circle-check"></i>
          <span className="text-xs font-black uppercase tracking-widest">Transcription Imported</span>
        </div>
      )}

      {isDragging && (
        <div className="fixed inset-0 z-50 bg-rose-600/10 backdrop-blur-sm border-4 border-dashed border-rose-400 flex items-center justify-center pointer-events-none">
          <div className="bg-white p-10 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
            <i className="fa-solid fa-file-import text-5xl text-rose-500 animate-bounce"></i>
            <span className="text-xl font-black text-slate-800 uppercase tracking-tighter">Drop XML to Resume Work</span>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 bg-white shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-rose-100 flex justify-between items-center bg-white z-10 shrink-0">
          <div>
            <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Cuaderno 1827 · Phrase List</p>
            <p className="text-[9px] font-bold text-slate-400">Single-column · Spanish | Mazatec (italic)</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => confirm('Clear workspace?') && setState({ metadata: INITIAL_METADATA, entries: [createNewEntry()] })}
              className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase hover:text-red-500 transition-colors">Clear All</button>
            <button onClick={() => fileInputRef.current?.click()}
              className="px-4 py-1.5 bg-rose-50 text-rose-700 text-[10px] font-black uppercase rounded-lg hover:bg-rose-100 transition-all">Open XML</button>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-10 bg-rose-50/10">
          <section className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-px bg-rose-100"></span>
              <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-widest">01 Manuscript Identity</h3>
              <span className="flex-1 h-px bg-rose-100"></span>
            </div>
            <PhraseMetadataForm metadata={state.metadata} onChange={updateMetadata} />
          </section>

          <section className="max-w-6xl mx-auto space-y-6 pb-32">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-px bg-rose-100"></span>
              <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-widest">02 Phrase Entry Flow</h3>
              <span className="flex-1 h-px bg-rose-100"></span>
              <span className="text-[10px] font-bold text-rose-400">{state.entries.length} entries</span>
            </div>
            <div className="grid gap-6">
              {state.entries.map((entry, index) => (
                <PhraseItem key={entry.id} entry={entry} index={index}
                  onUpdate={u => updateEntry(entry.id, u)}
                  onRemove={() => removeEntry(entry.id)}
                  onDuplicate={() => {
                    const idx = state.entries.findIndex(e => e.id === entry.id);
                    const copy = { ...entry, id: generateId(), line: `${parseInt(entry.line) + 1}` };
                    const news = [...state.entries]; news.splice(idx + 1, 0, copy);
                    setState(p => ({ ...p, entries: news }));
                  }} />
              ))}
            </div>
            <button onClick={addEntry} className="w-full py-16 border-2 border-dashed border-rose-100 rounded-2xl flex flex-col items-center justify-center gap-3 text-rose-200 hover:border-rose-400 hover:text-rose-500 hover:bg-rose-50 transition-all group">
              <div className="w-12 h-12 rounded-full border-2 border-rose-100 flex items-center justify-center group-hover:border-rose-400 transition-colors">
                <i className="fa-solid fa-plus text-xl group-hover:scale-110 transition-transform"></i>
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest">New Phrase Entry</span>
            </button>
          </section>
        </main>
      </div>

      <aside className="w-[480px] bg-[#1a0a0f] flex flex-col shrink-0 border-l border-rose-900/30">
        <div className="p-4 border-b border-white/5 flex justify-between items-center">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 bg-rose-500 rounded-full"></div>TEI P5 · Cuaderno 1827
            </span>
            <span className="text-[9px] font-bold text-rose-400/60 mt-0.5 font-mono truncate">{exportFileName}</span>
          </div>
          <button onClick={() => {
            const blob = new Blob([generatedXML], { type: 'text/xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = exportFileName; a.click();
          }} className="px-4 py-2 bg-rose-700 text-white text-[10px] font-black uppercase rounded-lg hover:bg-rose-600 shadow-xl shadow-rose-900/40 transition-transform active:scale-95">
            Download XML
          </button>
        </div>
        <XMLPreview content={generatedXML} />
      </aside>
    </div>
  );
};

export default CuadernoApp;
