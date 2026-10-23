export function Markdown({ source }: { source: string }) {
  const blocks = source.trim().split(/\n\n+/);
  return (
    <div className="space-y-4 text-sm leading-7 text-slate-700">
      {blocks.map((block, index) => {
        if (block.startsWith('## ')) return <h2 key={index} className="text-xl font-semibold text-navy">{block.slice(3)}</h2>;
        if (block.startsWith('# ')) return <h2 key={index} className="text-2xl font-semibold text-navy">{block.slice(2)}</h2>;
        const lines = block.split('\n');
        if (lines.every((line) => line.startsWith('- '))) {
          return (
            <ul key={index} className="list-disc space-y-1 pl-5">
              {lines.map((line) => <li key={line}>{line.slice(2)}</li>)}
            </ul>
          );
        }
        return <p key={index}>{block}</p>;
      })}
    </div>
  );
}
