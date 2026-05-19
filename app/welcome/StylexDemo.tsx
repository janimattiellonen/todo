import * as stylex from "@stylexjs/stylex";

export function StylexDemo() {
  return (
    <div {...stylex.props(styles.card)} data-testid="stylex-demo">
      <h2 {...stylex.props(styles.heading)}>StyleX is wired up.</h2>
      <p {...stylex.props(styles.body)}>
        This card is styled by{" "}
        <code {...stylex.props(styles.code)}>@stylexjs/stylex</code> via{" "}
        <code {...stylex.props(styles.code)}>vite-plugin-stylex</code>.
      </p>
    </div>
  );
}

const styles = stylex.create({
  card: {
    maxWidth: "500px",
    width: "100%",
    padding: "1.25rem 1.5rem",
    borderRadius: "0.75rem",
    border: "1px solid #d4d4d8",
    backgroundColor: "#fafafa",
    color: "#18181b",
    boxSizing: "border-box",
  },
  heading: {
    margin: 0,
    fontSize: "1rem",
    fontWeight: 600,
    lineHeight: 1.4,
  },
  body: {
    margin: "0.5rem 0 0",
    fontSize: "0.875rem",
    lineHeight: 1.5,
    color: "#3f3f46",
  },
  code: {
    padding: "0.05rem 0.3rem",
    borderRadius: "0.25rem",
    backgroundColor: "#e4e4e7",
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    fontSize: "0.8125rem",
  },
});
