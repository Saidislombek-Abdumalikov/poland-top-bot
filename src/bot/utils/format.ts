export function escapeHtml(str?: string | number | null): string {
  if (str === undefined || str === null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function cleanText(str?: string | number | null): string {
  if (str === undefined || str === null) return "";
  let text = String(str);

  // Convert triple asterisks ***bold-italic*** to <b><i>...</i></b>
  text = text.replace(/\*\*\*(.*?)\*\*\*/g, "<b><i>$1</i></b>");
  // Convert double asterisks **bold** to <b>...</b>
  text = text.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
  // Convert single asterisk *bold* to <b>...</b>
  text = text.replace(/\*([^*\n]+)\*/g, "<b>$1</b>");
  // Convert underscores _italic_ to <i>...</i>
  text = text.replace(/_([^_\n]+)_/g, "<i>$1</i>");
  // Convert backticks `code` to <code>...</code>
  text = text.replace(/`([^`\n]+)`/g, "<code>$1</code>");

  return text;
}
