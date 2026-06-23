const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const GHL_API_VERSION = '2021-07-28';

const getGhlHeaders = () => ({
  Authorization: `Bearer ${import.meta.env.VITE_GHL_API_KEY}`,
  Version: GHL_API_VERSION,
});

export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('locationId', import.meta.env.VITE_GHL_LOCATION_ID);

  const response = await fetch(`${GHL_API_BASE}/medias/upload-file`, {
    method: 'POST',
    headers: getGhlHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GHL upload failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  return data.url as string;
};

export const uploadImages = async (files: File[]): Promise<string[]> => {
  return Promise.all(files.map((file) => uploadImage(file)));
};

// GHL media deletion requires the internal fileId, not the URL.
// Images are removed from Firestore normally; the GHL media entry persists.
export const deleteImage = async (_url: string): Promise<void> => {
  // no-op
};

export const isValidImage = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = 5 * 1024 * 1024;
  return validTypes.includes(file.type) && file.size <= maxSize;
};

export const getImageValidationError = (file: File): string => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    return 'Only JPEG, PNG, WebP, and GIF images are supported';
  }
  if (file.size > 5 * 1024 * 1024) {
    return 'Image must be less than 5MB';
  }
  return '';
};
