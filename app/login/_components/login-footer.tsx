/**
 * mms_D_Footer — bottom copyright bar.
 * Design: width 1440px, padding 40px 90px, border-top 1px solid #2E3940.
 * Copyright text is provided translated (`text` prop) by the server page.
 */
export function LoginFooter({ text }: { text: string }) {
  return (
    <footer
      className="relative z-10 flex w-full items-center justify-center px-6 py-10 sm:px-16 lg:px-[90px]"
      style={{ borderTop: "1px solid #2E3940" }}
    >
      <p
        style={{
          fontFamily: "'Montserrat Alternates', Montserrat, sans-serif",
          fontWeight: 700,
          fontSize: "16px",
          lineHeight: "24px",
          color: "rgba(255, 255, 255, 1)",
          margin: 0,
          textAlign: "center",
        }}
      >
        {text}
      </p>
    </footer>
  );
}
