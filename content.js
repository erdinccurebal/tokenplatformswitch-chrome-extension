// Token Platform Switch - Content Script

(function() {
  'use strict';

  // Extract token address from URL
  function extractTokenFromURL() {
    const url = window.location.href;
    let token = null;

    // pump.fun: https://pump.fun/coin/TOKEN
    if (url.includes('pump.fun/coin/')) {
      const match = url.match(/pump\.fun\/coin\/([a-zA-Z0-9]+)/);
      if (match) token = match[1];
    }
    // gmgn.ai: https://gmgn.ai/sol/token/TOKEN
    else if (url.includes('gmgn.ai/sol/token/')) {
      const match = url.match(/gmgn\.ai\/sol\/token\/([a-zA-Z0-9]+)/);
      if (match) token = match[1];
    }
    // dexscreener: https://dexscreener.com/solana/TOKEN
    else if (url.includes('dexscreener.com/solana/')) {
      const match = url.match(/dexscreener\.com\/solana\/([a-zA-Z0-9]+)/);
      if (match) token = match[1];
    }
    // solscan: https://solscan.io/token/TOKEN
    else if (url.includes('solscan.io/token/')) {
      const match = url.match(/solscan\.io\/token\/([a-zA-Z0-9]+)/);
      if (match) token = match[1];
    }
    // birdeye: https://birdeye.so/solana/token/TOKEN or https://birdeye.so/token/TOKEN
    else if (url.includes('birdeye.so')) {
      const match = url.match(/birdeye\.so\/(?:solana\/)?token\/([a-zA-Z0-9]+)/);
      if (match) token = match[1];
    }
    // raydium: https://raydium.io/swap/?inputMint=TOKEN or outputMint=TOKEN
    else if (url.includes('raydium.io')) {
      const inputMatch = url.match(/inputMint=([a-zA-Z0-9]+)/);
      const outputMatch = url.match(/outputMint=([a-zA-Z0-9]+)/);

      // Prefer non-SOL token
      const SOL_ADDRESS = 'So11111111111111111111111111111111111111112';
      if (inputMatch && inputMatch[1] !== SOL_ADDRESS && inputMatch[1].toLowerCase() !== 'sol') {
        token = inputMatch[1];
      } else if (outputMatch && outputMatch[1] !== SOL_ADDRESS && outputMatch[1].toLowerCase() !== 'sol') {
        token = outputMatch[1];
      } else if (inputMatch) {
        token = inputMatch[1];
      } else if (outputMatch) {
        token = outputMatch[1];
      }
    }
    // jupiter: https://jup.ag/swap?sell=TOKEN&buy=TOKEN or /swap/SOL-TOKEN
    else if (url.includes('jup.ag')) {
      // Try query parameters (sell/buy format)
      const sellMatch = url.match(/[?&]sell=([a-zA-Z0-9]+)/);
      const buyMatch = url.match(/[?&]buy=([a-zA-Z0-9]+)/);

      // Prefer non-SOL token
      const SOL_ADDRESS = 'So11111111111111111111111111111111111111112';
      if (sellMatch && sellMatch[1] !== SOL_ADDRESS) {
        token = sellMatch[1];
      } else if (buyMatch && buyMatch[1] !== SOL_ADDRESS) {
        token = buyMatch[1];
      } else if (sellMatch) {
        token = sellMatch[1];
      } else if (buyMatch) {
        token = buyMatch[1];
      } else {
        // Try old swap URL format
        const match = url.match(/jup\.ag\/swap\/[^-]+-([a-zA-Z0-9]+)/);
        if (match) token = match[1];
      }
    }
    // bubblemaps: https://v2.bubblemaps.io/map?address=TOKEN&chain=solana
    else if (url.includes('bubblemaps.io')) {
      const match = url.match(/[?&]address=([a-zA-Z0-9]+)/);
      if (match) token = match[1];
    }
    return token;
  }

  // Get current site
  function getCurrentSite() {
    const url = window.location.href;
    if (url.includes('pump.fun')) return 'pump';
    if (url.includes('gmgn.ai')) return 'gmgn';
    if (url.includes('dexscreener.com')) return 'dex';
    if (url.includes('solscan.io')) return 'solscan';
    if (url.includes('birdeye.so')) return 'birdeye';
    if (url.includes('raydium.io')) return 'raydium';
    if (url.includes('jup.ag')) return 'jupiter';
    if (url.includes('bubblemaps.io')) return 'bubblemaps';
    return null;
  }

  // Build URL for each platform
  function buildURL(platform, token) {
    const urls = {
      pump: `https://pump.fun/coin/${token}`,
      gmgn: `https://gmgn.ai/sol/token/${token}`,
      dex: `https://dexscreener.com/solana/${token}`,
      solscan: `https://solscan.io/token/${token}`,
      birdeye: `https://birdeye.so/solana/token/${token}`,
      raydium: `https://raydium.io/swap/?inputMint=sol&outputMint=${token}`,
      jupiter: `https://jup.ag/swap?sell=${token}&buy=So11111111111111111111111111111111111111112`,
      bubblemaps: `https://v2.bubblemaps.io/map?address=${token}&chain=solana`
    };
    return urls[platform];
  }

  // Load saved position from chrome.storage.sync (global across all sites)
  async function loadPosition() {
    try {
      const result = await chrome.storage.sync.get(['tqs_position']);
      return result.tqs_position || null;
    } catch (e) {
      return null;
    }
  }

  // Save position to chrome.storage.sync (global)
  function savePosition(top, left) {
    chrome.storage.sync.set({ tqs_position: { top, left } });
  }

  // Check if overlay is closed (global across all sites)
  async function isOverlayClosed() {
    try {
      const result = await chrome.storage.sync.get(['tqs_closed']);
      return result.tqs_closed === true;
    } catch (e) {
      return false;
    }
  }

  // Set overlay closed state (global)
  function setOverlayClosed(closed) {
    chrome.storage.sync.set({ tqs_closed: closed });
  }

  // Load platform visibility settings
  async function getPlatformSettings() {
    try {
      const result = await chrome.storage.sync.get(['tqs_platforms']);
      let settings = result.tqs_platforms || {
        pump: true,
        gmgn: true,
        dex: true,
        solscan: false,
        birdeye: false,
        raydium: false,
        jupiter: false,
        bubblemaps: true
      };

      // Migration: Add bubblemaps if not present
      if (settings.bubblemaps === undefined) {
        settings.bubblemaps = true;
        savePlatformSettings(settings);
      }

      return settings;
    } catch (e) {
      return {
        pump: true,
        gmgn: true,
        dex: true,
        solscan: false,
        birdeye: false,
        raydium: false,
        jupiter: false,
        bubblemaps: true
      };
    }
  }

  // Save platform visibility settings
  function savePlatformSettings(settings) {
    chrome.storage.sync.set({ tqs_platforms: settings });
  }

  // Load display mode setting
  async function getDisplayMode() {
    try {
      const result = await chrome.storage.sync.get(['tqs_display_mode']);
      return result.tqs_display_mode || 'both'; // 'icons', 'labels', 'both'
    } catch (e) {
      return 'both';
    }
  }

  // Save display mode setting
  function saveDisplayMode(mode) {
    chrome.storage.sync.set({ tqs_display_mode: mode });
  }

  // Load platform order
  async function getPlatformOrder() {
    try {
      const result = await chrome.storage.sync.get(['tqs_platform_order']);
      let order = result.tqs_platform_order || ['pump', 'gmgn', 'dex', 'bubblemaps', 'jupiter', 'raydium', 'solscan', 'birdeye'];

      // Migration: Add bubblemaps if not present
      if (!order.includes('bubblemaps')) {
        order.push('bubblemaps');
        savePlatformOrder(order);
      }

      return order;
    } catch (e) {
      return ['pump', 'gmgn', 'dex', 'bubblemaps', 'jupiter', 'raydium', 'solscan', 'birdeye'];
    }
  }

  // Save platform order
  function savePlatformOrder(order) {
    chrome.storage.sync.set({ tqs_platform_order: order });
  }

  // Create the overlay UI
  async function createOverlay() {
    const token = extractTokenFromURL();
    if (!token) return;

    const currentSite = getCurrentSite();
    if (!currentSite) return;

    // Check if overlay already exists
    if (document.getElementById('token-quick-switch-overlay')) return;

    // Check if user closed it
    const closed = await isOverlayClosed();
    if (closed) {
      showReopenButton();
      return;
    }

    // Create overlay container
    const overlay = document.createElement('div');
    overlay.id = 'token-quick-switch-overlay';
    overlay.className = 'tqs-overlay';

    // Load saved position (global across all sites)
    const savedPos = await loadPosition();
    if (savedPos) {
      overlay.style.top = savedPos.top + 'px';
      overlay.style.left = savedPos.left + 'px';
      overlay.style.right = 'auto';
    }

    // Get platform visibility settings
    const platformSettings = await getPlatformSettings();
    const displayMode = await getDisplayMode();
    const platformOrder = await getPlatformOrder();

    // Platform definitions
    const platformDefs = {
      pump: {
        name: 'pump',
        label: 'Pump.fun',
        favicon: chrome.runtime.getURL('icons/pump-favicon.ico'),
        color: '#14F195'
      },
      gmgn: {
        name: 'gmgn',
        label: 'GMGN',
        favicon: chrome.runtime.getURL('icons/gmgn-favicon.ico'),
        color: '#FFB800'
      },
      dex: {
        name: 'dex',
        label: 'DexScreener',
        favicon: chrome.runtime.getURL('icons/dex-favicon.ico'),
        color: '#FFFFFF'
      },
      solscan: {
        name: 'solscan',
        label: 'Solscan',
        favicon: chrome.runtime.getURL('icons/solscan-favicon.ico'),
        color: '#9945FF'
      },
      birdeye: {
        name: 'birdeye',
        label: 'Birdeye',
        favicon: chrome.runtime.getURL('icons/birdeye-favicon.ico'),
        color: '#FF6B6B'
      },
      raydium: {
        name: 'raydium',
        label: 'Raydium',
        favicon: chrome.runtime.getURL('icons/raydium-favicon.ico'),
        color: '#C200FB'
      },
      jupiter: {
        name: 'jupiter',
        label: 'Jupiter',
        favicon: chrome.runtime.getURL('icons/jupiter-favicon.ico'),
        color: '#00D4AA'
      },
      bubblemaps: {
        name: 'bubblemaps',
        label: 'Bubblemaps',
        favicon: chrome.runtime.getURL('icons/bubblemaps-favicon.ico'),
        color: '#9333EA'
      }
    };

    // Create buttons in the saved order
    platformOrder.forEach(platformName => {
      const platform = platformDefs[platformName];
      if (!platform) return;
      // Skip if platform is disabled in settings
      if (!platformSettings[platform.name]) return;
      const button = document.createElement('button');
      button.className = 'tqs-button';

      // Create favicon image
      const favicon = document.createElement('img');
      favicon.src = platform.favicon;
      favicon.className = 'tqs-favicon';
      favicon.alt = platform.label;

      // Fallback if favicon fails to load
      favicon.onerror = function() {
        this.style.display = 'none';
        const fallback = document.createElement('span');
        fallback.className = 'tqs-favicon-fallback';
        fallback.textContent = platform.label[0];
        fallback.style.color = platform.color;
        this.parentNode.insertBefore(fallback, this);
      };

      // Create label
      const label = document.createElement('span');
      label.textContent = platform.label;

      // Apply display mode
      if (displayMode === 'icons') {
        // Show only icons
        button.appendChild(favicon);
        button.classList.add('tqs-button-icon-only');
      } else if (displayMode === 'labels') {
        // Show only labels
        button.appendChild(label);
        button.classList.add('tqs-button-label-only');
      } else {
        // Show both (default)
        button.appendChild(favicon);
        button.appendChild(label);
      }

      // Set custom color for active button
      if (platform.name === currentSite) {
        button.classList.add('tqs-button-active');
        button.style.borderLeft = `4px solid ${platform.color}`;
        button.disabled = true;
      }

      button.addEventListener('click', (e) => {
        const url = buildURL(platform.name, token);
        // Check if Cmd (Mac) or Ctrl (Windows/Linux) key is pressed
        if (e.metaKey || e.ctrlKey) {
          // Open in new tab
          window.open(url, '_blank');
        } else {
          // Navigate in current tab
          window.location.href = url;
        }
      });

      overlay.appendChild(button);
    });

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'tqs-close';
    closeButton.innerHTML = '×';
    closeButton.addEventListener('click', () => {
      overlay.remove();
      setOverlayClosed(true);
      showReopenButton();
    });
    overlay.appendChild(closeButton);

    // Add settings button
    const settingsButton = document.createElement('button');
    settingsButton.className = 'tqs-settings';
    settingsButton.innerHTML = '⚙️';
    settingsButton.title = 'Settings';
    settingsButton.addEventListener('click', () => {
      showSettingsModal();
    });
    overlay.appendChild(settingsButton);

    // Add drag handle
    const dragHandle = document.createElement('div');
    dragHandle.className = 'tqs-drag-handle';
    dragHandle.innerHTML = '⋮⋮';
    dragHandle.title = 'Drag to move';
    overlay.appendChild(dragHandle);

    // Add to page
    document.body.appendChild(overlay);

    // Make draggable from drag handle and overlay itself
    makeDraggable(overlay, overlay);

    // Handle window resize - constrain to viewport
    let resizeTimeout;
    window.addEventListener('resize', async () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(async () => {
        const pos = await loadPosition();
        if (!pos) return;

        // Get current overlay dimensions
        const rect = overlay.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        // Get viewport dimensions
        const viewportWidth = document.documentElement.clientWidth;
        const viewportHeight = document.documentElement.clientHeight;

        const minVisible = 60;

        // Calculate constrained position
        let newLeft = pos.left;
        let newTop = pos.top;

        // Constrain to viewport
        // Right side: require full widget visible (plus drag handle)
        newLeft = Math.max(-width + minVisible, newLeft);
        newLeft = Math.min(viewportWidth - width - 30, newLeft); // Full widget + drag handle visible
        newTop = Math.max(0, newTop);
        newTop = Math.min(viewportHeight - minVisible, newTop);

        // Apply constrained position
        overlay.style.left = newLeft + 'px';
        overlay.style.top = newTop + 'px';
      }, 100);
    });
  }


  // Show reopen button in bottom right corner
  function showReopenButton() {
    // Remove if already exists
    const existing = document.getElementById('tqs-reopen-button');
    if (existing) existing.remove();

    const reopenBtn = document.createElement('button');
    reopenBtn.id = 'tqs-reopen-button';
    reopenBtn.className = 'tqs-reopen';
    reopenBtn.innerHTML = '🔄';
    reopenBtn.title = 'Open Token Quick Switch';

    reopenBtn.addEventListener('click', () => {
      reopenBtn.remove();
      setOverlayClosed(false);
      createOverlay();
    });

    document.body.appendChild(reopenBtn);
  }

  // Show settings modal
  async function showSettingsModal() {
    // Remove if already exists
    const existing = document.getElementById('tqs-settings-modal');
    if (existing) existing.remove();

    const settings = await getPlatformSettings();
    const platformOrder = await getPlatformOrder();

    const modal = document.createElement('div');
    modal.id = 'tqs-settings-modal';
    modal.className = 'tqs-modal';

    const platformDefs = {
      pump: { name: 'pump', label: 'Pump.fun', color: '#14F195', favicon: chrome.runtime.getURL('icons/pump-favicon.ico') },
      gmgn: { name: 'gmgn', label: 'GMGN', color: '#FFB800', favicon: chrome.runtime.getURL('icons/gmgn-favicon.ico') },
      dex: { name: 'dex', label: 'DexScreener', color: '#FFFFFF', favicon: chrome.runtime.getURL('icons/dex-favicon.ico') },
      solscan: { name: 'solscan', label: 'Solscan', color: '#9945FF', favicon: chrome.runtime.getURL('icons/solscan-favicon.ico') },
      birdeye: { name: 'birdeye', label: 'Birdeye', color: '#FF6B6B', favicon: chrome.runtime.getURL('icons/birdeye-favicon.ico') },
      raydium: { name: 'raydium', label: 'Raydium', color: '#C200FB', favicon: chrome.runtime.getURL('icons/raydium-favicon.ico') },
      jupiter: { name: 'jupiter', label: 'Jupiter', color: '#00D4AA', favicon: chrome.runtime.getURL('icons/jupiter-favicon.ico') },
      bubblemaps: { name: 'bubblemaps', label: 'Bubblemaps', color: '#9333EA', favicon: chrome.runtime.getURL('icons/bubblemaps-favicon.ico') }
    };

    // Sort platforms by saved order
    const platforms = platformOrder.map(name => platformDefs[name]).filter(p => p);

    const displayMode = await getDisplayMode();

    modal.innerHTML = `
      <div class="tqs-modal-content">
        <div class="tqs-modal-header">
          <h3>
            <img src="${chrome.runtime.getURL('icon48.png')}" class="tqs-modal-logo">
            <span>Token Platform Switch</span>
          </h3>
          <button class="tqs-modal-close">×</button>
        </div>
        <div class="tqs-modal-body">
          <div class="tqs-modal-section">
            <p class="tqs-modal-section-title">Display Mode</p>
            <div class="tqs-display-mode-options">
              <label class="tqs-radio-option">
                <input type="radio" name="display_mode" value="both" ${displayMode === 'both' ? 'checked' : ''}>
                <span class="tqs-radio-label">
                  <span class="tqs-radio-icon">🖼️📝</span>
                  Show Icons & Labels
                </span>
              </label>
              <label class="tqs-radio-option">
                <input type="radio" name="display_mode" value="icons" ${displayMode === 'icons' ? 'checked' : ''}>
                <span class="tqs-radio-label">
                  <span class="tqs-radio-icon">🖼️</span>
                  Icons Only
                </span>
              </label>
              <label class="tqs-radio-option">
                <input type="radio" name="display_mode" value="labels" ${displayMode === 'labels' ? 'checked' : ''}>
                <span class="tqs-radio-label">
                  <span class="tqs-radio-icon">📝</span>
                  Labels Only
                </span>
              </label>
            </div>
          </div>

          <div class="tqs-modal-section">
            <p class="tqs-modal-section-title">Platforms</p>
            <p class="tqs-modal-description">Drag to reorder, check to enable:</p>
            <div class="tqs-platforms-list" id="tqs-platforms-list">
              ${platforms.map(p => `
                <div class="tqs-platform-toggle" draggable="true" data-platform="${p.name}">
                  <span class="tqs-drag-indicator">⋮⋮</span>
                  <input type="checkbox" data-platform="${p.name}" ${settings[p.name] ? 'checked' : ''}>
                  <span class="tqs-toggle-label">
                    <img src="${p.favicon}" class="tqs-platform-icon" alt="${p.label}">
                    ${p.label}
                  </span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        <div class="tqs-modal-footer">
          <div class="tqs-modal-footer-left">
            <button class="tqs-modal-docs">How It Works</button>
            <button class="tqs-modal-bug">Report Bug</button>
          </div>
          <button class="tqs-modal-save">Save Settings</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Drag and drop functionality
    const platformsList = modal.querySelector('#tqs-platforms-list');
    let draggedElement = null;

    platformsList.querySelectorAll('.tqs-platform-toggle').forEach(item => {
      item.addEventListener('dragstart', function(e) {
        draggedElement = this;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });

      item.addEventListener('dragend', function() {
        this.classList.remove('dragging');
        draggedElement = null;
      });

      item.addEventListener('dragover', function(e) {
        e.preventDefault();
        const afterElement = getDragAfterElement(platformsList, e.clientY);
        if (afterElement == null) {
          platformsList.appendChild(draggedElement);
        } else {
          platformsList.insertBefore(draggedElement, afterElement);
        }
      });
    });

    function getDragAfterElement(container, y) {
      const draggableElements = [...container.querySelectorAll('.tqs-platform-toggle:not(.dragging)')];
      return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // Minimum platform check
    function updateCheckboxStates() {
      const checkboxes = platformsList.querySelectorAll('input[type="checkbox"]');
      const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;

      // Disable unchecking if only 2 platforms are selected
      checkboxes.forEach(cb => {
        if (checkedCount <= 2 && cb.checked) {
          cb.disabled = true;
        } else {
          cb.disabled = false;
        }
      });
    }

    // Add change listeners to checkboxes
    platformsList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', updateCheckboxStates);
    });

    // Initial check
    updateCheckboxStates();

    // Docs button
    modal.querySelector('.tqs-modal-docs').addEventListener('click', () => {
      window.open('https://tokenplatformswitch.fun#howtowork', '_blank');
    });

    // Report Bug button
    modal.querySelector('.tqs-modal-bug').addEventListener('click', () => {
      window.open('https://tokenplatformswitch.fun#report', '_blank');
    });

    // Close modal
    modal.querySelector('.tqs-modal-close').addEventListener('click', () => {
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    // Save settings
    modal.querySelector('.tqs-modal-save').addEventListener('click', async () => {
      // Check if at least 2 platforms are selected
      const platformElements = platformsList.querySelectorAll('.tqs-platform-toggle');
      const checkedCount = Array.from(platformElements).filter(el =>
        el.querySelector('input[type="checkbox"]').checked
      ).length;

      if (checkedCount < 2) {
        alert('Please select at least 2 platforms');
        return;
      }

      // Save platform order
      const newOrder = Array.from(platformElements).map(el => el.dataset.platform);
      savePlatformOrder(newOrder);

      // Save platform settings
      const newSettings = {};
      platformElements.forEach(el => {
        const checkbox = el.querySelector('input[type="checkbox"]');
        newSettings[el.dataset.platform] = checkbox.checked;
      });
      savePlatformSettings(newSettings);

      // Save display mode
      const selectedMode = modal.querySelector('input[name="display_mode"]:checked').value;
      saveDisplayMode(selectedMode);

      modal.remove();

      // Refresh overlay if it's open
      const overlay = document.getElementById('token-quick-switch-overlay');
      if (overlay) {
        overlay.remove();
        await createOverlay();
      }
    });
  }

  // Make overlay draggable
  function makeDraggable(element, dragHandle) {
    let isDragging = false;
    let currentX = 0;
    let currentY = 0;
    let initialX = 0;
    let initialY = 0;

    // Allow dragging from the drag handle or overlay itself
    dragHandle.addEventListener('mousedown', dragStart);

    function dragStart(e) {
      // Don't drag if clicking on buttons or links
      if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.closest('a') || e.target.closest('button')) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      isDragging = true;

      // Get current position
      const rect = element.getBoundingClientRect();
      initialX = e.clientX - rect.left;
      initialY = e.clientY - rect.top;

      document.addEventListener('mousemove', drag);
      document.addEventListener('mouseup', dragEnd);

      element.style.cursor = 'grabbing';
      dragHandle.style.cursor = 'grabbing';
    }

    function drag(e) {
      if (!isDragging) return;

      e.preventDefault();

      // Calculate new position
      let newX = e.clientX - initialX;
      let newY = e.clientY - initialY;

      // Get element dimensions
      const rect = element.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Get actual visible viewport dimensions (accounting for DevTools, etc.)
      const viewportWidth = document.documentElement.clientWidth;
      const viewportHeight = document.documentElement.clientHeight;

      // Constrain to viewport boundaries
      // Left: keep at least 60px visible
      // Right: keep fully visible
      // Top: fully visible
      // Bottom: keep at least 60px visible
      const minVisible = 60;

      newX = Math.max(-width + minVisible, newX);  // Left boundary
      newX = Math.min(viewportWidth - width - 30, newX);  // Right boundary - keep full widget visible
      newY = Math.max(0, newY);  // Top boundary
      newY = Math.min(viewportHeight - minVisible, newY);  // Bottom boundary

      currentX = newX;
      currentY = newY;

      // Set position
      element.style.left = currentX + 'px';
      element.style.top = currentY + 'px';
      element.style.right = 'auto';
      element.style.bottom = 'auto';
    }

    function dragEnd(e) {
      if (!isDragging) return;

      isDragging = false;

      // Save position when drag ends (global)
      const top = element.offsetTop;
      const left = element.offsetLeft;
      savePosition(top, left);

      document.removeEventListener('mousemove', drag);
      document.removeEventListener('mouseup', dragEnd);

      element.style.cursor = '';
      dragHandle.style.cursor = 'move';
    }
  }

  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createOverlay);
  } else {
    createOverlay();
  }

  // Re-create overlay when URL changes (for SPAs)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      const oldOverlay = document.getElementById('token-quick-switch-overlay');
      if (oldOverlay) oldOverlay.remove();
      setTimeout(createOverlay, 500);
    }
  }).observe(document, { subtree: true, childList: true });
})();
