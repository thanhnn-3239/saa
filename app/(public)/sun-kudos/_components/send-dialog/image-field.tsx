/**
 * image-field.tsx
 *
 * "Image" row — label + image thumbnails (80×80, border-radius 18px, red×badge)
 * + "+ Image / Tối đa 5" button.
 * Design: mms_F — images 80×80 border #998C5F radius 18px, inner image radius 4px,
 * red close badge 20×20 radius 71px at top-right of each thumbnail,
 * add-button white bg border #998C5F radius 8 height 48px.
 */

import { useTranslations } from "next-intl";
import type { ImagePreview } from "./send-kudo-types";

interface ImageFieldProps {
  images: ImagePreview[];
  onAdd?: () => void;
  onRemove?: (index: number) => void;
  error?: string;
}

const MAX_IMAGES = 5;

export function ImageField({ images, onAdd, onRemove, error }: ImageFieldProps) {
  const t = useTranslations("Home.kudosPage.sendDialog");
  const canAdd = images.length < MAX_IMAGES;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full">
      {/* Label: mms_F.1_Title — "Image" 22px bold. Stacks above on mobile. */}
      <div className="flex flex-row items-center shrink-0 sm:w-[74px]">
        <span
          className="font-montserrat font-bold text-[#00101A] leading-7 text-lg sm:text-[22px]"
        >
          {t("imageLabel")}
        </span>
      </div>

      {/* Thumbnails + add button */}
      <div className="flex flex-row flex-wrap items-center gap-4 flex-1">
        {/* Image thumbnails with red-x badge */}
        {images.map((img, idx) => (
          <div
            key={img.previewUrl}
            className="relative shrink-0 bg-white border border-[#998C5F]"
            style={{ width: 80, height: 80, borderRadius: 18 }}
          >
            {/* Sample image inner */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.previewUrl}
              alt={t("ariaImageAttachment", { index: idx + 1 })}
              className="absolute inset-0 w-full h-full object-cover border border-[#FFEA9E]"
              style={{ borderRadius: 4 }}
            />

            {/* Red remove badge — top-right, 20×20 circle */}
            {onRemove && (
              <button
                type="button"
                aria-label={t("ariaRemoveImage", { index: idx + 1 })}
                onClick={() => onRemove(idx)}
                className="absolute flex items-center justify-center bg-[#D4271D] hover:bg-[#b81f17] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4271D]"
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "71.43px",
                  top: -8,
                  right: -8,
                  zIndex: 1,
                  padding: "1.43px",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/viet-kudo/Close_Tiny.svg"
                  alt=""
                  aria-hidden="true"
                  width={17}
                  height={17}
                />
              </button>
            )}
          </div>
        ))}

        {/* "+ Image" add button */}
        {canAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-2 bg-white border border-[#998C5F] rounded-lg px-2 py-1 h-12 hover:bg-[rgba(153,140,95,0.06)] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#998C5F]"
          >
            {/* Plus icon */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/viet-kudo/Plus.svg"
              alt=""
              aria-hidden="true"
              width={24}
              height={24}
              className="shrink-0"
            />
            <div className="flex flex-col items-start">
              <span
                className="font-montserrat font-bold text-[#999999] leading-4"
                style={{ fontSize: 11, letterSpacing: "0.5px" }}
              >
                {t("imageLabel")}
              </span>
              <span
                className="font-montserrat font-bold text-[#999999] leading-4"
                style={{ fontSize: 11, letterSpacing: "0.5px" }}
              >
                {t("imageMax")}
              </span>
            </div>
          </button>
        )}
      </div>

      {/* Inline error */}
      {error && (
        <p className="text-sm font-montserrat text-[#CF1322] mt-1 w-full">
          {error}
        </p>
      )}
    </div>
  );
}
