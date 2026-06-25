import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { AlertCircle, Loader2, Plus, Save, Settings, X } from 'lucide-react';
import { toast } from 'sonner';

export function ConfigTab() {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch configuration on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/manager/config', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success) {
          setKeywords(data.keywords || []);
        } else {
          toast.error(data.message || 'Không thể tải từ khóa cấm.');
        }
      } catch (err) {
        console.error(err);
        toast.error('Lỗi kết nối đến máy chủ.');
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;

    const rawWords = newKeyword.split(/[,;]/);
    const addedWords: string[] = [];
    const duplicateWords: string[] = [];
    const invalidWords: string[] = [];

    const newKeywordsList = [...keywords];

    rawWords.forEach((word) => {
      const clean = word.trim().toLowerCase();
      if (!clean) return;

      if (clean.length < 2) {
        invalidWords.push(clean);
        return;
      }

      if (newKeywordsList.includes(clean)) {
        duplicateWords.push(clean);
        return;
      }

      newKeywordsList.push(clean);
      addedWords.push(clean);
    });

    if (addedWords.length > 0) {
      setKeywords(newKeywordsList);
      toast.success(`Đã thêm từ khóa: ${addedWords.join(', ')}`);
    }

    if (duplicateWords.length > 0) {
      toast.warning(`Từ khóa đã tồn tại: ${duplicateWords.join(', ')}`);
    }

    if (invalidWords.length > 0) {
      toast.error(`Từ khóa quá ngắn (ít hơn 2 ký tự): ${invalidWords.join(', ')}`);
    }

    setNewKeyword('');
  };

  const handleRemoveKeyword = (wordToRemove: string) => {
    setKeywords(keywords.filter((k) => k !== wordToRemove));
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/manager/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ keywords }),
      });
      const data = await res.json();
      if (data.success) {
        setKeywords(data.keywords || []);
        toast.success('Đã lưu cấu hình hệ thống thành công.');
      } else {
        toast.error(data.message || 'Lưu cấu hình thất bại.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Không thể kết nối để lưu cấu hình.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
        <span className="ml-2 text-sm text-slate-500">Đang tải cấu hình hệ thống...</span>
      </div>
    );
  }

  return (
    <Card className="border-slate-200/80 bg-white/85 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/40">
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:bg-sky-500/25 dark:text-sky-400">
          <Settings className="h-6 w-6 animate-spin-slow" />
        </div>
        <div>
          <CardTitle>Cấu hình hệ thống</CardTitle>
          <CardDescription>Quản lý các thông số chung của toàn bộ hệ thống.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400" />
            <div>
              <h5 className="font-semibold text-amber-900 dark:text-amber-300">Kiểm duyệt từ khóa cấm</h5>
              <p className="mt-1 text-sm text-amber-800/90 dark:text-amber-400/95">
                Các từ khóa trong danh sách này sẽ được dùng để kiểm duyệt nội dung tự động khi người dùng đăng bán sản phẩm mới hoặc cập nhật thông tin sản phẩm. Bài viết chứa từ khóa này sẽ bị chặn đăng và yêu cầu chỉnh sửa lại.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleAddKeyword} className="flex gap-2">
          <Input
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder="Nhập từ khóa muốn cấm (VD: súng, đạn, hack...)"
            className="max-w-md rounded-xl"
          />
          <Button type="submit" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
            <Plus className="h-4 w-4" /> Thêm
          </Button>
        </form>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Từ khóa hiện tại ({keywords.length})
          </h4>

          {keywords.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400 dark:border-slate-800">
              Chưa cấu hình từ khóa cấm nào. Hệ thống sẽ sử dụng danh sách từ khóa mặc định.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-100 bg-slate-50/30 p-4 dark:border-slate-900 dark:bg-slate-900/10">
              {keywords.map((word) => (
                <div
                  key={word}
                  className="flex items-center gap-1.5 rounded-xl border border-red-200/60 bg-red-50/70 px-3 py-1.5 text-sm font-medium text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400"
                >
                  <span>{word}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(word)}
                    className="rounded-full p-0.5 hover:bg-red-200/50 dark:hover:bg-red-950/50"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button
            onClick={handleSaveConfig}
            disabled={saving}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Đang lưu...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Lưu cấu hình
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
