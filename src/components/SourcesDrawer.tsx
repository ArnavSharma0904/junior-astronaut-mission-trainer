import { useEffect, useRef } from 'react';
import { kindCopy } from '../content/copy';
import { formatUtc } from '../content/evidence';
import { snapshot, sources } from '../data';
import type { SourceRecord } from '../data/schema';
import { Drawer } from './Drawer';
import { Icon, type IconName } from './Icon';

const ORDER: SourceRecord['kind'][] = ['observation', 'curated-analysis', 'model-output', 'educational-resource', 'game-assumption'];
const ICONS: Record<SourceRecord['kind'], IconName> = { observation: 'eye', 'curated-analysis': 'eye', 'model-output': 'model', 'educational-resource': 'book', 'game-assumption': 'gear' };

function Record({ record, highlighted }: { record: SourceRecord; highlighted: boolean }) {
  const ref = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (!highlighted) return;
    // The dialog opens in the parent's effect, which runs after this one, so wait a frame before moving focus into it.
    const frame = requestAnimationFrame(() => {
      ref.current?.focus();
      ref.current?.scrollIntoView({ block: 'center' });
    });
    return () => cancelAnimationFrame(frame);
  }, [highlighted]);
  return (
    <li ref={ref} id={`source-${record.id}`} className="source" data-highlighted={highlighted} tabIndex={-1}>
      <p className="source-claim">{record.supportedClaim}</p>
      <dl className="source-facts">
        <div>
          <dt>From</dt>
          <dd>
            {record.provider}
            {record.datasetId ? `, ${record.datasetId}` : ''}
          </dd>
        </div>
        {record.rawIds.length > 0 ? (
          <div>
            <dt>Record id</dt>
            <dd className="mono">{record.rawIds.length > 2 ? `${record.rawIds[0]} and ${record.rawIds.length - 1} more` : record.rawIds.join(', ')}</dd>
          </div>
        ) : null}
        {record.observedAt ? (
          <div>
            <dt>Event time</dt>
            <dd className="mono">{formatUtc(record.observedAt)}</dd>
          </div>
        ) : null}
        {record.originalUnits ? (
          <div>
            <dt>Units</dt>
            <dd>{record.originalUnits}</dd>
          </div>
        ) : null}
        {record.retrievedAt ? (
          <div>
            <dt>Copied on</dt>
            <dd className="mono">{formatUtc(record.retrievedAt)}</dd>
          </div>
        ) : null}
        <div>
          <dt>Does not show</dt>
          <dd>{record.notSupported.join('. ')}.</dd>
        </div>
        <div>
          <dt>Notes</dt>
          <dd>{record.usageNotes}</dd>
        </div>
      </dl>
      {record.recordUrl ? (
        <a href={record.recordUrl} target="_blank" rel="noreferrer noopener">
          Open the source website (new tab)
        </a>
      ) : null}
    </li>
  );
}

export function SourcesDrawer({ open, onClose, focusId }: { open: boolean; onClose: () => void; focusId: string | null }) {
  return (
    <Drawer open={open} onClose={onClose} title="Sources and science" id="sources-drawer">
      <p className="drawer-lead">
        The space weather in this mission really happened. It is an <strong>archived NASA record, not live data</strong>, copied on {formatUtc(snapshot.createdAt)}. The numbers for power,
        oxygen and samples are made up for the game.
      </p>
      {ORDER.map((kind) => {
        const records = sources.records.filter((record) => record.kind === kind);
        if (records.length === 0) return null;
        return (
          <section key={kind} className="source-group" data-kind={kind}>
            <h3>
              <Icon name={ICONS[kind]} />
              {kindCopy[kind].tag}
            </h3>
            <p className="source-group-note">{kindCopy[kind].description}</p>
            <ul>
              {records.map((record) => (
                <Record key={record.id} record={record} highlighted={record.id === focusId} />
              ))}
            </ul>
          </section>
        );
      })}
    </Drawer>
  );
}
