import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { IRowData } from './types';
import { UploadIcon, SearchIcon, TableIcon, XCircleIcon } from './components/Icons';

// TypeScript declaration for the SheetJS library loaded from CDN.
declare var XLSX: any;

const App: React.FC = () => {
  const [data, setData] = useState<IRowData[]>([]);
  const [filteredData, setFilteredData] = useState<IRowData[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const expectedHeaders = ['NTE', 'Municipio', 'Cod.SEC', 'Nome Escola', 'Valor'];

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setFileName(file.name);
    setData([]);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const fileData = e.target?.result;
        const workbook = XLSX.read(fileData, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
            setError('The selected file is empty or in an unsupported format.');
            setIsLoading(false);
            return;
        }

        const headers = Object.keys(jsonData[0]);
        const hasAllHeaders = expectedHeaders.every(header => headers.includes(header));
        
        if (!hasAllHeaders) {
            setError(`The file is missing required columns. Please ensure it has: ${expectedHeaders.join(', ')}.`);
            setIsLoading(false);
            setFileName(null);
            return;
        }

        const typedData: IRowData[] = jsonData.map(row => ({
            'NTE': row['NTE'],
            'Municipio': row['Municipio'],
            'Cod.SEC': row['Cod.SEC'],
            'Nome Escola': row['Nome Escola'],
            'Valor': row['Valor']
        }));

        setData(typedData);
      } catch (err) {
        setError('Failed to parse the XLSX file. Please check the file format and try again.');
        setFileName(null);
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
        setError('Failed to read the file.');
        setIsLoading(false);
        setFileName(null);
    }
    reader.readAsBinaryString(file);
  };
  
  const filterData = useCallback(() => {
    if (!searchTerm) {
      setFilteredData(data);
      return;
    }

    const lowercasedFilter = searchTerm.toLowerCase();
    const filtered = data.filter((item) =>
      item['Cod.SEC']?.toString().toLowerCase().includes(lowercasedFilter)
    );
    setFilteredData(filtered);
  }, [data, searchTerm]);

  useEffect(() => {
    filterData();
  }, [searchTerm, data, filterData]);

  const clearFile = () => {
      setData([]);
      setFilteredData([]);
      setSearchTerm('');
      setFileName(null);
      setError(null);
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if(fileInput) fileInput.value = '';
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-blue-600 dark:text-blue-400">XLSX Data Viewer</h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Upload, view, and filter your spreadsheet data instantly.</p>
        </header>

        <main>
          <div className="bg-white dark:bg-gray-900 shadow-xl rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div>
                <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Upload XLSX File</label>
                <div className="flex items-center space-x-4">
                  <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md inline-flex items-center transition-transform transform hover:scale-105">
                    <UploadIcon className="w-5 h-5 mr-2" />
                    <span>Choose File</span>
                    <input id="file-upload" type="file" accept=".xlsx" className="hidden" onChange={handleFileChange} />
                  </label>
                  {fileName && (
                    <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate max-w-xs">{fileName}</span>
                        <button onClick={clearFile} className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400">
                            <XCircleIcon className="w-5 h-5"/>
                        </button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                 <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Filter by Cod. SEC</label>
                 <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <SearchIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="search"
                      placeholder="Enter Cod. SEC..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 transition-colors"
                      disabled={data.length === 0}
                    />
                 </div>
              </div>
            </div>
            {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
          </div>

          <div className="bg-white dark:bg-gray-900 shadow-xl rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
             <div className="overflow-x-auto">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                    </div>
                ) : data.length === 0 ? (
                  <div className="text-center p-16 text-gray-500 dark:text-gray-400">
                    <TableIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold">No data to display</h3>
                    <p>Please upload an XLSX file to begin.</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-blue-600 dark:bg-blue-800">
                      <tr>
                        {expectedHeaders.map((header) => (
                          <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredData.length > 0 ? (
                        filteredData.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{row.NTE}</td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{row.Municipio}</td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{row['Cod.SEC']}</td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{row['Nome Escola']}</td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{row.Valor}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                            <td colSpan={expectedHeaders.length} className="text-center py-10 text-gray-500">
                                No results found for "{searchTerm}".
                            </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
             </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
