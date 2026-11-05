export const cls = (...parts) => parts.filter(Boolean).join(' ');

// Superentity name -> CSS font class. Paste the same table into the editor's getParentFontClass stub.
export const PARENT_FONT_CLASS = {
  'MIDLAND COUNCIL (XII)': 'midland',
  'INDEPENDENTS': 'independents',
  'THE UNMORTAL LEAGUE': 'unmortal',
  'SALÍRAN DYNASTIES': 'salir',
  'DRAIDIC PACT': 'draid',
  'FAR-NORTHERN ENCLAVE': 'enclave',
  'THE THIRD MANDATE OF POWER': 'mandate',
  'THE FRONTIER': 'frontier',
  'ESOTERICS': 'esoterics',
};

export const parentFontClass = name => PARENT_FONT_CLASS[name] ?? '';
