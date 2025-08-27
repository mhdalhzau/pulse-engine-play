-- Create table for daily reports
CREATE TABLE public.laporan_harian (
  id TEXT PRIMARY KEY, -- Format: yyyyMMdd-Shift (e.g., 20250827-1)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tanggal TEXT NOT NULL, -- Full date format like "Rabu, 27 Agustus 2025"
  shift INTEGER NOT NULL CHECK (shift IN (1, 2)),
  jam_kerja TEXT NOT NULL, -- Work hours description like "07:00 - 14:00"
  nomor_awal INTEGER,
  nomor_akhir INTEGER,
  total_liter DECIMAL(10, 2),
  total_setoran DECIMAL(15, 2),
  qris DECIMAL(15, 2),
  cash DECIMAL(15, 2),
  pu DECIMAL(15, 2),
  total_keseluruhan DECIMAL(15, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.laporan_harian ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own reports" 
ON public.laporan_harian 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reports" 
ON public.laporan_harian 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports" 
ON public.laporan_harian 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports" 
ON public.laporan_harian 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_laporan_harian_updated_at
  BEFORE UPDATE ON public.laporan_harian
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create upsert function for daily reports
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
RETURNS public.laporan_harian AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;