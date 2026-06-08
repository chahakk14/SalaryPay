const variants: Record<string, string> = {
  success: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  retrying: 'bg-orange-100 text-orange-700',
  draft: 'bg-gray-100 text-gray-700',
  approved: 'bg-indigo-100 text-indigo-700',
  default: 'bg-gray-100 text-gray-700',
};
export default function Badge({ label, variant }: { label: string; variant?: string }) {
  const cls = variants[variant?.toLowerCase() || 'default'] || variants.default;
  return <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${cls}`}>{label}</span>;
}
