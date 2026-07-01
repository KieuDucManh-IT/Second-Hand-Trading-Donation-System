import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { StatusBadge } from './StatusBadge';
import { Scale, AlertTriangle, Play, HelpCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Pagination } from './Pagination';

type DisputeType = 'order' | 'exchange';

type ReviewResolution =
  | 'refund_a'
  | 'refund_b'
  | 'continue_auto_release';

type DisputesTabProps = {
  disputesData: {
    orders: Array<any>;
    exchanges: Array<any>;
  };
  resolveDispute: (
    disputeId: string,
    type: DisputeType,
    resolution: ReviewResolution,
    hasReturnedGoods: boolean,
    resolutionNote: string
  ) => Promise<void>;
};

function getId(value: any) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return String(value._id || value.id || '');
}

function getDisplayName(user: any, fallback = 'Người dùng') {
  if (!user || typeof user === 'string') return fallback;

  return (
    user.fullName ||
    user.name ||
    user.username ||
    user.email ||
    fallback
  );
}

function getMediaUrl(file: any) {
  if (!file) return '';
  if (typeof file === 'string') return file;

  return (
    file.url ||
    file.secure_url ||
    file.videoUrl ||
    file.imageUrl ||
    file.path ||
    ''
  );
}

function isVideoFile(file: any) {
  return (
    file?.type === 'video' ||
    file?.resourceType === 'video' ||
    file?.mimeType?.startsWith?.('video/')
  );
}

function toMediaList(value: any): any[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (value.evidences && Array.isArray(value.evidences)) {
    return value.evidences.filter(Boolean);
  }

  if (value.files && Array.isArray(value.files)) {
    return value.files.filter(Boolean);
  }

  return [value];
}

function getReporterEvidences(dispute: any) {
  return dispute?.evidences || dispute?.complaint?.evidences || [];
}

function getReportedDeliveryVideos(dispute: any) {
  if (!dispute) return [];

  if (dispute.type === 'order') {
    const candidates = [
      dispute.sellerDeliveryVideo,
      dispute.sellerPackingVideo,
      dispute.deliveryVideo,
      dispute.packingVideo,
      dispute.shipmentVideo,
      dispute.shippingVideo,
      dispute.deliveryEvidence,
      dispute.shippingEvidence,
      dispute.orderDeliveryVideo,
    ];

    return candidates.flatMap(toMediaList).filter((item) => !!getMediaUrl(item));
  }

  const requesterId = getId(dispute.requester);
  const disputeById = getId(dispute.disputeBy);

  const isRequesterDisputer =
    requesterId && disputeById && requesterId === disputeById;

  const deliveryVideo = isRequesterDisputer
    ? dispute.receiverDeliveryVideo
    : dispute.requesterDeliveryVideo;

  return toMediaList(deliveryVideo).filter((item) => !!getMediaUrl(item));
}

function getReportedPartyLabel(dispute: any) {
  return dispute?.otherParty || 'Bên bị khiếu nại';
}

function MediaEvidenceGrid({
  items,
  emptyText,
}: {
  items: any[];
  emptyText: string;
}) {
  if (!items || items.length === 0) {
    return (
      <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2 rounded-lg flex items-center gap-1.5">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        {emptyText}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((ev: any, idx: number) => {
        const mediaUrl = getMediaUrl(ev);

        if (!mediaUrl) return null;

        return (
          <div
            key={`${mediaUrl}-${idx}`}
            className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black aspect-video flex items-center justify-center"
          >
            {isVideoFile(ev) || String(mediaUrl).match(/\.(mp4|mov|webm)(\?|$)/i) ? (
              <div className="w-full h-full flex items-center justify-center">
                <video src={mediaUrl} className="w-full h-full object-contain" controls />
                <div className="absolute top-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-white flex items-center gap-1">
                  <Play className="h-3 w-3" /> Video
                </div>
              </div>
            ) : (
              <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="w-full h-full block">
                <img
                  src={mediaUrl}
                  alt={`Evidence ${idx + 1}`}
                  className="w-full h-full object-contain hover:scale-105 transition-transform"
                />
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function DisputesTab({ disputesData, resolveDispute }: DisputesTabProps) {
  const navigate = useNavigate();
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null);
  const [resolutionType, setResolutionType] = useState<ReviewResolution | null>(null);
  const [resolutionNote, setResolutionNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  const handleToggleHistory = (historyMode: boolean) => {
    setShowHistory(historyMode);
    setSelectedStatus('all');
    setCurrentPage(1);
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const orderDisputes = (disputesData.orders || []).map((o) => ({
    ...o,
    id: o._id,
    type: 'order' as const,
    disputer: o.buyerId?.fullName || o.buyerId?.email || 'Người mua',
    otherParty: o.sellerId?.fullName || o.sellerId?.email || 'Người bán',
    amount: o.escrowAmount || o.totalPrice || 0,
    complaintStatus: o.complaint?.status || 'pending',
    complaintReason: o.complaint?.reason || o.disputeReason || 'Khiếu nại giao dịch',
    evidences: o.complaint?.evidences || [],
    sellerDeliveryVideo: o.sellerDeliveryVideo,
    sellerPackingVideo: o.sellerPackingVideo,
    deliveryVideo: o.deliveryVideo,
    packingVideo: o.packingVideo,
    shipmentVideo: o.shipmentVideo,
    shippingVideo: o.shippingVideo,
    deliveryEvidence: o.deliveryEvidence,
    shippingEvidence: o.shippingEvidence,
    orderDeliveryVideo: o.orderDeliveryVideo,
    createdAt: o.complaint?.createdAt || o.disputedAt || o.updatedAt,
  }));

  const exchangeDisputes = (disputesData.exchanges || []).map((e) => {
    const requesterId = getId(e.requester);
    const disputeById = getId(e.disputeBy);

    const isRequesterDisputer =
      requesterId && disputeById && requesterId === disputeById;

    const disputerName = isRequesterDisputer
      ? getDisplayName(e.requester, 'Bên đề xuất')
      : getDisplayName(e.receiver, 'Bên đồng ý');

    const otherPartyName = isRequesterDisputer
      ? getDisplayName(e.receiver, 'Bên đồng ý')
      : getDisplayName(e.requester, 'Bên đề xuất');

    return {
      ...e,
      id: e._id,
      type: 'exchange' as const,
      disputer: disputerName,
      otherParty: otherPartyName,
      amount: e.requesterDepositAmount || e.receiverDepositAmount || 0,
      complaintStatus: e.complaint?.status || 'pending',
      complaintReason: e.complaint?.reason || e.disputeReason || 'Khiếu nại giao dịch',
      evidences: e.complaint?.evidences || [],
      requesterDeliveryVideo: e.requesterDeliveryVideo,
      receiverDeliveryVideo: e.receiverDeliveryVideo,
      counterComplaint: e.counterComplaint,
      counterDisputeBy: e.counterDisputeBy,
      createdAt: e.complaint?.createdAt || e.disputedAt || e.updatedAt,
    };
  });

  const allDisputes = [...orderDisputes, ...exchangeDisputes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const filteredDisputes = allDisputes.filter((dispute) => {
    const isResolved =
      dispute.complaintStatus === 'resolved' ||
      dispute.complaintStatus === 'rejected';

    if (showHistory && !isResolved) return false;
    if (!showHistory && isResolved) return false;

    if (selectedStatus !== 'all' && dispute.complaintStatus !== selectedStatus) {
      return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredDisputes.length / itemsPerPage);
  const paginatedDisputes = filteredDisputes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenResolve = (dispute: any) => {
    setSelectedDispute(dispute);
    setResolutionType(null);
    setResolutionNote('');
  };

  const handleCloseResolve = () => {
    setSelectedDispute(null);
    setResolutionType(null);
    setResolutionNote('');
  };

  const handleSubmitResolution = async () => {
    if (!selectedDispute || !resolutionType) {
      toast.error('Vui lòng chọn hướng xử lý.');
      return;
    }

    if (!resolutionNote.trim()) {
      toast.error('Vui lòng nhập ghi chú quyết định giải quyết.');
      return;
    }

    try {
      setIsSubmitting(true);

      await resolveDispute(
        selectedDispute.id,
        selectedDispute.type,
        resolutionType,
        false,
        resolutionNote.trim()
      );

      handleCloseResolve();
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(val);
  };

  const getResolutionButtonClass = () => {
    if (resolutionType === 'refund_a') {
      return 'bg-emerald-600 hover:bg-emerald-700';
    }

    if (resolutionType === 'refund_b') {
      return 'bg-indigo-600 hover:bg-indigo-700';
    }

    if (resolutionType === 'continue_auto_release') {
      return 'bg-slate-700 hover:bg-slate-800';
    }

    return 'bg-slate-400 hover:bg-slate-500';
  };

  return (
    <>
      <Card className="border-slate-200/80 bg-white/85 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/40">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-indigo-500" />
            Xử lý tranh chấp giao dịch
          </CardTitle>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-850">
              <Button
                variant="ghost"
                size="sm"
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  !showHistory
                    ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-950 dark:text-indigo-400'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
                onClick={() => handleToggleHistory(false)}
              >
                Cần xử lý
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  showHistory
                    ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-950 dark:text-indigo-400'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
                onClick={() => handleToggleHistory(true)}
              >
                Lịch sử giải quyết
              </Button>
            </div>

            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900/70"
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              {!showHistory ? (
                <>
                  <option value="pending">Chờ duyệt</option>
                  <option value="reviewing">Đang xem xét</option>
                </>
              ) : (
                <>
                  <option value="resolved">Đã giải quyết</option>
                  <option value="rejected">Đã bác bỏ</option>
                </>
              )}
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/70 dark:bg-slate-900/40">
                <TableHead className="pl-6">Giao dịch</TableHead>
                <TableHead>Sản phẩm liên quan</TableHead>
                <TableHead>Bên khiếu nại</TableHead>
                <TableHead>Bên bị khiếu nại</TableHead>
                <TableHead>Số tiền / Tiền cọc</TableHead>
                <TableHead>Lý do</TableHead>
                <TableHead>Ngày khiếu nại</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="pr-6 text-right">Quyết định</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedDisputes.length ? (
                paginatedDisputes.map((dispute) => (
                  <TableRow
                    key={dispute.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40"
                  >
                    <TableCell className="pl-6 align-middle font-medium">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {dispute.type === 'order' ? 'Đơn hàng mua bán' : 'Giao dịch trao đổi'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        ID: {dispute.id.slice(-6)}
                      </div>
                    </TableCell>

                    <TableCell className="align-middle">
                      {dispute.type === 'order' ? (
                        <button
                          onClick={() =>
                            navigate(`/products/${dispute.productId?._id || dispute.productId}`, {
                              state: { from: 'manager', tab: 'disputes' },
                            })
                          }
                          className="text-left text-indigo-600 hover:text-indigo-800 hover:underline font-medium flex items-center gap-1 max-w-[180px] truncate"
                          title={dispute.productId?.title || 'Xem chi tiết sản phẩm'}
                        >
                          <Eye className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">
                            {dispute.productId?.title || 'Xem sản phẩm'}
                          </span>
                        </button>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <button
                            onClick={() =>
                              navigate(`/products/${dispute.requesterProduct?._id || dispute.requesterProduct}`, {
                                state: { from: 'manager', tab: 'disputes' },
                              })
                            }
                            className="text-left text-indigo-600 hover:text-indigo-800 hover:underline text-xs font-medium flex items-center gap-1 max-w-[180px] truncate"
                            title={dispute.requesterProduct?.title || 'Xem sản phẩm đề xuất'}
                          >
                            <span className="shrink-0 text-[10px] bg-indigo-50 text-indigo-600 px-1 py-0.5 rounded dark:bg-indigo-950/40 dark:text-indigo-400 mr-1 font-semibold">
                              Đề xuất
                            </span>
                            <span className="truncate">
                              {dispute.requesterProduct?.title || 'Sản phẩm đề xuất'}
                            </span>
                          </button>

                          <button
                            onClick={() =>
                              navigate(`/products/${dispute.receiverProduct?._id || dispute.receiverProduct}`, {
                                state: { from: 'manager', tab: 'disputes' },
                              })
                            }
                            className="text-left text-indigo-600 hover:text-indigo-800 hover:underline text-xs font-medium flex items-center gap-1 max-w-[180px] truncate"
                            title={dispute.receiverProduct?.title || 'Xem sản phẩm nhận'}
                          >
                            <span className="shrink-0 text-[10px] bg-emerald-50 text-emerald-600 px-1 py-0.5 rounded dark:bg-emerald-950/40 dark:text-emerald-400 mr-1 font-semibold">
                              Nhận về
                            </span>
                            <span className="truncate">
                              {dispute.receiverProduct?.title || 'Sản phẩm nhận'}
                            </span>
                          </button>
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="align-middle">
                      <div
                        className="font-medium text-slate-700 dark:text-slate-300 max-w-[130px] truncate"
                        title={dispute.disputer}
                      >
                        {dispute.disputer}
                      </div>
                    </TableCell>

                    <TableCell className="align-middle">
                      <div
                        className="font-medium text-slate-700 dark:text-slate-300 max-w-[130px] truncate"
                        title={dispute.otherParty}
                      >
                        {dispute.otherParty}
                      </div>
                    </TableCell>

                    <TableCell className="align-middle font-semibold text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(dispute.amount)}
                    </TableCell>

                    <TableCell
                      className="align-middle max-w-[150px] truncate text-slate-600 dark:text-slate-400"
                      title={dispute.complaintReason}
                    >
                      {dispute.complaintReason}
                    </TableCell>

                    <TableCell className="align-middle text-sm text-slate-500 whitespace-nowrap">
                      {dispute.createdAt
                        ? new Date(dispute.createdAt).toLocaleDateString('vi-VN')
                        : 'Chưa có'}
                    </TableCell>

                    <TableCell className="align-middle">
                      <StatusBadge status={dispute.complaintStatus} />
                    </TableCell>

                    <TableCell className="pr-6 align-middle font-normal">
                      <div className="flex justify-end gap-2">
                        {dispute.complaintStatus === 'pending' ||
                        dispute.complaintStatus === 'reviewing' ? (
                          <Button
                            size="sm"
                            className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-medium"
                            onClick={() => handleOpenResolve(dispute)}
                          >
                            <Eye className="mr-1 h-3.5 w-3.5" />
                            Xem xét
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground font-semibold">
                            Đã xử lý
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                    {showHistory
                      ? 'Không tìm thấy lịch sử giải quyết tranh chấp nào.'
                      : 'Hiện tại không có tranh chấp nào cần xử lý.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredDisputes.length}
          itemsPerPage={itemsPerPage}
        />
      </Card>

      <Dialog open={!!selectedDispute} onOpenChange={(open) => !open && handleCloseResolve()}>
        {selectedDispute && (
          <DialogContent className="max-w-2xl rounded-3xl border-slate-200 bg-white/95 p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950/95 max-h-[90vh] overflow-y-auto">
            <DialogHeader className="text-left">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Scale className="h-5 w-5 text-indigo-500" />
                Xem xét tranh chấp giao dịch
              </DialogTitle>
              <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs">
                Vui lòng xem kỹ bằng chứng, video giao/đóng hàng và đưa ra hướng xử lý công bằng.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-5">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/20 p-4 space-y-3">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase">
                  <span>Chi tiết tranh chấp</span>
                  <StatusBadge status={selectedDispute.complaintStatus} />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400 block text-xs">Loại giao dịch</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {selectedDispute.type === 'order' ? 'Mua bán sản phẩm' : 'Trao đổi đồ'}
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-xs">Giá trị giao dịch / Cọc</span>
                    <strong className="text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(selectedDispute.amount)}
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-xs">Người khiếu nại (A)</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedDispute.disputer}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-xs">Bên bị khiếu nại (B)</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedDispute.otherParty}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                    <span className="text-slate-800 dark:text-slate-200 font-semibold text-xs block uppercase tracking-wider">
                      Khiếu nại chính ({selectedDispute.disputer})
                    </span>

                    <p className="text-sm bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      {selectedDispute.complaintReason}
                    </p>

                    <div className="mt-2">
                      <span className="text-slate-400 block text-xs mb-1.5 font-medium">
                        Bằng chứng của người gửi báo cáo ({getReporterEvidences(selectedDispute).length || 0})
                      </span>

                      <MediaEvidenceGrid
                        items={getReporterEvidences(selectedDispute)}
                        emptyText="Không có bằng chứng được tải lên."
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                    <span className="text-slate-800 dark:text-slate-200 font-semibold text-xs block uppercase tracking-wider">
                      Video đóng/giao hàng của bên bị báo cáo ({getReportedPartyLabel(selectedDispute)})
                    </span>

                    <MediaEvidenceGrid
                      items={getReportedDeliveryVideos(selectedDispute)}
                      emptyText="Bên bị báo cáo chưa có video đóng/giao hàng."
                    />
                  </div>

                  {selectedDispute.counterComplaint && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                      <span className="text-slate-800 dark:text-slate-200 font-semibold text-xs block uppercase tracking-wider">
                        Khiếu nại phản hồi (
                        {getDisplayName(
                          selectedDispute.counterDisputeBy,
                          'Đối phương'
                        )}
                        )
                      </span>

                      <p className="text-sm bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        {selectedDispute.counterComplaint.reason}
                      </p>

                      <div className="mt-2">
                        <span className="text-slate-400 block text-xs mb-1.5 font-medium">
                          Bằng chứng khiếu nại phản hồi (
                          {selectedDispute.counterComplaint.evidences?.length || 0})
                        </span>

                        <MediaEvidenceGrid
                          items={selectedDispute.counterComplaint.evidences || []}
                          emptyText="Không có bằng chứng phản hồi được tải lên."
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
                <div className="rounded-xl bg-indigo-500/10 p-3 border border-indigo-500/20 text-xs text-indigo-700 dark:text-indigo-300 flex items-start gap-2">
                  <HelpCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">Lựa chọn xử lý:</span>
                    Manager có thể hoàn toàn bộ giá trị cho bên A, hoàn toàn bộ giá trị cho bên B,
                    hoặc từ chối giải quyết để giao dịch tiếp tục cơ chế tự động hoàn trong 7 ngày.
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition ${
                      resolutionType === 'refund_a'
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="resolutionType"
                      checked={resolutionType === 'refund_a'}
                      onChange={() => setResolutionType('refund_a')}
                      className="mt-1"
                    />
                    <div>
                      <span className="font-semibold block">
                        Hoàn toàn bộ giá trị cho bên A
                      </span>
                      <span className="text-xs opacity-80">
                        Bên A là người khiếu nại: {selectedDispute.disputer}.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition ${
                      resolutionType === 'refund_b'
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-300'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="resolutionType"
                      checked={resolutionType === 'refund_b'}
                      onChange={() => setResolutionType('refund_b')}
                      className="mt-1"
                    />
                    <div>
                      <span className="font-semibold block">
                        Hoàn toàn bộ giá trị cho bên B
                      </span>
                      <span className="text-xs opacity-80">
                        Bên B là bên bị khiếu nại: {selectedDispute.otherParty}.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition ${
                      resolutionType === 'continue_auto_release'
                        ? 'border-slate-500 bg-slate-100 text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="resolutionType"
                      checked={resolutionType === 'continue_auto_release'}
                      onChange={() => setResolutionType('continue_auto_release')}
                      className="mt-1"
                    />
                    <div>
                      <span className="font-semibold block">
                        Từ chối giải quyết, tiếp tục tự động hoàn sau 7 ngày
                      </span>
                      <span className="text-xs opacity-80">
                        Không phán quyết thắng/thua. Giao dịch quay lại cơ chế tự động hoàn tiền theo thời hạn.
                      </span>
                    </div>
                  </label>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                    Ghi chú phán quyết / Lý do quyết định:
                  </label>
                  <textarea
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="Nhập lý do cụ thể để gửi thông báo và ghi lại lịch sử giao dịch..."
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6 flex gap-2">
              <Button variant="outline" onClick={handleCloseResolve} disabled={isSubmitting}>
                Đóng
              </Button>

              <Button
                className={`text-white ${getResolutionButtonClass()}`}
                onClick={handleSubmitResolution}
                disabled={isSubmitting || !resolutionType}
              >
                {isSubmitting ? 'Đang thực hiện...' : 'Xác nhận quyết định'}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}