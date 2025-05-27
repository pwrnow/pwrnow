'use client';

import { useEditor, EditorContent } from '@tiptap/react';

const RichTextEditor = () => {
  const editor = useEditor({
    content: '',
  });

  return <EditorContent editor={editor} />;
};

export default RichTextEditor;
