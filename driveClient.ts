// Minimal Google Identity Services types (loaded from CDN at runtime)
declare const google: {
  accounts: {
    oauth2: {
      initTokenClient(config: {
        client_id: string;
        scope: string;
        callback: (r: { access_token: string; error?: string }) => void;
      }): { requestAccessToken(opts?: { prompt: string }): void };
    };
  };
};

const SCOPES    = 'https://www.googleapis.com/auth/drive.file';
const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';

export interface DriveFile {
  id: string;
  name: string;
  modifiedTime: string;
}

type TokenClient = ReturnType<typeof google.accounts.oauth2.initTokenClient>;
let tokenClient: TokenClient | null = null;

export const initTokenClient = (clientId: string): void => {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPES,
    callback: () => {}, // replaced per-call in requestToken
  });
};

export const requestToken = (silent = false): Promise<string> =>
  new Promise((resolve, reject) => {
    if (!tokenClient) return reject(new Error('Drive not initialised. Call initTokenClient first.'));
    if (typeof google === 'undefined') return reject(new Error('Google Identity Services not loaded yet.'));
    (tokenClient as any).callback = (r: any) => {
      if (r.error) return reject(new Error(r.error));
      resolve(r.access_token);
    };
    tokenClient.requestAccessToken({ prompt: silent ? '' : 'select_account' });
  });

const authedFetch = (token: string, url: string, init: RequestInit = {}): Promise<Response> =>
  fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init.headers as Record<string, string> ?? {}) },
  });

const checkResponse = async (res: Response, context: string): Promise<Response> => {
  if (res.status === 401) throw new Error('TOKEN_EXPIRED');
  if (!res.ok) throw new Error(`${context}: HTTP ${res.status}`);
  return res;
};

export const listXmlFiles = async (token: string): Promise<DriveFile[]> => {
  const params = new URLSearchParams({
    q: "mimeType='text/xml' and trashed=false",
    orderBy: 'modifiedTime desc',
    fields: 'files(id,name,modifiedTime)',
    spaces: 'drive',
  });
  const res = await authedFetch(token, `${DRIVE_API}/files?${params}`);
  await checkResponse(res, 'List files');
  const data = await res.json();
  return data.files ?? [];
};

export const ensureFolder = async (token: string, folderName: string): Promise<string> => {
  const params = new URLSearchParams({
    q: `mimeType='application/vnd.google-apps.folder' and name='${folderName.replace(/'/g, "\\'")}' and trashed=false`,
    fields: 'files(id)',
    spaces: 'drive',
  });
  const searchRes = await authedFetch(token, `${DRIVE_API}/files?${params}`);
  await checkResponse(searchRes, 'Search folder');
  const data = await searchRes.json();
  if (data.files?.length > 0) return data.files[0].id;

  const createRes = await authedFetch(token, `${DRIVE_API}/files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: folderName, mimeType: 'application/vnd.google-apps.folder' }),
  });
  await checkResponse(createRes, 'Create folder');
  const folder = await createRes.json();
  return folder.id;
};

export const saveFile = async (
  token: string,
  name: string,
  xml: string,
  fileId?: string,
  folderId?: string,
): Promise<{ id: string; name: string }> => {
  const metaObj: Record<string, unknown> = { name, mimeType: 'text/xml' };
  if (!fileId && folderId) metaObj.parents = [folderId];
  const meta = JSON.stringify(metaObj);
  const body = new FormData();
  body.append('metadata', new Blob([meta], { type: 'application/json' }));
  body.append('file',     new Blob([xml],  { type: 'text/xml' }));

  const url = fileId
    ? `${UPLOAD_API}/files/${fileId}?uploadType=multipart`
    : `${UPLOAD_API}/files?uploadType=multipart`;

  const res = await authedFetch(token, url, { method: fileId ? 'PATCH' : 'POST', body });
  await checkResponse(res, 'Save file');
  return res.json();
};

export const downloadFile = async (token: string, fileId: string): Promise<string> => {
  const res = await authedFetch(token, `${DRIVE_API}/files/${fileId}?alt=media`);
  await checkResponse(res, 'Download file');
  return res.text();
};
