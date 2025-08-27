import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PUItem {
  id: string;
  user_id: string;
  tanggal: string;
  shift: number;
  keterangan: string;
  nominal: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    name: string;
  };
}

const PUDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [puItems, setPuItems] = useState<PUItem[]>([]);
  const [filteredPuItems, setFilteredPuItems] = useState<PUItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchPuData = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('pu_items')
        .select(`
          *,
          profiles(name)
        `);

      if (sortField) {
        query = query.order(sortField, { ascending: sortOrder === "asc" });
      }

      const { data, error } = await query;

      if (error) throw error;

      setPuItems(data || []);
      setFilteredPuItems(data || []);
    } catch (error) {
      console.error("Error fetching PU data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal mengambil data PU.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPuData();
  }, [sortField, sortOrder]);

  useEffect(() => {
    const filtered = puItems.filter((item) =>
      item.keterangan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tanggal.includes(searchTerm)
    );
    setFilteredPuItems(filtered);
  }, [searchTerm, puItems]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID");
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Home
          </Button>
          <h1 className="text-2xl font-bold">Dashboard PU Harian</h1>
        </div>
        <div className="text-sm text-muted-foreground">
          Login sebagai: {user?.email}
        </div>
      </div>

      {/* Filter Card */}
      <Card>
        <CardHeader>
          <CardTitle>Filter & Pencarian</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari berdasarkan keterangan, nama, atau tanggal..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={sortField} onValueChange={setSortField}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sortir berdasarkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Tanggal Dibuat</SelectItem>
                <SelectItem value="tanggal">Tanggal Laporan</SelectItem>
                <SelectItem value="shift">Shift</SelectItem>
                <SelectItem value="nominal">Nominal</SelectItem>
                <SelectItem value="keterangan">Keterangan</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Urutan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">A-Z / Terkecil</SelectItem>
                <SelectItem value="desc">Z-A / Terbesar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>Data PU Harian ({filteredPuItems.length} item)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredPuItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada data PU yang ditemukan.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('tanggal')}>
                      Tanggal {sortField === 'tanggal' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('shift')}>
                      Shift {sortField === 'shift' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('user_id')}>
                      Nama {sortField === 'user_id' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('keterangan')}>
                      Keterangan {sortField === 'keterangan' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('nominal')}>
                      Nominal {sortField === 'nominal' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('created_at')}>
                      Dibuat {sortField === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPuItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.tanggal}</TableCell>
                      <TableCell>Shift {item.shift}</TableCell>
                      <TableCell>{item.profiles?.name || 'Unknown User'}</TableCell>
                      <TableCell>{item.keterangan}</TableCell>
                      <TableCell>{formatCurrency(item.nominal)}</TableCell>
                      <TableCell>{formatDate(item.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PUDashboard;