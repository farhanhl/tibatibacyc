/**
 * Upload gambar langsung ke Cloudinary menggunakan Unsigned Upload Preset
 */
export async function uploadImageToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "qxwi3ibh";
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "tibatiba_preset";

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary Cloud Name atau Upload Preset belum disetting di .env");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gagal mengupload gambar (Status: ${response.status})`);
  }

  const data = await response.json();
  return data.secure_url || data.url;
}
