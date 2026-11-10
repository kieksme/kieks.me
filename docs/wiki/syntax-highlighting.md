# Syntax highlighting

Payload rich-text code uses the built-in `Code` block (`BlocksFeature` with `CodeBlock`). Each block stores `fields.code` and `fields.language`; inline code remains inline. Use TypeScript, JavaScript, JSON, Shell/Bash, Python, YAML, HTML, CSS, SQL, Dockerfile or Markdown in the editor, or plaintext for trace output.

`renderRichText` and `renderMarkdown` render code through the shared `renderCodeBlock` helper. Highlight.js runs on the server. No highlighter JavaScript or remote assets are sent to the reader. Unknown languages fall back to escaped plaintext. Source whitespace is preserved; wide blocks scroll horizontally and can receive keyboard focus.

`EditorialContent` and `SinglePost` load the shared code theme. The preview bridge accepts only the built-in `Code` block and passes code as text; arbitrary block fields remain excluded.

Live example: `/docs/code-highlighting`. Component props remain `collection` and `document`; no additional props are required.

Tests: `test/unit/components/syntax-highlighting.test.ts` covers token output, aliases, fallbacks, whitespace, unsafe markup, rich text and Markdown.
