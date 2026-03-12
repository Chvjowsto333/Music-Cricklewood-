import { NextResponse } from 'next/server'
import { writeFile, mkdir, readdir, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const songsDirectory = join(process.cwd(), 'public/Audio')

export async function GET() {
  try {
    if (!existsSync(songsDirectory)) {
      await mkdir(songsDirectory, { recursive: true })
    }

    const files = await readdir(songsDirectory)
    const songs = files
      .filter(
        (file) =>
          file.endsWith('.mp3') ||
          file.endsWith('.wav') ||
          file.endsWith('.ogg'),
      )
      .map((file) => {
        const parts = file.replace(/\.[^/.]+$/, '').split(' - ')
        const artist = parts.length >= 2 ? parts[0].trim() : 'Unknown Artist'
        const title =
          parts.length >= 2
            ? parts.slice(1).join(' - ').trim()
            : parts[0].trim()

        return {
          id: file,
          title,
          artist,
          url: `/Audio/${encodeURIComponent(file)}`,
        }
      })

    return NextResponse.json(songs)
  } catch (error) {
    console.error('Error reading songs directory:', error)
    return NextResponse.json({ error: 'Failed to read songs' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 })
    }

    if (!existsSync(songsDirectory)) {
      await mkdir(songsDirectory, { recursive: true })
    }

    const uploadedSongs = []

    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Sanitize filename to prevent directory traversal
      const filename = file.name.replace(/[^a-zA-Z0-9.\-_ ()]/g, '')
      const filePath = join(songsDirectory, filename)

      await writeFile(filePath, buffer)

      const parts = filename.replace(/\.[^/.]+$/, '').split(' - ')
      const artist = parts.length >= 2 ? parts[0].trim() : 'Unknown Artist'
      const title =
        parts.length >= 2 ? parts.slice(1).join(' - ').trim() : parts[0].trim()

      uploadedSongs.push({
        id: filename,
        title,
        artist,
        url: `/Audio/${encodeURIComponent(filename)}`,
      })
    }

    return NextResponse.json(uploadedSongs)
  } catch (error) {
    console.error('Error uploading songs:', error)
    return NextResponse.json(
      { error: 'Failed to upload songs' },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'No song ID provided' },
        { status: 400 },
      )
    }

    // Sanitize filename to prevent directory traversal
    const filename = id.replace(/[^a-zA-Z0-9.\-_ ()]/g, '')
    const filePath = join(songsDirectory, filename)

    if (existsSync(filePath)) {
      await unlink(filePath)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting song:', error)
    return NextResponse.json(
      { error: 'Failed to delete song' },
      { status: 500 },
    )
  }
}
