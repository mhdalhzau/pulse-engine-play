-- Update nomor_awal and nomor_akhir columns to accept decimal values
ALTER TABLE public.laporan_harian 
ALTER COLUMN nomor_awal TYPE NUMERIC;

ALTER TABLE public.laporan_harian 
ALTER COLUMN nomor_akhir TYPE NUMERIC;