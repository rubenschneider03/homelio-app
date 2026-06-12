'use client'

import { useState, useRef } from 'react'

interface PhotoPreview {
  id: string
  url: string
  name: string
}

export function PhotoUpload() {
  const [photos, setPhotos] = useState<PhotoPreview[]>([])
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFiles(files: FileList | null) {
    if (!files) return
    const remaining = 20 - photos.length
    const toAdd = Array.from(files).slice(0, remaining)
    const newPhotos: PhotoPreview[] = toAdd.map(f => ({
      id: Math.random().toString(36).slice(2),
      url: URL.createObjectURL(f),
      name: f.name,
    }))
    setPhotos(prev => [...prev, ...newPhotos])
  }

  function removePhoto(id: string) {
    setPhotos(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
        style={{
          border: `2px dashed ${dragOver ? 'rgba(212,168,83,0.60)' : 'rgba(255,255,255,0.12)'}`,
          borderRadius: 12,
          padding: '32px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragOver ? 'rgba(212,168,83,0.04)' : 'rgba(255,255,255,0.02)',
          transition: 'border-color 0.15s, background 0.15s',
          userSelect: 'none',
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 10 }}>📷</div>
        <p style={{ fontSize: 14, color: 'rgba(245,245,244,0.70)', margin: '0 0 6px', fontWeight: 500 }}>
          Fotos hier ablegen oder auswählen
        </p>
        <p style={{ fontSize: 12, color: 'rgba(245,245,244,0.35)', margin: 0 }}>
          JPG, PNG, HEIC · max. 10 MB pro Foto · max. 20 Fotos
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/heic,.heic"
          multiple
          style={{ display: 'none' }}
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {/* Preview grid */}
      {photos.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: 10,
        }}>
          {photos.map(photo => (
            <div
              key={photo.id}
              style={{
                position: 'relative',
                aspectRatio: '1',
                borderRadius: 8,
                overflow: 'hidden',
                background: '#1c1c1c',
              }}
            >
              <img
                src={photo.url}
                alt={photo.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <button
                onClick={() => removePhoto(photo.id)}
                style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 22, height: 22, borderRadius: 999,
                  background: 'rgba(0,0,0,0.70)', border: 'none',
                  color: '#fff', fontSize: 11, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'inherit', lineHeight: 1,
                }}
                aria-label="Foto entfernen"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && (
        <p style={{ fontSize: 12, color: 'rgba(245,245,244,0.28)', margin: 0, lineHeight: 1.6 }}>
          Fotos helfen Interessenten, Ihre Wohnung besser einzuschätzen. Sie können die Reihenfolge nach dem Upload anpassen.
        </p>
      )}

      {photos.length > 0 && (
        <p style={{ fontSize: 12, color: 'rgba(245,245,244,0.35)', margin: 0 }}>
          {photos.length} / 20 Fotos
        </p>
      )}
    </div>
  )
}
