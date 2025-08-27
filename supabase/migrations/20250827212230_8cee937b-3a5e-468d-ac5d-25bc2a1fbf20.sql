-- Fix RPC ambiguity: remove old overload using INTEGER for nomor_awal/nomor_akhir
-- Keep the NUMERIC version only

BEGIN;

DROP FUNCTION IF EXISTS public.upsert_laporan_harian(
  p_id text,
  p_user_id uuid,
  p_tanggal text,
  p_shift integer,
  p_jam_kerja text,
  p_nomor_awal integer,
  p_nomor_akhir integer,
  p_total_liter numeric,
  p_total_setoran numeric,
  p_qris numeric,
  p_cash numeric,
  p_pu numeric,
  p_total_keseluruhan numeric
);

COMMIT;