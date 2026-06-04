import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  SignIn,
  SignUp,
  useUser,
  UserButton,
} from '@clerk/clerk-react';

// ─── helpers ───────────────────────────────────────────────────────────────
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const HM_COLORS = ['#ede9e3','#c7daf5','#8ab8ed','#4d8fd9','#1b5fb8'];

function dateKey(d) { return d.toISOString().slice(0, 10); }
function todayKey() { return dateKey(new Date()); }

function getWeekDates(offset) {
  const now = new Date();
  const dow = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}
function fmtDate(d) { return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); }
function fmtDateFull(d) { return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }

// ─── per-user storage ──────────────────────────────────────────────────────
function storageKey(userId) { return `doit_v3_${userId}`; }

function loadState(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return { tasks: {}, weekOffset: 0, heatmapYear: new Date().getFullYear() };
}

function saveState(userId, s) {
  localStorage.setItem(storageKey(userId), JSON.stringify(s));
}

// ─── AUTH SCREEN ────────────────────────────────────────────────────────────
function AuthScreen() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">do<span className="logo-dot">.</span>it</div>
        <div className="auth-tagline">Your tasks. Your week. Your streak.</div>

        <div className="auth-tabs">
          <button
            className={`auth-tab${mode === 'signin' ? ' active' : ''}`}
            onClick={() => setMode('signin')}
          >Sign in</button>
          <button
            className={`auth-tab${mode === 'signup' ? ' active' : ''}`}
            onClick={() => setMode('signup')}
          >Create account</button>
        </div>

        <div className="clerk-embed">
          {mode === 'signin' ? (
            <SignIn
              appearance={{
                elements: {
                  rootBox: 'clerk-root',
                  card: 'clerk-inner',
                  headerTitle: 'clerk-hide',
                  headerSubtitle: 'clerk-hide',
                  logoBox: 'clerk-hide',
                  footer: 'clerk-footer',
                  formButtonPrimary: 'clerk-btn-primary',
                  formFieldInput: 'clerk-input',
                  socialButtonsBlockButton: 'clerk-social-btn',
                }
              }}
              routing="hash"
            />
          ) : (
            <SignUp
              appearance={{
                elements: {
                  rootBox: 'clerk-root',
                  card: 'clerk-inner',
                  headerTitle: 'clerk-hide',
                  headerSubtitle: 'clerk-hide',
                  logoBox: 'clerk-hide',
                  footer: 'clerk-footer',
                  formButtonPrimary: 'clerk-btn-primary',
                  formFieldInput: 'clerk-input',
                  socialButtonsBlockButton: 'clerk-social-btn',
                }
              }}
              routing="hash"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── TASK ITEM ───────────────────────────────────────────────────────────────
function TaskItem({ task, onToggle, onDelete, onEdit }) {
  return (
    <div className="task-item">
      <div
        className={`task-cb${task.done ? ' done' : ''}`}
        onClick={onToggle}
        title={task.done ? 'Mark incomplete' : 'Mark complete'}
      />
      <div className={`task-text${task.done ? ' done' : ''}`}>{task.text}</div>
      <div className="task-actions">
        <button className="act-btn" onClick={onEdit} title="Edit">
          <i className="bi bi-pencil" />
        </button>
        <button className="act-btn del" onClick={onDelete} title="Delete">
          <i className="bi bi-trash" />
        </button>
      </div>
    </div>
  );
}

// ─── DAY COLUMN ──────────────────────────────────────────────────────────────
function DayColumn({ date, tasks, onAdd, onToggle, onDelete, onEdit }) {
  const [adding, setAdding] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef(null);
  const dk = dateKey(date);
  const isToday = dk === todayKey();

  useEffect(() => {
    if (adding && inputRef.current) inputRef.current.focus();
  }, [adding]);

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      const v = inputVal.trim();
      if (v) onAdd(dk, v);
      setInputVal('');
      setAdding(false);
    }
    if (e.key === 'Escape') { setAdding(false); setInputVal(''); }
  }

  const dayIdx = date.getDay() === 0 ? 6 : date.getDay() - 1;
  const done = tasks.filter(t => t.done).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : null;

  return (
    <div className={`day-col${isToday ? ' today-col' : ''}`}>
      <div className="day-head">
        <span className="day-name">{DAYS[dayIdx]}</span>
        <span className="day-date-badge">{fmtDate(date)}</span>
      </div>
      {tasks.length > 0 && (
        <div className="day-progress-bar">
          <div className="day-progress-fill" style={{ width: pct + '%' }} />
        </div>
      )}
      <div className="task-list">
        {tasks.map(t => (
          <TaskItem
            key={t.id}
            task={t}
            onToggle={() => onToggle(dk, t.id)}
            onDelete={() => onDelete(dk, t.id)}
            onEdit={() => onEdit(dk, t.id, t.text)}
          />
        ))}
      </div>
      <div className="add-row">
        {adding ? (
          <input
            ref={inputRef}
            className="add-input-field"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => { setAdding(false); setInputVal(''); }}
            placeholder="Task… (Enter to add)"
          />
        ) : (
          <button className="add-trigger-btn" onClick={() => setAdding(true)}>
            + add task
          </button>
        )}
      </div>
    </div>
  );
}

// ─── HEATMAP ────────────────────────────────────────────────────────────────
function Heatmap({ tasks, year, onNavYear }) {
  const [tooltip, setTooltip] = useState(null);

  const getDayPct = useCallback((dk) => {
    const t = tasks[dk] || [];
    if (!t.length) return null;
    return Math.round((t.filter(x => x.done).length / t.length) * 100);
  }, [tasks]);

  function cellColor(pct) {
    if (pct === null) return HM_COLORS[0];
    if (pct === 0) return HM_COLORS[1];
    if (pct < 40) return HM_COLORS[2];
    if (pct < 70) return HM_COLORS[3];
    return HM_COLORS[4];
  }

  const jan1 = new Date(year, 0, 1);
  const startDow = jan1.getDay() === 0 ? 6 : jan1.getDay() - 1;
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const daysInYear = isLeap ? 366 : 365;
  const totalWeeks = Math.ceil((startDow + daysInYear) / 7);

  const weeks = [];
  for (let w = 0; w < totalWeeks; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const dayIdx = w * 7 + d - startDow;
      if (dayIdx < 0 || dayIdx >= daysInYear) {
        week.push({ empty: true });
      } else {
        const date = new Date(year, 0, dayIdx + 1);
        const dk = dateKey(date);
        const pct = getDayPct(dk);
        const t = tasks[dk] || [];
        week.push({ date, dk, pct, total: t.length, done: t.filter(x => x.done).length });
      }
    }
    weeks.push(week);
  }

  const monthSlots = new Array(totalWeeks).fill('');
  for (let i = 0; i < daysInYear; i++) {
    const d = new Date(year, 0, i + 1);
    const wIdx = Math.floor((startDow + i) / 7);
    if (d.getDate() === 1) monthSlots[wIdx] = MONTHS[d.getMonth()];
  }

  const weekW = 15;

  return (
    <div className="heatmap-card">
      <div className="heatmap-title">Completion heatmap</div>
      <div className="heatmap-sub">Daily task completion rate across the year</div>
      <div className="hm-year-nav">
        <button className="icon-btn" onClick={() => onNavYear(-1)}>
          <i className="bi bi-chevron-left" />
        </button>
        <span className="hm-year-label">{year}</span>
        <button className="icon-btn" onClick={() => onNavYear(1)}>
          <i className="bi bi-chevron-right" />
        </button>
      </div>

      <div className="hm-scroll-inner">
        <div className="months-row">
          {monthSlots.map((m, i) => (
            <div key={i} className="month-slot" style={{ width: weekW }}>{m}</div>
          ))}
        </div>
        <div className="hm-body">
          <div className="dow-col">
            {['M','','W','','F','','S'].map((l, i) => (
              <div key={i} className="dow-lbl">{l}</div>
            ))}
          </div>
          <div className="hm-weeks">
            {weeks.map((week, wi) => (
              <div key={wi} className="hm-week">
                {week.map((cell, di) => (
                  <div
                    key={di}
                    className={`hm-cell${cell.empty ? ' empty-slot' : ''}`}
                    style={{ background: cell.empty ? 'transparent' : cellColor(cell.pct) }}
                    onMouseEnter={cell.empty ? undefined : e => {
                      setTooltip({
                        x: e.clientX + 14,
                        y: e.clientY - 52,
                        html: `<strong>${fmtDateFull(cell.date)}</strong><br/>${
                          cell.total === 0
                            ? 'No tasks'
                            : `${cell.done}/${cell.total} done &nbsp;·&nbsp; ${cell.pct}%`
                        }`
                      });
                    }}
                    onMouseMove={cell.empty ? undefined : e => {
                      setTooltip(t => t ? { ...t, x: e.clientX + 14, y: e.clientY - 52 } : null);
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="hm-legend">
          <span>Less</span>
          {HM_COLORS.map((c, i) => (
            <span key={i} className="legend-swatch" style={{ background: c }} />
          ))}
          <span>More</span>
        </div>
      </div>

      {tooltip && (
        <div
          className="hm-tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
          dangerouslySetInnerHTML={{ __html: tooltip.html }}
        />
      )}
    </div>
  );
}

// ─── DASHBOARD ──────────────────────────────────────────────────────────────
function Dashboard({ tasks, heatmapYear, onNavYear }) {
  const allDays = Object.keys(tasks);
  const totalTasks = allDays.reduce((s, dk) => s + (tasks[dk]?.length || 0), 0);
  const doneTasks = allDays.reduce((s, dk) => s + (tasks[dk]?.filter(t => t.done).length || 0), 0);
  const completionRate = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  let streak = 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const dk = dateKey(d);
    const t = tasks[dk] || [];
    if (!t.length) { if (i === 0) continue; break; }
    if (t.filter(x => x.done).length > 0) streak++;
    else if (i > 0) break;
  }

  const todayT = tasks[todayKey()] || [];
  const todayPct = todayT.length
    ? Math.round(todayT.filter(t => t.done).length / todayT.length * 100)
    : null;

  const stats = [
    { val: totalTasks, lbl: 'Total tasks', cls: 'blue', icon: 'bi-list-task' },
    { val: doneTasks, lbl: 'Completed', cls: 'red', icon: 'bi-check2-circle' },
    { val: streak, lbl: 'Day streak 🔥', cls: '', icon: 'bi-lightning' },
    { val: todayPct === null ? '—' : todayPct + '%', lbl: "Today's progress", cls: 'green', icon: 'bi-graph-up' },
  ];

  return (
    <>
      <div className="stats-strip">
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon"><i className={`bi ${s.icon}`} /></div>
            <div className={`stat-val ${s.cls}`}>{s.val}</div>
            <div className="stat-lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Overall progress bar */}
      <div className="overall-progress-card">
        <div className="op-header">
          <span className="op-label">Overall completion</span>
          <span className="op-pct">{completionRate}%</span>
        </div>
        <div className="op-bar">
          <div className="op-fill" style={{ width: completionRate + '%' }} />
        </div>
        <div className="op-sub">{doneTasks} of {totalTasks} tasks completed across all time</div>
      </div>

      <Heatmap tasks={tasks} year={heatmapYear} onNavYear={onNavYear} />
    </>
  );
}

// ─── EDIT MODAL ──────────────────────────────────────────────────────────────
function EditModal({ visible, initialText, onSave, onClose }) {
  const [val, setVal] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setVal(initialText);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [visible, initialText]);

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-title">Edit task</div>
        <input
          ref={inputRef}
          className="modal-input"
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') onSave(val.trim());
            if (e.key === 'Escape') onClose();
          }}
          placeholder="Task name…"
        />
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={() => onSave(val.trim())}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP (authenticated) ────────────────────────────────────────────────
function MainApp() {
  const { user } = useUser();
  const userId = user.id;

  const [tab, setTab] = useState('tasks');
  const [state, setState] = useState(() => loadState(userId));
  const [editModal, setEditModal] = useState(null);

  // Reload state if user switches
  useEffect(() => {
    setState(loadState(userId));
  }, [userId]);

  // Persist on every change
  useEffect(() => {
    saveState(userId, state);
  }, [userId, state]);

  const weekDates = getWeekDates(state.weekOffset);

  function addTask(dk, text) {
    setState(s => ({
      ...s,
      tasks: {
        ...s.tasks,
        [dk]: [...(s.tasks[dk] || []), {
          id: Date.now() + Math.random().toString(36).slice(2),
          text,
          done: false,
          createdAt: new Date().toISOString(),
        }]
      }
    }));
  }

  function toggleTask(dk, tid) {
    setState(s => ({
      ...s,
      tasks: {
        ...s.tasks,
        [dk]: (s.tasks[dk] || []).map(t =>
          t.id === tid ? { ...t, done: !t.done } : t
        )
      }
    }));
  }

  function deleteTask(dk, tid) {
    setState(s => ({
      ...s,
      tasks: {
        ...s.tasks,
        [dk]: (s.tasks[dk] || []).filter(t => t.id !== tid)
      }
    }));
  }

  function saveEdit(newText) {
    if (!newText || !editModal) return setEditModal(null);
    const { dk, tid } = editModal;
    setState(s => ({
      ...s,
      tasks: {
        ...s.tasks,
        [dk]: (s.tasks[dk] || []).map(t =>
          t.id === tid ? { ...t, text: newText } : t
        )
      }
    }));
    setEditModal(null);
  }

  function navWeek(dir) {
    setState(s => ({ ...s, weekOffset: dir === 0 ? 0 : s.weekOffset + dir }));
  }

  function navYear(dir) {
    setState(s => ({ ...s, heatmapYear: s.heatmapYear + dir }));
  }

  const weekLabel = `${fmtDate(weekDates[0])} – ${fmtDate(weekDates[6])}`;
  const firstName = user.firstName || user.username || 'there';

  return (
    <>
      <nav className="app-nav">
        <div className="logo">do<span className="logo-dot">.</span>it</div>
        <div className="nav-tabs-wrap">
          <button className={`nav-pill${tab === 'tasks' ? ' active' : ''}`} onClick={() => setTab('tasks')}>
            <i className="bi bi-calendar3" /> Tasks
          </button>
          <button className={`nav-pill${tab === 'dashboard' ? ' active' : ''}`} onClick={() => setTab('dashboard')}>
            <i className="bi bi-bar-chart" /> Dashboard
          </button>
        </div>
        <div className="nav-user">
          <span className="nav-greeting">Hi, {firstName}</span>
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'clerk-avatar',
              }
            }}
          />
        </div>
      </nav>

      <div className="main-wrap">
        {tab === 'tasks' && (
          <>
            <div className="week-header">
              <div className="week-label">{weekLabel}</div>
              <div className="d-flex gap-2">
                <button className="icon-btn" onClick={() => navWeek(-1)} title="Previous week">
                  <i className="bi bi-chevron-left" />
                </button>
                <button className="icon-btn" onClick={() => navWeek(0)} title="This week">
                  <i className="bi bi-house" />
                </button>
                <button className="icon-btn" onClick={() => navWeek(1)} title="Next week">
                  <i className="bi bi-chevron-right" />
                </button>
              </div>
            </div>
            <div className="days-grid">
              {weekDates.map((d, i) => (
                <DayColumn
                  key={i}
                  date={d}
                  tasks={state.tasks[dateKey(d)] || []}
                  onAdd={addTask}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                  onEdit={(dk, tid, text) => setEditModal({ dk, tid, text })}
                />
              ))}
            </div>
          </>
        )}

        {tab === 'dashboard' && (
          <Dashboard
            tasks={state.tasks}
            heatmapYear={state.heatmapYear}
            onNavYear={navYear}
          />
        )}
      </div>

      <EditModal
        visible={!!editModal}
        initialText={editModal?.text || ''}
        onSave={saveEdit}
        onClose={() => setEditModal(null)}
      />
    </>
  );
}

// ─── ROOT APP with auth gate ─────────────────────────────────────────────────
export default function App() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">do<span className="logo-dot">.</span>it</div>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <AuthScreen />;
  }

  return <MainApp />;
}
