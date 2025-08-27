import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { CalendarDays, Clock, Fuel, DollarSign, FileImage, Share2, Save, Plus, Minus, LogOut } from "lucide-react";
import html2canvas from "html2canvas";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Helper: normalisasi angka desimal - deteksi otomatis . dan , sebagai desimal
function parseDecimal(input: string | number): number {
  if (typeof input !== "string") return Number(input) || 0;
  const raw = input.trim();
  
  if (/[.,]\d{1,2}$/.test(raw)) {
    const cleaned = raw.replace(/([.,])(\d{1,2})$/, ".$2");
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
  
  const n = parseFloat(raw.replace(/[.,]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

interface PUItem {
  keterangan: string;
  nominal: number;
}

interface LaporanData {
  tanggal: string;
  jam: string;
  nomorAwal: number;
  nomorAkhir: number;
  nomorAwalInput: string;
  nomorAkhirInput: string;
  qris: number;
  puItems: PUItem[];
}

export default function LaporanHarian() {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
  const formattedDate = today.toLocaleDateString("id-ID", options);

  const [data, setData] = useState<LaporanData>({
    tanggal: formattedDate,
    jam: "1",
    nomorAwal: 1192.86,
    nomorAkhir: 1254.03,
    nomorAwalInput: "1192,86",
    nomorAkhirInput: "1254,03",
    qris: 26_500,
    puItems: [
      { keterangan: "minum", nominal: 20_000 },
      { keterangan: "makan", nominal: 30_000 },
    ],
  });

  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = (number: number): string => new Intl.NumberFormat("id-ID").format(number || 0);
  
  const handleShiftChange = (value: string) => setData({ ...data, jam: value });

  const handleMeterInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const inputName = `${name}Input` as keyof LaporanData;
    setData({ ...data, [inputName]: value });
  };

  const handleMeterBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = parseDecimal(value);
    const inputName = `${name}Input` as keyof LaporanData;
    setData(prevData => ({ 
      ...prevData, 
      [name]: numericValue,
      [inputName]: numericValue.toString().replace(".", ",")
    }));
  };

  const getCurrentMeterValue = (fieldName: 'nomorAwal' | 'nomorAkhir'): number => {
    const inputFieldName = `${fieldName}Input` as keyof LaporanData;
    const inputValue = data[inputFieldName] as string;
    return parseDecimal(inputValue);
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numeric = value.replace(/[^0-9]/g, "");
    setData({ ...data, [name]: parseInt(numeric) || 0 });
  };

  const handlePUChange = (index: number, field: 'keterangan' | 'nominal', value: string) => {
    const newPUItems = [...data.puItems];
    if (field === "nominal") {
      const numeric = value.replace(/[^0-9]/g, "");
      newPUItems[index].nominal = parseInt(numeric) || 0;
    } else {
      newPUItems[index].keterangan = value;
    }
    setData({ ...data, puItems: newPUItems });
  };

  const addPUField = () => setData({ ...data, puItems: [...data.puItems, { keterangan: "", nominal: 0 }] });
  const removePUField = (index: number) => setData({ ...data, puItems: data.puItems.filter((_, i) => i !== index) });

  // ====== Perhitungan baru ======
  const hargaPerLiter = 11500;
  const currentNomorAwal = getCurrentMeterValue('nomorAwal');
  const currentNomorAkhir = getCurrentMeterValue('nomorAkhir');
  
  const totalLiter = currentNomorAkhir - currentNomorAwal;
  const totalSetoran = Math.round(totalLiter * hargaPerLiter);

  const cash = totalSetoran - data.qris; 
  const totalPU = data.puItems.reduce((sum, item) => sum + (item.nominal || 0), 0);
  const totalKeseluruhan = cash - totalPU;

  // ====== Web Share ======
  const canWebShare = () =>
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    window.isSecureContext === true;

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      alert("Laporan disalin ke clipboard!");
    } catch (err) {
      console.error("Clipboard copy failed", err);
      alert("Gagal menyalin. Silakan salin manual.");
    }
  };

  const buildShareText = () => {
    return (
      `Setoran Harian\n` +
      `${data.tanggal} Jam ${data.jam}\n` +
      `Nomor awal: ${currentNomorAwal}\n` +
      `Nomor akhir: ${currentNomorAkhir}\n` +
      `Total liter: ${totalLiter.toFixed(2)}\n\n` +
      `Cash: Rp ${formatCurrency(cash)}\n` +
      `Qris: Rp ${formatCurrency(data.qris)}\n` +
      `Total: Rp ${formatCurrency(totalSetoran)}\n\n` +
      `PU:` + data.puItems.map((it) => `\n- ${it.keterangan || "-"}: Rp ${formatCurrency(it.nominal)}`).join("") +
      `\nTotal PU: Rp ${formatCurrency(totalPU)}\n\n` +
      `Total keseluruhan: Rp ${formatCurrency(totalKeseluruhan)}`
    );
  };

  const handleShare = async () => {
    const text = buildShareText();
    if (canWebShare()) {
      try {
        await navigator.share({ title: "Laporan Harian", text });
        return;
      } catch (err: any) {
        if (err && (err.name === "AbortError" || err.name === "NotAllowedError")) {
          console.warn("Share dibatalkan / tidak diizinkan, fallback ke copy.");
        } else {
          console.warn("Share gagal, fallback ke copy.", err);
        }
      }
    }
    await copyToClipboard(text);
  };

  const handleExportImage = () => {
    const reportElement = document.getElementById("laporan-table");
    if (!reportElement) return;
    html2canvas(reportElement, { backgroundColor: "#ffffff", scale: 2 }).then((canvas) => {
      const link = document.createElement("a");
      link.download = "laporan-harian.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  };

  // Generate ID format: yyyyMMdd-Shift
  const generateReportId = (shift: string) => {
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    return `${dateStr}-${shift}`;
  };

  // Get shift description
  const getShiftDescription = (shiftNumber: string) => {
    return shiftNumber === "1" ? "07:00 - 14:00" : "14:00 - 22:00";
  };

  const handleSaveLaporan = async () => {
    setIsLoading(true);
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        toast({
          title: "Error",
          description: "Anda harus login terlebih dahulu",
          variant: "destructive",
        });
        return;
      }

      const reportId = generateReportId(data.jam);
      const jamKerja = getShiftDescription(data.jam);

      // Use the upsert function to insert or update
      const { data: result, error } = await supabase.rpc('upsert_laporan_harian', {
        p_id: reportId,
        p_user_id: user.id,
        p_tanggal: data.tanggal,
        p_shift: parseInt(data.jam),
        p_jam_kerja: jamKerja,
        p_nomor_awal: currentNomorAwal,
        p_nomor_akhir: currentNomorAkhir,
        p_total_liter: totalLiter,
        p_total_setoran: totalSetoran,
        p_qris: data.qris,
        p_cash: cash,
        p_pu: totalPU,
        p_total_keseluruhan: totalKeseluruhan
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Berhasil Disimpan",
        description: `Laporan untuk ${data.tanggal} shift ${data.jam} berhasil disimpan`,
      });

    } catch (error) {
      console.error('Error saving report:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan laporan",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    try {
      console.assert(parseDecimal("1.210,43") === 1210.43, "Test desimal (koma)");
      console.assert(parseDecimal("1210.43") === 1210.43, "Test desimal (titik)");
      console.assert(
        [{ nominal: 10_000 }, { nominal: 15_000 }].reduce((s, i) => s + i.nominal, 0) === 25_000,
        "Test total PU"
      );
    } catch (_) {}
  }, []);

  const shareSupported = canWebShare();

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-center flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">Setoran Harian</h1>
              <p className="text-muted-foreground">Kelola laporan setoran harian dengan mudah</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => signOut()}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
          {user && (
            <div className="text-center text-sm text-muted-foreground">
              Login sebagai: {user.email}
            </div>
          )}
        </div>

        <Card id="laporan-table" className="shadow-custom-lg bg-gradient-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <CalendarDays className="h-5 w-5 text-primary" />
              Laporan Setoran - {data.tanggal}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Waktu Shift */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Jam Kerja
              </Label>
              <Select value={data.jam} onValueChange={handleShiftChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih jam kerja" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Shift 1 (07:00 - 14:00)</SelectItem>
                  <SelectItem value="2">Shift 2 (14:00 - 22:00)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Data Meter */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Fuel className="h-5 w-5 text-accent" />
                Data Meter & Volume
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nomorAwal">Nomor Awal</Label>
                  <Input
                    type="text"
                    id="nomorAwal"
                    name="nomorAwal"
                    value={data.nomorAwalInput}
                    onChange={handleMeterInputChange}
                    onBlur={handleMeterBlur}
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nomorAkhir">Nomor Akhir</Label>
                  <Input
                    type="text"
                    id="nomorAkhir"
                    name="nomorAkhir"
                    value={data.nomorAkhirInput}
                    onChange={handleMeterInputChange}
                    onBlur={handleMeterBlur}
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Liter</Label>
                  <div className="flex items-center h-10 px-3 py-2 border rounded-md bg-muted">
                    <Badge variant="secondary" className="ml-auto">
                      {totalLiter.toFixed(2)} L
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Setoran */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-success" />
                Setoran
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Cash</Label>
                  <div className="flex items-center h-10 px-3 py-2 border rounded-md bg-muted">
                    <span className="text-sm text-muted-foreground mr-2">Rp</span>
                    <span className="font-medium">{formatCurrency(cash)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qris">QRIS</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                      Rp
                    </span>
                    <Input
                      id="qris"
                      name="qris"
                      type="text"
                      value={formatCurrency(data.qris)}
                      onChange={handleCurrencyChange}
                      className="pl-8 text-right"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Total</Label>
                  <div className="flex items-center h-10 px-3 py-2 border rounded-md bg-success/10 border-success/20">
                    <span className="text-sm text-success mr-2">Rp</span>
                    <Badge variant="outline" className="ml-auto border-success text-success">
                      {formatCurrency(totalSetoran)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* PU */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Pengeluaran (PU)</h3>
                <Button variant="outline" size="sm" onClick={addPUField}>
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah
                </Button>
              </div>
              
              <div className="space-y-3">
                {data.puItems.map((item, index) => (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1 space-y-2">
                      <Label>Keterangan</Label>
                      <Input
                        placeholder="Deskripsi pengeluaran"
                        value={item.keterangan}
                        onChange={(e) => handlePUChange(index, "keterangan", e.target.value)}
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label>Nominal</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                          Rp
                        </span>
                        <Input
                          type="text"
                          placeholder="0"
                          value={formatCurrency(item.nominal)}
                          onChange={(e) => handlePUChange(index, "nominal", e.target.value)}
                          className="pl-8 text-right"
                        />
                      </div>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => removePUField(index)}
                      className="h-10 w-10 p-0"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center p-3 bg-warning/10 border border-warning/20 rounded-md">
                <span className="font-medium">Total PU:</span>
                <Badge variant="outline" className="border-warning text-warning">
                  Rp {formatCurrency(totalPU)}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Total Keseluruhan */}
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total Keseluruhan:</span>
                <Badge className="text-lg px-4 py-2">
                  Rp {formatCurrency(totalKeseluruhan)}
                </Badge>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                variant="gradient" 
                className="flex-1"
                onClick={handleSaveLaporan}
                disabled={isLoading}
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Menyimpan..." : "Simpan Laporan"}
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleShare}
                title={shareSupported ? "Bagikan" : "Salin ke clipboard"}
              >
                <Share2 className="h-4 w-4 mr-2" />
                {shareSupported ? "Bagikan" : "Salin"}
              </Button>
              <Button 
                variant="secondary" 
                className="flex-1"
                onClick={handleExportImage}
              >
                <FileImage className="h-4 w-4 mr-2" />
                Export Image
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
