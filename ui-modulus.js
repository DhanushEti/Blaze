/**
 * IndusVaani — Dynamic UI Module Renderer
 * Generates rich, interactive HTML components based on intent resolution results.
 */

class UIModuleRenderer {

  /**
   * Route the UI action to the correct renderer.
   * @param {string} action - UI action key from NLP engine
   * @param {object} data - UI data payload
   * @param {string} language - Active language code
   * @returns {string} HTML string
   */
  static render(action, data, language = 'en') {
    const renderers = {
      'SHOW_BALANCE': () => this.renderBalance(data),
      'SHOW_BLOCK_CARD_MODAL': () => this.renderBlockCard(data),
      'SHOW_FD_RATES': () => this.renderFDRates(data),
      'SHOW_FD_CALCULATOR': () => this.renderFDCalculator(data),
      'SHOW_CARD_CATALOG': () => this.renderCardCatalog(data),
      'SHOW_CARD_LIMIT': () => this.renderCardLimit(data),
      'SHOW_LOAN_INFO': () => this.renderLoanInfo(data),
      'SHOW_MINI_STATEMENT': () => this.renderMiniStatement(data),
      'SHOW_SAVINGS_RATES': () => this.renderSavingsRates(data),
      'SHOW_UPI_HELP': () => this.renderUPIHelp(data),
      'SHOW_BRANCH_LOCATOR': () => this.renderBranchLocator(data),
      'SHOW_SUPPORT_CHANNELS': () => this.renderSupportChannels(data),
      'SHOW_SUGGESTIONS': () => this.renderSuggestions(language),
    };

    const renderer = renderers[action];
    return renderer ? renderer() : this.renderSuggestions(language);
  }

  // ─── Balance Cards ─────────────────────────────────────────
  static renderBalance(data) {
    const cards = data.accounts.map(acc => `
      <div class="balance-card">
        <div class="account-type">${acc.type}</div>
        <div class="account-number">${acc.number}</div>
        <div class="balance-amount">${acc.balance}</div>
        <div class="account-status">
          <span class="material-symbols-outlined" style="font-size:14px">check_circle</span>
          ${acc.status}
        </div>
      </div>
    `).join('');

    return `
      <div class="section-title">
        <span class="material-symbols-outlined">account_balance_wallet</span>
        Account Overview
      </div>
      <div class="balance-cards">${cards}</div>
    `;
  }

  // ─── Block Card Modal ──────────────────────────────────────
  static renderBlockCard(data) {
    const cardItems = data.cards.map((card, i) => `
      <div class="card-select-item" data-card-index="${i}" onclick="window.indusVaani?.selectCardToBlock(this)">
        <div class="card-info">
          <div class="card-name">${card.type}</div>
          <div class="card-digits">•••• •••• •••• ${card.last4}</div>
        </div>
        <div class="card-network">${card.network}</div>
      </div>
    `).join('');

    return `
      <div class="block-card-modal">
        <div class="modal-alert">
          <span class="material-symbols-outlined">warning</span>
          <span class="modal-alert-text">Card Security Alert — Immediate Action Required</span>
        </div>
        <div class="card-select-list">
          <div class="section-title" style="margin-bottom:8px">
            <span class="material-symbols-outlined">credit_card</span>
            Select Card to Block
          </div>
          ${cardItems}
        </div>
        <div class="block-actions">
          <button class="btn-block-confirm" onclick="window.indusVaani?.confirmBlockCard()">
            <span class="material-symbols-outlined">block</span>
            Confirm Block Card
          </button>
          <div class="freeze-toggle-row">
            <span class="freeze-toggle-label">Temporary Freeze Instead</span>
            <div class="toggle-switch" onclick="this.classList.toggle('active')"></div>
          </div>
        </div>
      </div>
    `;
  }

  // ─── FD Rates Table ────────────────────────────────────────
  static renderFDRates(data) {
    const rows = data.rates.map(r => {
      const isHighlight = r.tenure === data.highlight;
      return `
        <tr class="${isHighlight ? 'highlight' : ''}">
          <td>${r.tenure}</td>
          <td><span class="rate-badge">${r.general}</span></td>
          <td><span class="rate-badge ${isHighlight ? 'best' : ''}">${r.senior}</span></td>
        </tr>
      `;
    }).join('');

    return `
      <div class="section-title">
        <span class="material-symbols-outlined">savings</span>
        Fixed Deposit Interest Rates
      </div>
      <div class="fd-table-container">
        <table class="fd-table">
          <thead>
            <tr>
              <th>Tenure</th>
              <th>General (%&nbsp;p.a.)</th>
              <th>Senior Citizen (%&nbsp;p.a.)</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div style="margin-top:12px;font-size:12px;color:var(--text-muted)">
        * Best rate: <strong style="color:var(--brand-gold-light)">7.75% p.a.</strong> for Senior Citizens on 18 months – 2 years tenure
      </div>
    `;
  }

  // ─── FD Calculator ─────────────────────────────────────────
  static renderFDCalculator(data) {
    const amountBtns = data.suggestedAmounts.map((amt, i) => `
      <div class="fd-option ${i === 1 ? 'selected' : ''}" onclick="window.indusVaani?.selectFDOption(this, 'amount')">${amt}</div>
    `).join('');

    const tenureBtns = data.suggestedTenures.map((t, i) => `
      <div class="fd-option ${i === 2 ? 'selected' : ''}" onclick="window.indusVaani?.selectFDOption(this, 'tenure')">${t}</div>
    `).join('');

    return `
      <div class="section-title">
        <span class="material-symbols-outlined">add_circle</span>
        Open New Fixed Deposit
      </div>
      <div class="fd-calculator">
        <div class="fd-calc-field">
          <label>Select Amount</label>
          <div class="fd-amount-options">${amountBtns}</div>
        </div>
        <div class="fd-calc-field">
          <label>Select Tenure</label>
          <div class="fd-tenure-options">${tenureBtns}</div>
        </div>
        <div class="fd-result">
          <div class="maturity-label">Estimated Maturity Amount</div>
          <div class="maturity-value">₹1,14,456</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">at ${data.bestRate} p.a. for ${data.bestTenure}</div>
        </div>
      </div>
    `;
  }

  // ─── Credit Card Catalog ───────────────────────────────────
  static renderCardCatalog(data) {
    const cards = data.cards.map(card => `
      <div class="credit-card-item">
        <div class="credit-card-visual" style="background:${card.color}">
          <div class="cc-name">${card.name}</div>
          <div class="cc-tagline">${card.tagline}</div>
        </div>
        <div class="credit-card-details">
          <div class="detail-row">
            <span class="detail-label">Annual Fee</span>
            <span class="detail-value">${card.annualFee}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Rewards</span>
            <span class="detail-value">${card.rewards}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Lounge Access</span>
            <span class="detail-value">${card.lounge}</span>
          </div>
        </div>
        <button class="btn-apply-card" onclick="window.indusVaani?.showToast('Application Submitted', 'Your ${card.name} application has been submitted. Our team will contact you within 24 hours.', 'success')">
          Apply Now →
        </button>
      </div>
    `).join('');

    return `
      <div class="section-title">
        <span class="material-symbols-outlined">add_card</span>
        Premium Credit Cards
      </div>
      <div class="card-catalog">${cards}</div>
    `;
  }

  // ─── Card Limit ────────────────────────────────────────────
  static renderCardLimit(data) {
    return `
      <div class="section-title">
        <span class="material-symbols-outlined">tune</span>
        Credit Card Limit
      </div>
      <div class="card-limit-display">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <span style="font-size:13px;color:var(--text-muted)">Utilization</span>
          <span style="font-size:18px;font-weight:700;font-family:'Outfit',sans-serif;color:var(--text-primary)">${data.utilizationPercent}%</span>
        </div>
        <div class="limit-progress-track">
          <div class="limit-progress-fill" style="width:${data.utilizationPercent}%"></div>
        </div>
        <div class="limit-stats">
          <div class="limit-stat">
            <div class="stat-value">${data.currentLimit}</div>
            <div class="stat-label">Total Limit</div>
          </div>
          <div class="limit-stat">
            <div class="stat-value" style="color:var(--accent-red)">${data.usedLimit}</div>
            <div class="stat-label">Used</div>
          </div>
          <div class="limit-stat">
            <div class="stat-value" style="color:var(--accent-green)">${data.availableLimit}</div>
            <div class="stat-label">Available</div>
          </div>
        </div>
        <button class="btn-apply-card" style="margin:16px 0 0;width:100%" onclick="window.indusVaani?.showToast('Request Submitted', 'Your limit enhancement request for ${data.eligibleEnhancement} has been submitted. Processing in 2-3 business days.', 'success')">
          Request Enhancement to ${data.eligibleEnhancement} →
        </button>
      </div>
    `;
  }

  // ─── Loan Info ─────────────────────────────────────────────
  static renderLoanInfo(data) {
    const features = data.features.map(f => `
      <div class="loan-feature">
        <span class="material-symbols-outlined">check_circle</span>
        ${f}
      </div>
    `).join('');

    const steps = data.steps.map((s, i) => `
      <div class="loan-step">
        <div class="step-number">${i + 1}</div>
        <span>${s}</span>
      </div>
    `).join('');

    return `
      <div class="loan-info-module">
        <div class="loan-header-card">
          <div class="loan-type-title">${data.loanType}</div>
          <div class="loan-key-stats">
            <div class="loan-stat">
              <div class="stat-label">Interest Rate</div>
              <div class="stat-value">${data.interestRate}</div>
            </div>
            <div class="loan-stat">
              <div class="stat-label">Max Amount</div>
              <div class="stat-value">${data.maxAmount}</div>
            </div>
            <div class="loan-stat">
              <div class="stat-label">Max Tenure</div>
              <div class="stat-value">${data.maxTenure}</div>
            </div>
            <div class="loan-stat">
              <div class="stat-label">Processing Fee</div>
              <div class="stat-value">${data.processingFee}</div>
            </div>
          </div>
        </div>
        <div class="section-title">
          <span class="material-symbols-outlined">star</span>
          Key Features
        </div>
        <div class="loan-features-list">${features}</div>
        <div class="section-title">
          <span class="material-symbols-outlined">route</span>
          Application Process
        </div>
        <div class="loan-steps">${steps}</div>
        <button class="btn-apply-card" style="margin:0;width:100%" onclick="window.indusVaani?.showToast('Application Started', 'Your ${data.loanType} application process has been initiated. A relationship manager will contact you shortly.', 'success')">
          Apply for ${data.loanType} →
        </button>
      </div>
    `;
  }

  // ─── Mini Statement ────────────────────────────────────────
  static renderMiniStatement(data) {
    const rows = data.transactions.map(t => `
      <div class="transaction-row">
        <div class="txn-left">
          <div class="txn-desc">${t.desc}</div>
          <div class="txn-date">${t.date}</div>
        </div>
        <div class="txn-right">
          <div class="txn-amount ${t.type}">${t.amount}</div>
          <div class="txn-balance">Bal: ${t.balance}</div>
        </div>
      </div>
    `).join('');

    return `
      <div class="section-title">
        <span class="material-symbols-outlined">receipt_long</span>
        Recent Transactions
      </div>
      <div class="mini-statement">${rows}</div>
    `;
  }

  // ─── Savings Rates ─────────────────────────────────────────
  static renderSavingsRates(data) {
    const rows = data.rates.map(r => {
      const isBonus = r.slab.includes('Senior');
      return `
        <div class="savings-rate-row ${isBonus ? 'bonus' : ''}">
          <span class="slab-label">${r.slab}</span>
          <span class="rate-value">${r.rate}</span>
        </div>
      `;
    }).join('');

    return `
      <div class="section-title">
        <span class="material-symbols-outlined">trending_up</span>
        Savings Account Interest Rates
      </div>
      <div class="savings-rates-module">${rows}</div>
    `;
  }

  // ─── UPI Help ──────────────────────────────────────────────
  static renderUPIHelp(data) {
    const cards = data.actions.map(a => `
      <div class="upi-action-card">
        <span class="material-symbols-outlined">${a.icon}</span>
        <div class="action-label">${a.label}</div>
        <div class="action-desc">${a.desc}</div>
      </div>
    `).join('');

    return `
      <div class="section-title">
        <span class="material-symbols-outlined">contactless</span>
        UPI Services
      </div>
      <div class="upi-actions">${cards}</div>
    `;
  }

  // ─── Branch Locator ────────────────────────────────────────
  static renderBranchLocator(data) {
    const branches = data.branches.map(b => `
      <div class="branch-card">
        <div class="branch-name">${b.name}</div>
        <div class="branch-address">${b.address}</div>
        <div class="branch-meta">
          <span class="branch-tag">
            <span class="material-symbols-outlined">near_me</span>
            ${b.distance}
          </span>
          <span class="branch-tag">
            <span class="material-symbols-outlined">${b.type.includes('Branch') ? 'store' : 'atm'}</span>
            ${b.type}
          </span>
          <span class="branch-tag">
            <span class="material-symbols-outlined">schedule</span>
            ${b.timing}
          </span>
        </div>
      </div>
    `).join('');

    return `
      <div class="section-title">
        <span class="material-symbols-outlined">location_on</span>
        Nearby Branches & ATMs
      </div>
      <div class="branch-list">${branches}</div>
    `;
  }

  // ─── Support Channels ─────────────────────────────────────
  static renderSupportChannels(data) {
    const channels = data.channels.map(c => `
      <div class="support-channel">
        <span class="material-symbols-outlined">${c.icon}</span>
        <div class="channel-type">${c.type}</div>
        <div class="channel-value">${c.value}</div>
        <div class="channel-hours">${c.available}</div>
      </div>
    `).join('');

    return `
      <div class="section-title">
        <span class="material-symbols-outlined">support_agent</span>
        Contact Support
      </div>
      <div class="support-channels">${channels}</div>
    `;
  }

  // ─── Suggestion Chips (Fallback / Welcome) ─────────────────
  static renderSuggestions(language = 'en') {
    const nlp = new NLPEngine();
    const suggestions = nlp.getSuggestions(language);
    const icons = ['account_balance_wallet', 'credit_card_off', 'savings', 'add_card', 'home', 'location_on'];

    const chips = suggestions.map((s, i) => `
      <div class="suggestion-chip" onclick="window.indusVaani?.handleSuggestion('${s.replace(/'/g, "\\'")}')">
        <span class="material-symbols-outlined">${icons[i] || 'help_outline'}</span>
        ${s}
      </div>
    `).join('');

    return `
      <div style="margin-top:8px">
        <div class="section-title">
          <span class="material-symbols-outlined">lightbulb</span>
          Try asking
        </div>
        <div class="suggestion-grid" style="justify-content:flex-start">${chips}</div>
      </div>
    `;
  }
}
