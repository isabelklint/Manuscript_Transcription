
export interface OldSpaEntry {
  id: string;
  text: string;
  note?: string;
}

export interface NoteEntry {
  id: string;
  type: string;
  resp: string;
  text: string;
}

export interface TranscriptionEntry {
  id: string;
  page: string;
  line: string;
  old_maz: string;
  new_maz?: string;
  ipa?: string;
  kirk_set?: string;
  old_spa: OldSpaEntry[];
  new_spa?: string;
  eng_gloss?: string;
  notes: NoteEntry[];
}

export interface Metadata {
  docName: string;
  date: string;
  genre: string;
  author: string;
  source: string;
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
  { id: 'semantic', desc: 'Meaning clarifications' },
  { id: 'historical', desc: 'Context about period, author, colonial usage' },
  { id: 'gloss', desc: 'Unclear or archaic Spanish glosses' },
  { id: 'phonological', desc: 'Sound correspondences, tone reconstruction' },
  { id: 'morphological', desc: 'Word structure analysis' },
  { id: 'cross-reference', desc: 'Links to other entries' },
];

export const GENRE_OPTIONS = [
  "Vocabularios (Dictionaries/Word Lists)",
  "Confesionarios (Confession Manuals)",
  "Doctrinas Cristianas (Christian Catechisms)",
  "Phraseological Manuals"
];
