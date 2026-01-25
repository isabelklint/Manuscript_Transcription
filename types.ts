
export interface OldSpaEntry {
  id: string;
  text: string;
  note?: string;
  uncertain?: boolean;
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
  column: "1" | "2";
  line: string;
  maz_orig: string;
  maz_norm: string;
  uncertain_maz?: boolean;
  spa_orig: string;
  spa_norm: string;
  uncertain_spa?: boolean;
  eng_gloss: string;
  uncertain_eng?: boolean;
  // Variants
  has_variant?: boolean;
  variant_maz_orig?: string;
  variant_maz_norm?: string;
  notes: NoteEntry[];
}

export interface Metadata {
  title: string;
  author: string;
  editor: string;
  affiliation: string;
  date: string;
  publisher: string;
  settlement: string;
  institution: string;
  repository: string;
  shelfmark: string;
  collection: string;
  msContentsTitle: string;
  msContentsNote: string;
  summary: string;
  mainLang: string;
  otherLangs: string;
  physForm: string;
  physExtent: string;
  physLayout: string;
  handNote: string;
  origDate: string;
  origPlace: string;
  projectDesc: string;
}

export interface TranscriptionState {
  metadata: Metadata;
  entries: TranscriptionEntry[];
}

export const NOTE_TYPES = [
  { id: 'editorial', desc: 'Transcription decisions' },
  { id: 'linguistic', desc: 'Comparative/reconstructed' },
  { id: 'layout', desc: 'Physical arrangement' },
  { id: 'orthographic', desc: 'Spelling/graphemes' },
  { id: 'historical', desc: 'Contextual info' },
  { id: 'semantic', desc: 'Meaning clarifications' },
];
