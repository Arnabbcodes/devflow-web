/**
 * DevFlow Notes Page Controller
 */

import { supabaseClient, isSupabaseConfigured } from '../config/supabase.js';
import { STORAGE_KEYS, generateUUID } from '../utils/helpers.js';
import { timeAgo } from '../utils/dateUtils.js';
import { showToast } from '../utils/notifications.js';

const INITIAL_MOCK_NOTES = [
  {
    id: 'note-1',
    title: 'Groq AI Llama 3 Prompt Architecture',
    content: `# Groq Llama 3 Integration

Ensure the system prompt uses:
\`\`\`json
{
  "response_format": { "type": "json_object" }
}
\`\`\`
This enforces guaranteed parseable JSON payloads when structuring task subtasks and schedules.`,
    tags: ['ai', 'groq', 'architecture'],
    is_pinned: true,
    updated_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'note-2',
    title: 'Supabase RLS Checklist',
    content: `Always ensure:
1. \`alter table public.<table> enable row level security;\`
2. \`create policy "..." using (auth.uid() = user_id);\`
3. Never use service_role keys on client frontend; keep them strictly in Edge Functions secrets!`,
    tags: ['supabase', 'security'],
    is_pinned: false,
    updated_at: new Date(Date.now() - 86400000).toISOString()
  }
];

function getLocalNotes() {
  const data = localStorage.getItem(STORAGE_KEYS.LOCAL_NOTES);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.LOCAL_NOTES, JSON.stringify(INITIAL_MOCK_NOTES));
    return INITIAL_MOCK_NOTES;
  }
  try { return JSON.parse(data); } catch { return INITIAL_MOCK_NOTES; }
}

function saveLocalNotes(notes) {
  localStorage.setItem(STORAGE_KEYS.LOCAL_NOTES, JSON.stringify(notes));
}

export async function initNotesPage() {
  const notesListEl = document.getElementById('notes-list');
  const searchInput = document.getElementById('notes-search-input');
  const newNoteBtn = document.getElementById('new-note-btn');
  const titleInput = document.getElementById('note-title-editor');
  const contentInput = document.getElementById('note-content-editor');
  const saveBtn = document.getElementById('save-note-btn');
  const deleteBtn = document.getElementById('delete-note-btn');

  let activeNoteId = null;

  async function fetchNotes() {
    if (isSupabaseConfigured() && supabaseClient) {
      const { data, error } = await supabaseClient.from('notes').select('*').order('updated_at', { ascending: false });
      if (error) return getLocalNotes();
      return data || [];
    }
    return getLocalNotes();
  }

  async function renderNotesList() {
    const rawNotes = await fetchNotes();
    const query = (searchInput?.value || '').toLowerCase().trim();
    const notes = rawNotes.filter(n => 
      !query || n.title.toLowerCase().includes(query) || (n.content && n.content.toLowerCase().includes(query))
    );

    if (!notesListEl) return;

    if (notes.length === 0) {
      notesListEl.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 2rem 0;">No notes found</div>`;
      return;
    }

    notesListEl.innerHTML = notes.map(n => `
      <div class="note-item ${n.id === activeNoteId ? 'active' : ''}" data-id="${n.id}">
        <div class="note-item-title">${n.is_pinned ? '📌 ' : ''}${n.title || 'Untitled Note'}</div>
        <div class="note-item-snippet">${(n.content || '').substring(0, 60)}...</div>
        <div class="note-item-meta">
          <span>${(n.tags || []).map(t => `#${t}`).join(' ')}</span>
          <span>${timeAgo(n.updated_at)}</span>
        </div>
      </div>
    `).join('');

    notesListEl.querySelectorAll('.note-item').forEach(item => {
      item.addEventListener('click', () => {
        selectNote(item.dataset.id, rawNotes);
      });
    });

    if (!activeNoteId && notes.length > 0) {
      selectNote(notes[0].id, rawNotes);
    }
  }

  function selectNote(id, allNotes) {
    activeNoteId = id;
    const note = allNotes.find(n => n.id === id);
    if (!note) return;

    if (titleInput) titleInput.value = note.title || '';
    if (contentInput) contentInput.value = note.content || '';

    if (notesListEl) {
      notesListEl.querySelectorAll('.note-item').forEach(el => {
        el.classList.toggle('active', el.dataset.id === id);
      });
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => renderNotesList());
  }

  if (newNoteBtn) {
    newNoteBtn.addEventListener('click', async () => {
      const newNote = {
        id: generateUUID(),
        title: 'New Scratchpad Note',
        content: '',
        tags: ['snippet'],
        is_pinned: false,
        updated_at: new Date().toISOString()
      };

      if (isSupabaseConfigured() && supabaseClient) {
        const { data: { user } } = await supabaseClient.auth.getUser();
        await supabaseClient.from('notes').insert([{ ...newNote, user_id: user ? user.id : null }]);
      } else {
        const list = getLocalNotes();
        list.unshift(newNote);
        saveLocalNotes(list);
      }

      activeNoteId = newNote.id;
      showToast('Created new note', 'success');
      await renderNotesList();
      selectNote(newNote.id, await fetchNotes());
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      if (!activeNoteId) return;
      const title = titleInput.value.trim() || 'Untitled Note';
      const content = contentInput.value;

      if (isSupabaseConfigured() && supabaseClient) {
        await supabaseClient.from('notes').update({ title, content, updated_at: new Date().toISOString() }).eq('id', activeNoteId);
      } else {
        const list = getLocalNotes();
        const idx = list.findIndex(n => n.id === activeNoteId);
        if (idx !== -1) {
          list[idx].title = title;
          list[idx].content = content;
          list[idx].updated_at = new Date().toISOString();
          saveLocalNotes(list);
        }
      }

      showToast('Note saved!', 'success');
      await renderNotesList();
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      if (!activeNoteId) return;
      if (confirm('Delete this note?')) {
        if (isSupabaseConfigured() && supabaseClient) {
          await supabaseClient.from('notes').delete().eq('id', activeNoteId);
        } else {
          let list = getLocalNotes();
          list = list.filter(n => n.id !== activeNoteId);
          saveLocalNotes(list);
        }
        activeNoteId = null;
        if (titleInput) titleInput.value = '';
        if (contentInput) contentInput.value = '';
        showToast('Note deleted', 'info');
        await renderNotesList();
      }
    });
  }

  await renderNotesList();
}
