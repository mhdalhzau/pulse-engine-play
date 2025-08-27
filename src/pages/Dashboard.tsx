import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CalendarDays, Filter, Search, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface LaporanData {
  id: string;
  user_id: string;
  tanggal: string;
  shift: number;
  jam_kerja: string;
  nomor_awal?: number;
  nomor_akhir?: number;
  total_liter?: number;
  total_setoran?: number;
  qris?: number;
  cash?: number;
  pu?: number;
  total_keseluruhan?: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    name: string;
  } | null;
}

export default function Dashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [data, setData] = useState<LaporanData[]>([]);
  const [filteredData, setFilteredData] = useState<LaporanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const formatCurrency = (number: number): string => 
    new Intl.NumberFormat("id-ID").format(number || 0);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: laporanData, error } = await supabase
        .from('laporan_harian')
        .select('*')
        .order(sortBy, { ascending: sortOrder === "asc" });

      if (error) throw error;

      setData(laporanData || []);
      setFilteredData(laporanData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data laporan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [sortBy, sortOrder]);

  useEffect(() => {
    const filtered = data.filter(item => 
      item.tanggal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(filtered);
  }, [searchTerm, data]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Dashboard Admin</h1>
                <p className="text-muted-foreground">Kelola dan sortir data laporan harian</p>
              </div>
            </div>
          </div>
          {user && (
            <div className="text-center text-sm text-muted-foreground">
              Login sebagai: {user.email}
            </div>
          )}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter & Pencarian
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Pencarian</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari berdasarkan tanggal, ID, atau User ID"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Urutkan berdasarkan</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Tanggal Dibuat</SelectItem>
                    <SelectItem value="tanggal">Tanggal Laporan</SelectItem>
                    <SelectItem value="shift">Shift</SelectItem>
                    <SelectItem value="total_setoran">Total Setoran</SelectItem>
                    <SelectItem value="total_keseluruhan">Total Keseluruhan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Urutan</label>
                <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Terbaru ke Terlama</SelectItem>
                    <SelectItem value="asc">Terlama ke Terbaru</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Data Laporan Harian ({filteredData.length} laporan)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Memuat data...</p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Tidak ada data ditemukan</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => handleSort('tanggal')}
                      >
                        Tanggal
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => handleSort('shift')}
                      >
                        Shift
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => handleSort('jam_kerja')}
                      >
                        Jam Kerja
                      </TableHead>
                      <TableHead>
                        Nama
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => handleSort('nomor_awal')}
                      >
                        Nomor Awal
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => handleSort('nomor_akhir')}
                      >
                        Nomor Akhir
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => handleSort('total_liter')}
                      >
                        Total Liter
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => handleSort('cash')}
                      >
                        Cash
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => handleSort('qris')}
                      >
                        QRIS
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => handleSort('total_setoran')}
                      >
                        Total
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => handleSort('pu')}
                      >
                        Total PU
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => handleSort('total_keseluruhan')}
                      >
                        Total Keseluruhan
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.tanggal}</TableCell>
                        <TableCell>
                          <Badge variant={item.shift === 1 ? "default" : "secondary"}>
                            Shift {item.shift}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.jam_kerja}</TableCell>
                        <TableCell>User {item.user_id.substring(0, 8)}...</TableCell>
                        <TableCell>{item.nomor_awal || '-'}</TableCell>
                        <TableCell>{item.nomor_akhir || '-'}</TableCell>
                        <TableCell>{item.total_liter || '-'}</TableCell>
                        <TableCell>Rp {formatCurrency(item.cash || 0)}</TableCell>
                        <TableCell>Rp {formatCurrency(item.qris || 0)}</TableCell>
                        <TableCell>Rp {formatCurrency(item.total_setoran || 0)}</TableCell>
                        <TableCell>Rp {formatCurrency(item.pu || 0)}</TableCell>
                        <TableCell>
                          <div className="font-semibold text-primary">
                            Rp {formatCurrency(item.total_keseluruhan || 0)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}