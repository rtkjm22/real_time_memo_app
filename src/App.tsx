import { useEffect, useState, useCallback } from 'react'
import './App.css'
import { NoteList } from './NoteList'
import { supabase } from './supabase/client'
import { Note } from './Note'
import { NoteEditor } from './NoteEditor'
import { useDebounce } from './hooks/useDebounce'

function App() {
  const [notes, setNotes] = useState<Note[]>([])
  const [previewMode, setPreviewMode] = useState(false)
  const [currentNoteId, setCurrentNoteId] = useState<number | null>(null)
  const [currentValue, setCurrentValue] = useState<string | null>(null)

  const debounce = useDebounce(2000)

  const fetchNotes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('note')
        .select('*')
        .order('id', { ascending: false })

      if (error) throw error
      setNotes(data)
    } catch (error) {
      console.error('Error fetching Notes: ', error)
    }
  }, [])

  useEffect(() => {
    fetchNotes()
    const subscription = supabase
      .channel('note')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'note' },
        fetchNotes
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [fetchNotes])

  useEffect(() => {
    const target = notes.find((note) => note.id === currentNoteId)
    target && setCurrentValue(target.content)
  }, [currentNoteId, notes])

  const handleNewNote = async () => {
    try {
      const { error } = await supabase
        .from('note')
        .insert({ title: '新規ノート', content: '' })

      if (error) throw error
      fetchNotes()
    } catch (error) {
      console.error('Error creating new note: ', error)
    }
  }
  const handleContentChange = (content: string) => {
    setCurrentValue(content)
    debounce(async () => {
      try {
        const { error } = await supabase
          .from('note')
          .update({ content })
          .eq('id', currentNoteId)

        if (error) throw error
      } catch (error) {
        console.error('Error updating note content: ', error)
      }
    })
  }
  const handleTitleChange = async (title: string) => {
    try {
      const { error } = await supabase
        .from('note')
        .update({ title })
        .eq('id', currentNoteId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating note title: ', error)
    }
  }

  return (
    <div className="flex h-screen">
      <div className="w-[300px] bg-gray-100 p-4">
        <div className="mb-4">
          <button
            className="w-full p-2 bg-blue-500 text-white font-bold rounded"
            onClick={handleNewNote}
          >
            新規作成
          </button>
        </div>
        <NoteList
          notes={notes}
          selectNoteId={currentNoteId}
          onSelect={(note) => setCurrentNoteId(note.id)}
          handleChangeTitle={handleTitleChange}
        />
      </div>
      <div className="flex-1 p-4">
        <div className="mb-4 flex justify-between">
          <h2 className="text-lg font-bold">Note Editor</h2>
          <button
            className="p-2 bg-green-500 text-white font-bold rounded"
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? 'Edit' : 'Preview'}
          </button>
        </div>
        <NoteEditor
          content={currentValue ?? ''}
          isPreviewMode={previewMode}
          onContentChange={handleContentChange}
        />
      </div>
    </div>
  )
}

export default App
