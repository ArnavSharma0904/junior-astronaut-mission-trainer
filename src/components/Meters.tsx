import { weatherCopy, WEATHER_NOTE } from '../content/copy';
import { band, type ActionPreview } from '../game/selectors';
import type { GameState, MissionDef } from '../game/types';
import { Icon, type IconName } from './Icon';

const BAND_WORD = { strong: 'Strong', steady: 'Steady', low: 'Low' } as const;
const WEATHER_LEVEL = { quiet: 0, watch: 1, storm: 3, clearing: 2 } as const;

function ResourceMeter({ id, label, icon, value, preview }: { id: string; label: string; icon: IconName; value: number; preview: number | null }) {
  const level = band(value);
  const filled = Math.ceil(value / 10);
  const after = preview === null ? null : Math.max(0, Math.min(100, value + preview));
  const afterFilled = after === null ? filled : Math.ceil(after / 10);
  return (
    <div className="meter" data-band={level} data-testid={`meter-${id}`}>
      <div className="meter-label-row">
        <Icon name={icon} />
        <span className="meter-label">{label}</span>
      </div>
      <div className="meter-state" data-testid={`state-${id}`}>
        {level === 'low' ? <Icon name="warning" size={16} /> : null}
        <span className="meter-band">{BAND_WORD[level]}</span>
      </div>
      <div className="meter-number-row">
        <span className="mono meter-number" data-testid={`value-${id}`}>
          {value}
        </span>
        {after !== null && preview !== 0 ? (
          <span className="meter-preview mono" data-testid={`preview-${id}`}>
            <span aria-hidden="true">→</span> <span className="visually-hidden">would become</span> {after}
          </span>
        ) : null}
      </div>
      <span className="meter-unit">of 100 game units</span>
      <div className="meter-bar" aria-hidden="true">
        {Array.from({ length: 10 }, (_, index) => {
          const on = index < filled;
          const ghost = after !== null && ((index >= afterFilled && index < filled) || (index >= filled && index < afterFilled));
          return <span key={index} className="meter-segment" data-on={on} data-ghost={ghost} />;
        })}
        <span className="meter-tick" />
      </div>
    </div>
  );
}

export function Meters({ state, mission, preview }: { state: GameState; mission: MissionDef; preview: ActionPreview | null }) {
  const net = preview && preview.available ? preview.net : null;
  const level = WEATHER_LEVEL[state.spaceWeather];
  return (
    <section className="meters" aria-label="Base status">
      <ResourceMeter id="power" label="Power" icon="bolt" value={state.resources.power} preview={net ? net.power : null} />
      <ResourceMeter id="oxygen" label="Oxygen" icon="leaf" value={state.resources.oxygen} preview={net ? net.oxygen : null} />
      <div className="meter meter-samples" data-testid="meter-samples">
        <div className="meter-label-row">
          <Icon name="sample" />
          <span className="meter-label">Ice samples</span>
        </div>
        <div className="meter-state" data-testid="state-samples" aria-hidden="true" />
        <div className="meter-number-row">
          <span className="mono meter-number" data-testid="value-samples">
            {state.samples}
          </span>
        </div>
        <span className="meter-unit">of {mission.goalSamples} needed</span>
        <div className="sample-pips" aria-hidden="true">
          {Array.from({ length: Math.max(mission.goalSamples, state.samples) }, (_, index) => (
            <span key={index} className="sample-pip" data-on={index < state.samples} />
          ))}
        </div>
      </div>
      <div className="status-chips">
        <span className="status-chip" data-testid="chip-crew" data-state={state.crew}>
          <Icon name={state.crew === 'sheltered' ? 'shield' : 'crew'} />
          Crew: {state.crew === 'sheltered' ? 'In shelter' : 'Working'}
        </span>
        <span className="status-chip" data-testid="chip-shelter" data-state={state.shelterStocked ? 'ready' : 'empty'}>
          <Icon name={state.shelterStocked ? 'check' : 'lock'} />
          Shelter: {state.shelterStocked ? 'Stocked' : 'Not stocked'}
        </span>
        <span className="status-chip status-weather" data-testid="chip-weather" data-state={state.spaceWeather} title={WEATHER_NOTE}>
          <Icon name="sun" />
          Space weather: {weatherCopy[state.spaceWeather].label}
          <span className="weather-level" aria-hidden="true">
            {'›'.repeat(level) || '·'}
          </span>
        </span>
      </div>
    </section>
  );
}
