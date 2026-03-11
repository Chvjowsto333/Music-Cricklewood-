import { NextResponse } from 'next/server'
import { createReadStream, statSync, existsSync } from 'fs'
import { join } from 'path'
import { Readable } from 'stream'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return new NextResponse('No song ID provided', { status: 400 })
    }

    // Sanitize filename to prevent directory traversal
    const filename = id.replace(/[^a-zA-Z0-9.\-_ ()]/g, '')
    const filePath = join(process.cwd(), 'Audio', filename)

    if (!existsSync(filePath)) {
      return new NextResponse('Song not found', { status: 404 })
    }

    const stat = statSync(filePath)
    const fileSize = stat.size
    const range = request.headers.get('range')

    let contentType = 'audio/mpeg'
    if (filename.endsWith('.wav')) contentType = 'audio/wav'
    if (filename.endsWith('.ogg')) contentType = 'audio/ogg'

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
      const chunksize = end - start + 1
      const file = createReadStream(filePath, { start, end })

      const headers = new Headers({
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize.toString(),
        'Content-Type': contentType,
      })

      return new NextResponse(Readable.toWeb(file) as any, {
        status: 206,
        headers,
      })
    } else {
      const headers = new Headers({
        'Content-Length': fileSize.toString(),
        'Content-Type': contentType,
      })

      const file = createReadStream(filePath)
      return new NextResponse(Readable.toWeb(file) as any, {
        status: 200,
        headers,
      })
    }
  } catch (error) {
    console.error('Error serving song:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
