import type { PauseReason, Requirement, Weather } from '../game/types';

/**
 * All player-facing words. Written for ages 7 to 12: short sentences, plain words, calm tone.
 * Game numbers never appear here: they are rendered from the mission data so words and numbers cannot drift apart.
 */
export const GAME_TITLE = 'Junior Astronaut Mission Trainer';
export const MISSION_NAME = 'Storm Watch';
export const OBJECTIVE = 'Collect ice samples and keep the crew safe.';
export const DISCLAIMER = 'Independent student project. Not endorsed by NASA.';

export const turnCopy: Record<string, { title: string; situation: string; lesson: string }> = {
  'morning-check': {
    title: 'Morning check',
    situation: 'A busy spot on the Sun has been firing off big flares. Your base is running well. What should the team do first?',
    lesson: 'Engineers trade one thing for another. Nothing is free.',
  },
  'flare-seen': {
    title: 'Flare seen',
    situation: 'Satellites just saw a strong flare. Its light reached the Moon in about eight minutes. A big cloud is leaving the Sun too.',
    lesson: 'Flare light is very fast. It is the first warning.',
  },
  'forecast-changes': {
    title: 'The forecast changes',
    situation: 'A NASA computer model made a forecast for the cloud. A few hours later a new run gave a different answer. Storms are hard to predict.',
    lesson: 'A forecast is a careful guess. It can change, so plan ahead.',
  },
  'particle-storm': {
    title: 'Particle storm',
    situation: 'A bigger flare just peaked. Fast particles can follow. The archive gap is not a Moon arrival time and not a guaranteed warning. The crew needs to be in the shelter now.',
    lesson: 'Fast particles can arrive soon after a flare. Getting ready early pays off. Not every flare brings local danger.',
  },
  'storm-continues': {
    title: 'Storm continues',
    situation: 'In this game the crew is behind thick Moon soil. Real shielding can reduce exposure, and it is not a promise that the storm is safe. Work is slower in here, and the stored oxygen needs looking after.',
    lesson: 'Shelter can reduce exposure. This game does not measure a real dose. Work slows down. Remote tools help.',
  },
  'all-clear': {
    title: 'All clear',
    situation: 'Mission Control says the storm has passed. This is your last move. Finish the job, or build up your reserves?',
    lesson: 'After a storm, check your reserves before you push on.',
  },
};

export const actionCopy: Record<string, { label: string; effect: string; happened: string }> = {
  'drill-1': { label: 'Run the ice drill', effect: 'Dig for an ice sample. The drill is hungry for power.', happened: 'The drill pulled up an ice sample and used a lot of power.' },
  'charge-1': { label: 'Charge the batteries', effect: 'Turn the solar panels to the low Sun and fill up.', happened: 'The panels soaked up sunlight. No drilling got done.' },
  'grow-1': { label: 'Boost the greenhouse', effect: 'Give the plants more light. In this game that adds oxygen right away.', happened: 'The plants got extra light. In this game that adds oxygen right away. Real plants would not fill a base this fast.' },
  'drill-2': { label: 'Keep drilling', effect: 'Get another sample while the sky is still calm.', happened: 'The drill pulled up another sample and used a lot of power.' },
  'stock-2': { label: 'Stock the shelter', effect: 'Move air tanks and tools into the shelter, just in case.', happened: 'The shelter is ready. Moving supplies used some power and air.' },
  'charge-2': { label: 'Charge the batteries', effect: 'Top up power before things get busy.', happened: 'The batteries filled up a bit more. No drilling got done.' },
  'drill-3': { label: 'Keep drilling', effect: 'Trust the later forecast and keep working.', happened: 'The drill pulled up another sample and used a lot of power.' },
  'grow-3': { label: 'Boost the greenhouse', effect: 'Give the plants more light before the storm. The oxygen added here is a game unit.', happened: 'The plants got extra light. In this game that adds oxygen right away. Real plants would not fill a base this fast.' },
  'stock-3': { label: 'Stock the shelter', effect: 'Get the shelter ready before the storm.', happened: 'The shelter is ready. Moving supplies used some power and air.' },
  'shelter-4': { label: 'Go to the shelter', effect: 'Stop work and get everyone behind thick Moon soil.', happened: 'Everyone moved into the shelter.' },
  'remote-4': { label: 'Shelter and drill by remote', effect: 'Get safe, then drive the drill from inside.', happened: 'The crew got safe and ran the drill by remote control. That used a lot of power.' },
  'outside-4': { label: 'Keep working outside', effect: 'Stay out to finish the sample. This breaks the storm safety rule.', happened: 'The crew stayed outside during the storm. That breaks the safety rule, so Mission Control brought everyone inside and paused the mission.' },
  'rest-5': { label: 'Rest in low power', effect: 'Save power and wait. The shelter air gets used up.', happened: 'The base ran on low power. The air in the shelter went down.' },
  'remote-5': { label: 'Drill by remote', effect: 'Drive the drill from inside the shelter.', happened: 'The crew ran the drill by remote control. That used a lot of power.' },
  'reserve-5': { label: 'Release reserve oxygen', effect: 'Open a stored oxygen tank. It uses power, and the amount is a game unit.', happened: 'A stored oxygen tank was opened. Cleaning the air does not make new oxygen. This number is a made-up game unit.' },
  'drill-6': { label: 'Drill on the surface', effect: 'Head back out for one more sample.', happened: 'The crew went back out and drilled one more sample.' },
  'repair-6': { label: 'Repair and recharge', effect: 'Dust off the panels and fill the batteries.', happened: 'The crew cleaned the panels and the batteries filled up.' },
  'grow-6': { label: 'Restart the greenhouse', effect: 'Turn the plant lights back on. The oxygen added here is a game unit.', happened: 'The greenhouse is running again. In this game that adds oxygen right away. Real plants would not fill a base this fast.' },
};

export const RUSHED_NOTE = 'The shelter was not stocked, so the crew had to rush. That cost extra power and air.';
export const UPKEEP_NOTE = 'Every turn the base uses a little power and the crew breathes some oxygen.';

export const principleCopy: Record<string, string> = {
  'trade-offs': 'Every choice uses something up. Good engineers decide what matters most right now.',
  'plants-make-oxygen': 'Plants can give back oxygen, but not this fast. Extra light in this game adds oxygen right away, and that speed is made up. The plant study does not measure it.',
  'reserve-oxygen': 'Cleaning carbon dioxide out of the air does not make new oxygen. Crews also carry stored oxygen. This button opens a made-up reserve tank.',
  'flare-light-is-fast': 'A flare is a burst of light from the Sun. Light takes about eight minutes to get here, so we see a flare soon after it happens.',
  'prepare-early': 'Getting ready before trouble arrives is cheaper than rushing later.',
  'forecasts-change': 'Scientists use computer models to guess when a solar cloud will arrive. New information can change the guess.',
  'particles-follow-fast': 'After some flares, tiny fast particles race out from the Sun. They can arrive in minutes to hours, long before the slow cloud. A gap between two archived records is not a countdown for the Moon.',
  'shelter-rule': 'The Moon has no thick air or magnetic shield like Earth. Crews plan to shelter behind thick material, such as Moon soil, during a particle storm. Shielding can reduce exposure. It is not a guarantee.',
  'shelter-slows-work': 'Staying sheltered can reduce exposure, but it is not a promise of safety, and it is harder to get work done. Robots and remote controls can help.',
  'rebuild-reserves': 'A good mission ends with something left in the tank for the next crew.',
};

export const weatherCopy: Record<Weather, { label: string; description: string }> = {
  quiet: { label: 'Quiet', description: 'The Sun is calm.' },
  watch: { label: 'Watch', description: 'The Sun is active. Keep an eye on it.' },
  storm: { label: 'Storm', description: 'A particle storm is under way. Crew should be in the shelter.' },
  clearing: { label: 'Clearing', description: 'The storm is easing.' },
};
export const WEATHER_NOTE = 'This space weather sign is part of the game. It is not a real measurement.';

export function requirementCopy(requirement: Requirement): string {
  switch (requirement.kind) {
    case 'minPower':
      return `Needs at least ${requirement.value} power.`;
    case 'shelterStocked':
      return 'Needs a stocked shelter.';
    case 'shelterNotStocked':
      return 'The shelter is already stocked.';
  }
}

export const endingCopy = {
  success: { heading: 'Mission complete', body: 'You got the samples, kept the crew safe and left reserves for the next team. Great engineering.' },
  partial: { heading: 'Mission finished safely', body: 'The crew is safe, but the mission goals were not all met.' },
  paused: { heading: 'Mission paused: crew safe', body: 'Mission Control stopped the mission early. Everyone is safe.' },
} as const;

export const pauseCopy: Record<PauseReason, string> = {
  power: 'The base ran out of power. Without power the base cannot keep working.',
  oxygen: 'The oxygen reserve ran out. Mission Control switched to the backup supply and ended the mission.',
  'safety-rule': 'The crew stayed outside during the particle storm, so the safety rule paused the mission. Mission Control then brought everyone inside. Everyone is safe.',
};

export const missingCopy = {
  samples: 'Not enough ice samples.',
  power: 'Power reserve too low for the next crew.',
  oxygen: 'Oxygen reserve too low for the next crew.',
} as const;

export const kindCopy = {
  observation: { tag: 'Observed', description: 'Something instruments or scientists recorded.' },
  'curated-analysis': { tag: 'Measured by forecasters', description: 'Numbers that space weather forecasters worked out from images.' },
  'model-output': { tag: 'Forecast model', description: 'A computer model made this estimate. It is a forecast, not something that was seen.' },
  'educational-resource': { tag: 'Learn more', description: 'A teaching resource from a space agency.' },
  'game-assumption': { tag: 'Game rule', description: 'Made up for this game so the choices are clear.' },
} as const;
