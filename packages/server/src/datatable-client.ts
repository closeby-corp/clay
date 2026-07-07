/**
 * BadUI DataTable client enhancer — drag-drop, keyboard nav, clipboard.
 * Loaded from page template; re-inits after morph.
 */
export const DATATABLE_CLIENT_SCRIPT = `
(function() {
  function getAppSignals() {
    var app = document.getElementById('app');
    var attr = app && app.getAttribute('data-signals');
    if (!attr) return { ctxId: null };
    try { return JSON.parse(attr); } catch (e) { return { ctxId: null }; }
  }

  function postTableEvent(compId, evtType, signals) {
    var base = getAppSignals();
    var body = Object.assign({}, base, signals || {}, {
      compId: compId,
      evtType: evtType,
      ctxId: base.ctxId
    });
    return fetch('/badui/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Datastar-Request': 'true'
      },
      body: JSON.stringify(body)
    }).then(function() {
      setTimeout(initDataTables, 0);
    });
  }

  var selection = { anchor: null, focus: null };

  function getCellCoords(td) {
    var tr = td.closest('tr');
    var table = td.closest('table');
    if (!tr || !table) return null;
    var rowId = tr.getAttribute('data-row-id');
    var colKey = td.getAttribute('data-col-key');
    if (!rowId || !colKey) return null;
    return { rowId: rowId, colKey: colKey, td: td };
  }

  function getEditableCells(table) {
    return Array.from(table.querySelectorAll('td[data-editable]'));
  }

  function initDataTables() {
    document.querySelectorAll('[data-badui-table-enhanced]').forEach(function(root) {
      if (root._baduiTableInit) return;
      root._baduiTableInit = true;
      var compId = root.getAttribute('data-comp-id');
      var table = root.querySelector('table');
      if (!compId || !table) return;

      root.querySelectorAll('[data-draggable-col]').forEach(function(th) {
        th.addEventListener('dragstart', function(e) {
          e.dataTransfer.setData('text/col-key', th.getAttribute('data-col-key') || '');
          e.dataTransfer.effectAllowed = 'move';
        });
        th.addEventListener('dragover', function(e) { e.preventDefault(); });
        th.addEventListener('drop', function(e) {
          e.preventDefault();
          var fromKey = e.dataTransfer.getData('text/col-key');
          var toKey = th.getAttribute('data-col-key');
          if (!fromKey || !toKey || fromKey === toKey) return;
          var headers = Array.from(root.querySelectorAll('[data-draggable-col]'));
          var keys = headers.map(function(h) { return h.getAttribute('data-col-key'); });
          var fromIdx = keys.indexOf(fromKey);
          var toIdx = keys.indexOf(toKey);
          if (fromIdx < 0 || toIdx < 0) return;
          keys.splice(fromIdx, 1);
          keys.splice(toIdx, 0, fromKey);
          postTableEvent(compId, 'reorder_columns', { order: JSON.stringify(keys) });
        });
      });

      var dragRowId = null;
      root.querySelectorAll('[data-draggable-row]').forEach(function(tr) {
        tr.setAttribute('draggable', 'true');
        tr.addEventListener('dragstart', function(e) {
          if (!e.target.closest('[data-drag-handle]') && !e.target.closest('td')) return;
          dragRowId = tr.getAttribute('data-row-id');
          e.dataTransfer.effectAllowed = 'move';
        });
        tr.addEventListener('dragover', function(e) { e.preventDefault(); });
        tr.addEventListener('drop', function(e) {
          e.preventDefault();
          var toId = tr.getAttribute('data-row-id');
          if (!dragRowId || !toId || dragRowId === toId) return;
          var rows = Array.from(root.querySelectorAll('[data-draggable-row]'));
          var ids = rows.map(function(r) { return r.getAttribute('data-row-id'); });
          var fromIdx = ids.indexOf(dragRowId);
          var toIdx = ids.indexOf(toId);
          if (fromIdx < 0 || toIdx < 0) return;
          ids.splice(fromIdx, 1);
          ids.splice(toIdx, 0, dragRowId);
          postTableEvent(compId, 'reorder_rows', { order: JSON.stringify(ids) });
          dragRowId = null;
        });
      });

      table.addEventListener('click', function(e) {
        var td = e.target.closest('td[data-editable]');
        if (!td) return;
        var coords = getCellCoords(td);
        if (!coords) return;
        if (e.shiftKey && selection.anchor) {
          selection.focus = coords;
        } else {
          selection.anchor = coords;
          selection.focus = coords;
        }
        highlightSelection(table);
      });

      table.addEventListener('dblclick', function(e) {
        var td = e.target.closest('td[data-editable]');
        if (!td) return;
        var coords = getCellCoords(td);
        if (!coords) return;
        postTableEvent(compId, 'begin_edit', {
          rowId: coords.rowId,
          colKey: coords.colKey
        });
      });

      document.addEventListener('keydown', function keyHandler(e) {
        if (!root.isConnected) {
          document.removeEventListener('keydown', keyHandler);
          return;
        }
        var active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) {
          if (e.key === 'Escape') active.blur();
          return;
        }
        if (!selection.focus) return;
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
          e.preventDefault();
          copySelection(table);
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
          e.preventDefault();
          navigator.clipboard.readText().then(function(text) {
            pasteTsv(compId, table, text, selection.anchor);
          });
        } else if (e.key === 'Tab') {
          e.preventDefault();
          moveFocus(table, e.shiftKey ? -1 : 1);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          var c = selection.focus;
          if (c) {
            postTableEvent(compId, 'cell_edit', {
              rowId: c.rowId,
              colKey: c.colKey,
              value: c.td.getAttribute('data-raw-value') || ''
            });
          }
        }
      });
    });

    document.querySelectorAll('input[data-indeterminate="true"]').forEach(function(cb) {
      cb.indeterminate = true;
    });
  }

  function highlightSelection(table) {
    table.querySelectorAll('td[data-editable].bg-primary\\/20').forEach(function(td) {
      td.classList.remove('bg-primary/20');
    });
    if (!selection.anchor) return;
    var cells = getEditableCells(table);
    var anchorIdx = cells.indexOf(selection.anchor.td);
    var focusIdx = selection.focus ? cells.indexOf(selection.focus.td) : anchorIdx;
    if (anchorIdx < 0) return;
    var start = Math.min(anchorIdx, focusIdx);
    var end = Math.max(anchorIdx, focusIdx);
    for (var i = start; i <= end; i++) {
      cells[i].classList.add('bg-primary/20');
    }
  }

  function copySelection(table) {
    if (!selection.anchor) return;
    var cells = getEditableCells(table);
    var anchorIdx = cells.indexOf(selection.anchor.td);
    var focusIdx = selection.focus ? cells.indexOf(selection.focus.td) : anchorIdx;
    var start = Math.min(anchorIdx, focusIdx);
    var end = Math.max(anchorIdx, focusIdx);
    var lines = [];
    var currentRow = null;
    var rowCells = [];
    for (var i = start; i <= end; i++) {
      var td = cells[i];
      var tr = td.closest('tr');
      var rowId = tr ? tr.getAttribute('data-row-id') : '';
      if (currentRow !== null && rowId !== currentRow) {
        lines.push(rowCells.join('\\t'));
        rowCells = [];
      }
      currentRow = rowId;
      rowCells.push(td.getAttribute('data-raw-value') || td.textContent.trim());
    }
    if (rowCells.length) lines.push(rowCells.join('\\t'));
    navigator.clipboard.writeText(lines.join('\\n'));
  }

  function pasteTsv(compId, table, text, anchor) {
    if (!anchor) return;
    var lines = text.replace(/\\r\\n/g, '\\n').replace(/\\r/g, '\\n').split('\\n').filter(function(l, i, a) {
      return l.length > 0 || i < a.length - 1;
    });
    var editableCells = getEditableCells(table);
    var startIdx = editableCells.indexOf(anchor.td);
    if (startIdx < 0) return;
    var cells = [];
    var idx = startIdx;
    for (var r = 0; r < lines.length; r++) {
      var cols = lines[r].split('\\t');
      for (var c = 0; c < cols.length; c++) {
        if (idx >= editableCells.length) break;
        var td = editableCells[idx];
        var coords = getCellCoords(td);
        if (coords) {
          cells.push({ rowId: coords.rowId, colKey: coords.colKey, value: cols[c] });
        }
        idx++;
      }
    }
    if (cells.length) {
      postTableEvent(compId, 'paste', { cells: JSON.stringify(cells) });
    }
  }

  function moveFocus(table, delta) {
    var cells = getEditableCells(table);
    if (!cells.length) return;
    var current = selection.focus ? cells.indexOf(selection.focus.td) : 0;
    var next = Math.max(0, Math.min(cells.length - 1, current + delta));
    var td = cells[next];
    var coords = getCellCoords(td);
    if (coords) {
      selection.anchor = coords;
      selection.focus = coords;
      highlightSelection(table);
      td.focus();
    }
  }

  window.initDataTables = initDataTables;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDataTables);
  } else {
    initDataTables();
  }

  var observer = new MutationObserver(function() {
    document.querySelectorAll('[data-badui-table-enhanced]').forEach(function(el) {
      el._baduiTableInit = false;
    });
    initDataTables();
  });
  var app = document.getElementById('app');
  if (app) observer.observe(app.parentElement || document.body, { childList: true, subtree: true });
})();
`;
