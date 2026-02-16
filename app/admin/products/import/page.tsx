'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';
import { ta } from '@/lib/i18n-admin';

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
}

export default function ImportProductsPage() {
  const { lang } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [errorText, setErrorText] = useState('');

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setErrorKey('import.selectFile');
      setErrorText('');
      return;
    }

    setLoading(true);
    setErrorKey(null);
    setErrorText('');
    setResult(null);

    try {
      const text = await file.text();
      const lines = text.trim().split('\n');
      if (lines.length < 2) {
        setErrorKey('import.needsHeaderAndRow');
        setLoading(false);
        return;
      }

      const headers = parseCSVLine(lines[0]);
      const products = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = parseCSVLine(lines[i]);
        const product: any = {};
        headers.forEach((h, idx) => {
          product[h] = values[idx] || null;
        });
        products.push(product);
      }

      const res = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.error) {
          setErrorText(data.error);
          setErrorKey(null);
        } else {
          setErrorText('Import failed');
          setErrorKey(null);
        }
        setLoading(false);
        return;
      }

      const data = await res.json();
      setResult(data);
      setFile(null);
    } catch (err) {
      setErrorKey('import.parseFailed');
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-brand-navy">{ta('import.title', lang)}</h1>
        <Link href="/admin/products" className="text-sm text-gray-500 hover:text-brand-navy">
          {ta('import.backToProducts', lang)}
        </Link>
      </div>

      <form onSubmit={handleImport} className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">{ta('import.csvFile', lang)}</label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:text-sm file:bg-brand-pale file:text-brand-navy"
          />
          <p className="text-xs text-gray-400 mt-2">
            {ta('import.requiredColumns', lang)}
          </p>
        </div>

        {(errorKey || errorText) && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded mb-4">
            {errorKey ? ta(errorKey, lang) : errorText}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !file}
          className="bg-brand-magenta text-white text-sm px-6 py-2 rounded hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? ta('import.importing', lang) : ta('import.importProducts', lang)}
        </button>
      </form>

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-lg font-bold text-green-800 mb-2">{ta('import.importComplete', lang)}</h2>
          <p className="text-green-700 mb-1">
            {`${ta('import.created', lang)}:`} <span className="font-semibold">{result.created}</span>
          </p>
          <p className="text-green-700">
            {`${ta('import.updated', lang)}:`} <span className="font-semibold">{result.updated}</span>
          </p>
          {result.errors && result.errors.length > 0 && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-4">
              <h3 className="text-sm font-semibold text-yellow-800 mb-2">
                {`${result.errors.length} ${ta('import.rowsHadIssues', lang)}`}
              </h3>
              <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
                {result.errors.map((err: string, i: number) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 mt-6">
        <h3 className="font-bold text-gray-800 mb-3">{ta('import.csvFormatExample', lang)}</h3>
        <pre className="text-xs bg-white border border-gray-200 p-4 rounded overflow-x-auto">
{`name_en,name_ko,sku,category_id,type_id,brand_id,description_en,description_ko
Revos,Revos자동조직처리기,A84100001A,7,1,1,"Advanced tissue processor","고급 조직처리기"
ClearVue,ClearVue커버슬리퍼,4568,11,1,1,"Automatic coverslipper","자동 커버슬리퍼"`}
        </pre>
      </div>
    </div>
  );
}
