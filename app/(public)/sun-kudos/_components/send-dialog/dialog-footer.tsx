/**
 * dialog-footer.tsx
 *
 * Footer row: "Hủy ✕" outline button (left) + "Gửi ▷" gold primary button (flex-grow right).
 * Design: mms_H — cancel: border #998C5F, bg rgba(255,234,158,0.10), padding 16px 40px, radius 4px;
 * submit: bg #FFEA9E, radius 8px, height 60px, text 22px bold #00101A.
 */

import { useTranslations } from "next-intl";

interface DialogFooterProps {
  onCancel: () => void;
  onSubmit: () => void;
  submitting: boolean;
  submitDisabled: boolean;
}

export function DialogFooter({
  onCancel,
  onSubmit,
  submitting,
  submitDisabled,
}: DialogFooterProps) {
  const t = useTranslations("Home.kudosPage.sendDialog");
  return (
    <div className="flex flex-row items-start gap-6 w-full">
      {/* Cancel button: mms_H.1_Button */}
      <button
        type="button"
        onClick={onCancel}
        disabled={submitting}
        className="flex items-center gap-2 border border-[#998C5F] bg-[rgba(255,234,158,0.10)] px-10 py-4 h-[60px] shrink-0 hover:bg-[rgba(255,234,158,0.18)] active:bg-[rgba(255,234,158,0.25)] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#998C5F] disabled:opacity-50"
        style={{ borderRadius: 4 }}
      >
        <span className="font-montserrat font-bold text-base text-[#00101A] leading-6 tracking-[0.15px]">
          {t("cancelButton")}
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/viet-kudo/Close.svg"
          alt=""
          aria-hidden="true"
          width={24}
          height={24}
          className="shrink-0"
        />
      </button>

      {/* Submit button: mms_H.2_Button — flex-grow, gold bg */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={submitDisabled || submitting}
        className="flex-1 flex items-center justify-center gap-2 bg-[#FFEA9E] h-[60px] hover:brightness-95 active:brightness-90 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#998C5F] disabled:opacity-50 disabled:pointer-events-none"
        style={{ borderRadius: 8 }}
      >
        <span
          className="font-montserrat font-bold text-[#00101A] leading-7"
          style={{ fontSize: 22 }}
        >
          {t("submitButton")}
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/viet-kudo/Send.svg"
          alt=""
          aria-hidden="true"
          width={24}
          height={24}
          className="shrink-0"
        />
      </button>
    </div>
  );
}
