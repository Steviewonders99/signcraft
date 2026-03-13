'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DocumentEditor, type DocumentEditorHandle } from '@/components/editor/DocumentEditor';
import { AISidebar } from '@/components/editor/AISidebar';
import { AIFab } from '@/components/mobile/AIFab';
import { AIOverlay } from '@/components/mobile/AIOverlay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Save, Plus, ArrowLeft, FileText, PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { useSidebar } from '@/components/layout/AuthShell';
import type { JSONContent } from '@tiptap/core';

interface TemplateMeta {
  slug: string;
  name: string;
  category: string;
  description: string;
  variables: string[];
}

const CATEGORIES = ['All', 'SaaS / Tech', 'General Business', 'Employment', 'Startup / Fundraising'];

export default function NewDocumentPage() {
  const [step, setStep] = useState<'pick' | 'variables' | 'edit'>('pick');
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateMeta | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [category, setCategory] = useState('All');
  const [title, setTitle] = useState('Untitled Contract');
  const [content, setContent] = useState<JSONContent>({});
  const [saving, setSaving] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [initialHtml, setInitialHtml] = useState<string | null>(null);
  const [userTemplates, setUserTemplates] = useState<Array<{ id: string; name: string; category?: string }>>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const editorRef = useRef<DocumentEditorHandle>(null);
  const { collapsed, toggle: toggleNav } = useSidebar();

  useEffect(() => {
    fetch('/api/templates/builtin')
      .then((r) => r.json())
      .then((data: TemplateMeta[]) => {
        setTemplates(data);
        // Auto-select template from query param
        const templateSlug = searchParams.get('template');
        if (templateSlug) {
          const match = data.find((t) => t.slug === templateSlug);
          if (match) {
            handleSelectTemplate(match);
          }
        }
      })
      .catch(() => setTemplates([]));
    // Also fetch user-created templates
    fetch('/api/templates')
      .then((r) => r.json())
      .then((data) => setUserTemplates(Array.isArray(data) ? data : []))
      .catch(() => setUserTemplates([]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function extractText(json: JSONContent): string {
    if (!json) return '';
    if (json.text) return json.text;
    if (json.content) return json.content.map(extractText).join('\n');
    return '';
  }

  function handleSelectTemplate(template: TemplateMeta) {
    setSelectedTemplate(template);
    setTitle(template.name);
    // Initialize variable values with empty strings
    const vars: Record<string, string> = {};
    template.variables.forEach((v) => {
      // Pre-fill date variables with today
      if (v.toLowerCase().includes('date')) {
        vars[v] = new Date().toISOString().split('T')[0];
      } else {
        vars[v] = '';
      }
    });
    setVariableValues(vars);
    setStep('variables');
  }

  function handleSelectBlank() {
    setSelectedTemplate(null);
    setTitle('Untitled Contract');
    setContent({});
    setStep('edit');
  }

  async function handleApplyTemplate() {
    if (!selectedTemplate) return;
    setLoadingTemplate(true);

    const res = await fetch(`/api/templates/builtin/${selectedTemplate.slug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variables: variableValues }),
    });
    const data = await res.json();

    setInitialHtml(data.html);
    setContent({ type: 'doc', content: [] });
    setLoadingTemplate(false);
    setStep('edit');
  }

  const handleInsertContent = useCallback((text: string) => {
    setContent((prev) => ({
      type: 'doc',
      content: [
        ...(prev.content || []),
        { type: 'paragraph', content: [{ type: 'text', text }] },
      ],
    }));
  }, []);

  async function handleSave() {
    setSaving(true);
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    });
    const doc = await res.json();
    setSaving(false);
    router.push(`/documents/${doc.id}`);
  }

  const filtered = category === 'All'
    ? templates
    : templates.filter((t) => t.category === category);

  // Step 1: Template Picker
  if (step === 'pick') {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <h1 className="text-xl font-semibold mb-1">New Document</h1>
        <p className="text-sm text-muted-foreground mb-6">Choose a template or start from scratch.</p>

        {/* Category filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                category === c
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              style={category === c ? { backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--accent-hex)' } : { border: '1px solid transparent' }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Template grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Blank document card */}
          <button
            onClick={handleSelectBlank}
            className="text-left p-4 rounded-lg border border-dashed border-border hover:border-white/20 transition-colors"
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Plus className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-sm">Blank Document</span>
            </div>
            <p className="text-xs text-muted-foreground">Start from scratch</p>
          </button>

          {/* Template cards */}
          {filtered.map((t) => (
            <button
              key={t.slug}
              onClick={() => handleSelectTemplate(t)}
              className="text-left p-4 rounded-lg border border-border hover:border-white/20 transition-colors"
              style={{ backgroundColor: 'var(--bg-card)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-sm">{t.name}</span>
              </div>
              <Badge variant="outline" className="text-[10px] mb-2">{t.category}</Badge>
              <p className="text-xs text-muted-foreground">{t.description}</p>
            </button>
          ))}
        </div>

        {/* My Templates */}
        {userTemplates.length > 0 && (
          <>
            <h2 className="text-sm font-semibold mt-8 mb-3">My Templates</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {userTemplates.map((t) => (
                <a
                  key={t.id}
                  href={`/templates/${t.id}/edit`}
                  className="text-left p-4 rounded-lg border border-border hover:border-white/20 transition-colors block"
                  style={{ backgroundColor: 'var(--bg-card)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{t.name}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px]">Custom</Badge>
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Step 2: Variable Fill Form
  if (step === 'variables' && selectedTemplate) {
    const vars = selectedTemplate.variables;
    // Split variables into two columns for desktop
    const mid = Math.ceil(vars.length / 2);
    const leftVars = vars.slice(0, mid);
    const rightVars = vars.slice(mid);

    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        <button
          onClick={() => setStep('pick')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to templates
        </button>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
          <div>
            <h1 className="text-xl font-semibold mb-1">{selectedTemplate.name}</h1>
            <p className="text-sm text-muted-foreground">
              Fill in the details below. Empty fields become editable placeholders.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Button variant="outline" onClick={() => setStep('pick')}>
              Back
            </Button>
            <Button onClick={handleApplyTemplate} disabled={loadingTemplate}>
              {loadingTemplate ? 'Applying...' : 'Create Document'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <div className="space-y-4 min-w-0">
            {leftVars.map((v) => (
              <div key={v} className="min-w-0">
                <label className="text-sm font-medium mb-1 block truncate" title={v}>{v}</label>
                <textarea
                  value={variableValues[v] || ''}
                  onChange={(e) => {
                    setVariableValues((prev) => ({ ...prev, [v]: e.target.value }));
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
                  }}
                  placeholder={`Enter ${v.toLowerCase()}...`}
                  rows={1}
                  className="w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm leading-snug transition-colors outline-none resize-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  style={{ maxHeight: '150px' }}
                />
              </div>
            ))}
          </div>
          <div className="space-y-4 min-w-0">
            {rightVars.map((v) => (
              <div key={v} className="min-w-0">
                <label className="text-sm font-medium mb-1 block truncate" title={v}>{v}</label>
                <textarea
                  value={variableValues[v] || ''}
                  onChange={(e) => {
                    setVariableValues((prev) => ({ ...prev, [v]: e.target.value }));
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
                  }}
                  placeholder={`Enter ${v.toLowerCase()}...`}
                  rows={1}
                  className="w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm leading-snug transition-colors outline-none resize-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  style={{ maxHeight: '150px' }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Editor (same as before, with AI sidebar)
  // Uses negative margin to break out of the layout padding and fill the viewport
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Fixed top bar */}
      <div className="flex items-center gap-3 px-4 md:px-8 py-3 border-b border-border shrink-0" style={{ backgroundColor: 'var(--bg-root)' }}>
        <Button
          variant="outline"
          size="icon"
          className="hidden md:inline-flex"
          onClick={toggleNav}
          title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </Button>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg font-semibold bg-transparent border-none focus-visible:ring-0 px-0 flex-1"
          placeholder="Document title..."
        />
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {/* Editor + sidebar, each scroll independently */}
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0 overflow-y-auto">
          <DocumentEditor ref={editorRef} content={content} onChange={setContent} initialHtml={initialHtml} />
        </div>
        <div className="hidden lg:flex w-80 shrink-0 border-l border-border overflow-hidden">
          <AISidebar
            onInsert={handleInsertContent}
            documentContext={extractText(content)}
            getEditor={() => editorRef.current?.getEditor() ?? null}
          />
        </div>
      </div>

      <div className="lg:hidden">
        <AIFab onClick={() => setShowAI(true)} />
        <AIOverlay
          open={showAI}
          onClose={() => setShowAI(false)}
          onInsert={handleInsertContent}
          documentContext={extractText(content)}
        />
      </div>
    </div>
  );
}
