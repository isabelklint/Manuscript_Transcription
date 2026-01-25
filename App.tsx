import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Metadata, TranscriptionEntry, TranscriptionState, NOTE_TYPES, NoteEntry } from './types';
import MetadataForm from './components/MetadataForm';
import EntryItem from './components/EntryItem';
import XMLPreview from './components/XMLPreview';

const INITIAL_METADATA: Metadata = {
  title_orig: 'Vocabulario en Ydioma Mazateco',
  title_norm: 'Vocabulario en idioma mazateco',
  title_gloss: 'Vocabulary in Mazatec Language',
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
  pb_n: '000032278_0001'
};

const createNewEntry = (lastEntry?: TranscriptionEntry): TranscriptionEntry => {
  let nextLine = '1.1';
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
    column: lastEntry?.column || '1',
    line: nextLine,
    old_maz: '',
    new_maz: '',
    old_spa: '',
    new_spa: '',
    eng_gloss: '',
    notes: [],
  };
};

const App: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<TranscriptionState>(() => {
    const saved = localStorage.getItem('tei_transcriber_v1');
    if (saved) return JSON.parse(saved);
    return { metadata: INITIAL_METADATA, entries: [createNewEntry()] };
  });

  useEffect(() => {
    localStorage.setItem('tei_transcriber_v1', JSON.stringify(state));
  }, [state]);

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

  const generatedXML = useMemo(() => {
    const { metadata, entries } = state;
    const certain = (flag?: boolean) => flag ? ' certain="no"' : '';

    const renderColumn = (colNum: '1' | '2') => {
      const colEntries = entries.filter(e => e.column === colNum);
      if (colEntries.length === 0) return '';
      
      let colXml = `        <!-- COLUMN ${colNum} -->\n`;
      colXml += `        <div type="column" n="${colNum}">\n\n`;
      
      colEntries.forEach((entry, idx) => {
        const eid = `p1e${(entries.indexOf(entry) + 1).toString().padStart(3, '0')}`;
        colXml += `          <entry xml:id="${eid}">\n`;
        colXml += `            <form type="lemma">\n`;
        colXml += `              <orth type="orig" xml:lang="maz"${certain(entry.uncertain_maz)}>${entry.old_maz}</orth>\n`;
        colXml += `              <orth type="norm" xml:lang="maz">${entry.new_maz}</orth>\n`;
        colXml += `            </form>\n`;
        
        if (entry.variant) {
          colXml += `            <form type="variant">\n`;
          colXml += `              <usg type="textual" xml:lang="lat"><choice><abbr>${entry.variant.usg}</abbr><expan>vel</expan></choice></usg>\n`;
          colXml += `              <orth type="orig" xml:lang="maz">${entry.variant.orig}</orth>\n`;
          colXml += `              <orth type="norm" xml:lang="maz">${entry.variant.norm}</orth>\n`;
          colXml += `            </form>\n`;
        }

        colXml += `            <sense>\n`;
        colXml += `              <def type="orig" xml:lang="spa"${certain(entry.uncertain_spa)}>${entry.old_spa}</def>\n`;
        colXml += `              <def type="norm" xml:lang="spa">${entry.new_spa}</def>\n`;
        colXml += `              <def type="gloss" xml:lang="eng"${certain(entry.uncertain_eng)}>${entry.eng_gloss}</def>\n`;
        colXml += `            </sense>\n`;
        
        entry.notes.forEach(note => {
          colXml += `            <note type="${note.type}" resp="#${note.resp}">${note.text}</note>\n`;
        });
        
        colXml += `            <lb n="${entry.line}"/>\n`;
        colXml += `          </entry>\n\n`;
      });
      
      colXml += `        </div>\n`;
      return colXml;
    };

    return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-model href="http://www.tei-c.org/release/xml/tei/custom/schema/relaxng/tei_all.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <teiHeader>
    <fileDesc>
      <titleStmt>
        <title>${metadata.title_orig}</title>
        <author><persName>${metadata.author}</persName></author>
        <editor>
          <persName>${metadata.editor}</persName>
          <affiliation>${metadata.affiliation}</affiliation>
        </editor>
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
            <textLang mainLang="maz" otherLangs="spa lat eng">Mazatec (maz), Spanish (spa), Latin (lat), English (eng)</textLang>
          </msContents>
          <history>
            <origin><origDate notBefore="${metadata.orig_date}">begun ${metadata.orig_date}</origDate><origPlace>${metadata.orig_place}</origPlace></origin>
          </history>
        </msDesc>
      </sourceDesc>
    </fileDesc>
  </teiHeader>
  <text>
    <body>
      <div type="vocabulary">
        <pb n="${metadata.pb_n}"/>
        <head>
          <title type="orig" xml:lang="spa">${metadata.title_orig}</title>
          <title type="norm" xml:lang="spa">${metadata.title_norm}</title>
          <title type="gloss" xml:lang="eng">${metadata.title_gloss}</title>
        </head>
${renderColumn('1')}
${renderColumn('2')}
      </div>
    </body>
  </text>
</TEI>`;
  }, [state]);

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const xml = e.target?.result as string;
      try {
        const metadata: Metadata = {
          title_orig: xml.match(/<titleStmt>\s*<title>(.*?)<\/title>/)?.[1] || INITIAL_METADATA.title_orig,
          title_norm: xml.match(/<title type="norm".*?>(.*?)<\/title>/)?.[1] || INITIAL_METADATA.title_norm,
          title_gloss: xml.match(/<title type="gloss".*?>(.*?)<\/title>/)?.[1] || INITIAL_METADATA.title_gloss,
          author: xml.match(/<author><persName>(.*?)<\/persName>/)?.[1] || INITIAL_METADATA.author,
          editor: xml.match(/<editor>\s*<persName>(.*?)<\/persName>/)?.[1] || INITIAL_METADATA.editor,
          affiliation: xml.match(/<affiliation>(.*?)<\/affiliation>/)?.[1] || INITIAL_METADATA.affiliation,
          pub_date: xml.match(/<date when="(.*?)">/)?.[1] || INITIAL_METADATA.pub_date,
          settlement: xml.match(/<settlement>(.*?)<\/settlement>/)?.[1] || INITIAL_METADATA.settlement,
          institution: xml.match(/<institution>(.*?)<\/institution>/)?.[1] || INITIAL_METADATA.institution,
          repository: xml.match(/<repository>(.*?)<\/repository>/)?.[1] || INITIAL_METADATA.repository,
          shelfmark: xml.match(/<idno type="shelfmark">(.*?)<\/idno>/)?.[1] || INITIAL_METADATA.shelfmark,
          collection: xml.match(/<altIdentifier type="collection"><idno>(.*?)<\/idno>/)?.[1] || INITIAL_METADATA.collection,
          summary: xml.match(/<summary>(.*?)<\/summary>/)?.[1] || INITIAL_METADATA.summary,
          orig_date: xml.match(/<origDate.*?>(.*?)<\/origDate>/)?.[1].replace('begun ', '') || INITIAL_METADATA.orig_date,
          orig_place: xml.match(/<origPlace>(.*?)<\/origPlace>/)?.[1] || INITIAL_METADATA.orig_place,
          pb_n: xml.match(/<pb n="(.*?)">/)?.[1] || INITIAL_METADATA.pb_n,
        };

        const entries: TranscriptionEntry[] = [];
        const colRegex = /<div type="column" n="(1|2)">(.*?)<\/div>/gs;
        let colMatch;
        while ((colMatch = colRegex.exec(xml)) !== null) {
          const colNum = colMatch[1] as '1' | '2';
          const colContent = colMatch[2];
          const entryRegex = /<entry.*?>\s*<form type="lemma">(.*?)<\/form>(?:\s*<form type="variant">(.*?)<\/form>)?\s*<sense>(.*?)<\/sense>(.*?)\s*<lb n="(.*?)".*?>\s*<\/entry>/gs;
          let eMatch;
          while ((eMatch = entryRegex.exec(colContent)) !== null) {
            const [, lemma, variant, sense, notesRaw, line] = eMatch;
            const old_maz = lemma.match(/<orth type="orig".*?>(.*?)<\/orth>/)?.[1] || '';
            const new_maz = lemma.match(/<orth type="norm".*?>(.*?)<\/orth>/)?.[1] || '';
            const unc_maz = lemma.includes('certain="no"');

            const old_spa = sense.match(/<def type="orig".*?>(.*?)<\/def>/)?.[1] || '';
            const new_spa = sense.match(/<def type="norm".*?>(.*?)<\/def>/)?.[1] || '';
            const unc_spa = sense.includes('certain="no"');
            const eng_gloss = sense.match(/<def type="gloss".*?>(.*?)<\/def>/)?.[1] || '';
            const unc_eng = sense.match(/<def type="gloss".*?certain="no"/);

            const notes: NoteEntry[] = [];
            const noteRegex = /<note type="(.*?)" resp="#(.*?)">(.*?)<\/note>/g;
            let nMatch;
            while ((nMatch = noteRegex.exec(notesRaw)) !== null) {
              notes.push({ id: crypto.randomUUID(), type: nMatch[1], resp: nMatch[2], text: nMatch[3] });
            }

            entries.push({
              id: crypto.randomUUID(),
              column: colNum,
              line,
              old_maz, new_maz, uncertain_maz: unc_maz,
              old_spa, new_spa, uncertain_spa: unc_spa,
              eng_gloss, uncertain_eng: !!unc_eng,
              notes
            });
          }
        }
        setState({ metadata, entries: entries.length ? entries : [createNewEntry()] });
      } catch (err) { alert("Failed to parse TEI XML."); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col lg:flex-row bg-slate-50 h-screen overflow-hidden">
      <input type="file" ref={fileInputRef} onChange={handleImport} accept=".xml" className="hidden" />
      <div className="flex-1 overflow-y-auto p-6 lg:p-10 bg-white shadow-inner">
        <header className="mb-8 flex justify-between items-center border-b pb-4">
          <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">TEI Transcriber <span className="text-blue-500 font-light">P5</span></h1>
          <button onClick={() => confirm('Reset?') && setState({ metadata: INITIAL_METADATA, entries: [createNewEntry()] })} className="text-xs text-red-500 font-bold uppercase hover:bg-red-50 px-2 py-1 rounded transition-colors">Reset Session</button>
        </header>

        <section className="mb-10"><MetadataForm metadata={state.metadata} onChange={updateMetadata} /></section>
        
        <section className="space-y-6 pb-20">
          <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
             <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Transcription Entry Stack</h2>
             <div className="flex gap-4">
                <span className="text-[10px] text-blue-600 font-bold">Col 1: {state.entries.filter(e => e.column === '1').length}</span>
                <span className="text-[10px] text-purple-600 font-bold">Col 2: {state.entries.filter(e => e.column === '2').length}</span>
             </div>
          </div>
          {state.entries.map((entry, index) => (
            <EntryItem key={entry.id} entry={entry} index={index} onUpdate={u => updateEntry(entry.id, u)} onRemove={() => removeEntry(entry.id)} onDuplicate={() => {
              const idx = state.entries.findIndex(e => e.id === entry.id);
              const copy = { ...entry, id: crypto.randomUUID(), line: (parseFloat(entry.line) + 1).toFixed(1) };
              const news = [...state.entries]; news.splice(idx + 1, 0, copy);
              setState(p => ({ ...p, entries: news }));
            }} />
          ))}
          <button onClick={addEntry} className="w-full py-10 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-all flex flex-col items-center gap-2">
            <i className="fa-solid fa-plus text-xl"></i>
            <span className="text-[10px] font-bold uppercase tracking-widest">Add Entry</span>
          </button>
        </section>
      </div>

      <aside className="w-full lg:w-[480px] bg-[#0f172a] flex flex-col h-screen border-l border-slate-800">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center shrink-0">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TEI P5 Output</span>
          <div className="flex gap-2">
            <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-slate-700 text-white text-[10px] font-bold uppercase rounded hover:bg-slate-600 transition-colors">Import</button>
            <button onClick={() => {
              const blob = new Blob([generatedXML], { type: 'text/xml' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'tei_transcription.xml'; a.click();
            }} className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-bold uppercase rounded hover:bg-blue-500 transition-colors">Download</button>
          </div>
        </div>
        <XMLPreview content={generatedXML} />
      </aside>
    </div>
  );
};

export default App;