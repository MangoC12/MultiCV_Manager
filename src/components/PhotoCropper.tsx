"use client";

/* eslint-disable @next/next/no-img-element */

import { useI18n } from "@/lib/i18n";

type PhotoCropperProps = {
  photoDataUrl?: string;
  onChange: (photoDataUrl?: string) => void;
};

export function PhotoCropper({ photoDataUrl, onChange }: PhotoCropperProps) {
  const { t } = useI18n();
  const loadPhoto = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onChange(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="photoTool">
      <div className="photoPreviewColumn">
        <div className="photoCropPreview">
          {photoDataUrl ? <img src={photoDataUrl} alt={t.photo} /> : <span>{t.photo}</span>}
        </div>
        <p>{t.photoHint}</p>
      </div>
      <div className="photoControls">
        <label className="photoUploadButton">
          {t.uploadPhoto}
          <input type="file" accept="image/*" onChange={(event) => loadPhoto(event.target.files?.[0])} />
        </label>
        <div className="photoActions">
          <button className="ghostButton danger" onClick={() => onChange(undefined)}>{t.removePhoto}</button>
        </div>
      </div>
    </div>
  );
}
