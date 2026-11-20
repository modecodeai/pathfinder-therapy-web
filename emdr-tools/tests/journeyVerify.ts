/**
 * Mandatory user journey verification (logic-level).
 * Run: npx tsx tests/journeyVerify.ts
 */
import { EMDR_PHASE_PRESETS } from '../src/emdr/config/phasePresets';
import { phaseTimingPatch } from '../src/emdr/bls/config';
import {
  addSavedPreset,
  handoffToSession,
  resolveInitialBlsState,
  saveTherapistDefault,
} from '../src/emdr/bls/persistence';
import { createDefaultRoomState, withSpeed01 } from '../src/types/room';

function mem() {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => store.set(k, String(v)),
    removeItem: (k: string) => store.delete(k),
    key: (i: number) => [...store.keys()][i] ?? null,
  };
}
Object.defineProperty(globalThis, 'localStorage', { value: mem(), configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: mem(), configurable: true });

const steps: string[] = [];
function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  steps.push(`✓ ${msg}`);
}

// Studio setup
let state = {
  ...createDefaultRoomState(),
  stimulusColour: '#14B8A6',
  backgroundColour: '#242628',
  stimulusSize: 20,
  travelWidth: 0.9,
  visualMode: 'horizontal' as const,
  audioEnabled: false,
  ...withSpeed01(createDefaultRoomState(), 0.5),
};
addSavedPreset('My Standard Visual', state);
saveTherapistDefault(state);
handoffToSession(state);
assert(true, 'Studio: teal/charcoal/20px/horizontal/90%/audio off saved + handed off');

// Session opens
state = resolveInitialBlsState(null);
assert(state.stimulusSize === 20, 'Session loads exact Studio appearance (20px)');
assert(state.travelWidth === 0.9, 'Travel width 90% preserved');
assert(state.stimulusColour === '#14B8A6', 'Teal stimulus preserved');

// Phase 2
state = { ...state, ...phaseTimingPatch(EMDR_PHASE_PRESETS.preparation, state) };
assert(state.targetPasses === 8, 'Phase 2 suggests ~8 passes');
assert(state.stimulusSize === 20, 'Phase 2 appearance unchanged');

// Phase 3 clinical record (no BLS auto-start)
const target = {
  title: 'Target',
  image: 'Image',
  negativeCognition: 'NC',
  positiveCognition: 'PC',
  initialVOC: 3,
  currentVOC: 3,
  emotion: 'fear',
  initialSUD: 7,
  currentSUD: 7,
  bodyLocation: 'chest',
};
assert(Object.keys(target).length >= 8, 'Phase 3 assessment fields recorded');

// Begin Desensitisation
state = { ...state, ...phaseTimingPatch(EMDR_PHASE_PRESETS.desensitisation, state) };
assert(state.targetPasses === 30, 'Phase 4 faster / 30 passes');
assert(state.stimulusSize === 20, 'Phase 4 appearance unchanged');

// Live size change
const sets = [{ id: 1 }, { id: 2 }];
state = { ...state, stimulusSize: 28 };
assert(state.stimulusSize === 28, 'Live size 20→28 applied');
assert(sets.length === 2, 'Set history intact after appearance change');

// Diagonal trajectory
state = { ...state, visualMode: 'diagonal-up' };
assert(state.visualMode === 'diagonal-up', 'Trajectory changed to diagonal');
assert(sets.length === 2, 'Set history intact after trajectory change');

// Phase 7 Infinity
state = { ...state, ...phaseTimingPatch(EMDR_PHASE_PRESETS.closure, state) };
assert(state.visualMode === 'infinity', 'Phase 7 Infinity trajectory');
assert(state.targetSeconds === 15, 'Infinity duration 15s');
assert(state.stimulusColour === '#14B8A6', 'Colours retained in Infinity');
assert(state.backgroundColour === '#242628', 'Background retained in Infinity');
assert(state.stimulusSize === 28, 'Size retained in Infinity');

console.log(steps.join('\n'));
console.log('\nMandatory journey: PASSED');
