'use client';

import { SigningPage } from '@/components/signing/SigningPage';
import type { JSONContent } from '@tiptap/core';

interface ChromelessSignProps {
  token: string;
  documentTitle: string;
  content: JSONContent;
  signerName: string;
  createdAt: string;
  status: string;
  signedAt?: string;
  accentHex?: string;
  bgColor?: string;
}

export function ChromelessSign({
  token,
  documentTitle,
  content,
  signerName,
  createdAt,
  status,
  signedAt,
  accentHex,
  bgColor,
}: ChromelessSignProps) {
  return (
    <div
      style={{
        backgroundColor: bgColor || 'transparent',
        ['--accent-hex' as string]: accentHex ? `#${accentHex}` : undefined,
      }}
    >
      <SigningPage
        token={token}
        documentTitle={documentTitle}
        senderEmail=""
        content={content}
        signerName={signerName}
        createdAt={createdAt}
        status={status}
        signedAt={signedAt}
        isEmbed
      />
    </div>
  );
}
