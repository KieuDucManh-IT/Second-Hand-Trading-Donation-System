import type { ReactNode } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

type ModalsProps = {
  isCategoryModalOpen: boolean;
  setIsCategoryModalOpen: (value: boolean) => void;
  categoryModalMode: 'create' | 'edit';
  categoryName: string;
  setCategoryName: (value: string) => void;
  categoryDescription: string;
  setCategoryDescription: (value: string) => void;
  submitCategoryForm: (e: React.FormEvent) => Promise<void>;
};

export function Modals({
  isCategoryModalOpen,
  setIsCategoryModalOpen,
  categoryModalMode,
  categoryName,
  setCategoryName,
  categoryDescription,
  setCategoryDescription,
  submitCategoryForm,
}: ModalsProps) {
  return (
    <>
      {/* Category Modal Dialog */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="max-w-xl rounded-3xl border-slate-200 bg-white/95 p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-950/95">
          <div className="bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.18),_transparent_35%),linear-gradient(180deg,_rgba(15,23,42,0.03),_transparent)] px-6 py-6 dark:bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.16),_transparent_35%),linear-gradient(180deg,_rgba(255,255,255,0.03),_transparent)]">
            <DialogHeader className="text-left">
              <DialogTitle className="text-2xl">
                {categoryModalMode === 'create' ? 'Create category' : 'Edit category'}
              </DialogTitle>
              <DialogDescription>Keep category names concise so the marketplace stays easy to scan.</DialogDescription>
            </DialogHeader>
            <form onSubmit={submitCategoryForm} className="mt-6 space-y-4">
              <Field label="Category name">
                <Input
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={100}
                  pattern="^[^<>]*$"
                  title="Tên danh mục không được chứa các ký tự < hoặc >"
                  placeholder="Example: Electronics"
                />
              </Field>
              <Field label="Description">
                <Textarea
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                  required
                  minLength={5}
                  maxLength={500}
                  className="min-h-28"
                  placeholder="Short description of the category"
                />
              </Field>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsCategoryModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{categoryModalMode === 'create' ? 'Create' : 'Save changes'}</Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      {children}
    </label>
  );
}
