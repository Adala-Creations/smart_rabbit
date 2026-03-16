'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import useFetchWithLoading from '@/hooks/useFetchWithLoading';
import { useToast } from '@/components/ToastProvider';
import { useConfirm } from '@/components/ConfirmProvider';

type NoteType = 'GENERAL' | 'HEALTH' | 'FINANCE' | 'OTHER';
type NoteSubject = 'NONE' | 'RABBIT' | 'BATCH';

export default function NotesPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const fetchWithLoading = useFetchWithLoading();
  const searchParams = useSearchParams();

  const [notes, setNotes] = useState<any[]>([]);
  const [rabbits, setRabbits] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingNote, setViewingNote] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'GENERAL' as NoteType,
    subject: 'NONE' as NoteSubject,
    rabbitId: '',
    batchId: '',
  });

  const isAddAction = searchParams?.get('action') === 'add';

  useEffect(() => {
    if (isAddAction) {
      setShowForm(true);
    }
  }, [isAddAction]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [notesRes, rabbitsRes, batchesRes] = await Promise.all([
        fetchWithLoading('/api/notes'),
        fetchWithLoading('/api/rabbits'),
        fetchWithLoading('/api/offspring?status=SEXED&page=1&pageSize=200'),
      ]);

      const notesData = notesRes.ok ? await notesRes.json() : [];
      const rabbitsData = rabbitsRes.ok ? await rabbitsRes.json() : [];
      const batchesData = batchesRes.ok ? await batchesRes.json() : [];
      const batchItems = Array.isArray(batchesData) ? batchesData : (batchesData.items || []);

      setNotes(Array.isArray(notesData) ? notesData : []);
      setRabbits(Array.isArray(rabbitsData) ? rabbitsData : []);
      setBatches(batchItems.filter((b: any) => Number(b.availableCount ?? b.count ?? 0) > 0));
    } catch (error) {
      console.error('Error fetching notes data:', error);
      toast.pushToast({ message: 'Failed to load notes', type: 'error' });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: '',
      content: '',
      type: 'GENERAL',
      subject: 'NONE',
      rabbitId: '',
      batchId: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const method = editingId ? 'PUT' : 'POST';
      const payload = {
        ...(editingId ? { id: editingId } : {}),
        title: formData.title,
        content: formData.content,
        type: formData.type,
        subject: formData.subject,
        rabbitId: formData.subject === 'RABBIT' ? formData.rabbitId : undefined,
        batchId: formData.subject === 'BATCH' ? formData.batchId : undefined,
      };

      const res = await fetchWithLoading('/api/notes', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.pushToast({ message: data.error || 'Failed to save note', type: 'error' });
        return;
      }

      toast.pushToast({ message: editingId ? 'Note updated' : 'Note created', type: 'success' });
      setShowForm(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving note:', error);
      toast.pushToast({ message: 'Failed to save note', type: 'error' });
    }
  };

  const handleEdit = (note: any) => {
    setEditingId(note.id);
    setFormData({
      title: note.title || '',
      content: note.content || '',
      type: note.type || 'GENERAL',
      subject: note.subject || 'NONE',
      rabbitId: note.rabbitId || '',
      batchId: note.batchId || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm('Delete this note?'))) return;

    try {
      const res = await fetchWithLoading(`/api/notes?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        toast.pushToast({ message: data.error || 'Failed to delete note', type: 'error' });
        return;
      }

      toast.pushToast({ message: 'Note deleted', type: 'success' });
      fetchData();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.pushToast({ message: 'Failed to delete note', type: 'error' });
    }
  };

  const renderSubject = (note: any) => {
    if (note.subject === 'RABBIT') {
      return `Rabbit: ${note.rabbit?.rabbitId || 'Unknown'}`;
    }

    if (note.subject === 'BATCH') {
      return `Batch: ${note.batch?.batchId || 'Unknown'}`;
    }

    return 'Non-specific';
  };

  const typeLabel = (type: string) => type.charAt(0) + type.slice(1).toLowerCase();
  const getBatchGenderLabel = (batch: any) => {
    const male = Number(batch?.maleCount ?? 0);
    const female = Number(batch?.femaleCount ?? 0);

    if (male > 0 && female === 0) return 'Male';
    if (female > 0 && male === 0) return 'Female';
    if (male > 0 || female > 0) return `${male}M/${female}F`;

    return 'Unsexed';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Central Notes</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Record general or subject-specific notes for rabbits and batches.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Notes Records</h2>
          <button
            onClick={() => {
              if (showForm) {
                setShowForm(false);
                resetForm();
              } else {
                setShowForm(true);
              }
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
          >
            {showForm ? 'Cancel' : '+ Add Note'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Notes title *</label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as NoteType })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              >
                <option value="GENERAL">General</option>
                <option value="HEALTH">Health</option>
                <option value="FINANCE">Finance</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Select subject *</label>
              <select
                value={formData.subject}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    subject: e.target.value as NoteSubject,
                    rabbitId: '',
                    batchId: '',
                  })
                }
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              >
                <option value="NONE">Non-specific</option>
                <option value="RABBIT">Rabbit</option>
                <option value="BATCH">Available batch</option>
              </select>
            </div>

            {formData.subject === 'RABBIT' && (
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Rabbit *</label>
                <select
                  required
                  value={formData.rabbitId}
                  onChange={(e) => setFormData({ ...formData, rabbitId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                >
                  <option value="">Select rabbit</option>
                  {rabbits.filter((rabbit: any) => rabbit.status !== 'DECEASED').map((rabbit: any) => (
                    <option key={rabbit.id} value={rabbit.id}>
                      {rabbit.rabbitId} {rabbit.name ? `- ${rabbit.name}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.subject === 'BATCH' && (
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Available batch *</label>
                <select
                  required
                  value={formData.batchId}
                  onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                >
                  <option value="">Select batch</option>
                  {batches.map((batch: any) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.batchId} - Comp {batch.compartment ?? 1} - {getBatchGenderLabel(batch)} - {batch.availableCount ?? batch.count ?? 0} available
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Note *</label>
              <textarea
                required
                rows={4}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              />
            </div>

            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {editingId ? 'Update Note' : 'Create Note'}
            </button>
          </form>
        )}

        {notes.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No notes yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Title</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Subject</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Note</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {notes.map((note: any) => (
                  <tr key={note.id}>
                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-white font-medium">{note.title}</td>
                    <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{typeLabel(note.type)}</td>
                    <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{renderSubject(note)}</td>
                    <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 max-w-sm truncate">{note.content}</td>
                    <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{new Date(note.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-sm space-x-2">
                      <button
                        onClick={() => setViewingNote(note)}
                        className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleEdit(note)}
                        className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Note Details</h3>
            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <div><span className="font-semibold">Title:</span> {viewingNote.title}</div>
              <div><span className="font-semibold">Type:</span> {typeLabel(viewingNote.type)}</div>
              <div><span className="font-semibold">Subject:</span> {renderSubject(viewingNote)}</div>
              <div><span className="font-semibold">Created:</span> {new Date(viewingNote.createdAt).toLocaleString()}</div>
              <div className="pt-1">
                <div className="font-semibold mb-1">Note</div>
                <div className="whitespace-pre-wrap p-3 rounded bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100">
                  {viewingNote.content}
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setViewingNote(null)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
