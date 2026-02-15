'use client';

import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const MODULES = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
};

const FORMATS = [
  'header', 'bold', 'italic', 'underline',
  'list', 'link',
];

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** Quill emits '<p><br></p>' (and variants) for an empty editor — normalise to '' */
function sanitize(html: string): string {
  const stripped = html.replace(/<(.|\n)*?>/g, '').trim();
  return stripped.length === 0 ? '' : html;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  return (
    <ReactQuill
      theme="snow"
      value={value}
      onChange={(v) => onChange(sanitize(v))}
      modules={MODULES}
      formats={FORMATS}
      placeholder={placeholder}
    />
  );
}
