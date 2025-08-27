-- Fix security warnings by setting search_path for functions

-- Update the timestamp update function with proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Update the upsert function with proper search_path
CREATE OR REPLACE FUNCTION public.upsert_laporan_harian(
  p_id TEXT,
  p_user_id UUID,
  p_tanggal TEXT,
  p_shift INTEGER,
  p_jam_kerja TEXT,
  p_nomor_awal INTEGER DEFAULT NULL,
  p_nomor_akhir INTEGER DEFAULT NULL,
  p_total_liter DECIMAL DEFAULT NULL,
  p_total_setoran DECIMAL DEFAULT NULL,
  p_qris DECIMAL DEFAULT NULL,
  p_cash DECIMAL DEFAULT NULL,
  p_pu DECIMAL DEFAULT NULL,
  p_total_keseluruhan DECIMAL DEFAULT NULL
)
RETURNS public.laporan_harian 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;