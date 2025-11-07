'use client'

import { useThemeStyles } from '@/hooks/useThemeStyles'
import { Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, Link as LinkIcon } from 'lucide-react'
import { useState, useEffect } from 'react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

// Try to import TipTap components - will be null if not installed
let useEditor: any = null
let EditorContent: any = null
let StarterKit: any = null
let Link: any = null
let Placeholder: any = null
let TextStyle: any = null
let Color: any = null
let TextAlign: any = null
let Underline: any = null

try {
  const tiptap = require('@tiptap/react')
  useEditor = tiptap.useEditor
  EditorContent = tiptap.EditorContent
  StarterKit = require('@tiptap/starter-kit').default
  Link = require('@tiptap/extension-link').default
  Placeholder = require('@tiptap/extension-placeholder').default
  TextStyle = require('@tiptap/extension-text-style').default
  Color = require('@tiptap/extension-color').default
  TextAlign = require('@tiptap/extension-text-align').default
  Underline = require('@tiptap/extension-underline').default
} catch (e) {
  // TipTap not installed - will fall back to textarea
  console.warn('TipTap not installed. Rich text editor will use plain textarea.')
}

export function RichTextEditor({ content, onChange, placeholder = 'Type your message here...' }: RichTextEditorProps) {
  const { colors, text, spacing } = useThemeStyles()
  const [localContent, setLocalContent] = useState(content)

  // Sync content prop changes
  useEffect(() => {
    if (content !== localContent) {
      setLocalContent(content)
    }
  }, [content])

  // If TipTap is not installed, use textarea fallback
  if (!useEditor || !EditorContent) {
    return (
      <textarea
        value={localContent}
        onChange={(e) => {
          const newValue = e.target.value
          setLocalContent(newValue)
          onChange(newValue)
        }}
        placeholder={placeholder}
        style={{
          flex: 1,
          width: '100%',
          padding: spacing(2),
          backgroundColor: colors.card,
          border: `1px solid ${colors.border}`,
          borderRadius: spacing(1),
          fontSize: '14px',
          fontFamily: 'inherit',
          lineHeight: '1.6',
          ...text.primary,
          outline: 'none',
          resize: 'none',
          minHeight: '300px'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = colors.primary
          e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`
        }}
        onBlur={(e) => {
          e.target.style.borderColor = colors.border
          e.target.style.boxShadow = 'none'
        }}
      />
    )
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
    ],
    content: localContent || content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      setLocalContent(html)
      onChange(html)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none max-w-none',
        style: `color: ${colors.text.primary};`,
      },
    },
  })

  if (!editor) {
    return null
  }

  const addLink = () => {
    const url = window.prompt('Enter URL:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  return (
    <div style={{
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      backgroundColor: colors.card,
    }}>
      {/* Toolbar */}
      <div style={{
        padding: '8px',
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        alignItems: 'center',
      }}>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          style={{
            padding: '6px 8px',
            backgroundColor: editor.isActive('bold') ? colors.primary : 'transparent',
            color: editor.isActive('bold') ? '#ffffff' : colors.text.secondary,
            border: `1px solid ${colors.border}`,
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
          }}
        >
          <Bold style={{ width: '14px', height: '14px' }} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          style={{
            padding: '6px 8px',
            backgroundColor: editor.isActive('italic') ? colors.primary : 'transparent',
            color: editor.isActive('italic') ? '#ffffff' : colors.text.secondary,
            border: `1px solid ${colors.border}`,
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
          }}
        >
          <Italic style={{ width: '14px', height: '14px' }} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={!editor.can().chain().focus().toggleUnderline().run()}
          style={{
            padding: '6px 8px',
            backgroundColor: editor.isActive('underline') ? colors.primary : 'transparent',
            color: editor.isActive('underline') ? '#ffffff' : colors.text.secondary,
            border: `1px solid ${colors.border}`,
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
          }}
        >
          <UnderlineIcon style={{ width: '14px', height: '14px' }} />
        </button>

        <div style={{ width: '1px', height: '20px', backgroundColor: colors.border, margin: '0 4px' }} />

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          style={{
            padding: '6px 8px',
            backgroundColor: editor.isActive({ textAlign: 'left' }) ? colors.primary : 'transparent',
            color: editor.isActive({ textAlign: 'left' }) ? '#ffffff' : colors.text.secondary,
            border: `1px solid ${colors.border}`,
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
          }}
        >
          <AlignLeft style={{ width: '14px', height: '14px' }} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          style={{
            padding: '6px 8px',
            backgroundColor: editor.isActive({ textAlign: 'center' }) ? colors.primary : 'transparent',
            color: editor.isActive({ textAlign: 'center' }) ? '#ffffff' : colors.text.secondary,
            border: `1px solid ${colors.border}`,
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
          }}
        >
          <AlignCenter style={{ width: '14px', height: '14px' }} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          style={{
            padding: '6px 8px',
            backgroundColor: editor.isActive({ textAlign: 'right' }) ? colors.primary : 'transparent',
            color: editor.isActive({ textAlign: 'right' }) ? '#ffffff' : colors.text.secondary,
            border: `1px solid ${colors.border}`,
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
          }}
        >
          <AlignRight style={{ width: '14px', height: '14px' }} />
        </button>

        <div style={{ width: '1px', height: '20px', backgroundColor: colors.border, margin: '0 4px' }} />

        <button
          type="button"
          onClick={addLink}
          style={{
            padding: '6px 8px',
            backgroundColor: editor.isActive('link') ? colors.primary : 'transparent',
            color: editor.isActive('link') ? '#ffffff' : colors.text.secondary,
            border: `1px solid ${colors.border}`,
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
          }}
        >
          <LinkIcon style={{ width: '14px', height: '14px' }} />
        </button>
      </div>

      {/* Editor */}
      <div style={{
        padding: '12px',
        minHeight: '300px',
        maxHeight: '500px',
        overflowY: 'auto',
      }}>
        <EditorContent editor={editor} />
      </div>

      <style jsx global>{`
        .ProseMirror {
          outline: none;
          min-height: 300px;
        }
        .ProseMirror p {
          margin: 0.5em 0;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: ${colors.text.tertiary};
          pointer-events: none;
          height: 0;
        }
        .ProseMirror a {
          color: ${colors.primary};
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}

