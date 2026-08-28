import { createExport, fromPortable, getThoughts, saveThought, saveThoughts } from './db';
import { formatParkedTime, makeThought, MAX_THOUGHT_LENGTH, parseParkingExport, twoWeekStats } from './domain';
import { captureLicenseFromUrl, checkoutUrl, forgetLicense, getLicenseState, storeLicense, verifyLicense, type LicenseState } from './license';
import type { Thought, ThoughtStatus } from './types';

const DRAFT_KEY = 'thought-parking:draft';
const CUE_KEY = 'thought-parking:return-cue';
const DEFAULT_CUE = 'It’s safe here. Return to what you were doing.';

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character] ?? character);
}

function routeName(): 'capture' | 'review' | 'settings' | 'privacy' | 'terms' {
  const route = location.pathname.replace(/\/+$/, '') || '/';
  if (route === '/review') return 'review';
  if (route === '/settings') return 'settings';
  if (route === '/privacy') return 'privacy';
  if (route === '/terms') return 'terms';
  return 'capture';
}

function countLabel(count: number): string {
  return `${count} ${count === 1 ? 'thought' : 'thoughts'}`;
}

export class ThoughtParkingApp {
  private root: HTMLElement;
  private thoughts: Thought[] = [];
  private storageError = '';
  private reviewStarted = false;
  private justParked = false;
  private captureStartedAt: number | undefined;
  private audioBlob: Blob | undefined;
  private audioUrl = '';
  private recorder: MediaRecorder | undefined;
  private recordingStream: MediaStream | undefined;
  private recordingStartedAt = 0;
  private recordingTimer: number | undefined;
  private toastTimer: number | undefined;
  private installPrompt: InstallPrompt | undefined;
  private license: LicenseState = getLicenseState();
  private isOnline = navigator.onLine;

  constructor(root: HTMLElement) {
    this.root = root;
  }

  async init(): Promise<void> {
    captureLicenseFromUrl();
    this.license = getLicenseState();
    try {
      this.thoughts = await getThoughts();
    } catch (error) {
      this.storageError = error instanceof Error ? error.message : 'Local storage is unavailable.';
    }

    addEventListener('popstate', () => {
      this.reviewStarted = false;
      this.render();
    });
    addEventListener('online', () => { this.isOnline = true; this.render(); });
    addEventListener('offline', () => { this.isOnline = false; this.render(); });
    addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.installPrompt = event as InstallPrompt;
      this.render();
    });
    addEventListener('sw-update', () => this.showToast('A fresh tape is ready.', 'Update now', () => {
      sessionStorage.setItem('thought-parking:apply-update', '1');
      navigator.serviceWorker.getRegistration().then((registration) => registration?.waiting?.postMessage({ type: 'SKIP_WAITING' }));
    }));
    navigator.serviceWorker?.addEventListener('controllerchange', () => {
      if (sessionStorage.getItem('thought-parking:apply-update')) {
        sessionStorage.removeItem('thought-parking:apply-update');
        location.reload();
      }
    });
    addEventListener('keydown', (event) => this.handleGlobalKeys(event));

    this.render();
    void this.refreshNetworkState();
    if (this.license.checking) {
      this.license = await verifyLicense();
      this.render();
    }
  }

  private async refreshNetworkState(): Promise<void> {
    const wasOnline = this.isOnline;
    if (!navigator.onLine) {
      this.isOnline = false;
      if (wasOnline !== this.isOnline) this.render();
      return;
    }
    try {
      const response = await fetch('/manifest.webmanifest?network-probe=1', { cache: 'no-store' });
      this.isOnline = response.ok;
    } catch {
      this.isOnline = false;
    }
    if (wasOnline !== this.isOnline) this.render();
  }

  private handleGlobalKeys(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.code === 'Space') {
      event.preventDefault();
      this.navigate('/');
      requestAnimationFrame(() => document.querySelector<HTMLTextAreaElement>('#thought-input')?.focus());
    }
  }

  private navigate(path: string): void {
    if (this.recorder?.state === 'recording') this.stopRecording();
    if (location.pathname !== path) history.pushState({}, '', path);
    this.reviewStarted = false;
    this.render();
    window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  private shell(content: string, current: ReturnType<typeof routeName>): string {
    const parked = this.thoughts.filter((thought) => thought.status === 'parked').length;
    return `
      <a class="skip-link" href="#main">Skip to main content</a>
      <header class="site-header">
        <a class="wordmark" href="/" data-route aria-label="Thought Parking, capture a thought">
          <span class="record-dot" aria-hidden="true"></span>
          <span>Thought<br>Parking</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="/" data-route ${current === 'capture' ? 'aria-current="page"' : ''}>Capture</a>
          <a href="/review/" data-route ${current === 'review' ? 'aria-current="page"' : ''}>Review <span class="nav-count" aria-label="${countLabel(parked)} parked">${parked}</span></a>
          <a href="/settings/" data-route ${current === 'settings' ? 'aria-current="page"' : ''}>My data</a>
        </nav>
        <span class="network-state ${this.isOnline ? '' : 'is-offline'}" role="status">${this.isOnline ? 'On device' : 'Offline · still saving'}</span>
      </header>
      ${content}
      <footer>
        <p>Private by default. Made for useful interruptions, not productivity guilt.</p>
        <nav aria-label="Legal"><a href="/privacy/" data-route>Privacy</a><a href="/terms/" data-route>Terms</a></nav>
        <p class="provenance">Original hero image generated for Thought Parking with the factory image model.</p>
      </footer>
      <div id="toast-region" class="toast-region" aria-live="polite" aria-atomic="true"></div>
    `;
  }

  private render(): void {
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
      this.audioUrl = '';
    }
    const current = routeName();
    let content = '';
    if (current === 'capture') content = this.captureView();
    if (current === 'review') content = this.reviewView();
    if (current === 'settings') content = this.settingsView();
    if (current === 'privacy') content = this.privacyView();
    if (current === 'terms') content = this.termsView();
    this.root.innerHTML = this.shell(content, current);
    this.bindCommon();
    if (current === 'capture') this.bindCapture();
    if (current === 'review') this.bindReview();
    if (current === 'settings') this.bindSettings();
  }

  private captureView(): string {
    const parked = this.thoughts.filter((thought) => thought.status === 'parked').length;
    const draft = localStorage.getItem(DRAFT_KEY) ?? '';
    const cue = this.license.unlocked ? (localStorage.getItem(CUE_KEY) || DEFAULT_CUE) : DEFAULT_CUE;
    return `<main id="main" class="capture-layout">
      <section class="capture-intro" aria-labelledby="capture-title">
        <p class="eyebrow">Quick-capture deck · local only</p>
        <h1 id="capture-title">Park it.<br><span>Go back.</span></h1>
        <p class="lede">Catch the thought without deciding what it means. Review it later, on purpose.</p>
        <figure class="hero-art">
          <img src="/assets/cassette-still-life.webp" width="960" height="640" alt="An unlabeled cassette, loose ribbon, blank paper scraps, and a grease pencil on textured paper" fetchpriority="high" decoding="async">
          <figcaption>Side A: now. Side B: later.</figcaption>
        </figure>
      </section>
      <section class="capture-sheet" aria-label="Quick capture">
        ${this.justParked ? `<div class="return-cue" role="status"><span aria-hidden="true">✓</span><div><strong>Thought parked.</strong><p>${escapeHtml(cue)}</p></div></div>` : ''}
        ${this.storageError ? `<div class="error-note" role="alert"><strong>Parking is unavailable.</strong><p>${escapeHtml(this.storageError)} Check private-browsing or storage settings, then reload.</p></div>` : ''}
        <div class="sheet-label"><span>Interrupt slip</span><span>No. ${(this.thoughts.length + 1).toString().padStart(3, '0')}</span></div>
        <form id="capture-form">
          <label for="thought-input">What pulled your attention?</label>
          <textarea id="thought-input" name="thought" maxlength="${MAX_THOUGHT_LENGTH}" rows="7" placeholder="Type the thought—no tags, dates, or decisions." ${this.storageError ? 'disabled' : ''}>${escapeHtml(draft)}</textarea>
          <div class="input-meta"><span id="character-count">${draft.length} / ${MAX_THOUGHT_LENGTH}</span><span class="shortcut-hint"><kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Enter</kbd> to park</span></div>
          <div class="voice-strip">
            <button class="record-button" id="record-button" type="button" ${this.storageError ? 'disabled' : ''} aria-describedby="voice-status"><span class="mic-mark" aria-hidden="true"></span><span>Record voice</span></button>
            <div id="voice-status" class="voice-status" role="status">Or leave a short voice clip. It never leaves this device.</div>
          </div>
          <button class="primary-action" type="submit" ${this.storageError ? 'disabled' : ''}>Park thought <span aria-hidden="true">→</span></button>
          <p id="capture-error" class="form-error" role="alert"></p>
        </form>
        <div class="lot-status">
          <div><strong>${parked}</strong><span>waiting for review</span></div>
          <a href="/review/" data-route>Open parking lot <span aria-hidden="true">↗</span></a>
        </div>
        <p class="hotkey-note"><span aria-hidden="true">✦</span> From anywhere: <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Shift</kbd> + <kbd>Space</kbd></p>
      </section>
    </main>`;
  }

  private reviewView(): string {
    const parked = this.thoughts.filter((thought) => thought.status === 'parked').sort((a, b) => a.createdAt - b.createdAt);
    const handled = this.thoughts.filter((thought) => thought.status !== 'parked').sort((a, b) => (b.decidedAt ?? 0) - (a.decidedAt ?? 0));
    let reviewBody: string;
    if (!parked.length) {
      reviewBody = `<div class="empty-state"><div class="empty-reel" aria-hidden="true">◎—◎</div><h2>The lot is clear.</h2><p>There’s nothing asking for a decision. That is a real finish line.</p><a class="button-link" href="/" data-route>Return to capture</a></div>`;
    } else if (!this.reviewStarted) {
      reviewBody = `<div class="review-gate"><p class="stamp">${countLabel(parked.length)} waiting</p><h2>Review is a separate mode.</h2><p>Start only when you have a few minutes. You’ll see one thought at a time, oldest first—no sorting, scoring, or backlog grooming.</p><button id="start-review" class="primary-action" type="button">Start this review <span aria-hidden="true">→</span></button></div>`;
    } else {
      const thought = parked[0];
      if (thought.audio) this.audioUrl = URL.createObjectURL(thought.audio);
      reviewBody = `<div class="review-session">
        <div class="review-progress"><span>Now deciding</span><span>${parked.length} left</span></div>
        <article class="thought-card" data-id="${thought.id}">
          <p class="thought-time">Parked ${formatParkedTime(thought.createdAt)}</p>
          <p class="thought-text">${thought.text ? escapeHtml(thought.text) : '<em>Voice note</em>'}</p>
          ${this.audioUrl ? `<audio controls preload="metadata" src="${this.audioUrl}">Your browser cannot play this local voice clip.</audio>` : ''}
          <div class="decision-help"><p><strong>Archive</strong> means “not for now.”</p><p><strong>Promote</strong> means “ready to take elsewhere” and copies the text.</p></div>
          <div class="decision-actions">
            <button class="secondary-action" type="button" data-decision="archived">Archive</button>
            <button class="primary-action" type="button" data-decision="promoted">Promote <span aria-hidden="true">→</span></button>
          </div>
        </article>
      </div>`;
    }
    return `<main id="main" class="review-page">
      <div class="page-heading"><p class="eyebrow">Deliberate review window</p><h1>Open the parking lot.</h1><p>Nothing here is overdue. Decide only what deserves another life.</p></div>
      ${this.storageError ? `<div class="error-note" role="alert">${escapeHtml(this.storageError)}</div>` : reviewBody}
      ${handled.length ? `<details class="handled-log"><summary>Recently handled <span>${handled.length}</span></summary><ul>${handled.slice(0, 20).map((thought) => `<li><span class="status-tape status-${thought.status}">${thought.status}</span><p>${escapeHtml(thought.text || 'Voice note')}</p><button type="button" data-restore="${thought.id}">Put back</button></li>`).join('')}</ul></details>` : ''}
    </main>`;
  }

  private settingsView(): string {
    const stats = twoWeekStats(this.thoughts);
    const verificationUnavailable = this.license.reason === 'verification_unavailable';
    const verdictNotice = this.license.hasToken && !this.license.unlocked
      ? `<p class="license-notice" role="status">${verificationUnavailable
        ? 'The license service could not be reached. Supporter features remain locked until this token can be verified.'
        : `This license is no longer active${this.license.reason ? ` (${escapeHtml(this.license.reason.replaceAll('_', ' '))})` : ''}. The free capture experience is unchanged.`}</p>`
      : '';
    return `<main id="main" class="data-page">
      <div class="page-heading"><p class="eyebrow">Your device, your data</p><h1>Keep the keys.</h1><p>Thoughts and voice clips live in this browser’s IndexedDB. There is no account and no sync.</p></div>
      <section class="data-section" aria-labelledby="backup-title">
        <div><p class="section-number">01 / backup</p><h2 id="backup-title">Take the whole box</h2><p>Export a complete JSON backup, including voice clips. Import uses last-write-wins when IDs match.</p></div>
        <div class="data-actions">
          <button id="export-button" class="primary-action" type="button" ${this.storageError ? 'disabled' : ''}>Export JSON</button>
          <label class="file-button" for="import-file">Import JSON</label><input id="import-file" class="visually-hidden" type="file" accept="application/json,.json" ${this.storageError ? 'disabled' : ''}>
          <p id="import-status" role="status"></p>
        </div>
      </section>
      <section class="data-section supporter-section" aria-labelledby="support-title">
        <div><p class="section-number">02 / optional upgrade</p><h2 id="support-title">Support the lot</h2><p>The full capture, voice, review, and backup workflow is free. A <strong>$7 one-time</strong> supporter license adds a private 14-day return snapshot and your own return cue.</p><p class="merchant-note">Secure checkout is hosted by Sociobot; Dodo is merchant of record. Refunds are handled there.</p>${verdictNotice}</div>
        <div class="license-card ${this.license.unlocked ? 'is-unlocked' : ''}">
          ${this.license.unlocked ? `<p class="stamp">Supporter tape unlocked</p><div class="rhythm-stats"><div><strong>${stats.count}</strong><span>captures / 14 days</span></div><div><strong>${stats.percentage}%</strong><span>parked under 30 sec</span></div></div><p class="goal-note">The useful signal: 20+ captures and at least 70% under 30 seconds. This stays on your device.</p><form id="cue-form"><label for="custom-cue">Your return-to-work cue</label><input id="custom-cue" maxlength="120" value="${escapeHtml(localStorage.getItem(CUE_KEY) || DEFAULT_CUE)}"><button class="secondary-action" type="submit">Save cue</button></form><button id="forget-license" class="text-button" type="button">Forget license on this device</button>` : `<a class="primary-action button-link" href="${checkoutUrl}">Buy once · $7 <span aria-hidden="true">↗</span></a><details class="restore-license"><summary>Have a license?</summary><form id="license-form"><label for="license-input">Paste license token</label><input id="license-input" autocomplete="off" spellcheck="false" required><button class="secondary-action" type="submit">Verify and restore</button><p id="license-status" role="status">${this.license.checking ? 'Checking license…' : ''}</p></form></details>`}
        </div>
      </section>
      <section class="install-section" aria-labelledby="install-title"><div><p class="section-number">03 / offline</p><h2 id="install-title">Keep it within reach</h2><p>Install the app for an app-window shortcut. It remains useful without a connection.</p></div><button id="install-button" class="secondary-action" type="button" ${this.installPrompt ? '' : 'disabled'}>${this.installPrompt ? 'Install app' : 'Use browser menu to install'}</button></section>
    </main>`;
  }

  private privacyView(): string {
    return `<main id="main" class="legal-page"><p class="eyebrow">Plain-language policy · August 28, 2026</p><h1>Privacy stays parked.</h1><p class="legal-lede">Thought Parking is designed so we do not receive your thoughts.</p><h2>What stays on your device</h2><p>Captured text, voice clips, decisions, capture timing, custom return cues, and license tokens are stored locally in your browser. They are not uploaded by the app. Clearing site data can erase them, so use Export JSON for a backup.</p><h2>What leaves your device</h2><p>When you buy or verify a supporter license, your browser contacts the Sociobot billing API with the license token. Checkout is hosted by Sociobot and Dodo, the merchant of record. Their systems process purchase and refund information under their own policies.</p><h2>Analytics and permissions</h2><p>There are no analytics, advertising trackers, third-party fonts, or runtime CDNs. Microphone access is requested only after you press “Record voice”; the resulting clip is kept in local storage. The service worker caches the app shell for offline use.</p><h2>Your choices</h2><p>Export at any time. Archiving moves a thought out of the review queue but keeps it in your local history. Clear this site’s browser data to remove everything. You can forget a saved license from My data.</p><p><a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a></p></main>`;
  }

  private termsView(): string {
    return `<main id="main" class="legal-page"><p class="eyebrow">Terms · August 28, 2026</p><h1>A small, honest utility.</h1><p class="legal-lede">Use Thought Parking to capture interruptions—not as medical care or guaranteed storage.</p><h2>The service</h2><p>The app is provided “as is” for personal note capture. It does not diagnose, treat, coach, prioritize, or replace professional advice. You are responsible for backups and for the content you record.</p><h2>Supporter purchase</h2><p>The optional supporter unlock is a $7 one-time purchase for the listed features on compatible devices. Sociobot/Dodo is the merchant of record. Checkout, receipts, refunds, and license revocation are handled through that service. A refunded or revoked license may stop unlocking supporter features; core free features remain available.</p><h2>Acceptable use</h2><p>Do not misuse the billing or verification endpoints, interfere with the app, or use it in violation of law. Because data remains local, we generally cannot recover deleted notes or move them without your exported backup.</p><h2>Changes and liability</h2><p>We may improve or discontinue the app. To the extent permitted by law, the service comes without warranties and liability is limited to the amount you paid for it.</p><p><a href="mailto:support@sociobot.in">support@sociobot.in</a></p></main>`;
  }

  private bindCommon(): void {
    document.querySelectorAll<HTMLAnchorElement>('a[data-route]').forEach((link) => link.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      this.navigate(new URL(link.href).pathname);
    }));
  }

  private bindCapture(): void {
    const form = document.querySelector<HTMLFormElement>('#capture-form');
    const input = document.querySelector<HTMLTextAreaElement>('#thought-input');
    const count = document.querySelector<HTMLElement>('#character-count');
    if (!form || !input || !count) return;
    const begin = () => { this.captureStartedAt ??= performance.now(); };
    input.addEventListener('focus', begin, { once: true });
    input.addEventListener('input', () => {
      begin();
      localStorage.setItem(DRAFT_KEY, input.value);
      count.textContent = `${input.value.length} / ${MAX_THOUGHT_LENGTH}`;
      this.justParked = false;
    });
    input.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') form.requestSubmit();
    });
    form.addEventListener('submit', (event) => void this.captureThought(event));
    document.querySelector('#record-button')?.addEventListener('click', () => void this.toggleRecording());
    if (new URLSearchParams(location.search).has('capture')) input.focus();
  }

  private async captureThought(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (this.recorder?.state === 'recording') this.stopRecording();
    const input = document.querySelector<HTMLTextAreaElement>('#thought-input');
    const error = document.querySelector<HTMLElement>('#capture-error');
    if (!input || !error) return;
    if (!input.value.trim() && !this.audioBlob) {
      error.textContent = 'Type a thought or record a voice clip first.';
      input.focus();
      return;
    }
    const button = document.querySelector<HTMLButtonElement>('#capture-form button[type="submit"]');
    if (button) { button.disabled = true; button.textContent = 'Parking…'; }
    const thought = makeThought(input.value, performance.now() - (this.captureStartedAt ?? performance.now()), this.audioBlob);
    try {
      await saveThought(thought);
      this.thoughts.unshift(thought);
      localStorage.removeItem(DRAFT_KEY);
      this.audioBlob = undefined;
      this.captureStartedAt = undefined;
      this.justParked = true;
      this.render();
    } catch (saveError) {
      error.textContent = `${saveError instanceof Error ? saveError.message : 'The thought could not be saved.'} Copy it somewhere safe and try again.`;
      if (button) { button.disabled = false; button.innerHTML = 'Park thought <span aria-hidden="true">→</span>'; }
    }
  }

  private async toggleRecording(): Promise<void> {
    if (this.recorder?.state === 'recording') {
      this.stopRecording();
      return;
    }
    const status = document.querySelector<HTMLElement>('#voice-status');
    const button = document.querySelector<HTMLButtonElement>('#record-button');
    if (!status || !button) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      status.textContent = 'Voice recording is not supported here. Type the thought instead.';
      return;
    }
    try {
      this.captureStartedAt ??= performance.now();
      this.recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      this.recorder = new MediaRecorder(this.recordingStream);
      this.recorder.addEventListener('dataavailable', (event) => { if (event.data.size) chunks.push(event.data); });
      this.recorder.addEventListener('stop', () => {
        this.audioBlob = new Blob(chunks, { type: this.recorder?.mimeType || 'audio/webm' });
        this.recordingStream?.getTracks().forEach((track) => track.stop());
        this.recordingStream = undefined;
        if (this.recordingTimer) clearInterval(this.recordingTimer);
        this.recordingTimer = undefined;
        const currentStatus = document.querySelector<HTMLElement>('#voice-status');
        const currentButton = document.querySelector<HTMLButtonElement>('#record-button');
        if (currentStatus) currentStatus.textContent = 'Voice clip ready. Park it now, or record again.';
        if (currentButton) { currentButton.classList.remove('is-recording'); currentButton.setAttribute('aria-pressed', 'false'); currentButton.querySelector('span:last-child')!.textContent = 'Record again'; }
      }, { once: true });
      this.recorder.start();
      this.recordingStartedAt = Date.now();
      button.classList.add('is-recording');
      button.setAttribute('aria-pressed', 'true');
      button.querySelector('span:last-child')!.textContent = 'Stop recording';
      const updateTime = () => {
        const seconds = Math.floor((Date.now() - this.recordingStartedAt) / 1000);
        status.textContent = `Recording ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} · stays on this device`;
        if (seconds >= 120) this.stopRecording();
      };
      updateTime();
      this.recordingTimer = window.setInterval(updateTime, 1000);
    } catch (recordError) {
      status.textContent = recordError instanceof DOMException && recordError.name === 'NotAllowedError'
        ? 'Microphone permission was not granted. Allow it in browser settings, or type instead.'
        : 'The microphone could not start. Check that another app is not using it.';
    }
  }

  private stopRecording(): void {
    if (this.recorder?.state === 'recording') this.recorder.stop();
  }

  private bindReview(): void {
    document.querySelector('#start-review')?.addEventListener('click', () => { this.reviewStarted = true; this.render(); });
    document.querySelectorAll<HTMLButtonElement>('[data-decision]').forEach((button) => button.addEventListener('click', () => {
      const card = button.closest<HTMLElement>('[data-id]');
      if (card) void this.decide(card.dataset.id!, button.dataset.decision as ThoughtStatus);
    }));
    document.querySelectorAll<HTMLButtonElement>('[data-restore]').forEach((button) => button.addEventListener('click', () => void this.restore(button.dataset.restore!)));
  }

  private async decide(id: string, status: ThoughtStatus): Promise<void> {
    const thought = this.thoughts.find((item) => item.id === id);
    if (!thought) return;
    const previous = { ...thought };
    thought.status = status;
    thought.decidedAt = Date.now();
    thought.updatedAt = Date.now();
    try {
      await saveThought(thought);
      if (status === 'promoted' && thought.text) {
        try { await navigator.clipboard.writeText(thought.text); } catch { /* Clipboard is a convenience; promotion still succeeds. */ }
      }
      this.render();
      this.showToast(status === 'promoted' ? (thought.text ? 'Promoted and copied.' : 'Voice note promoted.') : 'Archived.', 'Undo', () => void this.restoreFromSnapshot(previous));
    } catch (error) {
      Object.assign(thought, previous);
      this.showToast(error instanceof Error ? error.message : 'That decision could not be saved.');
    }
  }

  private async restoreFromSnapshot(snapshot: Thought): Promise<void> {
    const thought = this.thoughts.find((item) => item.id === snapshot.id);
    if (!thought) return;
    Object.assign(thought, snapshot, { status: 'parked', decidedAt: undefined, updatedAt: Date.now() });
    await saveThought(thought);
    this.reviewStarted = true;
    this.render();
    this.showToast('Thought returned to the lot.');
  }

  private async restore(id: string): Promise<void> {
    const thought = this.thoughts.find((item) => item.id === id);
    if (!thought) return;
    thought.status = 'parked';
    thought.decidedAt = undefined;
    thought.updatedAt = Date.now();
    await saveThought(thought);
    this.render();
    this.showToast('Thought returned to the lot.');
  }

  private bindSettings(): void {
    document.querySelector('#export-button')?.addEventListener('click', () => void this.exportData());
    document.querySelector<HTMLInputElement>('#import-file')?.addEventListener('change', (event) => void this.importData(event));
    document.querySelector<HTMLFormElement>('#license-form')?.addEventListener('submit', (event) => void this.restoreLicense(event));
    document.querySelector<HTMLFormElement>('#cue-form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = document.querySelector<HTMLInputElement>('#custom-cue');
      if (input?.value.trim()) localStorage.setItem(CUE_KEY, input.value.trim());
      this.showToast('Return cue saved.');
    });
    document.querySelector('#forget-license')?.addEventListener('click', () => {
      forgetLicense();
      this.license = getLicenseState();
      this.render();
    });
    document.querySelector('#install-button')?.addEventListener('click', async () => {
      await this.installPrompt?.prompt();
      await this.installPrompt?.userChoice;
      this.installPrompt = undefined;
      this.render();
    });
  }

  private async exportData(): Promise<void> {
    try {
      const payload = await createExport(this.thoughts);
      const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `thought-parking-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      this.showToast(`Exported ${countLabel(this.thoughts.length)}.`);
    } catch (error) {
      this.showToast(error instanceof Error ? error.message : 'Export failed. Try again.');
    }
  }

  private async importData(event: Event): Promise<void> {
    const input = event.currentTarget as HTMLInputElement;
    const status = document.querySelector<HTMLElement>('#import-status');
    const file = input.files?.[0];
    if (!file || !status) return;
    status.textContent = 'Checking backup…';
    try {
      const parsed = parseParkingExport(await file.text());
      const imported = await fromPortable(parsed.thoughts);
      const merged = new Map(this.thoughts.map((thought) => [thought.id, thought]));
      imported.forEach((thought) => {
        const existing = merged.get(thought.id);
        if (!existing || thought.updatedAt >= existing.updatedAt) merged.set(thought.id, thought);
      });
      this.thoughts = [...merged.values()].sort((a, b) => b.createdAt - a.createdAt);
      await saveThoughts(this.thoughts);
      this.render();
      this.showToast(`Imported ${countLabel(imported.length)}.`);
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : 'That backup could not be imported.';
      input.value = '';
    }
  }

  private async restoreLicense(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const input = document.querySelector<HTMLInputElement>('#license-input');
    const status = document.querySelector<HTMLElement>('#license-status');
    if (!input?.value.trim() || !status) return;
    status.textContent = 'Checking license…';
    storeLicense(input.value);
    this.license = await verifyLicense(true);
    if (this.license.unlocked) {
      this.render();
      this.showToast('Supporter tape unlocked.');
    } else {
      status.textContent = this.license.reason === 'verification_unavailable'
        ? 'Could not reach the license service. Nothing was unlocked or saved; check your connection and try again.'
        : 'That license is not active. Check the token and try again.';
      forgetLicense();
      this.license = getLicenseState();
    }
  }

  private showToast(message: string, actionLabel?: string, action?: () => void): void {
    const region = document.querySelector<HTMLElement>('#toast-region');
    if (!region) return;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    region.innerHTML = `<div class="toast"><span>${escapeHtml(message)}</span>${actionLabel ? `<button type="button">${escapeHtml(actionLabel)}</button>` : ''}</div>`;
    const button = region.querySelector('button');
    if (button && action) button.addEventListener('click', () => { action(); region.innerHTML = ''; });
    this.toastTimer = window.setTimeout(() => { region.innerHTML = ''; }, actionLabel ? 8000 : 4500);
  }
}
