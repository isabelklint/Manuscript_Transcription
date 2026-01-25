import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Metadata, TranscriptionEntry, TranscriptionState, NOTE_TYPES, NoteEntry } from './types';
import MetadataForm from './components/MetadataForm';
import EntryItem from './components/EntryItem';
import XMLPreview from './components/XMLPreview';

const INITIAL_METADATA: Metadata = {
  title: 'Vocabulario en Ydioma Mazateco',
  author: 'Ygnacio Arrona',
  editor: 'Isabel Klint',
  affiliation: 'Lancaster University / ILV A.C.',
  date: '2026-01',
  publisher: 'Isabel Klint',
  settlement: 'Charlottesville',
  institution: 'University of Virginia',
  repository: 'Special Collections',
  shelfmark: 'UVA MSS 01784',
  collection: 'Gates Collection, 941 Manuscript',
  msContentsTitle: 'Vocabulario en Ydioma Mazateco',
  msContentsNote: 'comenzado en el año de 1796',
  summary: 'Bilingual Mazatec-Spanish vocabulary list, compiled for missionary or linguistic purposes.',
  mainLang: 'maz',
  otherLangs: 'spa lat eng',
  physForm: 'codex',
  physExtent: '18 pages, 4to',
  physLayout: 'Double column',
  handNote: 'Single hand, late 18th century',
  origDate: 'begun 1796',
  origPlace: 'Oaxaca, Mexico',
  projectDesc: 'Transcription prepared for Lancaster University PGCERT in Corpus Linguistics.',
};

const createNewEntry = (lastEntry?: TranscriptionEntry): TranscriptionEntry => ({
  id: crypto.randomUUID(),
  page: lastEntry?.page || '000032278_0001',
  column: lastEntry?.column || "1",
  line: lastEntry ? (parseFloat(lastEntry.line) + 1).toFixed(1) : '3.1',
  maz_orig: '',
  maz_norm: '',
  spa_orig: '',
  spa_norm: '',
  eng_gloss: '',
  notes: [],
});

const App: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<TranscriptionState>(() => {
    const saved = localStorage.getItem('tei_transcriber_v1');
    return saved ? JSON.parse(saved) : { metadata: INITIAL_METADATA, entries: [createNewEntry()] };
  });

  useEffect(() => {
    localStorage.setItem('tei_transcriber_v1', JSON.stringify(state));
  }, [state]);

  const updateMetadata = (field: keyof Metadata, value: string) => {
    setState(prev => ({ ...prev, metadata: { ...prev.metadata, [field]: value } }));
  };

  const updateEntry = (id: string, updates: Partial<TranscriptionEntry>) => {
    setState(prev => ({ ...prev, entries: prev.entries.map(e => e.id === id ? { ...e, ...updates } : e) }));
  };

  const generatedXML = useMemo(() => {
    const { metadata, entries } = state;
    const cert = (f?: boolean) => f ? ' cert="low"' : '';

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<?xml-model href="http://www.tei-c.org/release/xml/tei/custom/schema/relaxng/tei_all.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?>\n`;
    xml += `<TEI xmlns="http://www.tei-c.org/ns/1.0">\n`;
    xml += `  <teiHeader>\n`;
    xml += `    <fileDesc>\n`;
    xml += `      <titleStmt>\n        <title>${metadata.title}</title>\n        <author><persName>${metadata.author}</persName></author>\n        <editor><persName>${metadata.editor}</persName><affiliation>${metadata.affiliation}</affiliation></editor>\n      </titleStmt>\n`;
    xml += `      <editionStmt>\n        <edition>First TEI P5 digital edition, <date when="${metadata.date}">${metadata.date}</date></edition>\n      </editionStmt>\n`;
    xml += `      <publicationStmt>\n        <publisher>${metadata.publisher}</publisher>\n        <availability><p>For academic use.</p></availability>\n      </publicationStmt>\n`;
    xml += `      <sourceDesc>\n        <msDesc>\n          <msIdentifier>\n            <settlement>${metadata.settlement}</settlement>\n            <institution>${metadata.institution}</institution>\n            <repository>${metadata.repository}</repository>\n            <idno type="shelfmark">${metadata.shelfmark}</idno>\n            <altIdentifier type="collection"><idno>${metadata.collection}</idno></altIdentifier>\n          </msIdentifier>\n`;
    xml += `          <msContents>\n            <msItem><title>${metadata.msContentsTitle}</title><note>${metadata.msContentsNote}</note></msItem>\n            <summary>${metadata.summary}</summary>\n            <textLang mainLang="${metadata.mainLang}" otherLangs="${metadata.otherLangs}">${metadata.mainLang}</textLang>\n          </msContents>\n`;
    xml += `          <physDesc>\n            <objectDesc form="${metadata.physForm}"><supportDesc><extent>${metadata.physExtent}</extent></supportDesc><layoutDesc><layout columns="2">${metadata.physLayout}</layout></layoutDesc></objectDesc>\n            <handDesc><handNote>${metadata.handNote}</handNote></handDesc>\n          </physDesc>\n`;
    xml += `          <history><origin><origDate>${metadata.origDate}</origDate><origPlace>${metadata.origPlace}</origPlace></origin></history>\n`;
    xml += `        </msDesc>\n      </sourceDesc>\n    </fileDesc>\n`;
    xml += `    <encodingDesc>\n      <projectDesc><p>${metadata.projectDesc}</p></projectDesc>\n    </encodingDesc>\n`;
    xml += `  </teiHeader>\n`;
    xml += `  <text>\n    <body>\n      <div type="vocabulary">\n`;

    const pages = Array.from(new Set(entries.map(e => e.page)));
    pages.forEach(page => {
      xml += `        <pb n="${page}"/>\n`;
      ["1", "2"].forEach(col => {
        const colEntries = entries.filter(e => e.page === page && e.column === col);
        if (colEntries.length === 0) return;
        xml += `        <div type="column" n="${col}">\n`;
        colEntries.forEach((entry, i) => {
          const entryId = `p${page.slice(-1)}e${(i + 1).toString().padStart(3, '0')}`;
          xml += `          <entry xml:id="${entryId}">\n`;
          xml += `            <form type="lemma">\n`;
          xml += `              <orth type="orig" xml:lang="maz"${cert(entry.uncertain_maz)}>${entry.maz_orig}</orth>\n`;
          xml += `              <orth type="norm" xml:lang="maz">${entry.maz_norm}</orth>\n`;
          xml += `            </form>\n`;
          if (entry.has_variant) {
            xml += `            <form type="variant">\n              <usg type="textual" xml:lang="lat"><choice><abbr>v.l</abbr><expan>vel</expan></choice></usg>\n`;
            xml += `              <orth type="orig" xml:lang="maz">${entry.variant_maz_orig}</orth>\n`;
            xml += `              <orth type="norm" xml:lang="maz">${entry.variant_maz_norm}</orth>\n            </form>\n`;
          }
          xml += `            <sense>\n`;
          xml += `              <def type="orig" xml:lang="spa"${cert(entry.uncertain_spa)}>${entry.spa_orig}</def>\n`;
          xml += `              <def type="norm" xml:lang="spa">${entry.spa_norm}</def>\n`;
          xml += `              <def type="gloss" xml:lang="eng"${cert(entry.uncertain_eng)}>${entry.eng_gloss}</def>\n`;
          xml += `            </sense>\n`;
          entry.notes.forEach(n => {
            xml += `            <note type="${n.type}" resp="#${n.resp}">${n.text}</note>\n`;
          });
          xml += `            <lb n="${entry.line}"/>\n`;
          xml += `          </entry>\n`;
        });
        xml += `        </div>\n`;
      });
    });

    xml += `      </div>\n    </body>\n  </text>\n</TEI>`;
    return xml;
  }, [state]);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const xml = event.target?.result as string;
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, "text/xml");
        const getT = (sel: string) => doc.querySelector(sel)?.textContent || "";
        
        const metadata: Metadata = {
          ...INITIAL_METADATA,
          title: getT("titleStmt title"),
          author: getT("author persName"),
          editor: getT("editor persName"),
          affiliation: getT("affiliation"),
          settlement: getT("settlement"),
          institution: getT("institution"),
          repository: getT("repository"),
          shelfmark: getT("idno[type='shelfmark']"),
        };

        const entries: TranscriptionEntry[] = [];
        let currentPage = "";
        doc.querySelectorAll("pb, div[type='column'], entry").forEach(node => {
          if (node.nodeName === "pb") currentPage = node.getAttribute("n") || "";
          if (node.nodeName === "div") {
            const colN = node.getAttribute("n") as "1" | "2";
            node.querySelectorAll("entry").forEach(entryNode => {
              const getVal = (sel: string) => entryNode.querySelector(sel)?.textContent || "";
              const getCert = (sel: string) => entryNode.querySelector(sel)?.getAttribute("cert") === "low";
              
              const notes: NoteEntry[] = [];
              entryNode.querySelectorAll("note").forEach(n => {
                notes.push({
                  id: crypto.randomUUID(),
                  type: n.getAttribute("type") || "editorial",
                  resp: n.getAttribute("resp")?.replace("#", "") || "IK",
                  text: n.textContent || ""
                });
              });

              entries.push({
                id: crypto.randomUUID(),
                page: currentPage,
                column: colN,
                line: entryNode.querySelector("lb")?.getAttribute("n") || "",
                maz_orig: getVal("form[type='lemma'] orth[type='orig']"),
                maz_norm: getVal("form[type='lemma'] orth[type='norm']"),
                uncertain_maz: getCert("form[type='lemma'] orth[type='orig']"),
                spa_orig: getVal("sense def[type='orig']"),
                spa_norm: getVal("sense def[type='norm']"),
                uncertain_spa: getCert("sense def[type='orig']"),
                eng_gloss: getVal("sense def[type='gloss']"),
                uncertain_eng: getCert("sense def[type='gloss']"),
                has_variant: !!entryNode.querySelector("form[type='variant']"),
                variant_maz_orig: getVal("form[type='variant'] orth[type='orig']"),
                variant_maz_norm: getVal("form[type='variant'] orth[type='norm']"),
                notes
              });
            });
          }
        });
        setState({ metadata, entries: entries.length > 0 ? entries : [createNewEntry()] });
      } catch (err) { alert("Failed to parse TEI XML"); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 overflow-hidden h-screen">
      <input type="file" ref={fileInputRef} onChange={handleImport} accept=".xml" className="hidden" />
      <div className="flex-1 overflow-y-auto p-6 lg:p-12 bg-white">
        <header className="mb-10 flex justify-between items-center border-b border-slate-100 pb-6">
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">TEI P5 Transcriber</h1>
          <button onClick={() => confirm('Reset?') && setState({ metadata: INITIAL_METADATA, entries: [createNewEntry()] })} className="text-xs font-bold text-red-500 uppercase px-3 py-2 hover:bg-red-50 rounded">Reset</button>
        </header>
        <section className="mb-12"><MetadataForm metadata={state.metadata} onChange={updateMetadata} /></section>
        <section className="mb-24 space-y-8">
          {state.entries.map((entry, index) => (
            <EntryItem key={entry.id} entry={entry} index={index} onUpdate={(u) => updateEntry(entry.id, u)} onRemove={() => setState(p => ({ ...p, entries: p.entries.filter(e => e.id !== entry.id) }))} onDuplicate={() => {
              const idx = state.entries.findIndex(e => e.id === entry.id);
              const news = [...state.entries];
              news.splice(idx + 1, 0, { ...entry, id: crypto.randomUUID() });
              setState(p => ({ ...p, entries: news }));
            }} />
          ))}
          <button onClick={() => setState(p => ({ ...p, entries: [...p.entries, createNewEntry(p.entries[p.entries.length-1])] }))} className="w-full py-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold uppercase text-xs hover:bg-slate-50 transition-all">+ Add Entry</button>
        </section>
      </div>
      <aside className="w-full lg:w-[500px] bg-[#0f172a] flex flex-col h-screen shadow-2xl z-20">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#0f172a] shrink-0">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live TEI-XML Output</h2>
          <div className="flex gap-2">
            <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-slate-700 text-white rounded text-[10px] font-bold uppercase">Import</button>
            <button onClick={() => { const blob = new Blob([generatedXML], { type: 'text/xml' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'tei_edition.xml'; a.click(); }} className="px-3 py-1.5 bg-blue-600 text-white rounded text-[10px] font-bold uppercase">Download</button>
          </div>
        </div>
        <XMLPreview content={generatedXML} />
      </aside>
    </div>
  );
};

export default App;