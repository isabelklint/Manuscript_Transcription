export interface NoteEntry {
  id: string;
  type: string;
  resp: string;
  text: string;
}

export interface VariantEntry {
  id: string;
  usg: string; // e.g. v.l.
  orig: string;
  norm: string;
}

export interface DaughterWord {
  id: string;
  text: string;
  matches: boolean;
}

export interface KirkSet {
  id: string;
  number: string;
  protoForm: string;
  page: string;
  daughters: DaughterWord[];
}

export interface TranscriptionEntry {
  id: string;
  layout: 'col1' | 'col2' | 'across';
  line: string;
  old_maz: string;
  new_maz: string;
  uncertain_maz: boolean;
  old_spa: string;
  new_spa: string;
  uncertain_spa: boolean;
  eng_gloss: string;
  uncertain_eng: boolean;
  ipa?: string;
  kirk_sets: KirkSet[];
  variant?: VariantEntry;
  notes: NoteEntry[];
}

export interface Metadata {
  title_orig: string;
  title_norm: string;
  title_gloss: string;
  title_note: string;
  author: string;
  editor: string;
  affiliation: string;
  pub_date: string;
  settlement: string;
  institution: string;
  repository: string;
  shelfmark: string;
  collection: string;
  summary: string;
  orig_date: string;
  orig_place: string;
  pb_n: string;
  image_source: string;
  phys_extent: string;
  phys_layout: string;
  hand_note: string;
  project_desc: string;
  filename_keyword: string;
}

export interface TranscriptionState {
  metadata: Metadata;
  entries: TranscriptionEntry[];
}

export const NOTE_TYPES = [
  { id: 'editorial', desc: 'Editorial' },
  { id: 'linguistic', desc: 'Linguistic' },
  { id: 'layout', desc: 'Layout' },
  { id: 'orthographic', desc: 'Orthographic' },
  { id: 'historical', desc: 'Historical' },
  { id: 'semantic', desc: 'Semantic' },
  { id: 'none', desc: 'None (Remove Note)' },
];