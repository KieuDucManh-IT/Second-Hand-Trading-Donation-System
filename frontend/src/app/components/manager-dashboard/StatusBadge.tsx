import { Badge } from '../ui/badge';

type StatusBadgeProps = {
  status: string;
};

const statusLabels: Record<string, string> = {
  active: 'Hoạt động',
  completed: 'Hoàn thành',
  accept: 'Đã duyệt',
  pending: 'Chờ duyệt',
  reviewing: 'Đang xem xét',
  banned: 'Bị khóa',
  archived: 'Đã lưu trữ',
  reject: 'Từ chối',
  available: 'Đang hiển thị',
  hidden: 'Đã ẩn',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const label = statusLabels[status] || status;

  if (status === 'active' || status === 'completed' || status === 'accept') {
    return (
      <Badge className="rounded-full bg-emerald-600 text-white hover:bg-emerald-600 capitalize">
        {label}
      </Badge>
    );
  }

  if (status === 'pending' || status === 'reviewing') {
    return (
      <Badge className="rounded-full bg-amber-500 text-white hover:bg-amber-500 capitalize">
        {label}
      </Badge>
    );
  }

  if (status === 'banned' || status === 'archived' || status === 'reject') {
    return (
      <Badge variant="destructive" className="rounded-full capitalize">
        {label}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="rounded-full capitalize">
      {label}
    </Badge>
  );
}
