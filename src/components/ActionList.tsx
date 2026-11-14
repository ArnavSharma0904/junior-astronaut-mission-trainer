import { actionCopy, requirementCopy, UPKEEP_NOTE } from '../content/copy';
import type { ActionPreview } from '../game/selectors';
import { DeltaChips } from './Chips';
import { Icon } from './Icon';

interface Props {
  previews: ActionPreview[];
  selectedId: string | null;
  resolving: boolean;
  onSelect: (id: string) => void;
  onConfirm: () => void;
}

/**
 * The decision. A native radio group gives arrow-key movement for free. An unavailable choice stays focusable
 * and explains why it cannot be taken. Confirm is a separate button and is disabled while a decision resolves.
 */
export function ActionList({ previews, selectedId, resolving, onSelect, onConfirm }: Props) {
  const selected = previews.find((preview) => preview.action.id === selectedId) ?? null;
  return (
    <form
      className="actions"
      onSubmit={(event) => {
        event.preventDefault();
        onConfirm();
      }}
    >
      <div className="choice-scroll">
      <fieldset disabled={resolving}>
        <legend>Choose one</legend>
        <div className="choice-list">
        {previews.map((preview) => {
          const copy = actionCopy[preview.action.id]!;
          const id = `action-${preview.action.id}`;
          const sets = preview.action.sets;
          const note = preview.action.breaksSafetyRule ? 'Breaks the safety rule' : sets?.crew === 'sheltered' ? 'Crew to shelter' : sets?.shelterStocked ? 'Shelter stocked' : undefined;
          return (
            <label key={preview.action.id} className="choice" htmlFor={id} data-selected={selectedId === preview.action.id} data-available={preview.available} data-testid={`choice-${preview.action.id}`}>
              <input
                type="radio"
                id={id}
                name="action"
                value={preview.action.id}
                checked={selectedId === preview.action.id}
                aria-disabled={!preview.available}
                aria-describedby={`${id}-details`}
                onChange={() => {
                  if (preview.available) onSelect(preview.action.id);
                }}
              />
              <span className="choice-body">
                <span className="choice-title">
                  {!preview.available ? <Icon name="lock" size={18} /> : null}
                  {preview.action.breaksSafetyRule ? <Icon name="warning" size={18} /> : null}
                  {copy.label}
                </span>
                <span id={`${id}-details`} className="choice-details">
                  <span className="choice-effect">{copy.effect}</span>
                  {preview.available ? (
                    <DeltaChips delta={preview.delta} note={preview.rushed ? `${note ?? ''} (rushed)`.trim() : note} />
                  ) : (
                    <span className="choice-blocked">Not available. {preview.blockedBy ? requirementCopy(preview.blockedBy) : ''}</span>
                  )}
                </span>
              </span>
            </label>
          );
        })}
        </div>
      </fieldset>
      </div>
      <p className="upkeep-note">{UPKEEP_NOTE}</p>
      <div className="confirm-bar">
        <button type="submit" className="button button-primary button-confirm" disabled={resolving || !selected} data-testid="confirm">
          {resolving ? 'Working…' : selected ? `Confirm: ${actionCopy[selected.action.id]!.label}` : 'Pick a choice first'}
        </button>
      </div>
    </form>
  );
}
