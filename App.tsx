import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Metadata, TranscriptionEntry, TranscriptionState, NOTE_TYPES } from './types';
import MetadataForm from './components/MetadataForm';
import EntryItem from './components/EntryItem';
import XMLPreview from './components/XMLPreview';

const INITIAL_METADATA: Metadata = {
  title_orig: 'Vocabulario en Ydioma Mazateco',
  title_norm: 'Cuaderno de idioma mazateco comenzado en el año de 1796',
  title_gloss: 'Booklet of Mazatec language begun in the year 1796',
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
  const [state, setState] = useState<TranscriptionState>(() => {
    const saved = localStorage.getItem('tei_p5_v4_state');
    if (saved) return JSON.parse(saved);
    return { metadata: INITIAL_METADATA, entries: [createNewEntry()] };
  });

  useEffect(() => {
    localStorage.setItem('tei_p5_v4_state', JSON.stringify(state));
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
        xml += `              <usg type="textual" xml:lang="lat"><choice><abbr>${e.variant.usg}</abbr><expan>vel</expan></choice></usg>\n`;
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
        xml += `            <note type="${n.type}" resp="#${n.resp}">${n.text}</note>\n`;
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
        const entryRegex = /<entry xml:id=".*?">(.*?)<\/entry>/gs;

        const vocabularyBody = xml.split('<div type="vocabulary">')[1]?.split('</body>')[0] || '';
        const acrossContent = vocabularyBody.split(/<div type="column"/)[0];
        let acrossMatch;
        while ((acrossMatch = entryRegex.exec(acrossContent)) !== null) {
          entries.push(parseEntryContent(acrossMatch[1], 'across'));
        }

        const colRegex = /<div type="column" n="(1|2)">(.*?)<\/div>/gs;
        let colMatch;
        while ((colMatch = colRegex.exec(xml)) !== null) {
          const colLayout = colMatch[1] === '1' ? 'col1' : 'col2';
          const colContent = colMatch[2];
          let eMatch;
          while ((eMatch = entryRegex.exec(colContent)) !== null) {
            entries.push(parseEntryContent(eMatch[1], colLayout));
          }
        }

        setState({ metadata, entries: entries.length ? entries : [createNewEntry()] });
      } catch (err) { alert("Import failed. Please check TEI XML structure."); }
    };
    reader.readAsText(file);
  };

  const parseEntryContent = (content: string, layout: 'col1' | 'col2' | 'across'): TranscriptionEntry => {
    const old_maz = content.match(/<form type="lemma">.*?<orth type="orig".*?>(.*?)<\/orth>/s)?.[1] || '';
    const new_maz = content.match(/<form type="lemma">.*?<orth type="norm".*?>(.*?)<\/orth>/s)?.[1] || '';
    const unc_maz = content.includes('certain="no"');

    let variant: any = undefined;
    const variantMatch = content.match(/<form type="variant">.*?<abbr>(.*?)<\/abbr>.*?<orth type="orig".*?>(.*?)<\/orth>.*?<orth type="norm".*?>(.*?)<\/orth>/s);
    if (variantMatch) {
      variant = { id: crypto.randomUUID(), usg: variantMatch[1], orig: variantMatch[2], norm: variantMatch[3] };
    }

    const old_spa = content.match(/<def type="orig".*?>(.*?)<\/def>/)?.[1] || '';
    const new_spa = content.match(/<def type="norm".*?>(.*?)<\/def>/)?.[1] || '';
    const unc_spa = /<def type="orig".*?certain="no"/.test(content);
    const eng_gloss = content.match(/<def type="gloss".*?>(.*?)<\/def>/)?.[1] || '';
    const unc_eng = /<def type="gloss".*?certain="no"/.test(content);
    const line = content.match(/<lb n="(.*?)"/)?.[1] || '';

    const notes: any[] = [];
    const noteRegex = /<note type="(.*?)" resp="#(.*?)">(.*?)<\/note>/g;
    let nMatch;
    while ((nMatch = noteRegex.exec(content)) !== null) {
      notes.push({ id: crypto.randomUUID(), type: nMatch[1], resp: nMatch[2], text: nMatch[3] });
    }

    return { id: crypto.randomUUID(), layout, line, old_maz, new_maz, uncertain_maz: unc_maz, old_spa, new_spa, uncertain_spa: unc_spa, eng_gloss, uncertain_eng: unc_eng, variant, notes };
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <input type="file" ref={fileInputRef} onChange={handleImport} accept=".xml" className="hidden" />
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <header className="p-4 border-b flex justify-between items-center bg-white z-10 shrink-0">
          <div>
             <h1 className="text-xl font-black tracking-tight text-slate-800 uppercase">TEI <span className="text-blue-600">Manuscript</span> Workspace</h1>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lancaster University • Isabel Klint</p>
          </div>
          <div className="flex gap-4">
             <button onClick={() => confirm('Reset?') && setState({ metadata: INITIAL_METADATA, entries: [createNewEntry()] })} className="px-3 py-1.5 text-[10px] font-black text-red-500 uppercase hover:bg-red-50 rounded">Reset</button>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-6 lg:p-12 space-y-12 bg-slate-50/30">
          <section className="max-w-6xl mx-auto">
             <MetadataForm metadata={state.metadata} onChange={updateMetadata} />
          </section>

          <section className="max-w-6xl mx-auto space-y-8 pb-32">
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

             <button onClick={addEntry} className="w-full py-12 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-300 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all group">
                <i className="fa-solid fa-plus text-xl group-hover:scale-110 transition-transform"></i>
                <span className="text-[11px] font-black uppercase tracking-widest">Record Next Entry</span>
             </button>
          </section>
        </main>
      </div>

      <aside className="w-[520px] bg-[#1a1c23] flex flex-col shrink-0 border-l border-slate-800">
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#1a1c23]">
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">Live TEI P5 Output</span>
           <div className="flex gap-2">
              <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-slate-800 text-white text-[10px] font-black uppercase rounded hover:bg-slate-700">Import</button>
              <button onClick={() => {
                const blob = new Blob([generatedXML], { type: 'text/xml' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = 'tei_transcription.xml'; a.click();
              }} className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-black uppercase rounded hover:bg-blue-500 shadow-lg shadow-blue-900/40">Download</button>
           </div>
        </div>
        <XMLPreview content={generatedXML} />
      </aside>
    </div>
  );
};

export default App;