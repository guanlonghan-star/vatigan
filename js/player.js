export function clampSeek(value, duration) {
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  return Math.min(duration, Math.max(0, Number(value) || 0));
}

export function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

export class AudioController {
  constructor({audio, onState = () => {}, mediaSession} = {}) {
    this.audio = audio || new Audio();
    this.audio.preload = 'metadata';
    this.onState = onState;
    this.mediaSession = mediaSession ?? globalThis.navigator?.mediaSession;
    this.node = null;
    this.layer = null;
    this.error = null;
    for (const event of ['timeupdate', 'durationchange', 'play', 'pause', 'ended']) {
      this.audio.addEventListener(event, () => this.emit());
    }
    this.audio.addEventListener('error', () => {
      this.error = '音频未载入，请重试或直接阅读文字';
      this.emit();
    });
    this.setupMediaSession();
  }

  setStateListener(listener) { this.onState = listener || (() => {}); this.emit(); }
  state() {
    return {
      playing: !this.audio.paused,
      currentTime: this.audio.currentTime || 0,
      duration: Number.isFinite(this.audio.duration) ? this.audio.duration : 0,
      error: this.error,
      node: this.node,
      layer: this.layer,
    };
  }
  emit() { this.onState(this.state()); }

  load(node, layer) {
    if (!node?.audio?.[layer]) throw new Error('missing audio source');
    this.pause();
    this.audio.currentTime = 0;
    this.error = null;
    this.node = node;
    this.layer = layer;
    this.audio.src = node.audio[layer];
    this.audio.load?.();
    if (this.mediaSession && globalThis.MediaMetadata) {
      this.mediaSession.metadata = new MediaMetadata({
        title: node.title,
        artist: layer === 'standard' ? '标准讲解' : '深入补充',
        album: '梵蒂冈中文语音导览',
      });
    }
    this.emit();
  }

  async play() { this.error = null; await this.audio.play(); this.emit(); }
  pause() { this.audio.pause(); this.emit(); }
  seekBy(seconds) { this.seekTo((this.audio.currentTime || 0) + seconds); }
  seekTo(seconds) { this.audio.currentTime = clampSeek(seconds, this.audio.duration); this.emit(); }
  retry() { if (this.node) this.load(this.node, this.layer); }
  destroy() { this.pause(); this.audio.removeAttribute?.('src'); this.audio.load?.(); this.onState = () => {}; }

  setupMediaSession() {
    if (!this.mediaSession?.setActionHandler) return;
    const safe = (name, action) => { try { this.mediaSession.setActionHandler(name, action); } catch {} };
    safe('play', () => this.play());
    safe('pause', () => this.pause());
    safe('seekbackward', (details) => this.seekBy(-(details.seekOffset || 15)));
    safe('seekforward', (details) => this.seekBy(details.seekOffset || 15));
    safe('seekto', (details) => this.seekTo(details.seekTime));
  }
}

export function mountPlayer(container, controller, node, layer) {
  container.innerHTML = `<div class="player-status" aria-live="polite"></div><div class="player-controls"><button class="seek-back" aria-label="后退 15 秒">−15</button><button class="play-button" aria-label="播放">▶</button><button class="seek-forward" aria-label="前进 15 秒">+15</button></div><div class="timeline"><span class="elapsed">0:00</span><input class="scrubber" type="range" min="0" max="0" value="0" aria-label="播放进度"><span class="total">0:00</span></div>`;
  const play = container.querySelector('.play-button');
  const status = container.querySelector('.player-status');
  const scrubber = container.querySelector('.scrubber');
  const update = (state) => {
    play.textContent = state.playing ? 'Ⅱ' : '▶';
    play.setAttribute('aria-label', state.playing ? '暂停' : '播放');
    container.querySelector('.elapsed').textContent = formatTime(state.currentTime);
    container.querySelector('.total').textContent = formatTime(state.duration);
    scrubber.max = state.duration || 0;
    scrubber.value = state.currentTime || 0;
    status.innerHTML = state.error ? `${state.error} <button class="retry-audio">重试音频</button>` : '';
    status.querySelector('.retry-audio')?.addEventListener('click', () => controller.retry(), {once: true});
  };
  controller.setStateListener(update);
  controller.load(node, layer);
  play.addEventListener('click', () => controller.audio.paused ? controller.play() : controller.pause());
  container.querySelector('.seek-back').addEventListener('click', () => controller.seekBy(-15));
  container.querySelector('.seek-forward').addEventListener('click', () => controller.seekBy(15));
  scrubber.addEventListener('input', () => controller.seekTo(Number(scrubber.value)));
}
