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
import { Badge } from '@/components/ui/badge';
import { 
  getShippingRates, 
  updateShippingRate, 
  updateMultipleShippingRates,
  exportShippingRatesToCSV
} from '@/services/shippingService';

const ShippingRates = () => {
  const [saving, setSaving] = useState(false);
  const [editedRates, setEditedRates] = useState<Record<string, number>>({});
  const [fileInput, setFileInput] = useState<HTMLInputElement | null>(null);
  const [currentRates, setCurrentRates] = useState<ShippingRate[]>([...defaultRates]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch current rates from Firebase
  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching shipping rates from Firebase...');
        const fetchedRates = await getShippingRates();
        
        if (fetchedRates && fetchedRates.length > 0) {
          console.log(`Loaded ${fetchedRates.length} shipping rates from Firebase`);
          setCurrentRates(fetchedRates);
        } else {
          console.log('No shipping rates found in Firebase, using defaults');
          setCurrentRates([...defaultRates]);
        }
      } catch (err) {
        console.error('Error fetching shipping rates:', err);
        setError('Gagal memuat tarif ongkir. Menggunakan tarif default.');
        setCurrentRates([...defaultRates]);
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, []);

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
    if (!hasChanges()) return;
    
    setSaving(true);
    setError(null);
    
    try {
      console.log('Saving shipping rate changes...');
      
      // Create updated rates by merging current rates with edited rates
      const updatedRates = currentRates.map(rate => {
        if (editedRates[rate.prefecture] !== undefined) {
          return {
            ...rate,
            cost: editedRates[rate.prefecture]
          };
        }
        return rate;
      });

      // Add any new rates that might not be in currentRates
      Object.entries(editedRates).forEach(([prefecture, cost]) => {
        if (!updatedRates.some(rate => rate.prefecture === prefecture)) {
          // Find the default rate for this prefecture to get the estimated days
          const defaultRate = defaultRates.find(r => r.prefecture === prefecture);
          if (defaultRate) {
            updatedRates.push({
              prefecture,
              cost,
              estimatedDays: defaultRate.estimatedDays || '3-5 hari'
            });
          }
        }
      });

      // Save each rate to Firebase
      const result = await updateMultipleShippingRates(updatedRates);
      
      if (result) {
        // Update current rates
        setCurrentRates(updatedRates);
        
        // Clear edited rates
        setEditedRates({});

        toast({
          title: "Berhasil",
          description: "Semua tarif ongkir berhasil diperbarui",
        });
      } else {
        throw new Error('Failed to update shipping rates');
      }
    } catch (error) {
      console.error('Error saving shipping rates:', error);
      setError('Gagal menyimpan tarif ongkir. Silakan coba lagi.');
      
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
      exportShippingRatesToCSV(currentRates);
      
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
              
              if (prefecture && !isNaN(cost) && cost >= 0) {
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
    return Object.keys(editedRates).length > 0;
  };

  // Get rate for a prefecture (either edited or current)
  const getRateForPrefecture = (prefecture: string): number => {
    if (editedRates[prefecture] !== undefined) {
      return editedRates[prefecture];
    }
    
    const currentRate = currentRates.find(r => r.prefecture === prefecture);
    if (currentRate) {
      return currentRate.cost;
    }
    
    const defaultRate = defaultRates.find(r => r.prefecture === prefecture);
    return defaultRate?.cost || 800;
  };

  // Get estimated days for a prefecture
  const getEstimatedDaysForPrefecture = (prefecture: string): string => {
    const currentRate = currentRates.find(r => r.prefecture === prefecture);
    if (currentRate?.estimatedDays) {
      return currentRate.estimatedDays;
    }
    
    const defaultRate = defaultRates.find(r => r.prefecture === prefecture);
    return defaultRate?.estimatedDays || '3-5 hari';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

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
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={handleImportClick}
              disabled={saving}
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

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-600">
              {error}
            </AlertDescription>
          </Alert>
        )}

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
                    const currentCost = getRateForPrefecture(prefecture.name);
                    const editedCost = editedRates[prefecture.name];
                    const isChanged = editedCost !== undefined;
                    
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
                            value={getEstimatedDaysForPrefecture(prefecture.name)}
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