"use client";
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { dayNames } from './utils';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  entryForm: any;
  setEntryForm: (f: any) => void;
  onSave: () => void;
}

export default function EntryDialog({ open, onOpenChange, entryForm, setEntryForm, onSave }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => onOpenChange(o)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Afegir entrada</DialogTitle>
          <DialogDescription>{entryForm?.day !== undefined && `Dia: ${dayNames[entryForm.day]}`}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-medium">Tipus</label>
              <select className="mt-1 w-full border rounded px-2 py-1 bg-background" value={entryForm.kind} onChange={(e) => setEntryForm((f: any) => ({ ...f, kind: e.target.value }))}>
                <option value="class">Classe</option>
                <option value="break">Pausa</option>
              </select>
            </div>
            <div>
              <label className="font-medium">Inici</label>
              <Input className="mt-1" type="time" value={entryForm.start_time} onChange={(e) => setEntryForm((f: any) => ({ ...f, start_time: e.target.value }))} />
            </div>
            <div>
              <label className="font-medium">Final</label>
              <Input className="mt-1" type="time" value={entryForm.end_time} onChange={(e) => setEntryForm((f: any) => ({ ...f, end_time: e.target.value }))} />
            </div>
            {entryForm.kind === 'class' && (
              <div>
                <label className="font-medium">Capacitat</label>
                <Input className="mt-1" type="number" min={1} max={32} value={entryForm.capacity} onChange={(e) => setEntryForm((f: any) => ({ ...f, capacity: Number(e.target.value) }))} />
              </div>
            )}
            <div className="col-span-2">
              <label className="font-medium">Ubicació</label>
              <Input className="mt-1" value={entryForm.location} onChange={(e) => setEntryForm((f: any) => ({ ...f, location: e.target.value }))} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onSave}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
