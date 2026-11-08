<script>
  import {
    ui, toggleReviewPanel, startReviewCapture, stopReviewCapture, returnToLive,
    openReviewCapture, toggleReviewPlayback, stepReview, seekReview, setReviewSpeed, annotateReviewFrame,
  } from '../lib/app.svelte.js';
  import { CAPTURE_SECONDS, reviewTime } from '../lib/review.js';
  import { icon } from '../lib/icons.js';

  const r = $derived(ui.review);
  const reviewing = $derived(r.state === 'review');
  const capturing = $derived(r.state === 'capturing');
  const finishing = $derived(r.state === 'finishing');
</script>

<section class="pill animation-review" aria-label="Animation review">
  <div class="review-heading">
    <strong>{capturing ? 'Capturing animation' : reviewing ? 'Animation review' : 'Capture an animation'}</strong>
    <span class="review-caption">{capturing ? `${reviewTime(r.time)} / ${CAPTURE_SECONDS}s` : reviewing ? `${r.count} captured frames` : `Up to ${CAPTURE_SECONDS} seconds`}</span>
    <button class="icon-btn" title="Close animation review" onclick={toggleReviewPanel}>{@html icon('xmark')}</button>
  </div>
  {#if reviewing}
    <div class="review-timeline">
      <output>{reviewTime(r.time)}</output>
      <input type="range" min="0" max={r.duration || 0.001} step="any" value={r.time}
        aria-label="Animation timeline" aria-valuetext={reviewTime(r.time)}
        oninput={(e) => seekReview(Number(e.currentTarget.value))}>
      <span>{reviewTime(r.duration)}</span>
    </div>
    <div class="review-controls">
      <div class="review-transport" role="group" aria-label="Playback">
        <button class="icon-btn" title="Replay capture" disabled={r.count < 2} onclick={() => toggleReviewPlayback(true)}>{@html icon('refresh')}</button>
        <button class="icon-btn" title="Previous frame (←)" disabled={r.index === 0} onclick={() => stepReview(-1)}>{@html icon('frame-back')}</button>
        <button class="icon-btn" title={r.playing ? 'Pause capture (Space)' : 'Play capture (Space)'} disabled={r.count < 2} onclick={() => toggleReviewPlayback()}>{@html icon(r.playing ? 'pause' : 'play')}</button>
        <button class="icon-btn" title="Next frame (→)" disabled={r.index >= r.count - 1} onclick={() => stepReview(1)}>{@html icon('frame-forward')}</button>
      </div>
      <select class="popup review-speed" aria-label="Playback speed" value={r.speed} onchange={(e) => setReviewSpeed(Number(e.currentTarget.value))}>
        {#each [0.25, 0.5, 1, 2] as speed}<option value={speed}>{speed}×</option>{/each}
      </select>
      <button class="icon-btn" class:on={r.loop} title="Loop capture" aria-pressed={r.loop} onclick={() => (r.loop = !r.loop)}>{@html icon('loop')}</button>
      <span class="review-spacer"></span>
      <button class="icon-btn" title="Annotate this frame" onclick={annotateReviewFrame}>{@html icon('annotate')}</button>
      <button class="alert-btn" onclick={returnToLive}>Return to Live</button>
    </div>
    <p class="review-note">Recorded playback · the simulator continues live</p>
  {:else}
    <p class="review-description">{capturing ? 'Use the simulator, then stop to inspect the motion.' : finishing ? 'Preparing captured frames…' : 'Capture an interaction, then scrub, step through, and annotate its frames.'}</p>
    <div class="review-controls">
      {#if capturing || finishing}
        <button class="alert-btn default" disabled={finishing} onclick={stopReviewCapture}>{finishing ? 'Preparing…' : 'Stop and Review'}</button>
      {:else}
        <button class="alert-btn default" disabled={!ui.live || ui.recording} onclick={startReviewCapture}>{r.count ? 'Capture Again' : 'Start Capture'}</button>
        {#if r.count}<button class="alert-btn" onclick={openReviewCapture}>Review Capture</button>{/if}
      {/if}
    </div>
  {/if}
</section>
