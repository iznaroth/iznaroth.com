// The focus stack records what the user has drilled into, bottom to top:
//   { type: 'entity', name }   an entity the map is framed on
//   { type: 'marker', view }   a major marker (or footer post) shown in the info panel / popout
// Entities are never nested: focusing an entity replaces the whole stack.

export const topOf = stack => stack[stack.length - 1];
export const entityNameOf = stack => stack.find(entry => entry.type === 'entity')?.name ?? null;

// A marker on top is replaced by the next marker instead of stacking, so "go back" always lands on the entity.
export const pushMarker = (stack, view) => [
  ...(topOf(stack)?.type === 'marker' ? stack.slice(0, -1) : stack),
  { type: 'marker', view },
];

// What "go back" does from this stack. `then` says how the camera should respond:
//   'none'   nothing to go back from
//   'exit'   leave the entity (back to the map, as before)
//   'entity' return to the framed entity (a marker was on top of it)
//   'origin' fly home (a marker was on top with no entity beneath it, i.e. the popout view)
export function backFrom(stack) {
  const top = topOf(stack);
  if (!top) return { next: stack, then: 'none' };
  if (top.type === 'entity') return { next: [], then: 'exit' };
  const next = stack.slice(0, -1);
  const entity = entityNameOf(next);
  return { next, then: entity ? 'entity' : 'origin', entity };
}
