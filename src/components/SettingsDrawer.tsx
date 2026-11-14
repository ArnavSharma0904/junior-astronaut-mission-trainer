import { useState } from 'react';
import type { Settings } from '../state/settings';
import type { SaveStatus } from '../state/useMission';
import { Drawer } from './Drawer';

interface Props {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  onReset: () => boolean;
  hasSave: boolean;
  saveStatus: SaveStatus;
}

export function SettingsDrawer({ open, onClose, settings, update, onReset, hasSave, saveStatus }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [eraseNotice, setEraseNotice] = useState<'erased' | 'still-there' | null>(null);
  return (
    <Drawer open={open} onClose={() => { setConfirming(false); setEraseNotice(null); onClose(); }} title="Settings" id="settings-drawer">
      <div className="setting">
        <label className="switch">
          <input type="checkbox" role="switch" checked={!settings.muted} onChange={(event) => update({ muted: !event.target.checked })} />
          <span>Sound</span>
        </label>
        <p>Short beeps when you choose. Off until you turn it on. Everything is also shown on screen.</p>
      </div>
      <fieldset className="setting">
        <legend>Motion</legend>
        {(
          [
            ['system', 'Follow my device'],
            ['on', 'Reduce motion'],
            ['off', 'Full motion'],
          ] as const
        ).map(([value, label]) => (
          <label key={value} className="radio">
            <input type="radio" name="motion" value={value} checked={settings.reducedMotion === value} onChange={() => update({ reducedMotion: value })} />
            <span>{label}</span>
          </label>
        ))}
        <p>Reduce motion shows changes at once, with no moving parts.</p>
      </fieldset>
      <div className="setting">
        <label className="switch">
          <input type="checkbox" role="switch" checked={settings.lowEffects} onChange={(event) => update({ lowEffects: event.target.checked })} />
          <span>Low effects</span>
        </label>
        <p>Turns off glow, particles and scan lines. Good for slower devices.</p>
      </div>
      <div className="setting">
        <h3>Saved mission</h3>
        <p data-testid="save-status">
          {saveStatus === 'failed'
            ? 'The latest progress could not be saved on this device. You can keep playing. A reload keeps only the last save that worked.'
            : hasSave
              ? 'Your mission is saved on this device only. Nothing is sent anywhere.'
              : 'Nothing is sent anywhere.'}
        </p>
        {eraseNotice === 'erased' ? <p role="status">Saved mission erased.</p> : null}
        {eraseNotice === 'still-there' ? (
          <p role="status" data-testid="erase-failed">
            The saved mission is still on this device. Erase did not work. You can keep playing and try again.
          </p>
        ) : null}
        {confirming ? (
          <div className="confirm-row">
            <p>Erase the saved mission and go back to the start?</p>
            <button
              type="button"
              className="button button-danger"
              onClick={() => {
                const removed = onReset();
                setConfirming(false);
                setEraseNotice(removed ? 'erased' : 'still-there');
              }}
            >
              Yes, erase it
            </button>
            <button type="button" className="button" onClick={() => setConfirming(false)}>
              Keep it
            </button>
          </div>
        ) : (
          <button type="button" className="button" disabled={!hasSave} onClick={() => { setEraseNotice(null); setConfirming(true); }}>
            Erase saved mission
          </button>
        )}
        {!hasSave && eraseNotice !== 'erased' ? <p>There is no saved mission right now.</p> : null}
      </div>
    </Drawer>
  );
}
