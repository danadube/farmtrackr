# TipTap Installation Guide

## Required Packages

Install the following packages for the rich text editor:

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-placeholder @tiptap/extension-text-style @tiptap/extension-color @tiptap/extension-text-align @tiptap/extension-underline
```

Or with yarn:

```bash
yarn add @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-placeholder @tiptap/extension-text-style @tiptap/extension-color @tiptap/extension-text-align @tiptap/extension-underline
```

## Components Created

1. **RichTextEditor** (`src/components/RichTextEditor.tsx`)
   - Rich text editor with formatting toolbar
   - Supports bold, italic, underline, alignment, links
   - Styled to match FarmTrackr theme

2. **TransactionSelector** (`src/components/TransactionSelector.tsx`)
   - Dropdown selector for transactions
   - Search functionality
   - Fetches from `/api/emails/transactions`

## Next Steps

After installing packages, the EmailComposer component will be updated to use RichTextEditor instead of a plain textarea.

