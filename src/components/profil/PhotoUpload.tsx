'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Local types (no generated DB types in this project) ───────────────────────

interface LoadedPhoto {
  dbId: string       // apartment_photos.id
  storagePath: string
  signedUrl: string  // expires after 3600 s; regenerated on reload
  position: number
}

type InitStatus = 'loading' | 'no-user' | 'no-apartment' | 'ready'

// Row shapes returned by Supabase selects — cast from any-typed client results.
interface AptRow    { id: string }
interface PhotoRow  { id: string; storage_path: string; position: number }

// ── Constants ─────────────────────────────────────────────────────────────────

const BUCKET     = 'apartment-photos'
const MAX_PHOTOS = 20
const MAX_BYTES  = 10 * 1024 * 1024   // 10 MB

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
}
const ALLOWED_TYPES = new Set(Object.keys(MIME_TO_EXT))

// Distinguish external file drags from internal photo-tile drags.
function isFileDrag(e: React.DragEvent): boolean {
  return Array.from(e.dataTransfer.types).includes('Files')
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PhotoUpload() {
  const [initStatus,   setInitStatus]   = useState<InitStatus>('loading')
  const [photos,       setPhotos]       = useState<LoadedPhoto[]>([])
  const [aptId,        setAptId]        = useState<string | null>(null)
  const [userId,       setUserId]       = useState<string | null>(null)

  // Drop-zone hover (file drag only)
  const [dropZoneOver, setDropZoneOver] = useState(false)

  // Drag-and-drop reorder
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Async states
  const [uploading,     setUploading]     = useState(false)
  const [uploadErrors,  setUploadErrors]  = useState<string[]>([])
  const [loadError,     setLoadError]     = useState('')
  const [deleteError,   setDeleteError]   = useState('')
  const [reorderError,  setReorderError]  = useState('')

  const inputRef = useRef<HTMLInputElement>(null)

  // ── Init: fetch user → apartment → existing photos ────────────────────────

  useEffect(() => {
    async function init() {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setInitStatus('no-user'); return }
      setUserId(user.id)

      const { data: aptRaw } = await supabase
        .from('apartments')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      const apt = aptRaw as AptRow | null
      if (!apt) { setInitStatus('no-apartment'); return }
      setAptId(apt.id)

      const { data: rowsRaw, error: rowsErr } = await supabase
        .from('apartment_photos')
        .select('id, storage_path, position')
        .eq('apartment_id', apt.id)
        .order('position', { ascending: true })

      if (rowsErr) {
        setLoadError('Fotos konnten nicht geladen werden.')
        setInitStatus('ready')
        return
      }

      const rows = (rowsRaw as PhotoRow[] | null) ?? []

      if (rows.length > 0) {
        const loaded = await Promise.all(
          rows.map(async row => {
            const { data: signed } = await supabase.storage
              .from(BUCKET)
              .createSignedUrl(row.storage_path, 3600)
            return {
              dbId:        row.id,
              storagePath: row.storage_path,
              signedUrl:   signed?.signedUrl ?? '',
              position:    row.position,
            }
          })
        )
        setPhotos(loaded)
      }

      setInitStatus('ready')
    }

    init()
  }, [])

  // ── Upload ────────────────────────────────────────────────────────────────

  async function handleFiles(files: FileList | null) {
    if (!files || !aptId || !userId || uploading) return

    // Validate each file
    const errors: string[] = []
    const valid: File[] = []

    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES.has(file.type)) {
        errors.push(`„${file.name}": Ungültiger Dateityp. Erlaubt: JPG, PNG, WEBP, HEIC.`)
        continue
      }
      if (file.size > MAX_BYTES) {
        errors.push(`„${file.name}": Datei zu groß (max. 10 MB).`)
        continue
      }
      valid.push(file)
    }

    const remaining = MAX_PHOTOS - photos.length
    const toUpload  = valid.slice(0, remaining)
    if (valid.length > remaining) {
      errors.push(
        `${valid.length - remaining} weitere Datei(en) übersprungen — Maximum von ${MAX_PHOTOS} Fotos erreicht.`
      )
    }

    setUploadErrors(errors)
    if (toUpload.length === 0) return

    setUploading(true)
    const supabase   = createClient()
    const newPhotos: LoadedPhoto[] = []

    for (let i = 0; i < toUpload.length; i++) {
      const file = toUpload[i]
      const ext  = MIME_TO_EXT[file.type]
      const path = `${userId}/${aptId}/${crypto.randomUUID()}.${ext}`
      const pos  = photos.length + newPhotos.length

      // 1. Upload to Storage
      const { error: storageErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file)

      if (storageErr) {
        errors.push(`„${file.name}": Upload fehlgeschlagen. Bitte erneut versuchen.`)
        continue
      }

      // 2. Insert DB row — on failure, clean up the orphaned storage object
      const { data: rowRaw, error: dbErr } = await supabase
        .from('apartment_photos')
        .insert({ apartment_id: aptId, user_id: userId, storage_path: path, position: pos })
        .select('id, storage_path, position')
        .single()

      if (dbErr || !rowRaw) {
        await supabase.storage.from(BUCKET).remove([path])
        errors.push(`„${file.name}": Datenbankfehler. Datei wurde entfernt.`)
        continue
      }

      const row = rowRaw as PhotoRow

      // 3. Generate signed URL for immediate display
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, 3600)

      newPhotos.push({
        dbId:        row.id,
        storagePath: path,
        signedUrl:   signed?.signedUrl ?? '',
        position:    pos,
      })
    }

    setUploadErrors(errors)
    setPhotos(prev => [...prev, ...newPhotos])
    setUploading(false)
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete(photo: LoadedPhoto) {
    setDeleteError('')
    const supabase = createClient()

    // 1. Delete from Storage first — if this fails, abort entirely
    const { error: storageErr } = await supabase.storage
      .from(BUCKET)
      .remove([photo.storagePath])

    if (storageErr) {
      setDeleteError('Foto konnte nicht gelöscht werden. Bitte erneut versuchen.')
      return
    }

    // 2. Delete DB row (Storage is already gone — proceed regardless)
    await supabase.from('apartment_photos').delete().eq('id', photo.dbId)

    // 3. Reindex positions locally and persist
    const updated = photos
      .filter(p => p.dbId !== photo.dbId)
      .map((p, i) => ({ ...p, position: i }))

    setPhotos(updated)

    await Promise.all(
      updated.map(p =>
        supabase.from('apartment_photos').update({ position: p.position }).eq('id', p.dbId)
      )
    )
  }

  // ── Reorder (native HTML5 drag-and-drop) ──────────────────────────────────

  async function handleDrop(targetIndex: number) {
    if (dragFromIndex === null || dragFromIndex === targetIndex) {
      setDragFromIndex(null)
      setDragOverIndex(null)
      return
    }

    // Snapshot for potential revert
    const previous = photos

    const reordered = [...photos]
    const [moved] = reordered.splice(dragFromIndex, 1)
    reordered.splice(targetIndex, 0, moved)
    const withPositions = reordered.map((p, i) => ({ ...p, position: i }))

    // Optimistic update
    setPhotos(withPositions)
    setDragFromIndex(null)
    setDragOverIndex(null)
    setReorderError('')

    // Persist new positions
    const supabase = createClient()
    const results = await Promise.all(
      withPositions.map(p =>
        supabase.from('apartment_photos').update({ position: p.position }).eq('id', p.dbId)
      )
    )

    if (results.some(r => r.error)) {
      setPhotos(previous)   // revert on failure
      setReorderError('Reihenfolge konnte nicht gespeichert werden. Bitte laden Sie die Seite neu.')
    }
  }

  // ── Render: init states ────────────────────────────────────────────────────

  if (initStatus === 'loading') {
    return (
      <p style={{ fontSize: 13, color: 'rgba(245,245,244,0.35)', margin: 0 }}>
        Fotos werden geladen…
      </p>
    )
  }

  if (initStatus === 'no-user') {
    return (
      <p style={{ fontSize: 13, color: 'rgba(245,245,244,0.35)', margin: 0 }}>
        Bitte melden Sie sich an, um Fotos hochzuladen.
      </p>
    )
  }

  if (initStatus === 'no-apartment') {
    return (
      <p style={{ fontSize: 13, color: 'rgba(245,245,244,0.45)', margin: 0, lineHeight: 1.6 }}>
        Speichern Sie zuerst Ihre Wohnungsdaten, um Fotos hochzuladen.
      </p>
    )
  }

  // ── Render: ready ──────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Load error */}
      {loadError && (
        <p style={{ fontSize: 13, color: 'rgba(220,80,80,0.85)', margin: 0, lineHeight: 1.5 }}>
          {loadError}
        </p>
      )}

      {/* Drop zone — hidden when at photo limit */}
      {photos.length < MAX_PHOTOS && (
        <div
          onClick={() => { if (!uploading) inputRef.current?.click() }}
          onDragOver={e => { e.preventDefault(); if (isFileDrag(e)) setDropZoneOver(true) }}
          onDragLeave={() => setDropZoneOver(false)}
          onDrop={e => {
            e.preventDefault()
            setDropZoneOver(false)
            if (isFileDrag(e)) handleFiles(e.dataTransfer.files)
          }}
          style={{
            border: `2px dashed ${dropZoneOver ? 'rgba(212,168,83,0.60)' : 'rgba(255,255,255,0.12)'}`,
            borderRadius: 12,
            padding: '32px 20px',
            textAlign: 'center',
            cursor: uploading ? 'not-allowed' : 'pointer',
            background: dropZoneOver ? 'rgba(212,168,83,0.04)' : 'rgba(255,255,255,0.02)',
            transition: 'border-color 0.15s, background 0.15s',
            userSelect: 'none',
            opacity: uploading ? 0.60 : 1,
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 10 }}>
            {uploading ? '⏳' : '📷'}
          </div>
          <p style={{ fontSize: 14, color: 'rgba(245,245,244,0.70)', margin: '0 0 6px', fontWeight: 500 }}>
            {uploading ? 'Fotos werden hochgeladen…' : 'Fotos hier ablegen oder auswählen'}
          </p>
          <p style={{ fontSize: 12, color: 'rgba(245,245,244,0.35)', margin: 0 }}>
            JPG, PNG, WEBP, HEIC · max. 10 MB pro Foto · max. {MAX_PHOTOS} Fotos
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,.heic"
            multiple
            disabled={uploading}
            style={{ display: 'none' }}
            onChange={e => { handleFiles(e.target.files); e.target.value = '' }}
          />
        </div>
      )}

      {/* Per-file upload errors */}
      {uploadErrors.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {uploadErrors.map((err, i) => (
            <p key={i} style={{ fontSize: 12, color: 'rgba(220,80,80,0.85)', margin: 0, lineHeight: 1.5 }}>
              {err}
            </p>
          ))}
        </div>
      )}

      {/* Delete / reorder error */}
      {(deleteError || reorderError) && (
        <p style={{ fontSize: 12, color: 'rgba(220,80,80,0.85)', margin: 0, lineHeight: 1.5 }}>
          {deleteError || reorderError}
        </p>
      )}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: 10,
        }}>
          {photos.map((photo, i) => (
            <div
              key={photo.dbId}
              draggable
              onDragStart={() => { setDragFromIndex(i); setReorderError('') }}
              onDragOver={e => { e.preventDefault(); if (!isFileDrag(e)) setDragOverIndex(i) }}
              onDragLeave={() => setDragOverIndex(null)}
              onDrop={e => { e.preventDefault(); if (!isFileDrag(e)) handleDrop(i) }}
              onDragEnd={() => { setDragFromIndex(null); setDragOverIndex(null) }}
              style={{
                position: 'relative',
                aspectRatio: '1',
                borderRadius: 8,
                overflow: 'hidden',
                background: '#1c1c1c',
                cursor: 'grab',
                opacity: dragFromIndex === i ? 0.40 : 1,
                outline: dragOverIndex === i && dragFromIndex !== i
                  ? '2px solid rgba(212,168,83,0.70)'
                  : '2px solid transparent',
                outlineOffset: '-2px',
                transition: 'opacity 0.15s',
              }}
            >
              {/* Photo or placeholder when signed URL is missing / failed */}
              {photo.signedUrl ? (
                <img
                  src={photo.signedUrl}
                  alt={`Foto ${i + 1}`}
                  draggable={false}
                  loading="lazy"
                  decoding="async"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                />
              ) : (
                <div style={{
                  width: '100%', height: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, color: 'rgba(245,245,244,0.20)',
                }}>
                  🖼
                </div>
              )}

              {/* First photo gets a "Titelbild" badge */}
              {i === 0 && (
                <div style={{
                  position: 'absolute', bottom: 4, left: 4,
                  background: 'rgba(212,168,83,0.88)',
                  borderRadius: 4, padding: '2px 6px',
                  fontSize: 9, fontWeight: 700, color: '#0C0A06',
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                  pointerEvents: 'none',
                }}>
                  Titelbild
                </div>
              )}

              {/* Delete button */}
              <button
                onClick={e => { e.stopPropagation(); handleDelete(photo) }}
                aria-label="Foto entfernen"
                style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 22, height: 22, borderRadius: 999,
                  background: 'rgba(0,0,0,0.70)', border: 'none',
                  color: '#fff', fontSize: 11, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'inherit', lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty-state hint */}
      {photos.length === 0 && !loadError && (
        <p style={{ fontSize: 12, color: 'rgba(245,245,244,0.40)', margin: 0, lineHeight: 1.6 }}>
          Fotos helfen Interessenten, Ihre Wohnung besser einzuschätzen.
          Das erste Foto wird als Titelbild verwendet.
        </p>
      )}

      {/* Counter + drag hint + HEIC note */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {photos.length > 0 && (
          <p style={{ fontSize: 12, color: 'rgba(245,245,244,0.35)', margin: 0 }}>
            {photos.length} / {MAX_PHOTOS} Fotos · Zum Sortieren ziehen
          </p>
        )}
        <p style={{ fontSize: 11, color: 'rgba(245,245,244,0.38)', margin: 0 }}>
          HEIC-Vorschau ist je nach Browser eingeschränkt.
        </p>
      </div>

    </div>
  )
}
