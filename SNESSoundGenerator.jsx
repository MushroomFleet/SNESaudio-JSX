import React, { useState, useRef, useCallback, useEffect } from 'react';

// ============================================================================
// SNES SOUND GENERATOR - 16-bit Style Game Audio Effects
// ============================================================================
// Emulates the Sony SPC700 sound characteristics:
// - 8-channel sample-based synthesis
// - Gaussian interpolation (characteristic warmth)
// - Hardware echo with 8-tap FIR filtering
// - BRR-style compression artifacts
// ============================================================================

// --- SNES Color Palette (inspired by classic SNES UI) ---
const SNES_COLORS = {
  darkPurple: '#1a0a2e',
  midPurple: '#2d1b4e',
  accent: '#ff6b9d',
  accentAlt: '#c44569',
  gold: '#f9ca24',
  cyan: '#0abde3',
  green: '#10ac84',
  text: '#e8e8e8',
  textDim: '#8b8b9a',
  surface: '#251749',
  surfaceLight: '#3d2a6b',
};

// --- Styles ---
const styles = {
  container: {
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    background: `linear-gradient(135deg, ${SNES_COLORS.darkPurple} 0%, ${SNES_COLORS.midPurple} 100%)`,
    minHeight: '100vh',
    padding: '20px',
    color: SNES_COLORS.text,
    boxSizing: 'border-box',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    padding: '20px',
    background: SNES_COLORS.surface,
    borderRadius: '8px',
    border: `3px solid ${SNES_COLORS.accent}`,
    boxShadow: `0 0 20px ${SNES_COLORS.accent}40, inset 0 0 30px ${SNES_COLORS.darkPurple}`,
  },
  title: {
    fontSize: '18px',
    margin: '0 0 10px 0',
    color: SNES_COLORS.gold,
    textShadow: `2px 2px 0 ${SNES_COLORS.accentAlt}, 0 0 10px ${SNES_COLORS.gold}80`,
    letterSpacing: '2px',
  },
  subtitle: {
    fontSize: '8px',
    color: SNES_COLORS.textDim,
    margin: 0,
    letterSpacing: '1px',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  panel: {
    background: SNES_COLORS.surface,
    borderRadius: '8px',
    padding: '15px',
    border: `2px solid ${SNES_COLORS.surfaceLight}`,
    boxShadow: `0 4px 15px rgba(0,0,0,0.4)`,
  },
  panelTitle: {
    fontSize: '10px',
    color: SNES_COLORS.cyan,
    marginBottom: '15px',
    paddingBottom: '8px',
    borderBottom: `1px solid ${SNES_COLORS.surfaceLight}`,
    textTransform: 'uppercase',
    letterSpacing: '2px',
  },
  presetGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: '8px',
  },
  presetButton: {
    fontFamily: 'inherit',
    fontSize: '7px',
    padding: '12px 8px',
    background: `linear-gradient(180deg, ${SNES_COLORS.surfaceLight} 0%, ${SNES_COLORS.surface} 100%)`,
    border: `2px solid ${SNES_COLORS.accent}`,
    borderRadius: '4px',
    color: SNES_COLORS.text,
    cursor: 'pointer',
    transition: 'all 0.1s ease',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  presetButtonHover: {
    background: SNES_COLORS.accent,
    color: SNES_COLORS.darkPurple,
    transform: 'scale(1.02)',
    boxShadow: `0 0 15px ${SNES_COLORS.accent}80`,
  },
  sliderGroup: {
    marginBottom: '12px',
  },
  sliderLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '7px',
    marginBottom: '5px',
    color: SNES_COLORS.textDim,
  },
  slider: {
    width: '100%',
    height: '8px',
    borderRadius: '4px',
    background: SNES_COLORS.darkPurple,
    outline: 'none',
    cursor: 'pointer',
    WebkitAppearance: 'none',
  },
  select: {
    fontFamily: 'inherit',
    fontSize: '8px',
    padding: '8px 12px',
    background: SNES_COLORS.darkPurple,
    border: `2px solid ${SNES_COLORS.surfaceLight}`,
    borderRadius: '4px',
    color: SNES_COLORS.text,
    cursor: 'pointer',
    width: '100%',
  },
  playButton: {
    fontFamily: 'inherit',
    fontSize: '10px',
    padding: '15px 30px',
    background: `linear-gradient(180deg, ${SNES_COLORS.green} 0%, #0a8a6a 100%)`,
    border: 'none',
    borderRadius: '6px',
    color: SNES_COLORS.text,
    cursor: 'pointer',
    width: '100%',
    marginTop: '15px',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    boxShadow: `0 4px 0 #086650, 0 6px 15px rgba(0,0,0,0.4)`,
    transition: 'all 0.1s ease',
  },
  canvas: {
    width: '100%',
    height: '80px',
    background: SNES_COLORS.darkPurple,
    borderRadius: '4px',
    border: `2px solid ${SNES_COLORS.surfaceLight}`,
  },
  modeChip: {
    display: 'inline-block',
    fontSize: '6px',
    padding: '4px 8px',
    background: SNES_COLORS.accent,
    color: SNES_COLORS.darkPurple,
    borderRadius: '3px',
    marginRight: '5px',
    fontWeight: 'bold',
  },
  paramDisplay: {
    fontSize: '6px',
    color: SNES_COLORS.cyan,
    background: SNES_COLORS.darkPurple,
    padding: '10px',
    borderRadius: '4px',
    marginTop: '10px',
    fontFamily: 'monospace',
    lineHeight: '1.6',
    maxHeight: '120px',
    overflow: 'auto',
  },
};

// ============================================================================
// SNES PRESET DEFINITIONS
// ============================================================================
const SNES_PRESETS = {
  // --- MOVEMENT ---
  jump: {
    name: 'Jump',
    category: 'movement',
    waveform: 'square',
    baseFreq: 180,
    freqSweep: 2.5,
    duration: 0.18,
    attack: 0.01,
    decay: 0.08,
    sustain: 0.4,
    release: 0.08,
    filterFreq: 2500,
    filterQ: 1,
    echoDelay: 0,
    echoDecay: 0,
    bitCrush: 12,
    description: 'Classic platformer jump with pitch rise',
  },
  doubleJump: {
    name: 'Double Jump',
    category: 'movement',
    waveform: 'square',
    baseFreq: 280,
    freqSweep: 3.0,
    duration: 0.12,
    attack: 0.005,
    decay: 0.05,
    sustain: 0.3,
    release: 0.06,
    filterFreq: 3500,
    filterQ: 2,
    echoDelay: 0.05,
    echoDecay: 0.2,
    bitCrush: 10,
    description: 'Higher-pitched secondary jump',
  },
  dash: {
    name: 'Dash',
    category: 'movement',
    waveform: 'sawtooth',
    baseFreq: 120,
    freqSweep: 0.5,
    duration: 0.15,
    attack: 0.005,
    decay: 0.1,
    sustain: 0.2,
    release: 0.04,
    filterFreq: 1800,
    filterQ: 3,
    echoDelay: 0,
    echoDecay: 0,
    bitCrush: 8,
    description: 'Quick dash/dodge movement',
  },
  land: {
    name: 'Land',
    category: 'movement',
    waveform: 'triangle',
    baseFreq: 80,
    freqSweep: 0.3,
    duration: 0.1,
    attack: 0.002,
    decay: 0.08,
    sustain: 0.1,
    release: 0.02,
    filterFreq: 800,
    filterQ: 1,
    echoDelay: 0,
    echoDecay: 0,
    bitCrush: 8,
    description: 'Soft landing thud',
  },

  // --- PICKUPS ---
  coin: {
    name: 'Coin',
    category: 'pickup',
    waveform: 'square',
    baseFreq: 988,
    freqSweep: 1.3,
    duration: 0.15,
    attack: 0.005,
    decay: 0.1,
    sustain: 0.2,
    release: 0.04,
    filterFreq: 5000,
    filterQ: 1,
    echoDelay: 0.08,
    echoDecay: 0.15,
    bitCrush: 14,
    useArpeggio: true,
    arpeggioNotes: [988, 1318],
    arpeggioSpeed: 0.07,
    description: 'Two-note coin collection chime',
  },
  gem: {
    name: 'Gem',
    category: 'pickup',
    waveform: 'sine',
    baseFreq: 1200,
    freqSweep: 1.5,
    duration: 0.25,
    attack: 0.01,
    decay: 0.15,
    sustain: 0.3,
    release: 0.08,
    filterFreq: 6000,
    filterQ: 2,
    echoDelay: 0.1,
    echoDecay: 0.3,
    bitCrush: 14,
    useArpeggio: true,
    arpeggioNotes: [880, 1108, 1318, 1760],
    arpeggioSpeed: 0.05,
    description: 'Sparkling gem collection',
  },
  heart: {
    name: 'Heart',
    category: 'pickup',
    waveform: 'triangle',
    baseFreq: 523,
    freqSweep: 1.8,
    duration: 0.4,
    attack: 0.02,
    decay: 0.2,
    sustain: 0.4,
    release: 0.15,
    filterFreq: 2000,
    filterQ: 1,
    echoDelay: 0.12,
    echoDecay: 0.25,
    bitCrush: 12,
    useArpeggio: true,
    arpeggioNotes: [523, 659, 784, 1046],
    arpeggioSpeed: 0.08,
    description: 'Health pickup with warm arpeggio',
  },
  key: {
    name: 'Key',
    category: 'pickup',
    waveform: 'square',
    baseFreq: 660,
    freqSweep: 1.2,
    duration: 0.2,
    attack: 0.01,
    decay: 0.12,
    sustain: 0.3,
    release: 0.06,
    filterFreq: 3000,
    filterQ: 2,
    echoDelay: 0.06,
    echoDecay: 0.2,
    bitCrush: 10,
    description: 'Key/item collection jingle',
  },

  // --- COMBAT ---
  laser: {
    name: 'Laser',
    category: 'combat',
    waveform: 'sawtooth',
    baseFreq: 1200,
    freqSweep: 0.15,
    duration: 0.12,
    attack: 0.005,
    decay: 0.08,
    sustain: 0.2,
    release: 0.03,
    filterFreq: 4000,
    filterQ: 4,
    echoDelay: 0,
    echoDecay: 0,
    bitCrush: 10,
    description: 'Descending laser shot',
  },
  blaster: {
    name: 'Blaster',
    category: 'combat',
    waveform: 'square',
    baseFreq: 600,
    freqSweep: 0.2,
    duration: 0.1,
    attack: 0.002,
    decay: 0.06,
    sustain: 0.15,
    release: 0.03,
    filterFreq: 2500,
    filterQ: 2,
    echoDelay: 0.03,
    echoDecay: 0.1,
    bitCrush: 8,
    addNoise: true,
    noiseAmount: 0.15,
    description: 'Energy blaster with noise',
  },
  sword: {
    name: 'Sword',
    category: 'combat',
    waveform: 'sawtooth',
    baseFreq: 200,
    freqSweep: 4,
    duration: 0.08,
    attack: 0.002,
    decay: 0.05,
    sustain: 0.1,
    release: 0.02,
    filterFreq: 5000,
    filterQ: 1,
    echoDelay: 0,
    echoDecay: 0,
    bitCrush: 10,
    addNoise: true,
    noiseAmount: 0.3,
    description: 'Quick sword slash',
  },
  punch: {
    name: 'Punch',
    category: 'combat',
    waveform: 'triangle',
    baseFreq: 100,
    freqSweep: 0.4,
    duration: 0.08,
    attack: 0.002,
    decay: 0.05,
    sustain: 0.1,
    release: 0.02,
    filterFreq: 1200,
    filterQ: 2,
    echoDelay: 0,
    echoDecay: 0,
    bitCrush: 6,
    addNoise: true,
    noiseAmount: 0.4,
    description: 'Melee punch impact',
  },
  magicSpell: {
    name: 'Magic',
    category: 'combat',
    waveform: 'sine',
    baseFreq: 400,
    freqSweep: 2.5,
    duration: 0.5,
    attack: 0.05,
    decay: 0.2,
    sustain: 0.5,
    release: 0.2,
    filterFreq: 3000,
    filterQ: 3,
    echoDelay: 0.15,
    echoDecay: 0.4,
    bitCrush: 12,
    useArpeggio: true,
    arpeggioNotes: [400, 500, 600, 800, 1000, 1200],
    arpeggioSpeed: 0.06,
    description: 'Ascending magical spell cast',
  },

  // --- EXPLOSIONS ---
  explosion: {
    name: 'Explosion',
    category: 'explosion',
    waveform: 'noise',
    baseFreq: 100,
    freqSweep: 0.2,
    duration: 0.5,
    attack: 0.005,
    decay: 0.3,
    sustain: 0.2,
    release: 0.15,
    filterFreq: 2000,
    filterQ: 1,
    filterSweep: 0.1,
    echoDelay: 0.1,
    echoDecay: 0.2,
    bitCrush: 6,
    addBass: true,
    bassFreq: 50,
    description: 'Big explosion with bass rumble',
  },
  smallExplosion: {
    name: 'Pop',
    category: 'explosion',
    waveform: 'noise',
    baseFreq: 200,
    freqSweep: 0.3,
    duration: 0.15,
    attack: 0.002,
    decay: 0.1,
    sustain: 0.1,
    release: 0.04,
    filterFreq: 3000,
    filterQ: 2,
    filterSweep: 0.2,
    echoDelay: 0,
    echoDecay: 0,
    bitCrush: 8,
    description: 'Small pop/burst',
  },
  boom: {
    name: 'Boom',
    category: 'explosion',
    waveform: 'noise',
    baseFreq: 60,
    freqSweep: 0.15,
    duration: 0.8,
    attack: 0.01,
    decay: 0.5,
    sustain: 0.3,
    release: 0.25,
    filterFreq: 1500,
    filterQ: 0.5,
    filterSweep: 0.08,
    echoDelay: 0.15,
    echoDecay: 0.35,
    bitCrush: 4,
    addBass: true,
    bassFreq: 35,
    description: 'Deep rumbling boom',
  },

  // --- UI/MENU ---
  menuSelect: {
    name: 'Select',
    category: 'ui',
    waveform: 'square',
    baseFreq: 800,
    freqSweep: 1.0,
    duration: 0.06,
    attack: 0.002,
    decay: 0.04,
    sustain: 0.1,
    release: 0.02,
    filterFreq: 4000,
    filterQ: 1,
    echoDelay: 0,
    echoDecay: 0,
    bitCrush: 12,
    description: 'Menu cursor move blip',
  },
  menuConfirm: {
    name: 'Confirm',
    category: 'ui',
    waveform: 'square',
    baseFreq: 600,
    freqSweep: 1.5,
    duration: 0.12,
    attack: 0.005,
    decay: 0.08,
    sustain: 0.2,
    release: 0.03,
    filterFreq: 3500,
    filterQ: 1,
    echoDelay: 0.04,
    echoDecay: 0.1,
    bitCrush: 12,
    useArpeggio: true,
    arpeggioNotes: [600, 900],
    arpeggioSpeed: 0.05,
    description: 'Confirmation/OK sound',
  },
  menuCancel: {
    name: 'Cancel',
    category: 'ui',
    waveform: 'square',
    baseFreq: 400,
    freqSweep: 0.6,
    duration: 0.1,
    attack: 0.005,
    decay: 0.07,
    sustain: 0.1,
    release: 0.02,
    filterFreq: 2000,
    filterQ: 1,
    echoDelay: 0,
    echoDecay: 0,
    bitCrush: 10,
    description: 'Cancel/back sound',
  },
  pause: {
    name: 'Pause',
    category: 'ui',
    waveform: 'triangle',
    baseFreq: 300,
    freqSweep: 0.5,
    duration: 0.2,
    attack: 0.02,
    decay: 0.12,
    sustain: 0.3,
    release: 0.05,
    filterFreq: 1500,
    filterQ: 1,
    echoDelay: 0.08,
    echoDecay: 0.15,
    bitCrush: 10,
    description: 'Game pause sound',
  },
  textBlip: {
    name: 'Text',
    category: 'ui',
    waveform: 'square',
    baseFreq: 500,
    freqSweep: 1.0,
    duration: 0.03,
    attack: 0.001,
    decay: 0.02,
    sustain: 0.05,
    release: 0.01,
    filterFreq: 2500,
    filterQ: 1,
    echoDelay: 0,
    echoDecay: 0,
    bitCrush: 8,
    description: 'Text character appear blip',
  },

  // --- POWER/STATUS ---
  powerUp: {
    name: 'Power Up',
    category: 'power',
    waveform: 'square',
    baseFreq: 200,
    freqSweep: 3.0,
    duration: 0.6,
    attack: 0.02,
    decay: 0.3,
    sustain: 0.4,
    release: 0.2,
    filterFreq: 4000,
    filterQ: 2,
    echoDelay: 0.12,
    echoDecay: 0.3,
    bitCrush: 12,
    useArpeggio: true,
    arpeggioNotes: [262, 330, 392, 523, 659, 784, 1046],
    arpeggioSpeed: 0.07,
    description: 'Ascending power-up fanfare',
  },
  levelUp: {
    name: 'Level Up',
    category: 'power',
    waveform: 'square',
    baseFreq: 330,
    freqSweep: 2.0,
    duration: 0.8,
    attack: 0.02,
    decay: 0.4,
    sustain: 0.5,
    release: 0.3,
    filterFreq: 5000,
    filterQ: 1,
    echoDelay: 0.15,
    echoDecay: 0.35,
    bitCrush: 14,
    useArpeggio: true,
    arpeggioNotes: [330, 392, 494, 587, 659, 784, 988, 1175],
    arpeggioSpeed: 0.08,
    description: 'Level up celebration jingle',
  },
  oneUp: {
    name: '1-Up',
    category: 'power',
    waveform: 'square',
    baseFreq: 523,
    freqSweep: 1.5,
    duration: 0.5,
    attack: 0.01,
    decay: 0.25,
    sustain: 0.4,
    release: 0.15,
    filterFreq: 4500,
    filterQ: 1,
    echoDelay: 0.1,
    echoDecay: 0.25,
    bitCrush: 12,
    useArpeggio: true,
    arpeggioNotes: [523, 659, 784, 1046, 1318],
    arpeggioSpeed: 0.08,
    description: 'Extra life jingle',
  },
  heal: {
    name: 'Heal',
    category: 'power',
    waveform: 'sine',
    baseFreq: 400,
    freqSweep: 1.8,
    duration: 0.4,
    attack: 0.03,
    decay: 0.2,
    sustain: 0.4,
    release: 0.15,
    filterFreq: 2500,
    filterQ: 2,
    echoDelay: 0.12,
    echoDecay: 0.3,
    bitCrush: 12,
    useArpeggio: true,
    arpeggioNotes: [400, 500, 600, 800],
    arpeggioSpeed: 0.08,
    description: 'Healing/restoration effect',
  },

  // --- DAMAGE/DANGER ---
  hurt: {
    name: 'Hurt',
    category: 'damage',
    waveform: 'square',
    baseFreq: 200,
    freqSweep: 0.5,
    duration: 0.2,
    attack: 0.005,
    decay: 0.12,
    sustain: 0.2,
    release: 0.05,
    filterFreq: 1500,
    filterQ: 2,
    echoDelay: 0,
    echoDecay: 0,
    bitCrush: 6,
    addNoise: true,
    noiseAmount: 0.35,
    description: 'Player damage/hurt sound',
  },
  death: {
    name: 'Death',
    category: 'damage',
    waveform: 'square',
    baseFreq: 400,
    freqSweep: 0.15,
    duration: 0.8,
    attack: 0.01,
    decay: 0.5,
    sustain: 0.2,
    release: 0.25,
    filterFreq: 2000,
    filterQ: 1,
    filterSweep: 0.2,
    echoDelay: 0.15,
    echoDecay: 0.3,
    bitCrush: 8,
    useArpeggio: true,
    arpeggioNotes: [400, 350, 300, 250, 200, 150],
    arpeggioSpeed: 0.12,
    description: 'Descending death jingle',
  },
  enemyHit: {
    name: 'Enemy Hit',
    category: 'damage',
    waveform: 'sawtooth',
    baseFreq: 300,
    freqSweep: 0.4,
    duration: 0.08,
    attack: 0.002,
    decay: 0.05,
    sustain: 0.1,
    release: 0.02,
    filterFreq: 2000,
    filterQ: 2,
    echoDelay: 0,
    echoDecay: 0,
    bitCrush: 8,
    addNoise: true,
    noiseAmount: 0.2,
    description: 'Enemy takes damage',
  },
  warning: {
    name: 'Warning',
    category: 'damage',
    waveform: 'square',
    baseFreq: 440,
    freqSweep: 1.0,
    duration: 0.15,
    attack: 0.005,
    decay: 0.1,
    sustain: 0.2,
    release: 0.04,
    filterFreq: 3000,
    filterQ: 1,
    echoDelay: 0.08,
    echoDecay: 0.15,
    bitCrush: 10,
    useArpeggio: true,
    arpeggioNotes: [440, 554],
    arpeggioSpeed: 0.07,
    description: 'Alert/warning beep',
  },

  // --- ENVIRONMENT ---
  doorOpen: {
    name: 'Door',
    category: 'environment',
    waveform: 'triangle',
    baseFreq: 150,
    freqSweep: 2.0,
    duration: 0.3,
    attack: 0.02,
    decay: 0.15,
    sustain: 0.4,
    release: 0.1,
    filterFreq: 1500,
    filterQ: 1,
    echoDelay: 0.1,
    echoDecay: 0.2,
    bitCrush: 10,
    description: 'Door/gate opening',
  },
  chest: {
    name: 'Chest',
    category: 'environment',
    waveform: 'square',
    baseFreq: 300,
    freqSweep: 2.2,
    duration: 0.5,
    attack: 0.02,
    decay: 0.25,
    sustain: 0.4,
    release: 0.2,
    filterFreq: 3500,
    filterQ: 1,
    echoDelay: 0.12,
    echoDecay: 0.25,
    bitCrush: 12,
    useArpeggio: true,
    arpeggioNotes: [300, 400, 500, 600, 750],
    arpeggioSpeed: 0.08,
    description: 'Treasure chest opening',
  },
  splash: {
    name: 'Splash',
    category: 'environment',
    waveform: 'noise',
    baseFreq: 500,
    freqSweep: 0.3,
    duration: 0.25,
    attack: 0.005,
    decay: 0.15,
    sustain: 0.2,
    release: 0.08,
    filterFreq: 4000,
    filterQ: 3,
    filterSweep: 0.2,
    echoDelay: 0.08,
    echoDecay: 0.15,
    bitCrush: 8,
    description: 'Water splash effect',
  },
  teleport: {
    name: 'Teleport',
    category: 'environment',
    waveform: 'sine',
    baseFreq: 200,
    freqSweep: 5.0,
    duration: 0.4,
    attack: 0.02,
    decay: 0.2,
    sustain: 0.4,
    release: 0.15,
    filterFreq: 5000,
    filterQ: 4,
    echoDelay: 0.1,
    echoDecay: 0.35,
    bitCrush: 10,
    description: 'Teleportation/warp effect',
  },
  footstep: {
    name: 'Footstep',
    category: 'environment',
    waveform: 'noise',
    baseFreq: 100,
    freqSweep: 0.5,
    duration: 0.06,
    attack: 0.002,
    decay: 0.04,
    sustain: 0.1,
    release: 0.02,
    filterFreq: 800,
    filterQ: 1,
    echoDelay: 0,
    echoDecay: 0,
    bitCrush: 4,
    description: 'Single footstep',
  },
};

// ============================================================================
// AUDIO ENGINE CLASS
// ============================================================================
class SNESAudioEngine {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.masterGain = null;
    this.noiseBuffer = null;
  }

  init() {
    if (this.audioContext) return;
    
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Master output with gain
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.audioContext.destination);
    
    // Analyser for visualization
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.masterGain.connect(this.analyser);
    
    // Pre-generate noise buffer
    this.noiseBuffer = this.createNoiseBuffer();
  }

  resume() {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  createNoiseBuffer() {
    const bufferSize = this.audioContext.sampleRate * 2;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    // LFSR-based noise for more authentic character
    let lfsr = 0x7FFF;
    for (let i = 0; i < bufferSize; i++) {
      const feedback = ((lfsr >> 0) ^ (lfsr >> 1)) & 1;
      lfsr = (lfsr >> 1) | (feedback << 14);
      data[i] = ((lfsr & 1) * 2 - 1) * 0.5;
    }
    
    return buffer;
  }

  // Create a bandwidth-limited pulse wave
  createPulseWave(dutyCycle = 0.5, harmonics = 32) {
    const real = new Float32Array(harmonics);
    const imag = new Float32Array(harmonics);
    
    for (let n = 1; n < harmonics; n++) {
      imag[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * dutyCycle);
    }
    
    return this.audioContext.createPeriodicWave(real, imag, { disableNormalization: false });
  }

  // Create bit-crusher effect
  createBitCrusher(bits = 8) {
    const curve = new Float32Array(65536);
    const steps = Math.pow(2, bits);
    
    for (let i = 0; i < 65536; i++) {
      const x = (i / 32768) - 1;
      curve[i] = Math.round(x * steps) / steps;
    }
    
    const shaper = this.audioContext.createWaveShaper();
    shaper.curve = curve;
    shaper.oversample = 'none';
    return shaper;
  }

  // Apply Gaussian interpolation (SNES characteristic warmth)
  createGaussianFilter() {
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 16000; // SNES sample rate limit
    filter.Q.value = 0.5;
    return filter;
  }

  // Create echo effect (SNES hardware echo)
  createEcho(delayTime, decay) {
    const delay = this.audioContext.createDelay(1);
    delay.delayTime.value = delayTime;
    
    const feedback = this.audioContext.createGain();
    feedback.gain.value = decay;
    
    const wetGain = this.audioContext.createGain();
    wetGain.gain.value = 0.4;
    
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wetGain);
    
    return { input: delay, output: wetGain };
  }

  playPreset(preset, customParams = {}) {
    const params = { ...preset, ...customParams };
    const now = this.audioContext.currentTime;
    const nodes = [];
    
    // Check for arpeggio mode
    if (params.useArpeggio && params.arpeggioNotes) {
      this.playArpeggio(params);
      return;
    }
    
    // Main oscillator or noise source
    let source;
    if (params.waveform === 'noise') {
      source = this.audioContext.createBufferSource();
      source.buffer = this.noiseBuffer;
      source.loop = true;
    } else {
      source = this.audioContext.createOscillator();
      
      if (params.waveform === 'square') {
        source.setPeriodicWave(this.createPulseWave(0.5));
      } else {
        source.type = params.waveform;
      }
      
      // Frequency sweep
      source.frequency.setValueAtTime(params.baseFreq, now);
      source.frequency.exponentialRampToValueAtTime(
        params.baseFreq * params.freqSweep,
        now + params.duration
      );
    }
    nodes.push(source);
    
    // Filter
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(params.filterFreq, now);
    filter.Q.value = params.filterQ;
    
    if (params.filterSweep) {
      filter.frequency.exponentialRampToValueAtTime(
        params.filterFreq * params.filterSweep,
        now + params.duration
      );
    }
    
    // Bit crusher for lo-fi character
    const bitCrusher = this.createBitCrusher(params.bitCrush || 8);
    
    // Gaussian filter (SNES warmth)
    const gaussian = this.createGaussianFilter();
    
    // ADSR Envelope
    const envelope = this.audioContext.createGain();
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.linearRampToValueAtTime(0.8, now + params.attack);
    envelope.gain.setTargetAtTime(
      params.sustain * 0.8,
      now + params.attack,
      params.decay / 3
    );
    envelope.gain.setTargetAtTime(
      0.0001,
      now + params.duration - params.release,
      params.release / 3
    );
    
    // Connect chain
    source.connect(filter);
    filter.connect(bitCrusher);
    bitCrusher.connect(gaussian);
    gaussian.connect(envelope);
    
    // Add noise layer if specified
    if (params.addNoise && params.noiseAmount) {
      const noise = this.audioContext.createBufferSource();
      noise.buffer = this.noiseBuffer;
      noise.loop = true;
      
      const noiseGain = this.audioContext.createGain();
      noiseGain.gain.setValueAtTime(params.noiseAmount * 0.5, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + params.duration);
      
      const noiseFilter = this.audioContext.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = params.baseFreq * 2;
      noiseFilter.Q.value = 1;
      
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(envelope);
      
      noise.start(now);
      noise.stop(now + params.duration + 0.1);
      nodes.push(noise);
    }
    
    // Add bass layer for explosions
    if (params.addBass && params.bassFreq) {
      const bass = this.audioContext.createOscillator();
      bass.type = 'sine';
      bass.frequency.setValueAtTime(params.bassFreq, now);
      bass.frequency.exponentialRampToValueAtTime(20, now + params.duration * 0.7);
      
      const bassGain = this.audioContext.createGain();
      bassGain.gain.setValueAtTime(0.6, now);
      bassGain.gain.exponentialRampToValueAtTime(0.0001, now + params.duration * 0.8);
      
      bass.connect(bassGain);
      bassGain.connect(this.masterGain);
      
      bass.start(now);
      bass.stop(now + params.duration + 0.1);
      nodes.push(bass);
    }
    
    // Echo effect
    if (params.echoDelay > 0 && params.echoDecay > 0) {
      const echo = this.createEcho(params.echoDelay, params.echoDecay);
      envelope.connect(echo.input);
      echo.output.connect(this.masterGain);
    }
    
    // Connect to master
    envelope.connect(this.masterGain);
    
    // Start and stop
    source.start(now);
    source.stop(now + params.duration + (params.echoDelay * 3) + 0.1);
    
    return nodes;
  }

  playArpeggio(params) {
    const now = this.audioContext.currentTime;
    const notes = params.arpeggioNotes;
    const speed = params.arpeggioSpeed || 0.07;
    
    notes.forEach((freq, i) => {
      const startTime = now + (i * speed);
      const osc = this.audioContext.createOscillator();
      
      if (params.waveform === 'square') {
        osc.setPeriodicWave(this.createPulseWave(0.5));
      } else {
        osc.type = params.waveform === 'noise' ? 'square' : params.waveform;
      }
      
      osc.frequency.setValueAtTime(freq, startTime);
      
      // Filter
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = params.filterFreq;
      filter.Q.value = params.filterQ;
      
      // Bit crusher
      const bitCrusher = this.createBitCrusher(params.bitCrush || 12);
      
      // Gaussian filter
      const gaussian = this.createGaussianFilter();
      
      // Individual note envelope
      const noteDuration = speed * 2;
      const env = this.audioContext.createGain();
      env.gain.setValueAtTime(0.0001, startTime);
      env.gain.linearRampToValueAtTime(0.6, startTime + 0.005);
      env.gain.exponentialRampToValueAtTime(0.0001, startTime + noteDuration);
      
      osc.connect(filter);
      filter.connect(bitCrusher);
      bitCrusher.connect(gaussian);
      gaussian.connect(env);
      
      // Echo for arpeggios
      if (params.echoDelay > 0) {
        const echo = this.createEcho(params.echoDelay, params.echoDecay);
        env.connect(echo.input);
        echo.output.connect(this.masterGain);
      }
      
      env.connect(this.masterGain);
      
      osc.start(startTime);
      osc.stop(startTime + noteDuration + 0.1);
    });
  }

  getAnalyserData() {
    if (!this.analyser) return null;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(dataArray);
    return dataArray;
  }
}

// ============================================================================
// REACT COMPONENTS
// ============================================================================

// Waveform Visualizer
const WaveformVisualizer = ({ engine, isPlaying }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const draw = () => {
      const data = engine?.getAnalyserData();
      
      ctx.fillStyle = SNES_COLORS.darkPurple;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Grid lines
      ctx.strokeStyle = SNES_COLORS.surfaceLight + '40';
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        const y = (canvas.height / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      if (data) {
        ctx.strokeStyle = SNES_COLORS.cyan;
        ctx.lineWidth = 2;
        ctx.shadowColor = SNES_COLORS.cyan;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        
        const sliceWidth = canvas.width / data.length;
        let x = 0;
        
        for (let i = 0; i < data.length; i++) {
          const v = data[i] / 128.0;
          const y = (v * canvas.height) / 2;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      
      animationRef.current = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [engine]);

  return <canvas ref={canvasRef} width={400} height={80} style={styles.canvas} />;
};

// Slider Component
const Slider = ({ label, value, min, max, step, onChange, unit = '' }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div style={styles.sliderGroup}>
      <div style={styles.sliderLabel}>
        <span>{label}</span>
        <span style={{ color: SNES_COLORS.cyan }}>{value.toFixed(step < 1 ? 2 : 0)}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          ...styles.slider,
          background: `linear-gradient(to right, ${SNES_COLORS.accent} 0%, ${SNES_COLORS.accent} ${((value - min) / (max - min)) * 100}%, ${SNES_COLORS.darkPurple} ${((value - min) / (max - min)) * 100}%, ${SNES_COLORS.darkPurple} 100%)`,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
    </div>
  );
};

// Preset Button Component
const PresetButton = ({ preset, onClick, isActive }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <button
      style={{
        ...styles.presetButton,
        ...(isHovered || isActive ? styles.presetButtonHover : {}),
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={preset.description}
    >
      {preset.name}
    </button>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const SNESSoundGenerator = () => {
  const engineRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activePreset, setActivePreset] = useState(null);
  const [currentCategory, setCurrentCategory] = useState('all');
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Custom parameters
  const [params, setParams] = useState({
    volume: 0.5,
    baseFreq: 440,
    freqSweep: 1.0,
    duration: 0.3,
    attack: 0.01,
    decay: 0.1,
    sustain: 0.5,
    release: 0.15,
    filterFreq: 3000,
    filterQ: 1,
    echoDelay: 0.1,
    echoDecay: 0.2,
    bitCrush: 10,
    waveform: 'square',
  });

  // Initialize audio engine
  const initEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new SNESAudioEngine();
    }
    engineRef.current.init();
    setIsInitialized(true);
  }, []);

  // Play a preset
  const playPreset = useCallback((presetKey) => {
    if (!isInitialized) initEngine();
    engineRef.current?.resume();
    
    const preset = SNES_PRESETS[presetKey];
    if (preset) {
      setActivePreset(presetKey);
      setIsPlaying(true);
      engineRef.current?.playPreset(preset);
      
      setTimeout(() => setIsPlaying(false), (preset.duration || 0.5) * 1000 + 200);
    }
  }, [isInitialized, initEngine]);

  // Play custom sound
  const playCustom = useCallback(() => {
    if (!isInitialized) initEngine();
    engineRef.current?.resume();
    
    setIsPlaying(true);
    engineRef.current?.playPreset(params);
    
    setTimeout(() => setIsPlaying(false), params.duration * 1000 + 200);
  }, [isInitialized, initEngine, params]);

  // Randomize parameters
  const randomize = useCallback(() => {
    setParams({
      ...params,
      baseFreq: 100 + Math.random() * 900,
      freqSweep: 0.2 + Math.random() * 3,
      duration: 0.1 + Math.random() * 0.6,
      attack: 0.005 + Math.random() * 0.05,
      decay: 0.05 + Math.random() * 0.2,
      sustain: 0.2 + Math.random() * 0.6,
      release: 0.05 + Math.random() * 0.2,
      filterFreq: 500 + Math.random() * 4500,
      filterQ: 0.5 + Math.random() * 4,
      echoDelay: Math.random() * 0.2,
      echoDecay: Math.random() * 0.4,
      bitCrush: 4 + Math.floor(Math.random() * 12),
      waveform: ['sine', 'square', 'sawtooth', 'triangle'][Math.floor(Math.random() * 4)],
    });
  }, [params]);

  // Get categories
  const categories = ['all', ...new Set(Object.values(SNES_PRESETS).map(p => p.category))];
  
  // Filter presets by category
  const filteredPresets = Object.entries(SNES_PRESETS).filter(
    ([_, preset]) => currentCategory === 'all' || preset.category === currentCategory
  );

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>🎮 SNES SFX STUDIO</h1>
        <p style={styles.subtitle}>16-BIT GAME AUDIO EFFECTS GENERATOR • SPC700 STYLE</p>
      </header>

      <div style={styles.mainGrid}>
        {/* Presets Panel */}
        <div style={{ ...styles.panel, gridColumn: 'span 2' }}>
          <h2 style={styles.panelTitle}>
            <span style={styles.modeChip}>PRESETS</span>
            Effect Library
          </h2>
          
          {/* Category Filter */}
          <div style={{ marginBottom: '15px' }}>
            <select
              value={currentCategory}
              onChange={(e) => setCurrentCategory(e.target.value)}
              style={styles.select}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)} Effects
                </option>
              ))}
            </select>
          </div>
          
          {/* Preset Buttons */}
          <div style={styles.presetGrid}>
            {filteredPresets.map(([key, preset]) => (
              <PresetButton
                key={key}
                preset={preset}
                isActive={activePreset === key}
                onClick={() => playPreset(key)}
              />
            ))}
          </div>
        </div>

        {/* Waveform Display */}
        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>
            <span style={styles.modeChip}>SCOPE</span>
            Waveform
          </h2>
          <WaveformVisualizer engine={engineRef.current} isPlaying={isPlaying} />
          
          {activePreset && (
            <div style={styles.paramDisplay}>
              <strong style={{ color: SNES_COLORS.gold }}>
                {SNES_PRESETS[activePreset].name}
              </strong>
              <br />
              {SNES_PRESETS[activePreset].description}
            </div>
          )}
        </div>

        {/* Custom Controls */}
        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>
            <span style={styles.modeChip}>CUSTOM</span>
            Parameters
          </h2>
          
          <div style={{ marginBottom: '12px' }}>
            <div style={{ ...styles.sliderLabel, marginBottom: '5px' }}>
              <span>Waveform</span>
            </div>
            <select
              value={params.waveform}
              onChange={(e) => setParams({ ...params, waveform: e.target.value })}
              style={styles.select}
            >
              <option value="sine">Sine</option>
              <option value="square">Square (Pulse)</option>
              <option value="sawtooth">Sawtooth</option>
              <option value="triangle">Triangle</option>
            </select>
          </div>
          
          <Slider
            label="Base Freq"
            value={params.baseFreq}
            min={50}
            max={2000}
            step={1}
            unit=" Hz"
            onChange={(v) => setParams({ ...params, baseFreq: v })}
          />
          
          <Slider
            label="Freq Sweep"
            value={params.freqSweep}
            min={0.1}
            max={5}
            step={0.1}
            unit="x"
            onChange={(v) => setParams({ ...params, freqSweep: v })}
          />
          
          <Slider
            label="Duration"
            value={params.duration}
            min={0.05}
            max={1}
            step={0.01}
            unit="s"
            onChange={(v) => setParams({ ...params, duration: v })}
          />
          
          <Slider
            label="Bit Crush"
            value={params.bitCrush}
            min={2}
            max={16}
            step={1}
            unit=" bit"
            onChange={(v) => setParams({ ...params, bitCrush: v })}
          />
        </div>

        {/* Envelope Controls */}
        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>
            <span style={styles.modeChip}>ADSR</span>
            Envelope
          </h2>
          
          <Slider
            label="Attack"
            value={params.attack}
            min={0.001}
            max={0.2}
            step={0.001}
            unit="s"
            onChange={(v) => setParams({ ...params, attack: v })}
          />
          
          <Slider
            label="Decay"
            value={params.decay}
            min={0.01}
            max={0.5}
            step={0.01}
            unit="s"
            onChange={(v) => setParams({ ...params, decay: v })}
          />
          
          <Slider
            label="Sustain"
            value={params.sustain}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => setParams({ ...params, sustain: v })}
          />
          
          <Slider
            label="Release"
            value={params.release}
            min={0.01}
            max={0.5}
            step={0.01}
            unit="s"
            onChange={(v) => setParams({ ...params, release: v })}
          />
        </div>

        {/* Filter & Effects */}
        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>
            <span style={styles.modeChip}>FX</span>
            Filter & Echo
          </h2>
          
          <Slider
            label="Filter Freq"
            value={params.filterFreq}
            min={100}
            max={8000}
            step={10}
            unit=" Hz"
            onChange={(v) => setParams({ ...params, filterFreq: v })}
          />
          
          <Slider
            label="Filter Q"
            value={params.filterQ}
            min={0.1}
            max={10}
            step={0.1}
            onChange={(v) => setParams({ ...params, filterQ: v })}
          />
          
          <Slider
            label="Echo Delay"
            value={params.echoDelay}
            min={0}
            max={0.3}
            step={0.01}
            unit="s"
            onChange={(v) => setParams({ ...params, echoDelay: v })}
          />
          
          <Slider
            label="Echo Decay"
            value={params.echoDecay}
            min={0}
            max={0.6}
            step={0.01}
            onChange={(v) => setParams({ ...params, echoDecay: v })}
          />
        </div>

        {/* Play Controls */}
        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>
            <span style={styles.modeChip}>PLAY</span>
            Controls
          </h2>
          
          <Slider
            label="Master Volume"
            value={params.volume}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => {
              setParams({ ...params, volume: v });
              if (engineRef.current?.masterGain) {
                engineRef.current.masterGain.gain.value = v;
              }
            }}
          />
          
          <button
            style={{
              ...styles.playButton,
              background: isPlaying 
                ? `linear-gradient(180deg, ${SNES_COLORS.accent} 0%, ${SNES_COLORS.accentAlt} 100%)`
                : styles.playButton.background,
            }}
            onClick={playCustom}
          >
            ▶ PLAY CUSTOM
          </button>
          
          <button
            style={{
              ...styles.playButton,
              background: `linear-gradient(180deg, ${SNES_COLORS.gold} 0%, #d4a618 100%)`,
              boxShadow: `0 4px 0 #a88512, 0 6px 15px rgba(0,0,0,0.4)`,
              marginTop: '10px',
            }}
            onClick={randomize}
          >
            🎲 RANDOMIZE
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ 
        textAlign: 'center', 
        marginTop: '30px', 
        fontSize: '7px', 
        color: SNES_COLORS.textDim,
        letterSpacing: '1px',
      }}>
        SNES SOUND GENERATOR • WEB AUDIO API • REACT
        <br />
        INSPIRED BY SPC700 • {Object.keys(SNES_PRESETS).length} PRESETS AVAILABLE
      </footer>
    </div>
  );
};

export default SNESSoundGenerator;
