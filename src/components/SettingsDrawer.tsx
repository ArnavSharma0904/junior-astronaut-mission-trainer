import { useState } from 'react';
import type { Settings } from '../state/settings';
import { Drawer } from './Drawer';

interface Props {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  onReset: () => void;
  hasSave: boolean;
}

export function SettingsDrawer({ open, onClose, settings, update, onReset, hasSave }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [erased, setErased] = useState(false);
  return (
    <Drawer open={open} onClose={() => { setConfirming(false); setErased(false); onClose(); }} title="Settings" id="settings-drawer">
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
        <p>Your mission is saved on this device only. Nothing is sent anywhere.</p>
        {erased ? <p role="status">Saved mission erased.</p> : null}
        {confirming ? (
          <div className="confirm-row">
            <p>Erase the saved mission and go back to the start?</p>
            <button type="button" className="button button-danger" onClick={() => { onReset(); setConfirming(false); setErased(true); }}>
              Yes, erase it
            </button>
            <button type="button" className="button" onClick={() => setConfirming(false)}>
              Keep it
            </button>
          </div>
        ) : (
          <button type="button" className="button" disabled={!hasSave} onClick={() => { setErased(false); setConfirming(true); }}>
            Erase saved mission
          </button>
        )}
        {!hasSave && !erased ? <p>There is no saved mission right now.</p> : null}
      </div>
    </Drawer>
  );
}
