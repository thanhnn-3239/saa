"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { TheLePanel } from "./the-le-panel";

export function FloatingWidgetButton() {
  const t = useTranslations("Home.fab");
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
    // TODO(kudos): wire write-kudos flow once that screen exists. No-op for now.
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
        className="fixed z-50"
        style={{ bottom: "40px", right: "19px" }}
      >
        {/* Action buttons — shown when expanded */}
        {expanded && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              alignItems: "flex-end",
              marginBottom: "20px",
            }}
          >
            {/* "Thể lệ" action button */}
            <button
              onClick={handleThele}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "16px",
                borderRadius: "4px",
                backgroundColor: "rgba(255, 234, 158, 1)",
                color: "rgba(0, 16, 26, 1)",
                fontFamily: "Montserrat, sans-serif",
                fontWeight: 700,
                fontSize: "24px",
                lineHeight: "32px",
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "opacity 200ms ease",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.opacity = "0.85")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.opacity = "1")
              }
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
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "16px",
                borderRadius: "4px",
                backgroundColor: "rgba(255, 234, 158, 1)",
                color: "rgba(0, 16, 26, 1)",
                fontFamily: "Montserrat, sans-serif",
                fontWeight: 700,
                fontSize: "24px",
                lineHeight: "32px",
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "opacity 200ms ease",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.opacity = "0.85")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.opacity = "1")
              }
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
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              borderRadius: "100px",
              backgroundColor: "rgba(212, 39, 29, 1)",
              border: "none",
              cursor: "pointer",
              padding: "16px",
              marginLeft: "auto",
              transition: "opacity 200ms ease",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.opacity = "0.85")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.opacity = "1")
            }
          >
            <Image
              src="/homepage-saa/kudos/Close.svg"
              alt=""
              width={24}
              height={24}
              style={{ filter: "brightness(0) invert(1)" }}
            />
          </button>
        ) : (
          /* Yellow pill — collapsed state */
          <button
            ref={triggerRef}
            onClick={handleToggle}
            aria-label={t("openAriaLabel")}
            aria-expanded={false}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "16px",
              borderRadius: "100px",
              backgroundColor: "rgba(255, 234, 158, 1)",
              boxShadow: "0 4px 4px 0 rgba(0, 0, 0, 0.25), 0 0 6px 0 #FAE287",
              border: "none",
              cursor: "pointer",
              width: "106px",
              height: "64px",
              transition: "opacity 200ms ease",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.opacity = "0.9")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.opacity = "1")
            }
          >
            {/* Pen icon + slash + SAA bolt logo */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Image
                src="/homepage-saa/kudos/Pen.svg"
                alt=""
                width={24}
                height={24}
                style={{ objectFit: "contain" }}
              />
              <span
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontWeight: 700,
                  fontSize: "24px",
                  lineHeight: "32px",
                  color: "rgba(0, 16, 26, 1)",
                }}
              >
                /
              </span>
            </div>
            <Image
              src="/homepage-saa/kudos/LOGO.svg"
              alt="SAA"
              width={20}
              height={18}
              style={{ objectFit: "contain" }}
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
