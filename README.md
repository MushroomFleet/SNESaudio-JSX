<p align="center">
  <img src="https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 18+"/>
  <img src="https://img.shields.io/badge/Web_Audio_API-Supported-4CAF50?style=for-the-badge" alt="Web Audio API"/>
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="MIT License"/>
  <img src="https://img.shields.io/badge/Presets-32-ff6b9d?style=for-the-badge" alt="32 Presets"/>
</p>

<h1 align="center">🎮 SNES Audio JSX</h1>

<p align="center">
  <strong>16-Bit Game Sound Effects Generator for React Applications</strong>
</p>

<p align="center">
  A React component that synthesizes authentic SNES-style sound effects using the Web Audio API.<br/>
  Emulates the Sony SPC700 audio processor with Gaussian filtering, hardware echo, and bit-crushing.
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-features">Features</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-usage">Usage</a> •
  <a href="#-presets">Presets</a> •
  <a href="#-integration-guide">Integration</a> •
  <a href="#-api-reference">API</a>
</p>

---

## 🎵 What is SNES Audio JSX?

SNES Audio JSX is a **real-time sound effect synthesizer** that generates retro 16-bit game audio directly in the browser. Perfect for:

- 🕹️ **Indie game development** — Add authentic retro SFX to your web-based games
- 🎨 **Prototyping** — Quickly test sound design ideas without external tools
- 📚 **Learning** — Understand audio synthesis, envelopes, and chip-tune techniques
- 🔧 **Production** — Generate on-demand sound effects for React applications

The component faithfully emulates characteristics of the **Sony SPC700** audio processor found in the Super Nintendo, including:

- **Gaussian interpolation** for that signature warm, slightly muffled sound
- **Hardware-style echo/reverb** with feedback loops
- **Bit-crushing** for authentic lo-fi character
- **LFSR-based noise generation** for realistic chip percussion

## ✨ Features

| Feature | Description |
|---------|-------------|
| **32 Built-in Presets** | Jump, coin, laser, explosion, power-up, and more |
| **8 Effect Categories** | Movement, pickups, combat, explosions, UI, power, damage, environment |
| **Real-time Synthesis** | No audio files — sounds generated on-the-fly |
| **Full ADSR Envelopes** | Attack, Decay, Sustain, Release control |
| **SPC700 Emulation** | Gaussian filter, echo, bit-crush effects |
| **Custom Parameters** | Create unique sounds with full parameter control |
| **Waveform Visualization** | Real-time oscilloscope display |
| **Zero Dependencies** | Only React and the Web Audio API |
| **TypeScript Support** | Full type definitions included |
| **~5KB Core Engine** | Lightweight, minimal bundle impact |

## 🚀 Quick Start

### Demo Preview

Open `demo.html` in your browser to instantly preview all 32 presets and experiment with custom parameters — no build step required!

```bash
# Clone the repository
git clone https://github.com/MushroomFleet/SNESaudio-JSX.git

# Open the demo
open demo.html
```

### React Integration (30 seconds)

```jsx
import { playSound } from './audio';

function GameComponent() {
  return (
    <button onClick={() => playSound('coin')}>
      Collect Coin 🪙
    </button>
  );
}
```

That's it! The audio engine initializes automatically on first play.

## 📦 Installation

### Option 1: Copy Files (Recommended)

Copy the `audio/` folder into your React project:

```
your-project/
├── src/
│   ├── audio/
│   │   ├── index.js          # Main exports
│   │   ├── snes-engine.js    # Core audio engine
│   │   ├── snes-presets.js   # 32 preset definitions
│   │   └── snes-audio.d.ts   # TypeScript definitions
│   └── ...
```

### Option 2: Single File

For simpler projects, use `SNESSoundGenerator.jsx` which contains everything in one file.

## 🎮 Usage

### Basic Preset Playback

```jsx
import { playSound } from './audio';

// Play built-in presets
playSound('jump');       // Classic platformer jump
playSound('coin');       // Coin collection chime
playSound('explosion');  // Big explosion with bass
playSound('laser');      // Descending laser shot
playSound('powerUp');    // Ascending power-up fanfare
```

### React Hook Integration

```jsx
import { useSNESAudio } from './hooks/useSNESAudio';

function SoundPanel() {
  const { play, volume, setVolume, presets } = useSNESAudio();

  return (
    <div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={(e) => setVolume(parseFloat(e.target.value))}
      />
      
      {Object.keys(presets).map((key) => (
        <button key={key} onClick={() => play(key)}>
          {presets[key].name}
        </button>
      ))}
    </div>
  );
}
```

### Custom Sound Parameters

```jsx
import { playSound } from './audio';

// Create a custom sound effect
playSound({
  waveform: 'square',     // sine | square | sawtooth | triangle | noise
  baseFreq: 440,          // Starting frequency (Hz)
  freqSweep: 2.0,         // Frequency multiplier over duration
  duration: 0.3,          // Sound length (seconds)
  attack: 0.01,           // Attack time (seconds)
  decay: 0.1,             // Decay time (seconds)
  sustain: 0.5,           // Sustain level (0-1)
  release: 0.15,          // Release time (seconds)
  filterFreq: 3000,       // Low-pass filter cutoff (Hz)
  filterQ: 1,             // Filter resonance
  echoDelay: 0.1,         // Echo delay time (seconds)
  echoDecay: 0.2,         // Echo feedback amount (0-1)
  bitCrush: 10,           // Bit depth (2-16)
});
```

### Game Event Integration

```jsx
import { playSound } from './audio';

class GameEngine {
  onPlayerJump() {
    playSound('jump');
  }

  onCoinCollect() {
    playSound('coin');
  }

  onEnemyHit() {
    playSound('enemyHit');
  }

  onPlayerDamage() {
    playSound('hurt');
  }

  onLevelComplete() {
    playSound('levelUp');
  }

  onGameOver() {
    playSound('death');
  }
}
```

## 🎹 Presets

### Movement
| Preset | Description |
|--------|-------------|
| `jump` | Classic platformer jump with rising pitch |
| `doubleJump` | Higher-pitched secondary jump |
| `dash` | Quick dash/dodge movement |
| `land` | Soft landing thud |

### Pickups
| Preset | Description |
|--------|-------------|
| `coin` | Two-note coin collection chime |
| `gem` | Sparkling gem with arpeggio |
| `heart` | Health pickup with warm tones |
| `key` | Key/item collection jingle |

### Combat
| Preset | Description |
|--------|-------------|
| `laser` | Descending laser shot |
| `blaster` | Energy blaster with noise |
| `sword` | Quick sword slash |
| `punch` | Melee punch impact |
| `magic` | Ascending magical spell cast |

### Explosions
| Preset | Description |
|--------|-------------|
| `explosion` | Big explosion with bass rumble |
| `pop` | Small pop/burst |
| `boom` | Deep rumbling boom |

### UI / Menu
| Preset | Description |
|--------|-------------|
| `select` | Menu cursor move blip |
| `confirm` | Confirmation/OK sound |
| `cancel` | Cancel/back sound |
| `pause` | Game pause sound |
| `text` | Text character appear blip |

### Power / Status
| Preset | Description |
|--------|-------------|
| `powerUp` | Ascending power-up fanfare |
| `levelUp` | Level up celebration jingle |
| `oneUp` | Extra life jingle |
| `heal` | Healing/restoration effect |

### Damage
| Preset | Description |
|--------|-------------|
| `hurt` | Player damage sound |
| `death` | Descending death jingle |
| `enemyHit` | Enemy takes damage |
| `warning` | Alert/warning beep |

### Environment
| Preset | Description |
|--------|-------------|
| `door` | Door/gate opening |
| `chest` | Treasure chest opening |
| `splash` | Water splash effect |
| `teleport` | Teleportation/warp effect |
| `step` | Single footstep |

## 📖 Integration Guide

For comprehensive integration instructions, see **[SNESaudio-integration.md](./SNESaudio-integration.md)**.

The integration guide covers:

- ✅ **Pre-integration assessment** — Compatibility checks and codebase analysis
- ✅ **Architecture patterns** — Standalone, service-based, and store-integrated approaches
- ✅ **Framework adapters** — React hooks, Vue composables, Angular services
- ✅ **TypeScript support** — Full type definitions
- ✅ **Performance optimization** — Mobile optimizations, node pooling
- ✅ **Testing strategies** — Unit tests, integration tests, manual checklist
- ✅ **Troubleshooting** — Common issues and solutions

### Quick Integration Steps

1. **Copy the audio module** into your React project
2. **Import the playSound function** where needed
3. **Call playSound()** with preset names or custom parameters
4. **Done!** — Audio initializes automatically on first user interaction

```jsx
// Step 1: Import
import { playSound } from './audio';

// Step 2: Use anywhere in your React app
<button onClick={() => playSound('coin')}>
  Collect!
</button>
```

## 📚 API Reference

### Core Functions

```javascript
// Play a preset by name
playSound(presetName: string): void

// Play with custom parameters
playSound(params: SoundParams): void

// Get singleton engine instance
getAudioEngine(): SNESAudioEngine

// Initialize audio (called automatically)
initAudio(): SNESAudioEngine
```

### SNESAudioEngine Class

```javascript
class SNESAudioEngine {
  init(): this                          // Initialize audio context
  resume(): Promise<void>               // Resume suspended context
  setVolume(volume: number): void       // Set master volume (0-1)
  playPreset(preset: SoundParams): void // Play a sound
  getAnalyserData(): Uint8Array | null  // Get waveform data
}
```

### Sound Parameters

```typescript
interface SoundParams {
  waveform: 'sine' | 'square' | 'sawtooth' | 'triangle' | 'noise';
  baseFreq: number;      // 20-8000 Hz
  freqSweep: number;     // 0.1-10x
  duration: number;      // 0.01-2.0 seconds
  attack: number;        // 0-0.5 seconds
  decay: number;         // 0-1.0 seconds
  sustain: number;       // 0-1.0
  release: number;       // 0-1.0 seconds
  filterFreq: number;    // 100-10000 Hz
  filterQ: number;       // 0.1-20
  echoDelay: number;     // 0-0.5 seconds
  echoDecay: number;     // 0-0.9
  bitCrush: number;      // 2-16 bits
  
  // Optional
  arp?: number[];        // Arpeggio note frequencies
  arpSpeed?: number;     // Arpeggio speed
  noise?: number;        // Noise mix amount (0-1)
  bass?: number;         // Bass layer frequency
}
```

## 🌐 Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 66+ | ✅ Full Support |
| Firefox | 76+ | ✅ Full Support |
| Safari | 14.1+ | ✅ Full Support |
| Edge | 79+ | ✅ Full Support |
| Mobile Chrome | 88+ | ✅ Full Support |
| Mobile Safari | 14.5+ | ⚠️ Requires Touch |

> **Note:** Mobile browsers require a user interaction (touch/click) before audio can play due to autoplay policies.

## 📁 Repository Structure

```
SNESaudio-JSX/
├── SNESSoundGenerator.jsx      # Complete React component (all-in-one)
├── demo.html                   # Interactive demo (no build required)
├── SNESaudio-integration.md    # Comprehensive integration guide
├── README.md                   # This file
│
└── audio/                      # Modular version (recommended)
    ├── index.js                # Main exports
    ├── snes-engine.js          # Core audio engine
    ├── snes-presets.js         # 32 preset definitions
    └── snes-audio.d.ts         # TypeScript definitions
```

## 🤝 Contributing

Contributions are welcome! Feel free to:

- 🐛 Report bugs
- 💡 Suggest new presets or features
- 🔧 Submit pull requests
- 📖 Improve documentation

## 📄 License

MIT License — feel free to use in personal and commercial projects.

---

## 📚 Citation

### Academic Citation

If you use this codebase in your research or project, please cite:

```bibtex
@software{snes_audio_jsx,
  title = {SNES Audio JSX: 16-Bit Game Sound Effects Generator for React Applications},
  author = {Drift Johnson},
  year = {2025},
  url = {https://github.com/MushroomFleet/SNESaudio-JSX},
  version = {1.0.0}
}
```

### Donate

[![Ko-Fi](https://cdn.ko-fi.com/cdn/kofi3.png?v=3)](https://ko-fi.com/driftjohnson)

---

<p align="center">
  Made with 🎮 for indie game developers
</p>
