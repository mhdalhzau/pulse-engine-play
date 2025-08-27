-- Update the upsert_laporan_harian function to use NUMERIC type for nomor_awal and nomor_akhir parameters
CREATE OR REPLACE FUNCTION public.upsert_laporan_harian(
  p_id text, 
  p_user_id uuid, 
  p_tanggal text, 
  p_shift integer, 
  p_jam_kerja text, 
  p_nomor_awal NUMERIC DEFAULT NULL, 
  p_nomor_akhir NUMERIC DEFAULT NULL, 
  p_total_liter numeric DEFAULT NULL, 
  p_total_setoran numeric DEFAULT NULL, 
  p_qris numeric DEFAULT NULL, 
  p_cash numeric DEFAULT NULL, 
  p_pu numeric DEFAULT NULL, 
  p_total_keseluruhan numeric DEFAULT NULL
)
RETURNS laporan_harian
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result public.laporan_harian;
BEGIN
  INSERT INTO public.laporan_harian (
    id, user_id, tanggal, shift, jam_kerja, 
    nomor_awal, nomor_akhir, total_liter, total_setoran,
    qris, cash, pu, total_keseluruhan
  ) VALUES (
    p_id, p_user_id, p_tanggal, p_shift, p_jam_kerja,
    p_nomor_awal, p_nomor_akhir, p_total_liter, p_total_setoran,
    p_qris, p_cash, p_pu, p_total_keseluruhan
  )
  ON CONFLICT (id) DO UPDATE SET
    tanggal = EXCLUDED.tanggal,
    shift = EXCLUDED.shift,
    jam_kerja = EXCLUDED.jam_kerja,
    nomor_awal = EXCLUDED.nomor_awal,
    nomor_akhir = EXCLUDED.nomor_akhir,
    total_liter = EXCLUDED.total_liter,
    total_setoran = EXCLUDED.total_setoran,
    qris = EXCLUDED.qris,
    cash = EXCLUDED.cash,
    pu = EXCLUDED.pu,
    total_keseluruhan = EXCLUDED.total_keseluruhan,
    updated_at = NOW()
  RETURNING * INTO result;
  
  RETURN result;
END;
$function$