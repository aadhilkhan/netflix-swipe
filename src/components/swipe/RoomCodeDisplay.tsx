import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface RoomCodeDisplayProps {
  code: string;
}

export function RoomCodeDisplay({ code }: RoomCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 transition-colors hover:bg-zinc-800"
    >
      <span className="font-mono text-sm tracking-[0.2em] text-zinc-300">{code}</span>
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-400" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-zinc-500" />
      )}
    </button>
  );
}
