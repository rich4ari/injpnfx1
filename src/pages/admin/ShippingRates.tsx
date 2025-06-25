import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Truck, Save, Download, Upload, AlertTriangle } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { prefectures } from '@/data/prefectures';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ShippingRate, shippingRates as defaultRates } from '@/utils/shippingCost';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useShippingRates } from '@/hooks/useShippingRates';

const ShippingRates = () => {
  const { rates, loading, updateShippingRate, updateAllShippingRates } = useShippingRates();
  const [saving, setSaving] = useState(false);
  const [editedRates, setEditedRates] = useState<Record<string, number>>({});
  const [fileInput, setFileInput] = useState<HTMLInputElement | null>(null);

  useEffect(() => {
    // Initialize edited rates with current values
    const initialEditedRates: Record<string, number> = {};
    
    // First populate with default rates
    defaultRates.forEach(rate => {
      initialEditedRates[rate.prefecture] = rate.cost;
    });
    
    // Then override with fetched rates
    rates.forEach(rate => {
      initialEditedRates[rate.prefecture] = rate.cost;
    });
    
    setEditedRates(initialEditedRates);
  }, [rates]);

  const handleRateChange = (prefecture: string, value: string) => {
    const cost = parseInt(value);
    if (!isNaN(cost) && cost >= 0) {
      setEditedRates(prev => ({
        ...prev,
        [prefecture]: cost
      }));
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // Create array of updated rates
      const updatedRates = prefectures.map(prefecture => {
        const existingRate = rates.find(r => r.prefecture === prefecture.name);
        const defaultRate = defaultRates.find(r => r.prefecture === prefecture.name);
        const editedCost = editedRates[prefecture.name];
        
        return {
          prefecture: prefecture.name,
          cost: editedCost !== undefined ? editedCost : (existingRate?.cost || defaultRate?.cost || 800),
          estimatedDays: existingRate?.estimatedDays || defaultRate?.estimatedDays || '3-5 hari'
        };
      });
      
      // Update all rates in Firebase
      const success = await updateAllShippingRates(updatedRates);
      
      if (success) {
        toast({
          title: "Berhasil",
          description: "Semua tarif ongkir berhasil diperbarui",
        });
      }
    } catch (error) {
      console.error('Error saving shipping rates:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan tarif ongkir. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = () => {
    try {
      // Prepare CSV content
      const headers = ['Prefecture', 'Cost', 'EstimatedDays'];
      const rows = rates.map(rate => [
        rate.prefecture,
        rate.cost.toString(),
        rate.estimatedDays
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `shipping-rates-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Berhasil",
        description: "Data ongkir berhasil diekspor ke CSV",
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({
        title: "Error",
        description: "Gagal mengekspor data ke CSV",
        variant: "destructive",
      });
    }
  };

  const handleImportClick = () => {
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const csvText = event.target?.result as string;
          const lines = csvText.split('\n');
          
          // Skip header row
          const dataRows = lines.slice(1).filter(line => line.trim());
          
          const importedRates: Record<string, number> = {};
          
          for (const row of dataRows) {
            const columns = row.split(',');
            
            if (columns.length >= 2) {
              const prefecture = columns[0].trim();
              const cost = parseInt(columns[1].trim());
              
              if (prefecture && !isNaN(cost)) {
                importedRates[prefecture] = cost;
              }
            }
          }
          
          // Update edited rates with imported values
          setEditedRates(prev => ({
            ...prev,
            ...importedRates
          }));
          
          toast({
            title: "Berhasil",
            description: `${Object.keys(importedRates).length} tarif ongkir berhasil diimpor. Klik Simpan untuk menyimpan perubahan.`,
          });
        } catch (error) {
          console.error('Error parsing CSV:', error);
          toast({
            title: "Error",
            description: "Gagal mengimpor data dari CSV. Pastikan format file benar.",
            variant: "destructive",
          });
        }
      };
      
      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Gagal membaca file CSV",
          variant: "destructive",
        });
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast({
        title: "Error",
        description: "Gagal mengimpor data dari CSV",
        variant: "destructive",
      });
    }
    
    // Reset file input
    if (event.target) {
      event.target.value = '';
    }
  };

  const hasChanges = () => {
    return Object.keys(editedRates).some(prefecture => {
      const rate = rates.find(r => r.prefecture === prefecture);
      const defaultRate = defaultRates.find(r => r.prefecture === prefecture);
      const currentCost = rate?.cost || defaultRate?.cost || 800;
      return editedRates[prefecture] !== currentCost;
    });
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Truck className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pengaturan Ongkir</h1>
              <p className="text-gray-600">Kelola tarif ongkir untuk setiap prefektur di Jepang</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={loading}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={handleImportClick}
              disabled={loading || saving}
            >
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
              ref={ref => setFileInput(ref)}
            />
          </div>
        </div>

        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Perubahan tarif ongkir akan langsung berlaku untuk semua pesanan baru. Pastikan tarif yang dimasukkan sudah benar.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Truck className="w-5 h-5" />
              <span>Tarif Ongkir per Prefektur</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Memuat data ongkir...</span>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Prefektur</TableHead>
                        <TableHead>Nama Latin</TableHead>
                        <TableHead>Tarif Ongkir (¥)</TableHead>
                        <TableHead>Estimasi Pengiriman</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prefectures.map((prefecture) => {
                        const rate = rates.find(r => r.prefecture === prefecture.name);
                        const defaultRate = defaultRates.find(r => r.prefecture === prefecture.name);
                        const currentCost = rate?.cost || defaultRate?.cost || 800;
                        const editedCost = editedRates[prefecture.name];
                        const isChanged = editedCost !== undefined && editedCost !== currentCost;
                        
                        // Highlight Nagano prefecture
                        const isNagano = prefecture.name === '長野県';
                        
                        return (
                          <TableRow 
                            key={prefecture.name} 
                            className={`
                              ${isChanged ? 'bg-blue-50' : ''}
                              ${isNagano ? 'bg-yellow-50 hover:bg-yellow-100' : ''}
                            `}
                          >
                            <TableCell className="font-medium">
                              {prefecture.name}
                              {isNagano && (
                                <Badge className="ml-2 bg-yellow-200 text-yellow-800">
                                  Lokasi Anda
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{prefecture.name_en}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-500">¥</span>
                                <Input
                                  type="number"
                                  min="0"
                                  value={editedCost !== undefined ? editedCost : currentCost}
                                  onChange={(e) => handleRateChange(prefecture.name, e.target.value)}
                                  className={`w-24 ${isChanged ? 'border-blue-500' : ''} ${isNagano ? 'border-yellow-500' : ''}`}
                                />
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="text"
                                value={rate?.estimatedDays || defaultRate?.estimatedDays || '3-5 hari'}
                                className="w-32"
                                disabled
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handleSaveAll}
                    disabled={saving || !hasChanges()}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Simpan Semua Perubahan
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Panduan Pengaturan Ongkir</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>• Tarif ongkir diatur per prefektur untuk seluruh Jepang</p>
            <p>• Perubahan tarif akan langsung berlaku untuk semua pesanan baru</p>
            <p>• Anda dapat mengekspor data ke CSV untuk backup atau analisis</p>
            <p>• Format CSV untuk import: "Prefektur,Tarif Ongkir,Estimasi Pengiriman"</p>
            <p>• Sistem secara otomatis memberikan gratis ongkir untuk pembelian di atas ¥15,000 (atau ¥10,000 untuk area Kanto)</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ShippingRates;