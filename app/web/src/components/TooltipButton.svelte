<script module>
  // Moving along a toolbar should not repeat the initial hover delay.
  let lastShown = -Infinity;
  let closeCurrent;
</script>

<script>
  import { onDestroy } from 'svelte';
  import { glyphs, ariaShortcut } from '../lib/keys.js';

  let { label, keys, placement = 'bottom', children, onclick, ...props } = $props();
  const id = $props.id();
  let button = $state(null);
  let panel = $state(null);
  let open = $state(false);
  let position = $state('');
  let timer;

  function hide() {
    clearTimeout(timer);
    timer = undefined;
    if (open) lastShown = performance.now();
    if (closeCurrent === hide) closeCurrent = undefined;
    open = false;
  }

  function show(immediate = false) {
    clearTimeout(timer);
    if (props.disabled) return;
    timer = setTimeout(() => {
      closeCurrent?.();
      closeCurrent = hide;
      open = true;
      lastShown = performance.now();
    }, immediate || performance.now() - lastShown < 1000 ? 0 : 400);
  }

  function leave() {
    clearTimeout(timer);
    if (button?.matches(':focus-visible')) return;
    // Keep the tooltip reachable across the small gap from its button.
    timer = setTimeout(hide, 120);
  }

  $effect(() => {
    if (!panel) return;
    panel.showPopover();
    const r = button.getBoundingClientRect();
    const tip = panel.getBoundingClientRect();
    const above = placement === 'top' ? r.top >= tip.height + 16 : r.bottom + tip.height + 16 > innerHeight;
    const left = Math.max(8, Math.min(r.left + (r.width - tip.width) / 2, innerWidth - tip.width - 8));
    const top = Math.max(8, Math.min(above ? r.top - tip.height - 8 : r.bottom + 8, innerHeight - tip.height - 8));
    position = `left:${left}px;top:${top}px`;
  });
  $effect(() => { if (props.disabled) hide(); });
  onDestroy(hide);
</script>

<svelte:window
  onkeydown={hide}
  onpointerdown={hide}
  onresize={hide}
  onblur={hide}
  onscroll={hide}
/>

<button
  bind:this={button}
  type="button"
  class="icon-btn"
  {...props}
  aria-label={label}
  aria-keyshortcuts={keys ? ariaShortcut(keys) : undefined}
  aria-describedby={open ? id : undefined}
  onpointerenter={(e) => { if (e.pointerType !== 'touch') show(); }}
  onpointerleave={leave}
  onfocus={() => { if (button.matches(':focus-visible')) show(true); }}
  onblur={hide}
  onclick={(e) => { hide(); onclick?.(e); }}
>
  {@render children()}
</button>

{#if open}
  <div
    {id}
    bind:this={panel}
    class="action-tooltip"
    popover="manual"
    role="tooltip"
    style={position}
    onpointerenter={() => clearTimeout(timer)}
    onpointerleave={leave}
  >
    <span>{label}</span>
    {#if keys}<kbd>{glyphs(keys).join('')}</kbd>{/if}
  </div>
{/if}

<style>
  .action-tooltip {
    position: fixed;
    inset: auto;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 12px;
    width: max-content;
    max-width: calc(100vw - 16px);
    padding: 7px 9px;
    border: 1px solid var(--separator);
    border-radius: 8px;
    background: var(--menu);
    color: var(--text);
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.12);
    font-size: 11px;
    line-height: 16px;
    pointer-events: auto;
    user-select: none;
  }
  kbd {
    flex: none;
    border-radius: 4px;
    padding: 0 4px;
    background: var(--fill);
    color: var(--secondary);
    font-family: inherit;
    font-size: 11px;
    letter-spacing: 1px;
  }
</style>
