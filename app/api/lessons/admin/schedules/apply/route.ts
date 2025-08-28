import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import type { ScheduleTemplate } from "@/types/lessons";

interface ApplyBody {
  title?: string;
  valid_from: string;
  valid_to: string;
  days_of_week: number[];
  base_time_start: string; // HH:mm
  location?: string;
  timezone?: string;
  template: ScheduleTemplate;
  options?: { policy?: 'skip' | 'protect' | 'replace' };
  force?: boolean; // allow replacing conflicting slots without bookings
}

export async function POST(request: Request) {
  const supabase = createClient();
  const body = (await request.json()) as ApplyBody;

  // Validate
  if (!body.valid_from || !body.valid_to || !Array.isArray(body.days_of_week) || !body.base_time_start || !body.template?.blocks?.length) {
    return NextResponse.json({ error: "Paràmetres invàlids" }, { status: 400 });
  }

  const location = body.location || "Soses";
  const timezone = body.timezone || "Europe/Madrid";

  // Create batch record
  const { data: batch, error: batchErr } = await supabase
    .from('lesson_slot_batches')
    .insert({
      title: body.title || null,
      valid_from: body.valid_from,
      valid_to: body.valid_to,
      days_of_week: body.days_of_week,
      base_time_start: body.base_time_start,
      location,
      timezone,
      template: body.template,
      options: body.options || null,
    })
    .select('*')
    .single();

  if (batchErr) return NextResponse.json({ error: batchErr.message }, { status: 400 });

  // Generate slots using the batch template
  const from = new Date(body.valid_from + 'T00:00:00Z');
  const to = new Date(body.valid_to + 'T00:00:00Z');
  const dayMs = 24 * 60 * 60 * 1000;

  // Preload existing slots for quick checks
  const { data: existingSlots, error: exErr } = await supabase
    .from('lesson_slots')
    .select('id,start_at,end_at,location,locked_by_booking_id')
    .gte('start_at', from.toISOString())
    .lte('end_at', new Date(to.getTime() + dayMs).toISOString())
    .eq('location', location);
  if (exErr) return NextResponse.json({ error: exErr.message }, { status: 500 });

  let created_count = 0, skipped_count = 0, replaced_count = 0;

  const inserts: any[] = [];
  const deletions: number[] = [];

  for (let ts = from.getTime(); ts <= to.getTime(); ts += dayMs) {
    const day = new Date(ts);
    const dow = day.getUTCDay();
    if (!body.days_of_week.includes(dow)) continue;

    const [bh, bm] = body.base_time_start.split(':').map(Number);
    const cursorStart = new Date(day);
    cursorStart.setUTCHours(bh, bm || 0, 0, 0);
    let cursor = new Date(cursorStart);

    for (const block of body.template.blocks) {
      if (block.kind === 'lesson') {
        const start = new Date(cursor);
        const end = new Date(start.getTime() + block.duration_minutes * 60 * 1000);

        // Check overlap with existingSlots
        const overlap = (existingSlots || []).find(s => {
          const sStart = new Date(s.start_at).getTime();
          const sEnd = new Date(s.end_at).getTime();
          return start.getTime() < sEnd && end.getTime() > sStart;
        });

        if (overlap) {
          if (body.options?.policy === 'replace' && !overlap.locked_by_booking_id && body.force) {
            deletions.push(overlap.id);
            inserts.push({
              start_at: start.toISOString(),
              end_at: end.toISOString(),
              max_capacity: block.max_capacity ?? body.template.defaults?.max_capacity ?? 4,
              location,
              status: 'open',
              joinable: block.joinable ?? body.template.defaults?.joinable ?? true,
              created_from_batch_id: batch.id,
            });
            replaced_count++;
          } else {
            skipped_count++;
          }
        } else {
          inserts.push({
            start_at: start.toISOString(),
            end_at: end.toISOString(),
            max_capacity: block.max_capacity ?? body.template.defaults?.max_capacity ?? 4,
            location,
            status: 'open',
            joinable: block.joinable ?? body.template.defaults?.joinable ?? true,
            created_from_batch_id: batch.id,
          });
          created_count++;
        }
        cursor = end;
      } else {
        // break
        cursor = new Date(cursor.getTime() + block.duration_minutes * 60 * 1000);
      }
    }
  }

  // Execute deletions then inserts
  if (deletions.length > 0) {
    await supabase.from('lesson_slots').delete().in('id', deletions);
  }

  // Insert in chunks to avoid payload limits
  const chunkSize = 200;
  for (let i = 0; i < inserts.length; i += chunkSize) {
    const chunk = inserts.slice(i, i + chunkSize);
    const { error } = await supabase.from('lesson_slots').insert(chunk);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    batch_id: batch.id,
    created_count,
    skipped_count,
    replaced_count,
  });
}
