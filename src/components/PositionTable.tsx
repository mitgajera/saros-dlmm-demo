
type BinPos = {
  bin_id: number;
  token_x: string;
  token_y: string;
  shares: string;
  in_range: boolean;
};

export function PositionTable({ bins }: { bins: BinPos[] }) {
  return (
    <div className="overflow-auto rounded-2xl border">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="text-left p-2">Bin</th>
            <th className="text-left p-2">Token X</th>
            <th className="text-left p-2">Token Y</th>
            <th className="text-left p-2">Shares</th>
            <th className="text-left p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {bins.map((b, i) => (
            <tr key={i} className="border-t">
              <td className="p-2">{b.bin_id}</td>
              <td className="p-2">{b.token_x}</td>
              <td className="p-2">{b.token_y}</td>
              <td className="p-2">{b.shares}</td>
              <td className="p-2">{b.in_range ? "In range" : "Out of range"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
