import { BUILD_SHA } from '../build-info';
import { DISCLAIMER } from '../content/copy';
import { Drawer } from './Drawer';

export function AboutDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Drawer open={open} onClose={onClose} title="About this game" id="about-drawer">
      <p className="drawer-lead">{DISCLAIMER}</p>
      <h3>Made with AI help</h3>
      <p>
        The code, words, sounds and pictures were written with help from AI assistants (Claude, then Cursor running Grok), directed by the student team. The pictures are drawn with code. No AI image
        or video generator was used. NASA does not endorse this game, and no NASA logo is used.
      </p>
      <h3>Real data</h3>
      <p>Space weather records come from NASA&apos;s DONKI database (Community Coordinated Modeling Center). They are an archived copy, not live data. NASA does not endorse this game.</p>
      <h3>What is made up</h3>
      <p>
        The base, the crew, the power, oxygen and sample numbers, and the safety rule are made up for the game. Thick soil can reduce exposure. This game does not measure a dose, does not promise anyone is safe, and does not time a particle arrival at the Moon. The 47-minute figure is only the gap between two archived records.
      </p>
      <h3>Privacy</h3>
      <p>No accounts, no tracking and no data collection. Your saved mission stays on this device.</p>
      <p className="mono build-id">Build {BUILD_SHA.slice(0, 12)}</p>
    </Drawer>
  );
}
