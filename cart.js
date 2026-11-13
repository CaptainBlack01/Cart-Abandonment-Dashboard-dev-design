document.addEventListener('DOMContentLoaded', () => {
  const tableBody = document.getElementById('cartTableBody');
  const table = tableBody ? tableBody.closest('table') : null;
  const emptyState = document.getElementById('emptyState');
  const recoverAllBtn = document.getElementById('recoverAllBtn');
  const timeframeSelect = document.getElementById('timeframe');
  const emailFilter = document.getElementById('email-filter');
  const dayFilter = document.getElementById('days');
  const monthFilter = document.getElementById('months');
  const searchInput = document.getElementById('cart-search');
  const detailCustomer = document.getElementById('detailCustomer');
  const detailEmail = document.getElementById('detailEmail');
  const detailTotal = document.getElementById('detailTotal');
  const detailEmailBtn = document.getElementById('detailEmailBtn');
  const rows = Array.from(tableBody.querySelectorAll('tr'));

  let selectedRow = rows[rows.length - 1] || null;

  const parseHours = (text) => {
    const match = text.toLowerCase().match(/(\d+(?:\.\d+)?)\s*(min|h|hr|hour|day|week|month)/);
    if (!match) return null;
    const value = Number(match[1]);
    const unit = match[2];
    if (unit === 'min') return value / 60;
    if (unit === 'day') return value * 24;
    if (unit === 'week') return value * 168;
    if (unit === 'month') return value * 720;
    return value;
  };

  const rowHours = (row) => {
    const cell = row.children[3];
    return cell ? parseHours(cell.textContent) : null;
  };

  const rowStatus = (row) => {
    const badge = row.querySelector('.status');
    return badge ? badge.textContent.trim().toLowerCase() : '';
  };

  const matchesFilters = (row) => {
    const term = searchInput ? searchInput.value.trim().toLowerCase() : '';
    if (term && !row.textContent.toLowerCase().includes(term)) return false;

    const hours = rowHours(row);
    const timeframe = timeframeSelect ? timeframeSelect.value : 'last7days';
    const limits = { last7days: 168, last30days: 720, last6months: 4380, last1year: 8760 };
    if (hours !== null && limits[timeframe] && hours > limits[timeframe]) return false;

    if (dayFilter && dayFilter.value !== 'all' && hours !== null) {
      const date = new Date(Date.now() - hours * 3600 * 1000);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      if (dayName !== dayFilter.value) return false;
    }

    if (monthFilter && monthFilter.value !== 'all' && hours !== null) {
      const date = new Date(Date.now() - hours * 3600 * 1000);
      const monthName = date.toLocaleDateString('en-US', { month: 'long' });
      if (monthName !== monthFilter.value) return false;
    }

    if (emailFilter && emailFilter.value !== 'allEmails') {
      const status = rowStatus(row);
      const isSent = status.includes('sent') || status.includes('recovered');
      if (emailFilter.value === 'sentEmails' && !isSent) return false;
      if (emailFilter.value === 'notSentEmails' && isSent) return false;
    }

    return true;
  };

  const updateEmptyState = () => {
    const visibleRows = rows.filter((row) => !row.hidden);
    if (visibleRows.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      if (table) table.style.display = 'none';
    } else {
      if (emptyState) emptyState.style.display = 'none';
      if (table) table.style.display = '';
    }
  };

  const applyFilters = () => {
    rows.forEach((row) => {
      row.hidden = !matchesFilters(row);
    });
    updateEmptyState();
  };

  const setStatus = (row, label, className) => {
    const badge = row.querySelector('.status');
    if (!badge) return;
    badge.textContent = label;
    badge.className = `status ${className}`;
  };

  const updateDetails = (row) => {
    if (!row) return;
    selectedRow = row;
    const nameCell = row.querySelector('td:first-child');
    const name = nameCell ? nameCell.textContent.trim() : '';
    const valueCell = row.children[2];
    const email = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '')}@gmail.com`;

    if (detailCustomer) detailCustomer.textContent = name;
    if (detailEmail) detailEmail.textContent = email;
    if (detailTotal && valueCell) detailTotal.textContent = valueCell.textContent.trim();
  };

  const sendEmailFor = (row) => {
    if (!row) return;
    if (rowStatus(row) === 'pending') setStatus(row, 'Sent', 'sent');
    applyFilters();
  };

  document.querySelectorAll('.btn-send-email').forEach((btn) => {
    btn.addEventListener('click', () => {
      const row = btn.closest('tr');
      const original = btn.textContent;
      btn.textContent = 'Sent!';
      btn.disabled = true;
      sendEmailFor(row);
      updateDetails(row);
      window.setTimeout(() => {
        btn.textContent = original;
        btn.disabled = false;
      }, 2000);
    });
  });

  if (detailEmailBtn) {
    detailEmailBtn.addEventListener('click', () => {
      sendEmailFor(selectedRow);
      const original = detailEmailBtn.textContent;
      detailEmailBtn.textContent = 'Sent!';
      detailEmailBtn.disabled = true;
      window.setTimeout(() => {
        detailEmailBtn.textContent = original;
        detailEmailBtn.disabled = false;
      }, 2000);
    });
  }

  if (recoverAllBtn) {
    recoverAllBtn.addEventListener('click', () => {
      rows.forEach((row) => setStatus(row, 'Recovered', 'recovered'));
      applyFilters();
      window.setTimeout(() => {
        if (!rows.some((row) => !row.hidden)) updateEmptyState();
      }, 100);
    });
  }

  rows.forEach((row) => {
    row.addEventListener('click', (event) => {
      if (event.target.closest('button')) return;
      updateDetails(row);
      rows.forEach((item) => item.classList.remove('selected'));
      row.classList.add('selected');
    });
  });

  [timeframeSelect, emailFilter, dayFilter, monthFilter].forEach((select) => {
    if (select) select.addEventListener('change', applyFilters);
  });

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  if (selectedRow) {
    updateDetails(selectedRow);
    rows.forEach((row) => row.classList.remove('selected'));
    selectedRow.classList.add('selected');
  }

  applyFilters();
});
