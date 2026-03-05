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

// ── Cuaderno 1827 Phrase List types ──────────────────────────────────────────

export interface PhraseEntry {
  id: string;
  line: string;
  orig_spa: string;       // original Spanish phrase as written in manuscript
  new_spa: string;        // normalized modern Spanish
  orig_maz: string;       // original Mazatec phrase / response
  new_maz: string;        // normalized Mazatec
  eng_gloss: string;      // English translation / gloss
  uncertain_spa: boolean;
  uncertain_maz: boolean;
  uncertain_eng: boolean;
  category: string;       // thematic category (greeting, prayer, instruction, etc.)
  notes: NoteEntry[];
}

export interface PhraseMetadata {
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

export interface PhraseState {
  metadata: PhraseMetadata;
  entries: PhraseEntry[];
}

export const PHRASE_CATEGORIES = [
  { id: 'greeting', desc: 'Greeting / Salutation' },
  { id: 'prayer', desc: 'Prayer / Devotion' },
  { id: 'instruction', desc: 'Instruction / Command' },
  { id: 'question', desc: 'Question / Interrogative' },
  { id: 'response', desc: 'Response / Answer' },
  { id: 'daily', desc: 'Daily Life' },
  { id: 'body', desc: 'Body / Health' },
  { id: 'time', desc: 'Time / Calendar' },
  { id: 'number', desc: 'Number / Quantity' },
  { id: 'other', desc: 'Other' },
];