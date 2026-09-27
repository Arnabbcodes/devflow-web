/**
 * DevFlow Focus Mode Page Controller
 */

import { FocusTimer, AmbientSynthesizer } from './timer.js';
import { taskService } from '../services/taskService.js';
import { analyticsService } from '../services/analyticsService.js';
import { showToast } from '../utils/notifications.js';

export async function initFocusPage() {
  const digitsEl = document.getElementById('timer-digits');
  const playBtn = document.getElementById('btn-timer-toggle');
  const resetBtn = document.getElementById('btn-timer-reset');
  const circleProgress = document.getElementById('timer-circle-progress');
  const taskSelect = document.getElementById('focus-task-select');
  const modeTabs = document.querySelectorAll('.focus-tab-btn');
  const ambientBtns = document.querySelectorAll('.ambient-btn');

  const circleRadius = 140;
  const circumference = 2 * Math.PI * circleRadius;
  if (circleProgress) {
    circleProgress.style.strokeDasharray = `${circumference} ${circumference}`;
    circleProgress.style.strokeDashoffset = '0';
  }

  // Populate active tasks in selector
  try {
    const tasks = await taskService.getTasks();
    const activeTasks = tasks.filter(t => t.status !== 'done');
    if (taskSelect) {
      taskSelect.innerHTML = '<option value="">-- No specific task (Free Flow) --</option>' + 
        activeTasks.map(t => `<option value="${t.id}">${t.title}</option>`).join('');
    }
  } catch (err) {
    console.error("Error loading tasks for focus mode:", err);
  }

  let currentMode = 'pomodoro'; // 'pomodoro' (25), 'short_break' (5), 'long_break' (15), 'flow' (50)
  const durations = {
    pomodoro: 25,
    short_break: 5,
    long_break: 15,
    flow: 50
  };

  const timer = new FocusTimer({
    initialSeconds: durations.pomodoro * 60,
    onTick: (remaining, total) => {
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      if (digitsEl) digitsEl.textContent = formatted;
      document.title = `${formatted} - DevFlow Focus`;

      // Update ring
      if (circleProgress) {
        const offset = circumference - (remaining / total) * circumference;
        circleProgress.style.strokeDashoffset = String(offset);
      }
    },
    onComplete: async (completedMinutes) => {
      showToast('🎉 Focus session completed! Great work.', 'success', 5000);
      playBtn.innerHTML = '▶';
      document.title = 'DevFlow - Focus Mode';

      const selectedTaskId = taskSelect ? taskSelect.value || null : null;
      await analyticsService.logFocusSession(completedMinutes, currentMode, selectedTaskId);
    }
  });

  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (timer.isRunning) {
        timer.pause();
        playBtn.innerHTML = '▶';
        playBtn.title = 'Start Focus';
      } else {
        timer.start();
        playBtn.innerHTML = '❚❚';
        playBtn.title = 'Pause Focus';
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      timer.reset();
      if (playBtn) playBtn.innerHTML = '▶';
    });
  }

  // Mode tabs
  modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      modeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentMode = tab.dataset.mode;
      timer.setDuration(durations[currentMode] || 25);
      if (playBtn) playBtn.innerHTML = '▶';
    });
  });

  // Ambient sound synthesizer
  const synth = new AmbientSynthesizer();
  ambientBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.sound;
      if (btn.classList.contains('active')) {
        synth.stop();
        btn.classList.remove('active');
      } else {
        ambientBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        synth.play(mode);
      }
    });
  });
}
