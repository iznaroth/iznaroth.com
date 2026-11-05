// Where marker prose comes from, and how it becomes HTML.
//
// Placement (position, type, parent entity) comes from the editor's marker_data.json. Prose comes from the CMS,
// joined to a marker by NAME, the same way entity shapes are joined to their CMS entries. The blurb/passage typed
// into the editor are only a fallback for markers with no CMS entry.
//
// To turn the CMS source on, set QUERY_MARKERS to a GraphQL query string. Left null, nothing is fetched. Example:
//
//   export const QUERY_MARKERS = `{
//     mapMarkers(first: 1000) { name subtitle nameColor { hex } blurb content }
//   }`;
//
// Model and field names above are placeholders: use your schema's. If the records live in an existing model
// (Dharshav's post, for instance), point RESULT_KEY at it. normalizeCmsMarker is the one place to adapt field names.
export const QUERY_MARKERS = null;
const RESULT_KEY = 'mapMarkers';

// CMS record -> what the site uses. `content` may be an HTML string or a rich-text field ({ html }).
export const normalizeCmsMarker = raw => ({
  name: raw.name,
  subtitle: raw.subtitle,
  color: raw.nameColor?.hex,
  blurb: raw.blurb,
  html: (typeof raw.content === 'string' ? raw.content : raw.content?.html) ?? '',
});

export async function fetchCmsMarkers(client) {
  if (!QUERY_MARKERS) return [];
  const res = await client.request(QUERY_MARKERS);
  return (res[RESULT_KEY] ?? []).map(normalizeCmsMarker);
}

// HTML passes through untouched (as Dharshav's post does). Anything without tags is treated as plain text:
// escaped, with blank lines becoming paragraphs and single newlines becoming <br>.
const HAS_TAG = /<\/?[a-z][^>]*>/i;
const escapeHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function toHtml(content) {
  if (!content || !content.trim()) return '';
  if (HAS_TAG.test(content)) return content;
  return content.trim().split(/\n\s*\n/).map(p => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`).join('');
}
