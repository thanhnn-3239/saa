"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { TheLePanel } from "./the-le-panel";
import { useSendKudo } from "./send-kudo-provider";

export function FloatingWidgetButton() {
  const t = useTranslations("Home.fab");
  const { openSendKudo } = useSendKudo();
  const [expanded, setExpanded] = useState(false);
  const [theleOpen, setTheleOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Collapse on outside click (when expanded but panel not open)
  useEffect(() => {
    if (!expanded || theleOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.closest("[data-fab-root]")?.contains(e.target as Node)
      ) {
        setExpanded(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [expanded, theleOpen]);

  // Esc collapses the speed-dial (panel handles its own Esc internally)
  useEffect(() => {
    if (!expanded || theleOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setExpanded(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [expanded, theleOpen]);

  const handleToggle = () => setExpanded((v) => !v);

  const handleThele = () => {
    setExpanded(false);
    setTheleOpen(true);
  };

  const handleWriteKudos = () => {
    // Collapse the speed-dial / close the Thể lệ panel, then open the modal.
    setExpanded(false);
    setTheleOpen(false);
    openSendKudo();
  };

  const handleTheleClose = () => {
    setTheleOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <>
      {/* Speed-dial root — fixed bottom-right */}
      <div
        data-fab-root
        className="fixed z-50 bottom-10 right-[19px]"
      >
        {/* Action buttons — shown when expanded */}
        {expanded && (
          <div className="flex flex-col gap-5 items-end mb-5">
            {/* "Thể lệ" action button */}
            <button
              onClick={handleThele}
              className="flex items-center gap-2 p-4 rounded bg-saa-gold-accent text-saa-navy-darkest font-montserrat font-bold text-2xl leading-8 border-none cursor-pointer whitespace-nowrap transition-opacity duration-200 ease-[ease] hover:opacity-85"
            >
              <Image
                src="/homepage-saa/kudos/LOGO.svg"
                alt=""
                width={24}
                height={24}
              />
              {t("theleLabel")}
            </button>

            {/* "Viết KUDOS" action button */}
            <button
              onClick={handleWriteKudos}
              className="flex items-center gap-2 p-4 rounded bg-saa-gold-accent text-saa-navy-darkest font-montserrat font-bold text-2xl leading-8 border-none cursor-pointer whitespace-nowrap transition-opacity duration-200 ease-[ease] hover:opacity-85"
            >
              <Image
                src="/homepage-saa/kudos/Pen.svg"
                alt=""
                width={24}
                height={24}
              />
              {t("writeKudosLabel")}
            </button>
          </div>
        )}

        {/* Trigger: collapsed = yellow pill, expanded = red × circle */}
        {expanded ? (
          /* Red × close button */
          <button
            ref={triggerRef}
            onClick={handleToggle}
            aria-label={t("closeAriaLabel")}
            aria-expanded={true}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-[rgba(212,39,29,1)] border-none cursor-pointer p-4 ml-auto transition-opacity duration-200 ease-[ease] hover:opacity-85"
          >
            <Image
              src="/homepage-saa/kudos/Close.svg"
              alt=""
              width={24}
              height={24}
              className="[filter:brightness(0)_invert(1)]"
            />
          </button>
        ) : (
          /* Yellow pill — collapsed state */
          <button
            ref={triggerRef}
            onClick={handleToggle}
            aria-label={t("openAriaLabel")}
            aria-expanded={false}
            className="flex items-center gap-2 p-4 rounded-full bg-saa-gold-accent shadow-saa-glow border-none cursor-pointer w-[106px] h-16 transition-opacity duration-200 ease-[ease] hover:opacity-90"
          >
            {/* Pen icon + slash + SAA bolt logo */}
            <div className="flex items-center gap-2">
              <Image
                src="/homepage-saa/kudos/Pen.svg"
                alt=""
                width={24}
                height={24}
                className="object-contain"
              />
              <span className="font-montserrat font-bold text-2xl leading-8 text-saa-navy-darkest">
                /
              </span>
            </div>
            <Image
              src="/homepage-saa/kudos/LOGO.svg"
              alt="SAA"
              width={20}
              height={18}
              className="object-contain"
            />
          </button>
        )}
      </div>

      {/* Thể lệ panel */}
      <TheLePanel
        open={theleOpen}
        onClose={handleTheleClose}
        onWriteKudos={handleWriteKudos}
      />
    </>
  );
}
