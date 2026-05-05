class ToneParam {
  constructor(value = 0, minValue = -Infinity, maxValue = Infinity) {
    this.value = value;
    this.minValue = minValue;
    this.maxValue = maxValue;
  }

  rampTo(value, _time) {
    this.value = value;
    return this;
  }
}

class ToneNode {
  constructor() {
    this.disposed = false;
  }

  connect(node) {
    this._connectedTo = node || null;
    return this;
  }

  toDestination() {
    this._connectedTo = 'destination';
    return this;
  }

  disconnect() {
    this._connectedTo = null;
    return this;
  }

  dispose() {
    this.disposed = true;
  }
}

class ToneSynthBase extends ToneNode {
  constructor() {
    super();
    this.volume = new ToneParam(0, -Infinity, 0);
  }

  set(options = {}) {
    this.options = {
      ...(this.options || {}),
      ...options
    };
    return this;
  }

  triggerAttackRelease() {
    return this;
  }
}

class Filter extends ToneNode {
  constructor(options = {}) {
    super();
    this.type = options.type || 'lowpass';
    this.frequency = new ToneParam(options.frequency ?? 350, 0, Infinity);
    this.Q = new ToneParam(options.Q ?? 1, 0, Infinity);
  }
}

class Limiter extends ToneNode {
  constructor(threshold = 0) {
    super();
    this.threshold = threshold;
  }
}

class Reverb extends ToneNode {
  constructor(options = {}) {
    super();
    this.decay = options.decay ?? 1.5;
    this.preDelay = options.preDelay ?? 0.01;
    this.wet = new ToneParam(options.wet ?? 0.15, 0, 1);
  }
}

class AutoFilter extends Filter {
  constructor(options = {}) {
    super(options);
    this.baseFrequency = options.baseFrequency ?? 300;
    this.octaves = options.octaves ?? 2;
  }

  start() {
    this.started = true;
    return this;
  }
}

class MonoSynth extends ToneSynthBase {
  constructor(options = {}) {
    super();
    this.options = options;
  }
}

class Synth extends ToneSynthBase {
  constructor(options = {}) {
    super();
    this.options = options;
  }
}

class NoiseSynth extends ToneSynthBase {
  constructor(options = {}) {
    super();
    this.options = options;
  }
}

class DuoSynth extends ToneSynthBase {
  constructor(options = {}) {
    super();
    this.options = options;
  }
}

class PolySynth extends ToneSynthBase {
  constructor(VoiceCtor = Synth, options = {}) {
    super();
    this.VoiceCtor = VoiceCtor;
    this.options = options;
  }
}

class LFO extends ToneNode {
  constructor(options = {}) {
    super();
    this.frequency = new ToneParam(options.frequency ?? 1, 0, Infinity);
    this.min = options.min ?? 0;
    this.max = options.max ?? 1;
  }

  start() {
    this.started = true;
    return this;
  }
}

const ToneTransport = {
  bpm: {
    value: 120
  }
};

class ToneDestination extends ToneNode {
  constructor() {
    super();
    this.mute = false;
  }
}

class Panner extends ToneNode {
  constructor(pan = 0) {
    super();
    this.pan = new ToneParam(pan, -1, 1);
  }
}

class PanVol extends ToneNode {
  constructor(options = {}) {
    super();
    this.pan = new ToneParam(options.pan ?? 0, -1, 1);
    this.volume = new ToneParam(options.volume ?? 0, -Infinity, 0);
  }
}

class Channel extends PanVol {}

export const __ATOMA_TONE_STUB__ = true;
export const version = 'atoma-tone-stub';
export const context = {
  state: 'running'
};
export const Destination = new ToneDestination();

export function getDestination() {
  return Destination;
}

export function getContext() {
  return {
    state: context.state,
    rawContext: null
  };
}

export const Transport = ToneTransport;
export { ToneParam as Param, Filter, Limiter, Reverb, MonoSynth, Synth, NoiseSynth, DuoSynth, PolySynth, AutoFilter, LFO, Panner, PanVol, Channel };

export function now() {
  return (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
}

export async function start() {
  return undefined;
}

export default {
  Param: ToneParam,
  Filter,
  Limiter,
  Reverb,
  MonoSynth,
  Synth,
  NoiseSynth,
  DuoSynth,
  PolySynth,
  AutoFilter,
  LFO,
  Panner,
  PanVol,
  Channel,
  Transport,
  context,
  Destination,
  getDestination,
  getContext,
  __ATOMA_TONE_STUB__,
  version,
  now,
  start
};
