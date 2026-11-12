<script>
  import {
    ui, toggleXray, xrayUnavailable, setMode, setZoom, zoomIn, zoomOut, isFit, togglePanel, toggleFocus,
    copyPending, clearDone, saveScreenshot, pressButton, pressAppSwitcher, pressHome,
    startDevice, shutdownDevice, restartDevice, copyScreen, toggleRecording, toggleReviewPanel, rotateBy, feature,
  } from '../lib/app.svelte.js';
  import { icon } from '../lib/icons.js';
  import Popover from './Popover.svelte';
  import Menu from './Menu.svelte';
  import TooltipButton from './TooltipButton.svelte';

  const status = $derived(ui.flash ?? ui.status);

  // The … menu: what has no button of its own in Device Hub's toolbar.
  // Every shortcut is here too, under the names and keys Simulator.app's
  // menus give them (keys as SHORTCUTS in app.svelte.js has them).
  const menu = $derived.by(() => {
    const off = !ui.running;
    return [
      // Device Hub's device actions, together.
      [
        ui.running ? { label: 'Shut Down', icon: 'power', run: shutdownDevice } : { label: 'Start', icon: 'power', run: startDevice },
        { label: 'Restart', icon: 'restart', run: restartDevice, disabled: off },
        { label: 'Rename…', icon: 'rename', run: () => (ui.sheet = 'rename') },
        { label: 'Reset Content and Settings…', icon: 'erase', run: () => (ui.sheet = 'erase') },
        { label: 'Remove…', icon: 'trash', run: () => (ui.sheet = 'remove') },
      ],
      [
        { label: 'Copy Pending Annotations', icon: 'copy', run: copyPending },
        { label: 'Remove Resolved Annotations', icon: 'clear-done', run: clearDone },
      ],
      [
        { label: 'Animation Review', icon: 'film', run: toggleReviewPanel, disabled: off, keys: 'ctrl+meta+KeyR' },
        { label: 'Save Screen', icon: 'screenshot', run: saveScreenshot, disabled: off, keys: 'meta+KeyS' },
        { label: 'Copy Screen', icon: 'copy', run: copyScreen, disabled: off, keys: 'ctrl+meta+KeyC' },
        { label: ui.recording ? 'Stop Recording' : 'Record Screen', icon: 'record', run: toggleRecording, disabled: off || ui.review.state !== 'live', keys: 'meta+KeyR' },
      ],
      [
        {
          label: 'Device', icon: 'phone', disabled: off, submenu: [
            [
              { label: 'Home', icon: 'home', run: pressHome, keys: 'shift+meta+KeyH' },
              { label: 'Lock', icon: 'lock', run: () => pressButton('lock'), keys: 'meta+KeyL' },
              { label: 'App Switcher', icon: 'app-switcher', run: pressAppSwitcher, keys: 'ctrl+shift+meta+KeyH' },
              { label: 'Shake', icon: 'shake', run: () => feature('shake'), keys: 'ctrl+meta+KeyZ' },
            ],
            [
              { label: 'Rotate Left', icon: 'rotate-left', run: () => rotateBy(-1), keys: 'meta+ArrowLeft' },
              { label: 'Rotate Right', icon: 'rotate', run: () => rotateBy(1), keys: 'meta+ArrowRight' },
            ],
            [
              { label: 'Increase Volume', icon: 'volume-up', run: () => pressButton('volume-up'), keys: 'meta+ArrowUp' },
              { label: 'Decrease Volume', icon: 'volume-down', run: () => pressButton('volume-down'), keys: 'meta+ArrowDown' },
            ],
          ],
        },
        {
          label: 'Features', icon: 'features', disabled: off, submenu: [
            [{ label: 'Toggle Appearance', icon: 'appearance', run: () => feature('appearance'), keys: 'shift+meta+KeyA' }],
            [
              { label: 'Increase Preferred Text Size', icon: 'text-bigger', run: () => feature('text-bigger'), keys: 'alt+shift+meta+Equal' },
              { label: 'Decrease Preferred Text Size', icon: 'text-smaller', run: () => feature('text-smaller'), keys: 'alt+shift+meta+Minus' },
            ],
            [
              { label: 'Matching Face', icon: 'face-id', run: () => feature('biometric-match'), keys: 'alt+meta+KeyM' },
              { label: 'Non-matching Face', icon: 'face-id-off', run: () => feature('biometric-mismatch'), keys: 'alt+meta+KeyN' },
            ],
          ],
        },
      ],
      [
        { label: 'Interact', icon: 'pointer', run: () => setMode('interact'), disabled: off, keys: 'KeyI' },
        { label: ui.mode === 'annotate' ? 'Leave Design Mode' : 'Design Mode', icon: 'annotate', run: () => setMode(ui.mode === 'annotate' ? 'interact' : 'annotate'), disabled: off, keys: 'shift+meta+KeyD' },
      ],
      [
        { label: 'Zoom In', icon: 'zoom-in', run: zoomIn, keys: 'meta+Equal' },
        { label: 'Zoom Out', icon: 'zoom-out', run: zoomOut, keys: 'meta+Minus' },
        { label: 'Fit Screen', icon: 'zoom-fit', run: () => setZoom('fit'), keys: 'meta+Digit4' },
      ],
    ];
  });
</script>

<header class="canvas-top">
  <!-- The sidebar button stays in the canvas, before the title, whether the
       sidebar is in or out. -->
  <div class="pill sidebar-toggle">
    <TooltipButton
      id="toggle-sidebar"
      class="icon-btn"
      label={ui.panels.sidebar ? 'Hide the device list' : 'Show the device list'}
      onclick={() => togglePanel('sidebar')}
    >{@html icon('sidebar')}</TooltipButton>
  </div>
  <div class="title">
    <div class="title-name">{ui.simName}</div>
    <div class="title-sub">
      <span>{ui.runtime}</span><span class="status">{status}</span>
    </div>
  </div>
  <div class="toolbar">
    <div class="pill segmented" role="group" aria-label="Mode">
      <TooltipButton
        id="mode-interact"
        class={ui.mode === 'interact' && ui.running ? 'icon-btn on' : 'icon-btn'}
        label="Interact" keys="KeyI"
        aria-pressed={ui.mode === 'interact' && ui.running}
        data-icon="pointer"
        disabled={!ui.running}
        onclick={() => setMode('interact')}
      >{@html icon('pointer')}<span class="mode-label"><span>Interact</span></span></TooltipButton>
      <TooltipButton
        id="mode-annotate"
        class={ui.mode === 'annotate' && !ui.xray ? 'icon-btn on' : 'icon-btn'}
        label={ui.mode === 'annotate' && !ui.xray ? 'Leave Design Mode' : 'Design Mode'} keys="shift+meta+KeyD"
        aria-pressed={ui.mode === 'annotate' && !ui.xray}
        data-icon="annotate"
        disabled={!ui.running}
        onclick={() => setMode(ui.mode === 'annotate' && !ui.xray ? 'interact' : 'annotate')}
      >{@html icon('annotate')}<span class="mode-label"><span>Design</span></span></TooltipButton>
      <TooltipButton id="mode-xray" class={ui.xray ? 'icon-btn on' : 'icon-btn'} label={xrayUnavailable() || 'X-Ray: inspect spacing and sizes'} title={xrayUnavailable() || 'X-Ray: inspect spacing and sizes'} disabled={!!xrayUnavailable()} aria-pressed={ui.xray} onclick={toggleXray}>
        {@html icon('xray')}<span class="mode-label"><span>X-Ray</span></span>
      </TooltipButton>
    </div>
    <div class="pill" role="group" aria-label="Zoom">
      <TooltipButton id="zoom-out" label="Zoom out" keys="meta+Minus" data-icon="zoom-out" onclick={zoomOut}>{@html icon('zoom-out')}</TooltipButton>
      <TooltipButton
        id="zoom-fit"
        class={isFit() && ui.running ? 'icon-btn on' : 'icon-btn'}
        label="Fit to window" keys="meta+Digit4"
        data-icon="zoom-fit"
        onclick={() => setZoom('fit')}
      >{@html icon('zoom-fit')}</TooltipButton>
      <TooltipButton id="zoom-in" label="Zoom in" keys="meta+Equal" data-icon="zoom-in" onclick={zoomIn}>{@html icon('zoom-in')}</TooltipButton>
    </div>
    <div class="pill" role="group" aria-label="View">
      <TooltipButton
        id="toggle-focus"
        class="icon-btn"
        label={ui.panels.sidebar || ui.panels.inspector ? 'Show the device alone' : 'Show the device list and inspector'}
        data-icon="focus"
        onclick={toggleFocus}
      >{@html icon('focus')}</TooltipButton>
      <Popover icon="more" title="More">
        {#snippet children(close)}<Menu groups={menu} {close} />{/snippet}
      </Popover>
    </div>
  </div>
</header>
