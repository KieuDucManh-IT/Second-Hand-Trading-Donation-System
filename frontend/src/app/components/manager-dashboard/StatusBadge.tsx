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
  resolved: 'Đã giải quyết',
  rejected: 'Đã bác bỏ',
  disputed: 'Đang tranh chấp',
  sold: 'Đã giao dịch',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const label = statusLabels[status] || status;

  if (status === 'active' || status === 'completed' || status === 'accept' || status === 'resolved') {
    return (
      <Badge className="rounded-full bg-emerald-600 text-white hover:bg-emerald-600 capitalize">
        {label}
      </Badge>
    );
  }

  if (status === 'sold') {
    return (
      <Badge className="rounded-full bg-blue-600 text-white hover:bg-blue-600 capitalize">
        {label}
      </Badge>
    );
  }

  if (status === 'pending' || status === 'reviewing' || status === 'disputed') {
    return (
      <Badge className="rounded-full bg-amber-500 text-white hover:bg-amber-500 capitalize">
        {label}
      </Badge>
    );
  }

  if (status === 'banned' || status === 'archived' || status === 'reject' || status === 'rejected') {
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
