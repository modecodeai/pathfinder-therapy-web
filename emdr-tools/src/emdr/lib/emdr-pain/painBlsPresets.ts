import type { RoomState } from '../../../types/room';
import { withSpeed01 } from '../../../types/room';

/** Grant Pain Default — Protocol Guidance (Mark Grant materials). Clinician may override. */
export function grantPainDefaultPatch(current: RoomState): Partial<RoomState> {
  return {
    ...withSpeed01(current, 0.45),
    visualEnabled: false,
    audioEnabled: true,
    audioOnly: true,
    continuous: true,
    setMode: 'continuous',
    audioSound: 'soft-tone',
    audioVolume: 0.4,
    syncAudioWithVisual: true,
    muteTherapistAudio: false,
    visualMode: 'horizontal',
    taxationMode: 'standard',
    taxationReduceVisualVariation: true,
    taxationDisableColour: true,
  };
}

/** Pain Visual BLS — Practice Tool alternative when clinician chooses visual. */
export function painVisualBlsPatch(current: RoomState): Partial<RoomState> {
  return {
    ...withSpeed01(current, 0.4),
    visualEnabled: true,
    audioEnabled: false,
    audioOnly: false,
    continuous: true,
    setMode: 'continuous',
    visualMode: 'horizontal',
    taxationMode: 'standard',
    taxationReduceVisualVariation: true,
  };
}

/** Pain Installation — Slow BLS (source: short protocol — 8 slow bilateral eye movements). */
export function painInstallationSlowPatch(current: RoomState): Partial<RoomState> {
  return {
    ...withSpeed01(current, 0.12),
    visualEnabled: true,
    audioEnabled: false,
    audioOnly: false,
    continuous: false,
    setMode: 'passes',
    targetPasses: 8,
    visualMode: 'horizontal',
    taxationMode: 'standard',
  };
}

export const GRANT_PAIN_DEFAULT_LABEL = 'Grant Pain Default';
export const PAIN_VISUAL_BLS_LABEL = 'Pain Visual BLS';
export const PAIN_INSTALL_SLOW_LABEL = 'Pain Installation — Slow BLS';
