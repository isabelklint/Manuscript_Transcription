import { Metadata, TranscriptionEntry, TranscriptionState } from './types';
import { escapeXml } from './utils';

const cert = (uncertain: boolean) => (uncertain ? ' certain="no"' : '');

const renderEntry = (e: TranscriptionEntry, globalIndex: number, pbN: string): string => {
  const eid = `p${pbN}e${(globalIndex + 1).toString().padStart(3, '0')}`;
  const lines: string[] = [
    `          <entry xml:id="${eid}">`,
    `            <form type="lemma">`,
    `              <orth type="orig" xml:lang="maz"${cert(e.uncertain_maz)}>${escapeXml(e.old_maz)}</orth>`,
    `              <orth type="norm" xml:lang="maz">${escapeXml(e.new_maz)}</orth>`,
  ];
  if (e.ipa) lines.push(`              <pron notation="ipa">${escapeXml(e.ipa)}</pron>`);
  lines.push(`            </form>`);

  if (e.variant) {
    lines.push(
      `            <form type="variant">`,
      `              <usg type="textual" xml:lang="lat">${escapeXml(e.variant.usg)}</usg>`,
      `              <orth type="orig" xml:lang="maz">${escapeXml(e.variant.orig)}</orth>`,
      `              <orth type="norm" xml:lang="maz">${escapeXml(e.variant.norm)}</orth>`,
      `            </form>`,
    );
  }

  // old_spa is intentionally not escaped: users hand-enter abbreviation XML here
  // (e.g. <choice><abbr>pʳ. qᵉ.</abbr><expan>por que</expan></choice>)
  lines.push(
    `            <sense>`,
    `              <def type="orig" xml:lang="spa"${cert(e.uncertain_spa)}>${e.old_spa}</def>`,
    `              <def type="norm" xml:lang="spa">${escapeXml(e.new_spa)}</def>`,
    `              <def type="gloss" xml:lang="eng"${cert(e.uncertain_eng)}>${escapeXml(e.eng_gloss)}</def>`,
    `            </sense>`,
  );

  for (const ks of e.kirk_sets) {
    lines.push(
      `            <note type="kirk" n="${escapeXml(ks.number)}" target="${escapeXml(ks.page)}">`,
      `              <hi type="proto">${escapeXml(ks.protoForm)}</hi>`,
      `              <list type="daughters">`,
      ...ks.daughters.map(d => {
        const matchAttr = d.matches ? ' cert="high"' : ' cert="low"';
        return `                <item${matchAttr}>${escapeXml(d.text)}</item>`;
      }),
      `              </list>`,
      `            </note>`,
    );
  }

  for (const n of e.notes) {
    const typeAttr = n.type && n.type !== 'none' ? ` type="${escapeXml(n.type)}"` : '';
    lines.push(`            <note${typeAttr} resp="#${escapeXml(n.resp)}">${escapeXml(n.text)}</note>`);
  }

  lines.push(`            <lb n="${escapeXml(e.line)}"/>`, `          </entry>`);
  return lines.join('\n');
};

export const generateXML = ({ metadata, entries }: TranscriptionState): string => {
  const ex = escapeXml;
  // Map entry id → global index so columns get correct sequential IDs
  const indexMap = new Map(entries.map((e, i) => [e.id, i]));
  const render = (e: TranscriptionEntry) => renderEntry(e, indexMap.get(e.id)!, metadata.pb_n);

  const renderColumn = (layoutType: 'col1' | 'col2', n: string) => {
    const col = entries.filter(e => e.layout === layoutType);
    const open = `        <div type="column" n="${n}">`;
    return col.length === 0
      ? `${open}</div>`
      : `${open}\n${col.map(render).join('\n')}\n        </div>`;
  };

  const acrossXml = entries
    .filter(e => e.layout === 'across')
    .map(render)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-model href="http://www.tei-c.org/release/xml/tei/custom/schema/relaxng/tei_all.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <teiHeader>
    <fileDesc>
      <titleStmt>
        <title>${ex(metadata.title_orig)}</title>
        <author><persName>${ex(metadata.author)}</persName></author>
        <editor><persName>${ex(metadata.editor)}</persName><affiliation>${ex(metadata.affiliation)}</affiliation></editor>
      </titleStmt>
      <editionStmt>
        <edition>First TEI P5 digital edition, <date when="${ex(metadata.pub_date)}">${ex(metadata.pub_date)}</date></edition>
      </editionStmt>
      <publicationStmt>
        <publisher>${ex(metadata.editor)}</publisher>
        <availability><p>For academic use.</p></availability>
      </publicationStmt>
      <sourceDesc>
        <msDesc>
          <msIdentifier>
            <settlement>${ex(metadata.settlement)}</settlement>
            <institution>${ex(metadata.institution)}</institution>
            <repository>${ex(metadata.repository)}</repository>
            <idno type="shelfmark">${ex(metadata.shelfmark)}</idno>
            <altIdentifier type="collection"><idno>${ex(metadata.collection)}</idno></altIdentifier>
          </msIdentifier>
          <msContents>
            <msItem><title>${ex(metadata.title_orig)}</title><note>${ex(metadata.title_note)}</note></msItem>
            <summary>${ex(metadata.summary)}</summary>
            <textLang mainLang="maz" otherLangs="spa lat eng">maz</textLang>
          </msContents>
          <physDesc>
            <objectDesc form="codex"><supportDesc><extent>${ex(metadata.phys_extent)}</extent></supportDesc><layoutDesc><layout columns="2">${ex(metadata.phys_layout)}</layout></layoutDesc></objectDesc>
            <handDesc><handNote>${ex(metadata.hand_note)}</handNote></handDesc>
          </physDesc>
          <history><origin><origDate>begun ${ex(metadata.orig_date)}</origDate><origPlace>${ex(metadata.orig_place)}</origPlace></origin></history>
        </msDesc>
      </sourceDesc>
    </fileDesc>
    <encodingDesc>
      <projectDesc><p>${ex(metadata.project_desc)}</p></projectDesc>
    </encodingDesc>
  </teiHeader>
  <text>
    <body>
      <div type="vocabulary">
        <pb n="${ex(metadata.pb_n)}" facs="${ex(metadata.image_source)}"/>
        <head>
          <title type="orig" xml:lang="spa">${ex(metadata.title_orig)}</title>
          <title type="norm" xml:lang="spa">${ex(metadata.title_norm)}</title>
          <title type="gloss" xml:lang="eng">${ex(metadata.title_gloss)}</title>
        </head>
${acrossXml ? acrossXml + '\n' : ''}        <!-- COLUMN 1 -->
${renderColumn('col1', '1')}
        <!-- COLUMN 2 -->
${renderColumn('col2', '2')}
      </div>
    </body>
  </text>
</TEI>`;
};

export const generateExportFilename = (metadata: Metadata): string => {
  const sanitize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const authorParts = metadata.author.trim().split(/\s+/);
  const author = sanitize(authorParts[authorParts.length - 1] || 'unknown');
  const keyword = sanitize(metadata.filename_keyword || metadata.title_orig.split(/\s+/)[0] || 'keyword');
  const yearMatch = metadata.orig_date.match(/\d{4}/);
  const date = yearMatch ? yearMatch[0] : 'date';
  return `${author}_${keyword}_${date}_p${metadata.pb_n || '0'}.xml`;
};
