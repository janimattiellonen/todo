import * as stylex from "@stylexjs/stylex";
import { type ReactNode, useEffect } from "react";
import { colors } from "~/ui/tokens/colors.stylex";
import { radius } from "~/ui/tokens/radius.stylex";
import { spacing } from "~/ui/tokens/spacing.stylex";
import {
  fontFamily,
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
} from "~/ui/tokens/typography.stylex";

type Props = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

/**
 * Minimal modal primitive: fixed backdrop + centred dialog. The dialog
 * is `role="dialog" aria-modal="true"` with the title wired via
 * `aria-labelledby`. Closes on ESC, backdrop click, or the explicit
 * close button.
 *
 * No focus trap yet. The single input that follows the dialog header
 * is auto-focusable enough for the limited surface we currently have;
 * a real trap can land alongside the keyboard a11y pass (#41).
 */
export function Modal(props: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        props.onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [props.onClose]);

  const labelId = "modal-title";

  return (
    <div {...stylex.props(styles.backdrop)} data-testid="modal-backdrop">
      <button
        type="button"
        aria-label="Close"
        onClick={props.onClose}
        {...stylex.props(styles.backdropClickTarget)}
        tabIndex={-1}
      />
      <div
        {...stylex.props(styles.dialog, styles.dialogAboveBackdrop)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
      >
        <header {...stylex.props(styles.header)}>
          <h2 id={labelId} {...stylex.props(styles.title)}>
            {props.title}
          </h2>
          <button
            type="button"
            onClick={props.onClose}
            aria-label="Close"
            {...stylex.props(styles.closeButton)}
            data-testid="modal-close"
          >
            ×
          </button>
        </header>
        <div {...stylex.props(styles.body)}>{props.children}</div>
      </div>
    </div>
  );
}

const styles = stylex.create({
  backdrop: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.x4,
    zIndex: 100,
  },
  backdropClickTarget: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
    borderWidth: 0,
    padding: 0,
    margin: 0,
    cursor: "default",
  },
  dialog: {
    width: "100%",
    maxWidth: "480px",
    backgroundColor: colors.surface1,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.borderSubtle,
    borderRadius: radius.lg,
    fontFamily: fontFamily.text,
    color: colors.textDefault,
    boxSizing: "border-box",
    maxHeight: "calc(100vh - 64px)",
    display: "flex",
    flexDirection: "column",
  },
  dialogAboveBackdrop: {
    position: "relative",
    zIndex: 1,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.x3,
    padding: `${spacing.x4} ${spacing.x4} ${spacing.x3}`,
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: colors.borderSubtle,
  },
  title: {
    margin: 0,
    fontSize: fontSize.titleMd,
    fontWeight: fontWeight.semiBold,
    lineHeight: lineHeight.heading,
    letterSpacing: letterSpacing.tight,
  },
  closeButton: {
    width: "28px",
    height: "28px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: fontFamily.text,
    fontSize: fontSize.titleMd,
    lineHeight: 1,
    color: colors.textMuted,
    backgroundColor: { default: "transparent", ":hover": colors.surface2 },
    borderWidth: 0,
    borderRadius: radius.md,
    cursor: "pointer",
  },
  body: {
    padding: spacing.x4,
    overflowY: "auto",
  },
});
