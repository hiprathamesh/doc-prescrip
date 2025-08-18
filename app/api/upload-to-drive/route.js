import { google } from "googleapis";
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { Readable } from "stream";

// --- Utility: Get or create a Drive folder ---
async function getOrCreateFolder(drive, name, parentId = null) {
  const query = `name='${name}' and mimeType='application/vnd.google-apps.folder' ${
    parentId ? `and '${parentId}' in parents` : ""
  } and trashed=false`;

  const res = await drive.files.list({ q: query, fields: "files(id, name)" });
  if (res.data.files.length > 0) return res.data.files[0].id;

  const folder = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId ? [parentId] : [],
    },
    fields: "id",
  });

  return folder.data.id;
}

export async function POST(request) {
  try {
    const token = await getToken({ req: request });

    if (!token?.serverAccessToken) {
      return NextResponse.json(
        { error: "Unauthorized - No Google access token found. Please sign out and sign in again." },
        { status: 401 }
      );
    }

    // Setup OAuth2 client with stored token
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    
    oauth2Client.setCredentials({
      access_token: token.serverAccessToken,
      refresh_token: token.serverRefreshToken,
    });

    // Handle automatic token refresh
    oauth2Client.on('tokens', (tokens) => {
      console.log('Tokens refreshed automatically');
      if (tokens.refresh_token) {
        // Store the new refresh token if provided
        oauth2Client.setCredentials({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
        });
      }
    });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // --- Get form data ---
    const formData = await request.formData();
    const file = formData.get("file"); // PDF blob
    const filename = formData.get("filename") || "document.pdf";
    const patientName = formData.get("patientName") || "UnknownPatient";
    const visitDate = formData.get("visitDate") || new Date().toISOString().split("T")[0];

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to buffer/stream
    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = Readable.from(buffer);

    // --- Create folder hierarchy ---
    const rootId = await getOrCreateFolder(drive, "doc-prescrip");
    const patientId = await getOrCreateFolder(drive, patientName, rootId);
    const visitId = await getOrCreateFolder(drive, visitDate, patientId);

    // --- Upload file ---
    const uploadResponse = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [visitId],
      },
      media: {
        mimeType: file.type || "application/pdf",
        body: stream,
      },
      fields: "id, webViewLink",
    });

    const fileId = uploadResponse.data.id;

    // Make file shareable
    await drive.permissions.create({
      fileId: fileId,
      requestBody: { role: "reader", type: "anyone" },
    });

    return NextResponse.json({
      success: true,
      fileId,
      link: uploadResponse.data.webViewLink,
    });
  } catch (error) {
    console.error("Google Drive upload error:", error);
    
    // If it's an authentication error, suggest re-login
    if (error.code === 401 || error.message?.includes('invalid_grant') || error.message?.includes('unauthorized')) {
      return NextResponse.json(
        { error: "Google authentication expired. Please sign out and sign in again to refresh your access." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: "Upload failed: " + error.message },
      { status: 500 }
    );
  }
}
