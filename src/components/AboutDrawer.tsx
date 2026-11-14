import { BUILD_SHA } from '../build-info';
import { DISCLAIMER } from '../content/copy';
import { Drawer } from './Drawer';

export function AboutDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Drawer open={open} onClose={onClose} title="About this game" id="about-drawer">
      <p className="drawer-lead">{DISCLAIMER}</p>
      <h3>Made with AI help</h3>
      <p>
        The code, words, sounds and pictures in this game were written with help from an AI assistant (Claude), directed by the student team. The pictures are drawn with code. No AI image
        or video generator was used.
      </p>
      <h3>Real data</h3>
      <p>Space weather records come from NASA&apos;s DONKI database (Community Coordinated Modeling Center). They are an archived copy, not live data. NASA does not endorse this game.</p>
      <h3>What is made up</h3>
      <p>The base, the crew, the power, oxygen and sample numbers, and the safety rule are made up for the game. The game does not measure or predict radiation, health or safety.</p>
      <h3>Privacy</h3>
      <p>No accounts, no tracking and no data collection. Your saved mission stays on this device.</p>
      <p className="mono build-id">Build {BUILD_SHA.slice(0, 12)}</p>
    </Drawer>
  );
}
