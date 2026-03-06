import { DaughterWord, KirkSet, Metadata, NoteEntry, TranscriptionEntry, TranscriptionState, VariantEntry } from './types';
import { generateId } from './utils';
import { INITIAL_METADATA } from './constants';

const match1 = (xml: string, pattern: RegExp): string =>
  pattern.exec(xml)?.[1] ?? '';

const parseEntryContent = (content: string, layout: 'col1' | 'col2' | 'across'): TranscriptionEntry => {
  const old_maz = match1(content, /<orth type="orig" xml:lang="maz"[^>]*?>(.*?)<\/orth>/i);
  const new_maz = match1(content, /<orth type="norm" xml:lang="maz"[^>]*?>(.*?)<\/orth>/i);
  const ipa     = match1(content, /<pron notation="ipa">(.*?)<\/pron>/i) || undefined;
  const uncertain_maz = /<orth type="orig"[^>]*?certain="no"/i.test(content);

  let variant: VariantEntry | undefined;
  const vm = /<form type="variant">[\s\S]*?<usg[^>]*?>(.*?)<\/usg>[\s\S]*?<orth type="orig"[^>]*?>(.*?)<\/orth>[\s\S]*?<orth type="norm"[^>]*?>(.*?)<\/orth>/i.exec(content);
  if (vm) {
    variant = { id: generateId(), usg: vm[1], orig: vm[2], norm: vm[3] };
  }

  const old_spa     = match1(content, /<def type="orig" xml:lang="spa"[^>]*?>(.*?)<\/def>/i);
  const new_spa     = match1(content, /<def type="norm" xml:lang="spa"[^>]*?>(.*?)<\/def>/i);
  const uncertain_spa = /<def type="orig"[^>]*?certain="no"/i.test(content);
  const eng_gloss   = match1(content, /<def type="gloss" xml:lang="eng"[^>]*?>(.*?)<\/def>/i);
  const uncertain_eng = /<def type="gloss"[^>]*?certain="no"/i.test(content);
  const line        = match1(content, /<lb n="(.*?)"/i);

  const kirk_sets: KirkSet[] = [];
  for (const km of content.matchAll(/<note type="kirk" n="(.*?)" target="(.*?)">([\s\S]*?)<\/note>/gi)) {
    const kirkContent = km[3];
    const protoForm = match1(kirkContent, /<hi type="proto">(.*?)<\/hi>/i);
    const daughters: DaughterWord[] = Array.from(
      kirkContent.matchAll(/<item(.*?)>(.*?)<\/item>/gi),
      m => ({ id: generateId(), text: m[2], matches: m[1].includes('cert="high"') })
    );
    kirk_sets.push({ id: generateId(), number: km[1], page: km[2], protoForm, daughters });
  }

  const notes: NoteEntry[] = [];
  for (const nm of content.matchAll(/<note(.*?) resp="#(.*?)">(.*?)<\/note>/gi)) {
    const typeMatch = /type="(.*?)"/.exec(nm[1]);
    if (typeMatch?.[1] === 'kirk') continue;
    notes.push({ id: generateId(), type: typeMatch?.[1] ?? 'editorial', resp: nm[2], text: nm[3] });
  }

  return {
    id: generateId(), layout, line,
    old_maz, new_maz, uncertain_maz,
    old_spa, new_spa, uncertain_spa,
    eng_gloss, uncertain_eng,
    ipa, variant, kirk_sets, notes,
  };
};

export const parseXML = (xml: string): TranscriptionState => {
  const m = (pattern: RegExp, fallback: string) => pattern.exec(xml)?.[1] ?? fallback;
  const md = INITIAL_METADATA;

  const metadata: Metadata = {
    title_orig:   m(/<titleStmt>[\s\S]*?<title>(.*?)<\/title>/i,                    md.title_orig),
    title_norm:   m(/<title type="norm".*?>(.*?)<\/title>/i,                         md.title_norm),
    title_gloss:  m(/<title type="gloss".*?>(.*?)<\/title>/i,                        md.title_gloss),
    title_note:   m(/<msItem>[\s\S]*?<note>(.*?)<\/note>/i,                          md.title_note),
    author:       m(/<author><persName>(.*?)<\/persName>/i,                           md.author),
    editor:       m(/<editor>[\s\S]*?<persName>(.*?)<\/persName>/i,                  md.editor),
    affiliation:  m(/<affiliation>(.*?)<\/affiliation>/i,                             md.affiliation),
    pub_date:     m(/<date when="(.*?)">/i,                                           md.pub_date),
    settlement:   m(/<settlement>(.*?)<\/settlement>/i,                               md.settlement),
    institution:  m(/<institution>(.*?)<\/institution>/i,                             md.institution),
    repository:   m(/<repository>(.*?)<\/repository>/i,                               md.repository),
    shelfmark:    m(/<idno type="shelfmark">(.*?)<\/idno>/i,                         md.shelfmark),
    collection:   m(/<altIdentifier type="collection"><idno>(.*?)<\/idno>/i,          md.collection),
    summary:      m(/<summary>(.*?)<\/summary>/i,                                     md.summary),
    orig_date:    m(/<origDate.*?>(.*?)<\/origDate>/i, 'begun ' + md.orig_date).replace('begun ', ''),
    orig_place:   m(/<origPlace>(.*?)<\/origPlace>/i,                                 md.orig_place),
    pb_n:         m(/<pb n="(.*?)"/i,                                                 md.pb_n),
    image_source: m(/facs="(.*?)"/i,                                                  md.image_source),
    phys_extent:  m(/<extent>(.*?)<\/extent>/i,                                       md.phys_extent),
    phys_layout:  m(/<layout[^>]*>(.*?)<\/layout>/i,                                  md.phys_layout),
    hand_note:    m(/<handNote>(.*?)<\/handNote>/i,                                   md.hand_note),
    project_desc: m(/<projectDesc><p>(.*?)<\/p>/i,                                    md.project_desc),
    filename_keyword: md.filename_keyword,
  };

  const entries: TranscriptionEntry[] = [];
  const vocabSection = xml.split(/<div type="vocabulary">/i)[1]?.split(/<\/body>/i)[0] ?? '';

  // Across entries appear before the first <div type="column"
  const acrossSection = vocabSection.split(/<div type="column"/i)[0];
  for (const am of acrossSection.matchAll(/<entry xml:id=".*?">([\s\S]*?)<\/entry>/gis)) {
    entries.push(parseEntryContent(am[1], 'across'));
  }

  // Column entries
  for (const cm of xml.matchAll(/<div type="column" n="(1|2)">([\s\S]*?)<\/div>/gis)) {
    const layout = cm[1] === '1' ? 'col1' : 'col2';
    for (const em of cm[2].matchAll(/<entry xml:id=".*?">([\s\S]*?)<\/entry>/gis)) {
      entries.push(parseEntryContent(em[1], layout));
    }
  }

  return { metadata, entries };
};
