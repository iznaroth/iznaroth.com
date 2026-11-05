/* 🤖 Beep-boop. This block was written in part or whole by an LLM.
MODEL: Sonnet 5.5
REVIEW STATUS: unreviewed
*/

// Painting ownership rules, kept free of React so they can be tested.
//
// `levels` is { entity, subentity, region }, each { owners: Map(cellKey -> owner name), entries: Map(name -> entry),
// dirty: Set(names whose merged shape needs rebuilding) }.
//
//  - A cell has at most one owner per level.
//  - Subentities only exist inside their parent entity: they can only be painted on cells the parent owns, and a cell
//    leaving an entity leaves its subentity too.
//  - Regions (geographic) are independent of both: they can cross entity borders and never affect political ownership.

// Removes a cell from whoever owns it at this level.
export function releaseCell(levels, level, hash) {
  const { owners, entries, dirty } = levels[level];
  const ownerName = owners.get(hash);
  if (ownerName === undefined) return;

  entries.get(ownerName)?.territories.delete(hash);
  owners.delete(hash);
  dirty.add(ownerName);
  if (level === 'entity') releaseCell(levels, 'subentity', hash);
}

// Paints one cell for `target` at `level`, or erases it from whoever owns it when `erasing`.
// Returns true if anything changed.
export function paintCell(levels, level, target, hash, cell, erasing) {
  const { owners, dirty } = levels[level];

  if (level === 'subentity' && levels.entity.owners.get(hash) !== target.parentEntity){
    return false;
  } 

  if (!erasing && owners.get(hash) === target.name) {
    return false; // already theirs
  }

  const hadOwner = owners.has(hash);
  releaseCell(levels, level, hash);
  if (erasing){
    return hadOwner;
  }

  target.territories.set(hash, structuredClone(cell));
  owners.set(hash, target.name);
  dirty.add(target.name);
  return true;
}
