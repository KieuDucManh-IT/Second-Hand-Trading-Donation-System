import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { StatusBadge } from './StatusBadge';
import { Scale, FileText, Check, X, AlertTriangle, Play, HelpCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Pagination } from './Pagination';

type DisputesTabProps = {
  disputesData: {
    orders: Array<any>;
    exchanges: Array<any>;
  };
  resolveDispute: (
    disputeId: string,
    type: 'order' | 'exchange',
    resolution: 'accept' | 'reject',
    hasReturnedGoods: boolean,
    resolutionNote: string
  ) => Promise<void>;
};

export function DisputesTab({ disputesData, resolveDispute }: DisputesTabProps) {
  const navigate = useNavigate();
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null);
  const [resolutionType, setResolutionType] = useState<'accept' | 'reject' | null>(null);
  const [hasReturnedGoods, setHasReturnedGoods] = useState<boolean>(false);
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
    createdAt: o.complaint?.createdAt || o.disputedAt || o.updatedAt,
  }));

  const exchangeDisputes = (disputesData.exchanges || []).map((e) => {
    const isRequesterDisputer = String(e.requester?._id || e.requester) === String(e.disputeBy);
    const disputerName = isRequesterDisputer
      ? e.requester?.fullName || e.requester?.email || 'Bên đề xuất'
      : e.receiver?.fullName || e.receiver?.email || 'Bên đồng ý';
    const otherPartyName = isRequesterDisputer
      ? e.receiver?.fullName || e.receiver?.email || 'Bên đồng ý'
      : e.requester?.fullName || e.requester?.email || 'Bên đề xuất';

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
      createdAt: e.complaint?.createdAt || e.disputedAt || e.updatedAt,
    };
  });

  const allDisputes = [...orderDisputes, ...exchangeDisputes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const filteredDisputes = allDisputes.filter((dispute) => {
    const isResolved = dispute.complaintStatus === 'resolved' || dispute.complaintStatus === 'rejected';
    if (showHistory && !isResolved) return false;
    if (!showHistory && isResolved) return false;

    if (selectedStatus !== 'all' && dispute.complaintStatus !== selectedStatus) return false;

    return true;
  });

  const totalPages = Math.ceil(filteredDisputes.length / itemsPerPage);
  const paginatedDisputes = filteredDisputes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenResolve = (dispute: any, action: 'accept' | 'reject') => {
    setSelectedDispute(dispute);
    setResolutionType(action);
    setResolutionNote('');
    setHasReturnedGoods(false);
  };

  const handleCloseResolve = () => {
    setSelectedDispute(null);
    setResolutionType(null);
    setResolutionNote('');
    setHasReturnedGoods(false);
  };

  const handleSubmitResolution = async () => {
    if (!selectedDispute || !resolutionType) return;
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
        hasReturnedGoods,
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
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
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
                  <TableRow key={dispute.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40">
                    {/* Transaction info */}
                    <TableCell className="pl-6 align-middle font-medium">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {dispute.type === 'order' ? 'Đơn hàng mua bán' : 'Giao dịch trao đổi'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">ID: {dispute.id.slice(-6)}</div>
                    </TableCell>

                    {/* Products Column */}
                    <TableCell className="align-middle">
                      {dispute.type === 'order' ? (
                        <button
                          onClick={() => navigate(`/products/${dispute.productId?._id || dispute.productId}`, { state: { from: 'manager', tab: 'disputes' } })}
                          className="text-left text-indigo-600 hover:text-indigo-800 hover:underline font-medium flex items-center gap-1 max-w-[180px] truncate"
                          title={dispute.productId?.title || 'Xem chi tiết sản phẩm'}
                        >
                          <Eye className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{dispute.productId?.title || 'Xem sản phẩm'}</span>
                        </button>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <button
                            onClick={() => navigate(`/products/${dispute.requesterProduct?._id || dispute.requesterProduct}`, { state: { from: 'manager', tab: 'disputes' } })}
                            className="text-left text-indigo-600 hover:text-indigo-800 hover:underline text-xs font-medium flex items-center gap-1 max-w-[180px] truncate"
                            title={dispute.requesterProduct?.title || 'Xem sản phẩm đề xuất'}
                          >
                            <span className="shrink-0 text-[10px] bg-indigo-50 text-indigo-600 px-1 py-0.5 rounded dark:bg-indigo-950/40 dark:text-indigo-400 mr-1 font-semibold">Đề xuất</span>
                            <span className="truncate">{dispute.requesterProduct?.title || 'Sản phẩm đề xuất'}</span>
                          </button>
                          <button
                            onClick={() => navigate(`/products/${dispute.receiverProduct?._id || dispute.receiverProduct}`, { state: { from: 'manager', tab: 'disputes' } })}
                            className="text-left text-indigo-600 hover:text-indigo-800 hover:underline text-xs font-medium flex items-center gap-1 max-w-[180px] truncate"
                            title={dispute.receiverProduct?.title || 'Xem sản phẩm nhận'}
                          >
                            <span className="shrink-0 text-[10px] bg-emerald-50 text-emerald-600 px-1 py-0.5 rounded dark:bg-emerald-950/40 dark:text-emerald-400 mr-1 font-semibold">Nhận về</span>
                            <span className="truncate">{dispute.receiverProduct?.title || 'Sản phẩm nhận'}</span>
                          </button>
                        </div>
                      )}
                    </TableCell>

                    {/* Disputer */}
                    <TableCell className="align-middle">
                      <div className="font-medium text-slate-700 dark:text-slate-300 max-w-[130px] truncate" title={dispute.disputer}>
                        {dispute.disputer}
                      </div>
                    </TableCell>

                    {/* Opponent */}
                    <TableCell className="align-middle">
                      <div className="font-medium text-slate-700 dark:text-slate-300 max-w-[130px] truncate" title={dispute.otherParty}>
                        {dispute.otherParty}
                      </div>
                    </TableCell>

                    {/* Money Amount */}
                    <TableCell className="align-middle font-semibold text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(dispute.amount)}
                    </TableCell>

                    {/* Reason */}
                    <TableCell className="align-middle max-w-[150px] truncate text-slate-600 dark:text-slate-400" title={dispute.complaintReason}>
                      {dispute.complaintReason}
                    </TableCell>

                    {/* Date */}
                    <TableCell className="align-middle text-sm text-slate-500 whitespace-nowrap">
                      {new Date(dispute.createdAt).toLocaleDateString('vi-VN')}
                    </TableCell>

                    {/* Status badge */}
                    <TableCell className="align-middle">
                      <StatusBadge status={dispute.complaintStatus} />
                    </TableCell>

                    {/* Action buttons */}
                    <TableCell className="pr-6 align-middle font-normal">
                      <div className="flex justify-end gap-2">
                        {dispute.complaintStatus === 'pending' || dispute.complaintStatus === 'reviewing' ? (
                          <>
                            <Button
                              size="sm"
                              className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-medium"
                              onClick={() => handleOpenResolve(dispute, 'accept')}
                            >
                              <Check className="mr-1 h-3.5 w-3.5" />
                              Chấp thuận
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8 shadow-sm font-medium"
                              onClick={() => handleOpenResolve(dispute, 'reject')}
                            >
                              <X className="mr-1 h-3.5 w-3.5" />
                              Từ chối
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground font-semibold">Đã xử lý</span>
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

      {/* Resolution Dialog */}
      <Dialog open={!!selectedDispute} onOpenChange={(open) => !open && handleCloseResolve()}>
        {selectedDispute && (
          <DialogContent className="max-w-2xl rounded-3xl border-slate-200 bg-white/95 p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950/95 max-h-[90vh] overflow-y-auto">
            <DialogHeader className="text-left">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Scale className="h-5 w-5 text-indigo-500" />
                Quyết định xử lý tranh chấp
              </DialogTitle>
              <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs">
                Vui lòng xem kỹ bằng chứng và đưa ra phán quyết công bằng. Tiền ví sẽ được chuyển tự động ngay khi bạn xác nhận.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-5">
              {/* Transaction Context card */}
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
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedDispute.disputer}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">Bên bị khiếu nại (B)</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedDispute.otherParty}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Khiếu nại chính */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                    <span className="text-slate-800 dark:text-slate-200 font-semibold text-xs block uppercase tracking-wider">
                      Khiếu nại chính ({selectedDispute.disputer})
                    </span>
                    <p className="text-sm bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      {selectedDispute.complaintReason}
                    </p>

                    {/* Bằng chứng khiếu nại chính */}
                    <div className="mt-2">
                      <span className="text-slate-400 block text-xs mb-1.5 font-medium">
                        Bằng chứng khiếu nại chính ({selectedDispute.evidences?.length || 0})
                      </span>
                      {selectedDispute.evidences && selectedDispute.evidences.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                          {selectedDispute.evidences.map((ev: any, idx: number) => (
                            <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black aspect-video flex items-center justify-center">
                              {ev.type === 'video' || ev.resourceType === 'video' || ev.mimeType?.startsWith('video/') ? (
                                <div className="w-full h-full flex items-center justify-center">
                                  <video src={ev.url} className="w-full h-full object-contain" controls />
                                  <div className="absolute top-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-white flex items-center gap-1">
                                    <Play className="h-3 w-3" /> Video
                                  </div>
                                </div>
                              ) : (
                                <a href={ev.url} target="_blank" rel="noopener noreferrer" className="w-full h-full block">
                                  <img src={ev.url} alt={`Evidence ${idx + 1}`} className="w-full h-full object-contain hover:scale-105 transition-transform" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2 rounded-lg flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          Không có bằng chứng được tải lên.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Khiếu nại phản hồi (nếu có) */}
                  {selectedDispute.counterComplaint && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                      <span className="text-slate-800 dark:text-slate-200 font-semibold text-xs block uppercase tracking-wider">
                        Khiếu nại phản hồi ({selectedDispute.counterDisputeBy?.fullName || selectedDispute.counterDisputeBy?.email || 'Đối phương'})
                      </span>
                      <p className="text-sm bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        {selectedDispute.counterComplaint.reason}
                      </p>

                      {/* Bằng chứng khiếu nại phản hồi */}
                      <div className="mt-2">
                        <span className="text-slate-400 block text-xs mb-1.5 font-medium">
                          Bằng chứng khiếu nại phản hồi ({selectedDispute.counterComplaint.evidences?.length || 0})
                        </span>
                        {selectedDispute.counterComplaint.evidences && selectedDispute.counterComplaint.evidences.length > 0 ? (
                          <div className="grid grid-cols-2 gap-3">
                            {selectedDispute.counterComplaint.evidences.map((ev: any, idx: number) => (
                              <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black aspect-video flex items-center justify-center">
                                {ev.type === 'video' || ev.resourceType === 'video' || ev.mimeType?.startsWith('video/') ? (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <video src={ev.url} className="w-full h-full object-contain" controls />
                                    <div className="absolute top-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-white flex items-center gap-1">
                                      <Play className="h-3 w-3" /> Video
                                    </div>
                                  </div>
                                ) : (
                                  <a href={ev.url} target="_blank" rel="noopener noreferrer" className="w-full h-full block">
                                    <img src={ev.url} alt={`Evidence ${idx + 1}`} className="w-full h-full object-contain hover:scale-105 transition-transform" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2 rounded-lg flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            Không có bằng chứng được tải lên.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Resolution Form */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
                <div className="rounded-xl bg-indigo-500/10 p-3 border border-indigo-500/20 text-xs text-indigo-700 dark:text-indigo-300 flex items-start gap-2">
                  <HelpCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">Luật tài chính áp dụng:</span>
                    {resolutionType === 'accept' ? (
                      selectedDispute.type === 'order' ? (
                        'Chấp thuận: Hoàn tiền 100% giá trị đơn hàng về ví của Người mua (Bên khiếu nại). Đơn hàng sẽ bị huỷ.'
                      ) : (
                        'Chấp thuận giao dịch trao đổi: Hoàn trả 100% tiền cọc bảo hiểm cho hai bên (nếu Bên khiếu nại đã chuyển trả lại hàng), hoặc chuyển toàn bộ tiền cọc của Bên khiếu nại sang cho đối phương (nếu giữ hàng lại không trả).'
                      )
                    ) : (
                      selectedDispute.type === 'order' ? (
                        'Từ chối: Giải ngân 100% số tiền đơn hàng (sau khi trừ phí hệ thống) sang ví của Người bán. Đơn hàng hoàn tất.'
                      ) : (
                        'Từ chối giao dịch trao đổi: Giao dịch kết thúc bình thường, hoàn trả tiền cọc cho cả 2 bên (sau khi khấu trừ 10% phí dịch vụ trung gian).'
                      )
                    )}
                  </div>
                </div>

                {selectedDispute.type === 'exchange' && resolutionType === 'accept' && (
                  <div className="flex items-center gap-2 p-3 rounded-xl border border-indigo-200 bg-indigo-50/50 dark:border-indigo-900/40 dark:bg-indigo-950/20">
                    <input
                      type="checkbox"
                      id="hasReturned"
                      checked={hasReturnedGoods}
                      onChange={(e) => setHasReturnedGoods(e.target.checked)}
                      className="h-4.5 w-4.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="hasReturned" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                      Xác nhận: Người khiếu nại ĐÃ gửi trả lại hàng cho đối phương (đã xác minh bằng chứng)
                    </label>
                  </div>
                )}

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
                className={`text-white ${
                  resolutionType === 'accept'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
                onClick={handleSubmitResolution}
                disabled={isSubmitting}
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
