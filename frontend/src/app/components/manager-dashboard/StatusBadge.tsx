import { Badge } from '../ui/badge';

type StatusBadgeProps = {
  status: string;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status === 'active' || status === 'completed' || status === 'resolved') {
    return (
      <Badge className="rounded-full bg-emerald-600 text-white hover:bg-emerald-600 capitalize">
        {status}
      </Badge>
    );
  }

  if (status === 'pending' || status === 'reviewing') {
    return (
      <Badge className="rounded-full bg-amber-500 text-white hover:bg-amber-500 capitalize">
        {status}
      </Badge>
    );
  }

  if (status === 'suspended' || status === 'banned' || status === 'dismissed' || status === 'archived') {
    return (
      <Badge variant="destructive" className="rounded-full capitalize">
        {status}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="rounded-full capitalize">
      {status}
    </Badge>
  );
}
