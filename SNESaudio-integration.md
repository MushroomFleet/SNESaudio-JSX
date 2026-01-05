# SNES Audio Integration Guide

> **Migration & Implementation Plan for SNESSoundGenerator**  
> Version 1.0 | 16-Bit Game Audio Effects System

---

## Table of Contents

1. [Pre-Integration Assessment](#1-pre-integration-assessment)
2. [Target Codebase Analysis](#2-target-codebase-analysis)
3. [Architecture Adaptation Strategies](#3-architecture-adaptation-strategies)
4. [Implementation Phases](#4-implementation-phases)
5. [Framework-Specific Integration](#5-framework-specific-integration)
6. [Audio Engine Extraction](#6-audio-engine-extraction)
7. [Preset System Configuration](#7-preset-system-configuration)
8. [Testing & Validation](#8-testing--validation)
9. [Performance Optimization](#9-performance-optimization)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Pre-Integration Assessment

### 1.1 Component Overview

The SNES Sound Generator consists of two primary modules:

| Module | Purpose | Dependencies |
|--------|---------|--------------|
| `SNESAudioEngine` | Core synthesis engine | Web Audio API only |
| `PRESETS` | Sound effect definitions | None (pure data) |
| UI Components | Interactive controls | Framework-dependent |

### 1.2 Pre-Integration Checklist

Before beginning integration, verify:

- [ ] Target environment supports Web Audio API
- [ ] Browser compatibility requirements documented
- [ ] Audio context management strategy defined
- [ ] State management approach identified
- [ ] Build system can process source format
- [ ] Testing infrastructure available

### 1.3 Compatibility Matrix

```
┌─────────────────────┬──────────────────────────────────────┐
│ Environment         │ Compatibility                        │
├─────────────────────┼──────────────────────────────────────┤
│ Modern Browsers     │ ✓ Full support                       │
│ React 16.8+         │ ✓ Hooks-based integration            │
│ React < 16.8        │ ✓ Class component adaptation needed  │
│ Vue 2/3             │ ✓ Composition API or Options API     │
│ Svelte              │ ✓ Store-based integration            │
│ Angular             │ ✓ Service-based integration          │
│ Vanilla JS          │ ✓ Direct usage                       │
│ Node.js (SSR)       │ ⚠ Client-side only, needs guards     │
│ Web Workers         │ ✗ No Web Audio API access            │
│ React Native        │ ✗ Requires native audio bridge       │
└─────────────────────┴──────────────────────────────────────┘
```

---

## 2. Target Codebase Analysis

### 2.1 Assessment Questions

Complete this assessment before integration:

#### Architecture

```markdown
1. What is the primary framework/library?
   [ ] React  [ ] Vue  [ ] Svelte  [ ] Angular  [ ] Vanilla JS  [ ] Other: _____

2. What state management is used?
   [ ] Redux  [ ] MobX  [ ] Zustand  [ ] Vuex/Pinia  [ ] Context API  
   [ ] Signals  [ ] None  [ ] Other: _____

3. Is TypeScript used?
   [ ] Yes - strict mode  [ ] Yes - loose mode  [ ] No

4. What module system is used?
   [ ] ES Modules  [ ] CommonJS  [ ] UMD  [ ] IIFE

5. What build tool is used?
   [ ] Vite  [ ] Webpack  [ ] Rollup  [ ] Parcel  [ ] esbuild  [ ] None
```

#### Audio Requirements

```markdown
1. Are there existing audio systems?
   [ ] Yes - Web Audio API based
   [ ] Yes - HTML5 Audio based
   [ ] Yes - Third-party library (Howler, Tone.js, etc.)
   [ ] No existing audio

2. How should audio context be managed?
   [ ] Single global context (recommended)
   [ ] Per-component context
   [ ] Existing context to reuse

3. What triggers sound playback?
   [ ] User interactions (clicks, keypresses)
   [ ] Game events (collisions, pickups)
   [ ] Animation/timeline events
   [ ] Network events
   [ ] All of the above

4. Is audio persistence needed?
   [ ] Yes - export to files
   [ ] Yes - save to localStorage
   [ ] No - real-time only
```

#### Integration Scope

```markdown
1. Which components are needed?
   [ ] Audio engine only (headless)
   [ ] Engine + presets
   [ ] Engine + presets + UI controls
   [ ] Full demo application

2. Will presets be modified?
   [ ] Use as-is
   [ ] Add custom presets
   [ ] Replace entirely
   [ ] Dynamic preset loading

3. Performance constraints?
   [ ] Mobile-first (battery considerations)
   [ ] Desktop-focused (full features)
   [ ] Embedded/low-power
```

### 2.2 Codebase Audit Script

Run this analysis on your target codebase:

```bash
#!/bin/bash
# codebase-audit.sh - Analyze target for SNES audio integration

echo "=== SNES Audio Integration Audit ==="
echo ""

# Check for existing audio
echo "1. Existing Audio Usage:"
grep -r "AudioContext\|webkitAudioContext\|Howl\|Tone\." --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" . 2>/dev/null | head -20

echo ""
echo "2. Framework Detection:"
if [ -f "package.json" ]; then
  echo "React: $(grep -c '"react"' package.json 2>/dev/null || echo 0)"
  echo "Vue: $(grep -c '"vue"' package.json 2>/dev/null || echo 0)"
  echo "Svelte: $(grep -c '"svelte"' package.json 2>/dev/null || echo 0)"
  echo "Angular: $(grep -c '"@angular/core"' package.json 2>/dev/null || echo 0)"
fi

echo ""
echo "3. TypeScript Usage:"
[ -f "tsconfig.json" ] && echo "TypeScript: Yes" || echo "TypeScript: No"

echo ""
echo "4. Module System:"
grep -l "export default\|export {" --include="*.js" --include="*.ts" . 2>/dev/null | head -5 && echo "ES Modules detected"
grep -l "module.exports\|require(" --include="*.js" . 2>/dev/null | head -5 && echo "CommonJS detected"

echo ""
echo "=== Audit Complete ==="
```

### 2.3 Dependency Conflict Check

Verify no conflicts with existing audio libraries:

```javascript
// conflict-check.js
const potentialConflicts = [
  'howler',
  'tone',
  'pizzicato',
  'sound.js',
  'webaudiox',
  'audio-context-polyfill'
];

// Check package.json
const pkg = require('./package.json');
const allDeps = {
  ...pkg.dependencies,
  ...pkg.devDependencies
};

const conflicts = potentialConflicts.filter(lib => allDeps[lib]);

if (conflicts.length > 0) {
  console.log('⚠️  Potential audio library conflicts:', conflicts);
  console.log('   Consider: shared AudioContext, namespace isolation, or removal');
} else {
  console.log('✓ No conflicting audio libraries detected');
}
```

---

## 3. Architecture Adaptation Strategies

### 3.1 Integration Patterns

Choose the appropriate pattern based on your assessment:

#### Pattern A: Standalone Module (Recommended for most cases)

```
┌─────────────────────────────────────────────────────────┐
│                    Your Application                      │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │ Game Logic  │───▶│ SFX Manager │───▶│   SNES      │ │
│  │             │    │  (Adapter)  │    │   Engine    │ │
│  └─────────────┘    └─────────────┘    └─────────────┘ │
└─────────────────────────────────────────────────────────┘
```

#### Pattern B: Service-Based (Angular, enterprise apps)

```
┌─────────────────────────────────────────────────────────┐
│                    Your Application                      │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐                                        │
│  │ Components  │──┐                                     │
│  └─────────────┘  │    ┌────────────────────────────┐  │
│  ┌─────────────┐  ├───▶│    AudioService            │  │
│  │ Game Engine │──┤    │  ├─ SNESAudioEngine        │  │
│  └─────────────┘  │    │  ├─ Presets                │  │
│  ┌─────────────┐  │    │  └─ Context Management     │  │
│  │   Events    │──┘    └────────────────────────────┘  │
│  └─────────────┘                                        │
└─────────────────────────────────────────────────────────┘
```

#### Pattern C: Store-Integrated (Redux, Vuex, etc.)

```
┌─────────────────────────────────────────────────────────┐
│                      Store                               │
├─────────────────────────────────────────────────────────┤
│  audioSlice: {                                          │
│    engine: SNESAudioEngine,                             │
│    volume: 0.5,                                         │
│    currentPreset: null,                                 │
│    customParams: { ... }                                │
│  }                                                      │
├─────────────────────────────────────────────────────────┤
│  Actions: playPreset, setVolume, randomize, etc.        │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Module Extraction Map

Extract these modules from the source:

```
SNESSoundGenerator.jsx (or demo.html)
         │
         ├──▶ SNESAudioEngine (class)
         │         │
         │         ├── init()
         │         ├── resume()
         │         ├── setVolume()
         │         ├── createNoiseBuffer()
         │         ├── createPulseWave()
         │         ├── createBitCrusher()
         │         ├── playPreset()
         │         ├── playArpeggio()
         │         └── getAnalyserData()
         │
         ├──▶ PRESETS (object)
         │         │
         │         ├── movement: { jump, doubleJump, dash, land }
         │         ├── pickup: { coin, gem, heart, key }
         │         ├── combat: { laser, blaster, sword, punch, magic }
         │         ├── explosion: { explosion, pop, boom }
         │         ├── ui: { select, confirm, cancel, pause, text }
         │         ├── power: { powerUp, levelUp, oneUp, heal }
         │         ├── damage: { hurt, death, enemyHit, warning }
         │         └── environment: { door, chest, splash, teleport, step }
         │
         └──▶ UI Components (framework-specific)
                   │
                   ├── WaveformVisualizer
                   ├── Slider
                   ├── PresetButton
                   └── CategorySelect
```

---

## 4. Implementation Phases

### Phase 1: Core Engine Integration (Day 1)

#### Step 1.1: Create Audio Module

```javascript
// src/audio/snes-engine.js

export class SNESAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.analyser = null;
    this.noiseBuffer = null;
  }

  init() {
    if (this.ctx) return this;
    
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.ctx.destination);
    
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.masterGain.connect(this.analyser);
    
    this.noiseBuffer = this._createNoiseBuffer();
    
    return this;
  }

  resume() {
    if (this.ctx?.state === 'suspended') {
      return this.ctx.resume();
    }
    return Promise.resolve();
  }

  // ... (copy remaining methods from source)
}

export default SNESAudioEngine;
```

#### Step 1.2: Create Presets Module

```javascript
// src/audio/snes-presets.js

export const SNES_PRESETS = {
  // Movement
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
  },
  // ... (copy remaining presets)
};

// Utility: Get presets by category
export const getPresetsByCategory = (category) => {
  return Object.entries(SNES_PRESETS)
    .filter(([_, preset]) => preset.category === category)
    .reduce((acc, [key, preset]) => ({ ...acc, [key]: preset }), {});
};

// Utility: Get all categories
export const getCategories = () => {
  return [...new Set(Object.values(SNES_PRESETS).map(p => p.category))];
};

export default SNES_PRESETS;
```

#### Step 1.3: Create Index Export

```javascript
// src/audio/index.js

export { SNESAudioEngine } from './snes-engine.js';
export { 
  SNES_PRESETS, 
  getPresetsByCategory, 
  getCategories 
} from './snes-presets.js';

// Convenience: Create singleton instance
let _instance = null;

export const getAudioEngine = () => {
  if (!_instance) {
    _instance = new SNESAudioEngine();
  }
  return _instance;
};

export const initAudio = () => {
  return getAudioEngine().init();
};

export const playSound = (presetNameOrConfig) => {
  const engine = getAudioEngine().init();
  engine.resume();
  
  const preset = typeof presetNameOrConfig === 'string'
    ? SNES_PRESETS[presetNameOrConfig]
    : presetNameOrConfig;
    
  if (preset) {
    engine.playPreset(preset);
  }
};
```

### Phase 2: Framework Adapter (Day 2)

Create framework-specific adapter (see Section 5).

### Phase 3: UI Components (Day 3-4)

Port or recreate UI components for your framework.

### Phase 4: Integration Testing (Day 5)

Verify all presets, parameters, and edge cases.

### Phase 5: Performance Tuning (Day 6)

Optimize for target platform requirements.

---

## 5. Framework-Specific Integration

### 5.1 React Integration

#### Hook-Based Approach

```jsx
// src/hooks/useSNESAudio.js
import { useRef, useCallback, useState } from 'react';
import { SNESAudioEngine, SNES_PRESETS } from '../audio';

export const useSNESAudio = (initialVolume = 0.5) => {
  const engineRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [volume, setVolume] = useState(initialVolume);

  const init = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new SNESAudioEngine();
      engineRef.current.init();
      engineRef.current.setVolume(initialVolume);
      setIsReady(true);
    }
    return engineRef.current;
  }, [initialVolume]);

  const play = useCallback((presetName) => {
    const engine = init();
    engine.resume();
    const preset = SNES_PRESETS[presetName];
    if (preset) {
      engine.playPreset(preset);
    }
  }, [init]);

  const playCustom = useCallback((params) => {
    const engine = init();
    engine.resume();
    engine.playPreset(params);
  }, [init]);

  const updateVolume = useCallback((v) => {
    setVolume(v);
    if (engineRef.current) {
      engineRef.current.setVolume(v);
    }
  }, []);

  const getAnalyserData = useCallback(() => {
    return engineRef.current?.getAnalyserData() || null;
  }, []);

  return {
    isReady,
    volume,
    play,
    playCustom,
    setVolume: updateVolume,
    getAnalyserData,
    presets: SNES_PRESETS,
  };
};
```

#### Usage Example

```jsx
// src/components/GameSoundEffects.jsx
import React from 'react';
import { useSNESAudio } from '../hooks/useSNESAudio';

export const GameSoundEffects = () => {
  const { play, volume, setVolume, presets } = useSNESAudio();

  return (
    <div className="sfx-panel">
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={(e) => setVolume(parseFloat(e.target.value))}
      />
      
      <div className="preset-buttons">
        {Object.keys(presets).map((key) => (
          <button key={key} onClick={() => play(key)}>
            {presets[key].name}
          </button>
        ))}
      </div>
    </div>
  );
};
```

### 5.2 Vue 3 Integration

#### Composable Approach

```javascript
// src/composables/useSNESAudio.js
import { ref, onUnmounted } from 'vue';
import { SNESAudioEngine, SNES_PRESETS } from '../audio';

export function useSNESAudio(initialVolume = 0.5) {
  const engine = ref(null);
  const isReady = ref(false);
  const volume = ref(initialVolume);

  function init() {
    if (!engine.value) {
      engine.value = new SNESAudioEngine();
      engine.value.init();
      engine.value.setVolume(initialVolume);
      isReady.value = true;
    }
    return engine.value;
  }

  function play(presetName) {
    const e = init();
    e.resume();
    const preset = SNES_PRESETS[presetName];
    if (preset) {
      e.playPreset(preset);
    }
  }

  function playCustom(params) {
    const e = init();
    e.resume();
    e.playPreset(params);
  }

  function setVolume(v) {
    volume.value = v;
    if (engine.value) {
      engine.value.setVolume(v);
    }
  }

  onUnmounted(() => {
    // Cleanup if needed
  });

  return {
    isReady,
    volume,
    play,
    playCustom,
    setVolume,
    presets: SNES_PRESETS,
  };
}
```

#### Usage in Component

```vue
<!-- src/components/GameSFX.vue -->
<template>
  <div class="sfx-panel">
    <input
      type="range"
      min="0"
      max="1"
      step="0.01"
      :value="volume"
      @input="setVolume(parseFloat($event.target.value))"
    />
    
    <button
      v-for="(preset, key) in presets"
      :key="key"
      @click="play(key)"
    >
      {{ preset.name }}
    </button>
  </div>
</template>

<script setup>
import { useSNESAudio } from '../composables/useSNESAudio';

const { play, volume, setVolume, presets } = useSNESAudio();
</script>
```

### 5.3 Svelte Integration

```svelte
<!-- src/lib/SNESAudio.svelte -->
<script>
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { SNESAudioEngine, SNES_PRESETS } from '../audio';

  let engine = null;
  export const volume = writable(0.5);
  export const isReady = writable(false);

  onMount(() => {
    engine = new SNESAudioEngine();
    engine.init();
    isReady.set(true);
    
    volume.subscribe((v) => {
      if (engine) engine.setVolume(v);
    });
  });

  export function play(presetName) {
    if (!engine) return;
    engine.resume();
    const preset = SNES_PRESETS[presetName];
    if (preset) engine.playPreset(preset);
  }

  export function playCustom(params) {
    if (!engine) return;
    engine.resume();
    engine.playPreset(params);
  }
</script>

<div class="sfx-panel">
  <input
    type="range"
    min="0"
    max="1"
    step="0.01"
    bind:value={$volume}
  />
  
  {#each Object.entries(SNES_PRESETS) as [key, preset]}
    <button on:click={() => play(key)}>
      {preset.name}
    </button>
  {/each}
</div>
```

### 5.4 Angular Integration

```typescript
// src/app/services/snes-audio.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SNESAudioEngine, SNES_PRESETS } from '../audio';

@Injectable({
  providedIn: 'root'
})
export class SNESAudioService {
  private engine: SNESAudioEngine | null = null;
  
  public isReady$ = new BehaviorSubject<boolean>(false);
  public volume$ = new BehaviorSubject<number>(0.5);
  
  public readonly presets = SNES_PRESETS;

  init(): void {
    if (!this.engine) {
      this.engine = new SNESAudioEngine();
      this.engine.init();
      this.engine.setVolume(this.volume$.value);
      this.isReady$.next(true);
    }
  }

  play(presetName: string): void {
    this.init();
    this.engine?.resume();
    const preset = SNES_PRESETS[presetName];
    if (preset) {
      this.engine?.playPreset(preset);
    }
  }

  playCustom(params: any): void {
    this.init();
    this.engine?.resume();
    this.engine?.playPreset(params);
  }

  setVolume(value: number): void {
    this.volume$.next(value);
    this.engine?.setVolume(value);
  }

  getAnalyserData(): Uint8Array | null {
    return this.engine?.getAnalyserData() || null;
  }
}
```

### 5.5 Vanilla JS / Game Engine Integration

```javascript
// src/sfx-manager.js
import { SNESAudioEngine, SNES_PRESETS } from './audio';

class SFXManager {
  constructor() {
    this.engine = new SNESAudioEngine();
    this.initialized = false;
  }

  init() {
    if (!this.initialized) {
      this.engine.init();
      this.initialized = true;
    }
    return this;
  }

  // Direct preset playback
  play(name) {
    this.init();
    this.engine.resume();
    if (SNES_PRESETS[name]) {
      this.engine.playPreset(SNES_PRESETS[name]);
    }
  }

  // Shorthand methods for common effects
  jump() { this.play('jump'); }
  coin() { this.play('coin'); }
  hurt() { this.play('hurt'); }
  explosion() { this.play('explosion'); }
  confirm() { this.play('confirm'); }
  
  // Game-specific aliases
  playerJump() { this.jump(); }
  collectItem() { this.coin(); }
  playerDamage() { this.hurt(); }
  enemyDestroy() { this.explosion(); }
  menuSelect() { this.confirm(); }

  setVolume(v) {
    this.engine.setVolume(v);
  }
}

// Export singleton
export const sfx = new SFXManager();

// Usage:
// import { sfx } from './sfx-manager';
// sfx.jump();
// sfx.coin();
```

---

## 6. Audio Engine Extraction

### 6.1 Minimal Engine (Headless)

For games/apps that only need sound playback without UI:

```javascript
// snes-audio-minimal.js
// ~3KB minified - Core engine only

class SNESAudioEngine {
  constructor() {
    this.ctx = null;
    this.gain = null;
    this.noise = null;
  }

  init() {
    if (this.ctx) return this;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.gain = this.ctx.createGain();
    this.gain.gain.value = 0.5;
    this.gain.connect(this.ctx.destination);
    this.noise = this._noise();
    return this;
  }

  _noise() {
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    let l = 0x7FFF;
    for (let i = 0; i < d.length; i++) {
      l = (l >> 1) | (((l ^ (l >> 1)) & 1) << 14);
      d[i] = ((l & 1) * 2 - 1) * 0.5;
    }
    return buf;
  }

  _pulse(duty = 0.5) {
    const r = new Float32Array(32), m = new Float32Array(32);
    for (let n = 1; n < 32; n++) m[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty);
    return this.ctx.createPeriodicWave(r, m, { disableNormalization: false });
  }

  _crush(bits) {
    const s = Math.pow(2, bits), c = new Float32Array(65536);
    for (let i = 0; i < 65536; i++) c[i] = Math.round(((i / 32768) - 1) * s) / s;
    const w = this.ctx.createWaveShaper(); w.curve = c; return w;
  }

  play(p) {
    if (!this.ctx) this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    const t = this.ctx.currentTime;
    
    if (p.arp?.length) return this._arp(p);

    let s;
    if (p.waveform === 'noise') {
      s = this.ctx.createBufferSource();
      s.buffer = this.noise;
      s.loop = true;
    } else {
      s = this.ctx.createOscillator();
      s.type = p.waveform === 'square' ? undefined : p.waveform;
      if (p.waveform === 'square') s.setPeriodicWave(this._pulse(0.5));
      s.frequency.setValueAtTime(p.baseFreq, t);
      s.frequency.exponentialRampToValueAtTime(Math.max(20, p.baseFreq * p.freqSweep), t + p.duration);
    }

    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(p.filterFreq, t);
    f.Q.value = p.filterQ || 1;

    const e = this.ctx.createGain();
    e.gain.setValueAtTime(0.0001, t);
    e.gain.linearRampToValueAtTime(0.8, t + p.attack);
    e.gain.setTargetAtTime(p.sustain * 0.8, t + p.attack, p.decay / 3);
    e.gain.setTargetAtTime(0.0001, t + p.duration - p.release, p.release / 3);

    s.connect(f).connect(this._crush(p.bitCrush || 10)).connect(e).connect(this.gain);
    s.start(t);
    s.stop(t + p.duration + 0.1);
  }

  _arp(p) {
    const t = this.ctx.currentTime, sp = p.arpSpeed || 0.07;
    p.arp.forEach((fr, i) => {
      const st = t + i * sp;
      const o = this.ctx.createOscillator();
      o.type = p.waveform === 'square' ? undefined : (p.waveform === 'noise' ? 'square' : p.waveform);
      if (p.waveform === 'square') o.setPeriodicWave(this._pulse(0.5));
      o.frequency.setValueAtTime(fr, st);
      const e = this.ctx.createGain();
      e.gain.setValueAtTime(0.0001, st);
      e.gain.linearRampToValueAtTime(0.6, st + 0.005);
      e.gain.exponentialRampToValueAtTime(0.0001, st + sp * 2);
      o.connect(e).connect(this.gain);
      o.start(st);
      o.stop(st + sp * 2 + 0.1);
    });
  }

  volume(v) { if (this.gain) this.gain.gain.value = v; }
}

export { SNESAudioEngine };
```

### 6.2 TypeScript Definitions

```typescript
// snes-audio.d.ts

export interface SNESPreset {
  name: string;
  category: string;
  waveform: 'sine' | 'square' | 'sawtooth' | 'triangle' | 'noise';
  baseFreq: number;
  freqSweep: number;
  duration: number;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  filterFreq: number;
  filterQ: number;
  echoDelay: number;
  echoDecay: number;
  bitCrush: number;
  desc?: string;
  arp?: number[];
  arpSpeed?: number;
  noise?: number;
  bass?: number;
  filterSweep?: number;
}

export interface SNESPresets {
  [key: string]: SNESPreset;
}

export declare class SNESAudioEngine {
  constructor();
  init(): this;
  resume(): Promise<void>;
  setVolume(volume: number): void;
  playPreset(preset: SNESPreset): void;
  getAnalyserData(): Uint8Array | null;
}

export declare const SNES_PRESETS: SNESPresets;
export declare function getPresetsByCategory(category: string): SNESPresets;
export declare function getCategories(): string[];
export declare function getAudioEngine(): SNESAudioEngine;
export declare function initAudio(): SNESAudioEngine;
export declare function playSound(presetNameOrConfig: string | SNESPreset): void;
```

---

## 7. Preset System Configuration

### 7.1 Adding Custom Presets

```javascript
// custom-presets.js
import { SNES_PRESETS } from './audio';

// Method 1: Extend existing presets
export const GAME_PRESETS = {
  ...SNES_PRESETS,
  
  // Custom game-specific sounds
  bossAppear: {
    name: 'Boss Appear',
    category: 'custom',
    waveform: 'sawtooth',
    baseFreq: 80,
    freqSweep: 0.3,
    duration: 1.2,
    attack: 0.1,
    decay: 0.5,
    sustain: 0.6,
    release: 0.5,
    filterFreq: 1000,
    filterQ: 2,
    echoDelay: 0.2,
    echoDecay: 0.4,
    bitCrush: 6,
  },
  
  criticalHit: {
    name: 'Critical Hit',
    category: 'custom',
    waveform: 'square',
    baseFreq: 150,
    freqSweep: 3,
    duration: 0.25,
    attack: 0.002,
    decay: 0.1,
    sustain: 0.3,
    release: 0.1,
    filterFreq: 4000,
    filterQ: 3,
    echoDelay: 0.05,
    echoDecay: 0.2,
    bitCrush: 10,
    noise: 0.2,
  },
};
```

### 7.2 Dynamic Preset Loading

```javascript
// preset-loader.js

export async function loadPresetsFromJSON(url) {
  const response = await fetch(url);
  const presets = await response.json();
  
  // Validate preset structure
  return Object.entries(presets).reduce((acc, [key, preset]) => {
    if (isValidPreset(preset)) {
      acc[key] = preset;
    } else {
      console.warn(`Invalid preset: ${key}`);
    }
    return acc;
  }, {});
}

function isValidPreset(preset) {
  const required = [
    'waveform', 'baseFreq', 'freqSweep', 'duration',
    'attack', 'decay', 'sustain', 'release',
    'filterFreq', 'bitCrush'
  ];
  
  return required.every(prop => preset.hasOwnProperty(prop));
}
```

### 7.3 Preset Categories Extension

```javascript
// category-config.js

export const PRESET_CATEGORIES = {
  movement: {
    label: 'Movement',
    icon: '🏃',
    description: 'Jump, dash, land, movement sounds',
  },
  pickup: {
    label: 'Pickups',
    icon: '💎',
    description: 'Coins, gems, items, collectibles',
  },
  combat: {
    label: 'Combat',
    icon: '⚔️',
    description: 'Weapons, attacks, magic',
  },
  explosion: {
    label: 'Explosions',
    icon: '💥',
    description: 'Blasts, booms, impacts',
  },
  ui: {
    label: 'UI/Menu',
    icon: '📋',
    description: 'Menu navigation, confirmations',
  },
  power: {
    label: 'Power-ups',
    icon: '⚡',
    description: 'Level up, power-ups, buffs',
  },
  damage: {
    label: 'Damage',
    icon: '💔',
    description: 'Hurt, death, warnings',
  },
  environment: {
    label: 'Environment',
    icon: '🌍',
    description: 'Doors, chests, ambient',
  },
  custom: {
    label: 'Custom',
    icon: '🎨',
    description: 'Game-specific custom sounds',
  },
};
```

---

## 8. Testing & Validation

### 8.1 Unit Tests

```javascript
// __tests__/snes-engine.test.js

import { SNESAudioEngine, SNES_PRESETS } from '../audio';

describe('SNESAudioEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new SNESAudioEngine();
  });

  test('initializes without errors', () => {
    expect(() => engine.init()).not.toThrow();
  });

  test('creates audio context on init', () => {
    engine.init();
    expect(engine.ctx).toBeTruthy();
    expect(engine.ctx instanceof AudioContext).toBe(true);
  });

  test('sets volume correctly', () => {
    engine.init();
    engine.setVolume(0.75);
    expect(engine.masterGain.gain.value).toBe(0.75);
  });

  test('all presets have required properties', () => {
    const required = [
      'waveform', 'baseFreq', 'freqSweep', 'duration',
      'attack', 'decay', 'sustain', 'release',
      'filterFreq', 'bitCrush'
    ];

    Object.entries(SNES_PRESETS).forEach(([key, preset]) => {
      required.forEach(prop => {
        expect(preset).toHaveProperty(prop);
      });
    });
  });

  test('plays preset without errors', () => {
    engine.init();
    expect(() => engine.playPreset(SNES_PRESETS.coin)).not.toThrow();
  });

  test('handles arpeggio presets', () => {
    engine.init();
    const arpPreset = Object.values(SNES_PRESETS).find(p => p.arp);
    expect(() => engine.playPreset(arpPreset)).not.toThrow();
  });
});
```

### 8.2 Integration Tests

```javascript
// __tests__/integration.test.js

import { playSound, initAudio, getAudioEngine } from '../audio';

describe('Audio Integration', () => {
  test('singleton pattern works correctly', () => {
    const engine1 = getAudioEngine();
    const engine2 = getAudioEngine();
    expect(engine1).toBe(engine2);
  });

  test('playSound initializes engine if needed', () => {
    expect(() => playSound('coin')).not.toThrow();
  });

  test('playSound handles custom params', () => {
    expect(() => playSound({
      waveform: 'sine',
      baseFreq: 440,
      freqSweep: 1,
      duration: 0.2,
      attack: 0.01,
      decay: 0.1,
      sustain: 0.5,
      release: 0.1,
      filterFreq: 2000,
      filterQ: 1,
      bitCrush: 10,
    })).not.toThrow();
  });
});
```

### 8.3 Manual Testing Checklist

```markdown
## Manual Test Checklist

### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

### Audio Playback
- [ ] All 32 presets play correctly
- [ ] Arpeggio presets play note sequences
- [ ] Noise-based presets (explosion, splash) work
- [ ] Echo/reverb effects audible
- [ ] Bit crush effect varies with setting
- [ ] Volume control affects output

### User Interaction
- [ ] Audio works after first click/tap
- [ ] Rapid preset switching doesn't break
- [ ] Custom parameters apply correctly
- [ ] Randomize produces varied sounds

### Edge Cases
- [ ] Tab switching/background doesn't break audio
- [ ] Multiple rapid sounds don't overflow
- [ ] Very short durations work (<50ms)
- [ ] Very long durations work (>2s)
- [ ] Extreme parameter values handled
```

---

## 9. Performance Optimization

### 9.1 Audio Context Management

```javascript
// Singleton pattern with lazy initialization
let audioContext = null;
let audioContextPromise = null;

export function getSharedAudioContext() {
  if (audioContext) return Promise.resolve(audioContext);
  
  if (!audioContextPromise) {
    audioContextPromise = new Promise((resolve) => {
      // Defer creation until user interaction
      const handler = () => {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        document.removeEventListener('click', handler);
        document.removeEventListener('keydown', handler);
        document.removeEventListener('touchstart', handler);
        resolve(audioContext);
      };
      
      document.addEventListener('click', handler, { once: true });
      document.addEventListener('keydown', handler, { once: true });
      document.addEventListener('touchstart', handler, { once: true });
    });
  }
  
  return audioContextPromise;
}
```

### 9.2 Node Pooling

```javascript
// Reuse oscillator nodes for rapid sounds
class NodePool {
  constructor(audioContext, poolSize = 10) {
    this.ctx = audioContext;
    this.pool = [];
    this.active = new Set();
    
    // Pre-create nodes
    for (let i = 0; i < poolSize; i++) {
      this.pool.push(this._createNode());
    }
  }
  
  _createNode() {
    return {
      osc: null,
      gain: this.ctx.createGain(),
      filter: this.ctx.createBiquadFilter(),
    };
  }
  
  acquire() {
    let node = this.pool.pop();
    if (!node) {
      node = this._createNode();
    }
    this.active.add(node);
    return node;
  }
  
  release(node) {
    this.active.delete(node);
    this.pool.push(node);
  }
}
```

### 9.3 Mobile Optimization

```javascript
// Mobile-specific optimizations
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const mobileConfig = {
  // Reduce polyphony on mobile
  maxConcurrentSounds: isMobile ? 4 : 16,
  
  // Simpler effects on mobile
  enableEcho: !isMobile,
  
  // Lower buffer sizes for lower latency
  bufferSize: isMobile ? 256 : 512,
};

export function createMobileOptimizedEngine() {
  const engine = new SNESAudioEngine();
  
  if (isMobile) {
    // Override echo for mobile
    engine.createEcho = () => null;
    
    // Simplify bit crusher
    engine.createBitCrusher = (bits) => {
      // Return passthrough on mobile for performance
      return engine.ctx.createGain();
    };
  }
  
  return engine;
}
```

---

## 10. Troubleshooting

### 10.1 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| No sound plays | Audio context suspended | Call `engine.resume()` after user interaction |
| Sound delayed | Context created late | Initialize on first user click |
| Clicking/popping | Abrupt volume changes | Use exponential ramps for envelope |
| Memory leaks | Nodes not disconnected | Disconnect and nullify after stop |
| Mobile no sound | Autoplay restrictions | Require touch event to initialize |
| Safari issues | webkit prefix needed | Use `webkitAudioContext` fallback |

### 10.2 Debug Mode

```javascript
// debug.js - Add debugging capabilities

export function enableAudioDebug(engine) {
  const originalPlay = engine.playPreset.bind(engine);
  
  engine.playPreset = function(preset) {
    console.group('🔊 SNES Audio Debug');
    console.log('Preset:', preset.name || 'Custom');
    console.log('Params:', preset);
    console.log('Context State:', engine.ctx?.state);
    console.log('Time:', engine.ctx?.currentTime);
    console.groupEnd();
    
    return originalPlay(preset);
  };
  
  // Monitor audio context state
  if (engine.ctx) {
    engine.ctx.onstatechange = () => {
      console.log('AudioContext state changed:', engine.ctx.state);
    };
  }
}
```

### 10.3 Error Recovery

```javascript
// error-recovery.js

export function createResilientEngine() {
  const engine = new SNESAudioEngine();
  
  const originalPlay = engine.playPreset.bind(engine);
  
  engine.playPreset = function(preset) {
    try {
      // Ensure initialized
      if (!engine.ctx) {
        engine.init();
      }
      
      // Handle suspended context
      if (engine.ctx.state === 'suspended') {
        engine.ctx.resume().then(() => originalPlay(preset));
        return;
      }
      
      // Handle closed context (recreate)
      if (engine.ctx.state === 'closed') {
        engine.ctx = null;
        engine.init();
      }
      
      originalPlay(preset);
      
    } catch (error) {
      console.error('Audio playback error:', error);
      
      // Attempt recovery
      try {
        engine.ctx = null;
        engine.init();
        originalPlay(preset);
      } catch (recoveryError) {
        console.error('Recovery failed:', recoveryError);
      }
    }
  };
  
  return engine;
}
```

---

## Appendix A: Quick Reference Card

```
┌────────────────────────────────────────────────────────────┐
│                SNES AUDIO QUICK REFERENCE                  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  INITIALIZATION                                            │
│  ─────────────                                             │
│  import { playSound } from './audio';                      │
│  playSound('coin');  // That's it!                         │
│                                                            │
│  AVAILABLE PRESETS (32 total)                              │
│  ─────────────────────────────                             │
│  Movement:    jump, doubleJump, dash, land                 │
│  Pickup:      coin, gem, heart, key                        │
│  Combat:      laser, blaster, sword, punch, magic          │
│  Explosion:   explosion, pop, boom                         │
│  UI:          select, confirm, cancel, pause, text         │
│  Power:       powerUp, levelUp, oneUp, heal                │
│  Damage:      hurt, death, enemyHit, warning               │
│  Environment: door, chest, splash, teleport, step          │
│                                                            │
│  CUSTOM SOUND                                              │
│  ────────────                                              │
│  playSound({                                               │
│    waveform: 'square',     // sine|square|saw|tri|noise    │
│    baseFreq: 440,          // 20-8000 Hz                   │
│    freqSweep: 2.0,         // 0.1-10x                      │
│    duration: 0.3,          // 0.01-2.0s                    │
│    attack: 0.01,           // 0-0.5s                       │
│    decay: 0.1,             // 0-1.0s                       │
│    sustain: 0.5,           // 0-1.0                        │
│    release: 0.15,          // 0-1.0s                       │
│    filterFreq: 3000,       // 100-10000 Hz                 │
│    filterQ: 1,             // 0.1-20                       │
│    echoDelay: 0.1,         // 0-0.5s                       │
│    echoDecay: 0.2,         // 0-0.9                        │
│    bitCrush: 10,           // 2-16 bits                    │
│  });                                                       │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Appendix B: File Structure Template

```
your-project/
├── src/
│   ├── audio/
│   │   ├── index.js              # Main exports
│   │   ├── snes-engine.js        # Core audio engine
│   │   ├── snes-presets.js       # Preset definitions
│   │   ├── custom-presets.js     # Your custom sounds
│   │   └── snes-audio.d.ts       # TypeScript definitions
│   │
│   ├── hooks/                    # React
│   │   └── useSNESAudio.js
│   │
│   ├── composables/              # Vue
│   │   └── useSNESAudio.js
│   │
│   ├── services/                 # Angular
│   │   └── snes-audio.service.ts
│   │
│   └── components/
│       └── SoundEffects.jsx      # UI components
│
├── __tests__/
│   ├── snes-engine.test.js
│   └── integration.test.js
│
└── package.json
```

---

*Document Version: 1.0*  
*Last Updated: 2025*  
*Compatible with: SNESSoundGenerator v1.0*
