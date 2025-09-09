"use client";

import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AlertCircle, Loader } from "lucide-react";
import { PrizeForm } from "../PrizeForm";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Props {
  showCreateModal: boolean;
  setShowCreateModal: (v: boolean) => void;
  editingPrize: any;
  setEditingPrize: (p: any) => void;
  deletingPrize: any;
  setDeletingPrize: (p: any) => void;
  confirmTogglePrize: any;
  setConfirmTogglePrize: (p: any) => void;
  createPrize: any;
  updatePrize: any;
  deletePrize: any;
  isSubmittingForm: boolean;
  togglingPrizeId: number | null;
}

export function Modals({ showCreateModal, setShowCreateModal, editingPrize, setEditingPrize, deletingPrize, setDeletingPrize, confirmTogglePrize, setConfirmTogglePrize, createPrize, updatePrize, deletePrize, isSubmittingForm, togglingPrizeId }: Props) {
  const { toast } = useToast();
  const [selectedImageFile, setSelectedImageFile] = React.useState<File | null>(null);
  const { createClient: createSbBrowser } = { createClient: undefined as any } as any; // placeholder to satisfy linter
  // We'll import createSbBrowser dynamically when needed

  return (
    <>
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-black/90 border-white/20 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nou Premi</DialogTitle>
            <DialogDescription className="text-white/60">Afegeix un nou premi al Battle Pass amb tota la informació necessària.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <PrizeForm
              onSubmit={async (data) => {
                // parent will handle mapping and toast
                try {
                  const res = await createPrize.mutateAsync(data);
                  setShowCreateModal(false);

                  // If user selected a local image file during create, upload it post-create and patch the prize
                  if (selectedImageFile && res?.data?.id) {
                    try {
                      // dynamic import of supabase client for browser
                      const { createClient: createSb } = await import("@/libs/supabase/client");
                      const sb = createSb();
                      const { data: sessionData } = await sb.auth.getSession();
                      const accessToken = sessionData.session?.access_token;
                      // upload via storage helper
                      const { uploadPrizeImage } = await import("@/libs/supabase/storage");
                      const { publicUrl } = await uploadPrizeImage(selectedImageFile, res.data.id);

                      // Patch the created prize with image_url
                      let resp = await fetch(`/api/admin/battle-pass/prizes/${res.data.id}`, {
                        method: "PUT",
                        headers: {
                          "Content-Type": "application/json",
                          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                        },
                        credentials: "include",
                        body: JSON.stringify({ image_url: publicUrl, title: res.data.title, points_required: res.data.points_required }),
                      });
                      if (resp.status === 401) {
                        await sb.auth.getSession();
                        const { data: s2 } = await sb.auth.getSession();
                        const at2 = s2.session?.access_token;
                        resp = await fetch(`/api/admin/battle-pass/prizes/${res.data.id}`, {
                          method: "PUT",
                          headers: {
                            "Content-Type": "application/json",
                            ...(at2 ? { Authorization: `Bearer ${at2}` } : {}),
                          },
                          credentials: "include",
                          body: JSON.stringify({ image_url: publicUrl, title: res.data.title, points_required: res.data.points_required }),
                        });
                      }
                      if (!resp.ok) {
                        console.warn("[Prizes Modals] Failed to patch created prize with image_url", resp.status);
                      }
                    } catch (e) {
                      console.warn("Unable to upload image post-create:", e);
                    }
                  }

                } catch (e) {
                  toast({ variant: 'destructive', title: 'Error', description: "No s'ha pogut crear el premi." });
                } finally {
                  setSelectedImageFile(null);
                }
              }}
              onCancel={() => { setShowCreateModal(false); setSelectedImageFile(null); }}
              isSubmitting={isSubmittingForm}
              submitLabel="Crear Premi"
              onImageFileSelected={(f) => setSelectedImageFile(f)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingPrize} onOpenChange={(open) => !open && setEditingPrize(null)}>
        <DialogContent className="bg-black/90 border-white/20 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Premi</DialogTitle>
            <DialogDescription className="text-white/60">Modifica la informació del premi seleccionat.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {editingPrize && (
              <PrizeForm
                initialData={editingPrize}
                onSubmit={async (data) => {
                  try {
                    await updatePrize.mutateAsync({ id: editingPrize.id, ...data });
                    setEditingPrize(null);
                  } catch (e) {
                    toast({ variant: 'destructive', title: 'Error', description: "No s'ha pogut actualitzar el premi." });
                  }
                }}
                onCancel={() => setEditingPrize(null)}
                isSubmitting={isSubmittingForm}
                submitLabel="Guardar Canvis"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingPrize} onOpenChange={(open) => !open && setDeletingPrize(null)}>
        <AlertDialogContent className="bg-black/90 border-white/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              Confirmar Eliminació
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Estàs segur que vols eliminar el premi "{deletingPrize?.name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 border-white/20 text-white hover:bg-white/20">Cancel·lar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { try { await deletePrize.mutateAsync(deletingPrize.id); setDeletingPrize(null); } catch (e) { toast({ variant: 'destructive', title: 'Error', description: "No s'ha pogut eliminar el premi." }); } }} className="bg-red-600 hover:bg-red-700 text-white">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmTogglePrize} onOpenChange={(open) => !open && setConfirmTogglePrize(null)}>
        <AlertDialogContent className="bg-black/90 border-padel-primary/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-padel-primary" />
              Confirmar ocultació del premi
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">Estàs segur que vols ocultar (desactivar) el premi?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 border-white/20 text-white hover:bg-white/20">Cancel·lar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { try { await updatePrize.mutateAsync({ id: confirmTogglePrize.id, is_active: false }); setConfirmTogglePrize(null); } catch (e) { toast({ variant: 'destructive', title: 'Error', description: "No s'ha pogut desactivar el premi." }); } }} className="bg-padel-primary text-black flex items-center gap-2" disabled={togglingPrizeId === confirmTogglePrize?.id}>
              {togglingPrizeId === confirmTogglePrize?.id ? (<Loader className="h-4 w-4 animate-spin text-black" />) : null}
              Ocultar premi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
