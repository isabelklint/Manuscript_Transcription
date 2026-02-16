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
  kirk_set?: string;
  variant?: VariantEntry;
  notes: NoteEntry[];
}

export interface Metadata {
  title_orig: string;
  title_norm: string;
  title_gloss: string;
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
}

export interface TranscriptionState {
  metadata: Metadata;
  entries: TranscriptionEntry[];
}

export const NOTE_TYPES = [
  { id: 'editorial', desc: 'Transcription decisions and uncertainties' },
  { id: 'linguistic', desc: 'Comparative and reconstructed forms' },
  { id: 'layout', desc: 'Physical arrangement on manuscript page' },
  { id: 'orthographic', desc: 'Spelling conventions and grapheme interpretation' },
  { id: 'historical', desc: 'Context about period, author, colonial usage' },
  { id: 'semantic', desc: 'Meaning clarifications' },
];