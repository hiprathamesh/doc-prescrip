import { google } from 'googleapis'
import { getToken } from 'next-auth/jwt'

export default async function handler(req, res) {
  const token = await getToken({ req })
  if (!token?.accessToken) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({ access_token: token.accessToken })

  const drive = google.drive({ version: 'v3', auth: oauth2Client })

  // Simulating a file (in real use, replace with actual file input)
  const fileMetadata = {
    name: 'example.pdf',
  }

  const media = {
    mimeType: 'application/pdf',
    body: Buffer.from('Fake PDF content for demo'), // Replace with actual file stream
  }

  try {
    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id',
    })

    // Make the file public
    await drive.permissions.create({
      fileId: file.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    })

    const fileLink = `https://drive.google.com/uc?export=download&id=${file.data.id}`
    res.status(200).json({ link: fileLink })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Upload failed' })
  }
}
