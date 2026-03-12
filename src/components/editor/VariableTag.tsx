import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';

const VariableComponent = ({ node }: { node: { attrs: { name: string } } }) => (
  <NodeViewWrapper as="span" className="inline">
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono"
      style={{
        backgroundColor: 'hsl(var(--accent) / 0.15)',
        color: 'var(--accent-hex)',
        border: '1px solid hsl(var(--accent) / 0.3)',
      }}
    >
      {'{{ '}
      {node.attrs.name}
      {' }}'}
    </span>
  </NodeViewWrapper>
);

export const VariableTagExtension = Node.create({
  name: 'variableTag',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      name: { default: 'variable' },
    };
  },

  parseHTML() {
    return [{ tag: 'variable-tag' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['variable-tag', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VariableComponent);
  },
});
