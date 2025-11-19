
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Download, ChevronDown, X, ArrowUp, ArrowDown, Filter, SortAsc } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';

export interface DataTableColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'array' | 'boolean';
  searchable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
}

export interface DataTableFilters {
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  columnFilters: Record<string, string[]>;
  propertyFilters: Record<string, string[]>;
}

export interface DataTableToolbarProps<T = any> {
  data: T[];
  columns: DataTableColumn[];
  sensitiveProperties?: string[];
  filters: DataTableFilters;
  onFiltersChange: (filters: DataTableFilters) => void;
  onExport?: (filteredData: T[]) => void;
  exportFileName?: string;
  searchPlaceholder?: string;
  className?: string;
  onDataFilter?: (filteredData: T[]) => void;
}

export function DataTableToolbar<T extends Record<string, any>>({
  data,
  columns,
  sensitiveProperties = [],
  filters,
  onFiltersChange,
  onExport,
  exportFileName = 'export',
  searchPlaceholder = 'Buscar...',
  className = '',
  onDataFilter,
}: DataTableToolbarProps<T>) {
  const [columnFilterOpen, setColumnFilterOpen] = useState(false);
  const [propertyFilterOpen, setPropertyFilterOpen] = useState(false);
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState<string>('');
  const [columnSearchTerm, setColumnSearchTerm] = useState('');
  const [propertySearchTerm, setPropertySearchTerm] = useState('');
  const isMobile = useIsMobile();

  // Get the first sortable column as default
  const getDefaultSortColumn = () => {
    const sortableColumns = columns.filter(col => col.sortable !== false);
    return sortableColumns.length > 0 ? sortableColumns[0].key : '';
  };

  const currentSortBy = filters.sortBy || getDefaultSortColumn();

  // Get data filtered only by search (before column/property filters)
  const searchFilteredData = useMemo(() => {
    if (!filters.search) return data;
    
    const searchTerm = filters.search.toLowerCase();
    return data.filter(item =>
      columns
        .filter(col => col.searchable !== false)
        .some(col => {
          const value = item[col.key];
          if (Array.isArray(value)) {
            return value.some(v => String(v).toLowerCase().includes(searchTerm));
          }
          return String(value || '').toLowerCase().includes(searchTerm);
        })
    );
  }, [data, filters.search, columns]);

  // Get unique values for column filters (from search-filtered data)
  const getUniqueValues = (columnKey: string): string[] => {
    const column = columns.find(col => col.key === columnKey);
    const isArrayColumn = column?.type === 'array';
    
    if (isArrayColumn) {
      // For array columns, extract all individual values from all arrays
      const allValues = searchFilteredData.flatMap(item => {
        const value = item[columnKey];
        if (Array.isArray(value)) {
          return value.map(v => String(v).trim());
        }
        return [];
      }).filter(v => v !== '');
      
      return [...new Set(allValues)].sort();
    }
    
    // For non-array columns, use existing logic
    const values = searchFilteredData.map(item => {
      const value = item[columnKey];
      if (value instanceof Date) {
        return value.toLocaleDateString('es-ES');
      }
      if (typeof value === 'string' && !isNaN(Date.parse(value))) {
        const dateValue = new Date(value);
        return dateValue.toLocaleDateString('es-ES');
      }
      return String(value || '');
    }).filter(v => v !== '');
    
    return [...new Set(values)].sort();
  };

  // Filter unique values based on search term
  const getFilteredUniqueValues = (columnKey: string, searchTerm: string): string[] => {
    const allValues = getUniqueValues(columnKey);
    if (!searchTerm) return allValues;
    
    return allValues.filter(value => 
      value.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Apply all filters to data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply global search first
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(item =>
        columns
          .filter(col => col.searchable !== false)
          .some(col => {
            const value = item[col.key];
            if (Array.isArray(value)) {
              return value.some(v => String(v).toLowerCase().includes(searchTerm));
            }
            return String(value || '').toLowerCase().includes(searchTerm);
          })
      );
    }

    // Apply column filters
    Object.entries(filters.columnFilters).forEach(([columnKey, selectedValues]) => {
      if (selectedValues.length > 0) {
        const column = columns.find(col => col.key === columnKey);
        const isArrayColumn = column?.type === 'array';
        
        result = result.filter(item => {
          const value = item[columnKey];
          
          if (isArrayColumn && Array.isArray(value)) {
            // For array columns, check if any selected value is in the array
            return selectedValues.some(selectedValue => 
              value.map(v => String(v).trim()).includes(selectedValue)
            );
          }
          
          // For non-array columns
          let valueStr = '';
          if (value instanceof Date) {
            valueStr = value.toLocaleDateString('es-ES');
          } else if (typeof value === 'string' && !isNaN(Date.parse(value))) {
            const dateValue = new Date(value);
            valueStr = dateValue.toLocaleDateString('es-ES');
          } else {
            valueStr = String(value || '');
          }
          return selectedValues.includes(valueStr);
        });
      }
    });

    // Apply property filters
    Object.entries(filters.propertyFilters).forEach(([propertyKey, selectedValues]) => {
      if (selectedValues.length > 0) {
        result = result.filter(item => {
          const value = item[propertyKey];
          const valueStr = Array.isArray(value) ? value.join(', ') : String(value || '');
          return selectedValues.includes(valueStr);
        });
      }
    });

    // Apply sorting
    if (currentSortBy) {
      result.sort((a, b) => {
        const aVal = a[currentSortBy];
        const bVal = b[currentSortBy];
        
        let comparison = 0;
        if (aVal < bVal) comparison = -1;
        if (aVal > bVal) comparison = 1;
        
        return filters.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    return result;
  }, [data, filters, columns, currentSortBy]);

  // Call onDataFilter when filteredData changes
  useEffect(() => {
    if (onDataFilter) {
      onDataFilter(filteredData);
    }
  }, [filteredData, onDataFilter]);

  // Handle search changes
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    if (currentSortBy) {
      const newSortOrder = filters.sortOrder === 'asc' ? 'desc' : 'asc';
      onFiltersChange({
        ...filters,
        sortBy: currentSortBy,
        sortOrder: newSortOrder,
      });
    }
  };

  // Handle sort changes
  const handleSortChange = (column: string) => {
    const newSortOrder = filters.sortBy === column && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    onFiltersChange({
      ...filters,
      sortBy: column,
      sortOrder: newSortOrder,
    });
  };

  // Handle column filter changes
  const handleColumnFilterChange = (columnKey: string, values: string[]) => {
    onFiltersChange({
      ...filters,
      columnFilters: {
        ...filters.columnFilters,
        [columnKey]: values,
      },
    });
  };

  // Handle property filter changes
  const handlePropertyFilterChange = (propertyKey: string, values: string[]) => {
    onFiltersChange({
      ...filters,
      propertyFilters: {
        ...filters.propertyFilters,
        [propertyKey]: values,
      },
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      sortBy: '',
      sortOrder: 'asc',
      columnFilters: {},
      propertyFilters: {},
    });
  };

  // Clear specific column filter
  const clearColumnFilter = (columnKey: string) => {
    const newColumnFilters = { ...filters.columnFilters };
    delete newColumnFilters[columnKey];
    onFiltersChange({
      ...filters,
      columnFilters: newColumnFilters,
    });
  };

  // Export functionality
  const handleExport = () => {
    if (onExport) {
      onExport(filteredData);
    } else {
      const csvContent = generateCSV(filteredData, columns);
      downloadCSV(csvContent, exportFileName);
    }
  };

  const generateCSV = (data: T[], columns: DataTableColumn[]): string => {
    const headers = columns.map(col => col.label).join(',');
    const rows = data.map(item =>
      columns.map(col => {
        const value = item[col.key];
        if (Array.isArray(value)) {
          return `"${value.join(', ')}"`;
        }
        return `"${String(value || '')}"`;
      }).join(',')
    );
    return [headers, ...rows].join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Count active filters
  const activeFiltersCount = Object.values(filters.columnFilters).flat().length +
                           Object.values(filters.propertyFilters).flat().length;

  const getTotalColumnFilterCount = () => {
    return Object.values(filters.columnFilters).flat().length;
  };

  const isCurrentColumnFilterable = () => {
    if (!currentSortBy) return false;
    const column = columns.find(col => col.key === currentSortBy);
    return column?.filterable !== false;
  };

  const getCurrentColumnLabel = () => {
    const column = columns.find(col => col.key === currentSortBy);
    return column?.label || '';
  };

  const getSelectedPropertyLabel = () => {
    if (!selectedPropertyFilter) return '';
    const column = columns.find(col => col.key === selectedPropertyFilter);
    return column?.label || selectedPropertyFilter;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Mobile Layout */}
      {isMobile ? (
        <>
          {/* Search and Export Row */}
          <div className="flex flex-col space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={searchPlaceholder}
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleExport} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>

          {/* Mobile Controls Row */}
          <div className="flex flex-col space-y-3">
            {/* Sort Control */}
            <div className="flex items-center space-x-2">
              <SortAsc className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex items-center space-x-2 flex-1">
                {currentSortBy && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSortOrder}
                    className="p-1 h-8 w-8 flex-shrink-0"
                  >
                    {filters.sortOrder === 'asc' ? (
                      <ArrowUp className="h-4 w-4" />
                    ) : (
                      <ArrowDown className="h-4 w-4" />
                    )}
                  </Button>
                )}
                <Select
                  value={currentSortBy}
                  onValueChange={(value) => handleSortChange(value)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.filter(col => col.sortable !== false).map(column => (
                      <SelectItem key={column.key} value={column.key}>
                        {column.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-col space-y-2">
              {/* Column Filter */}
              {currentSortBy && isCurrentColumnFilterable() && (
                <Popover 
                  open={columnFilterOpen} 
                  onOpenChange={(open) => {
                    setColumnFilterOpen(open);
                    if (!open) setColumnSearchTerm('');
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <div className="flex items-center space-x-2">
                        <Filter className="h-4 w-4" />
                        <span className="truncate">Filtrar: {getCurrentColumnLabel()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {getTotalColumnFilterCount() > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {getTotalColumnFilterCount()}
                          </Badge>
                        )}
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">
                          Filtrar: {getCurrentColumnLabel()}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => clearColumnFilter(currentSortBy)}
                        >
                          Limpiar
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Input 
                          placeholder="Buscar valores..." 
                          value={columnSearchTerm}
                          onChange={(e) => setColumnSearchTerm(e.target.value)}
                        />
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={!filters.columnFilters[currentSortBy]?.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleColumnFilterChange(currentSortBy, []);
                                }
                              }}
                            />
                            <span className="text-sm">Todos</span>
                          </label>
                          {getFilteredUniqueValues(currentSortBy, columnSearchTerm).map(value => (
                            <label key={value} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={filters.columnFilters[currentSortBy]?.includes(value) || false}
                                onChange={(e) => {
                                  const currentValues = filters.columnFilters[currentSortBy] || [];
                                  if (e.target.checked) {
                                    handleColumnFilterChange(currentSortBy, [...currentValues, value]);
                                  } else {
                                    handleColumnFilterChange(currentSortBy, currentValues.filter(v => v !== value));
                                  }
                                }}
                              />
                              <span className="text-sm truncate">{value}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* Property Filter */}
              {sensitiveProperties.length > 0 && (
                <Popover 
                  open={propertyFilterOpen} 
                  onOpenChange={(open) => {
                    setPropertyFilterOpen(open);
                    if (!open) setPropertySearchTerm('');
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <div className="flex items-center space-x-2">
                        <Filter className="h-4 w-4" />
                        <span className="truncate">
                          {selectedPropertyFilter 
                            ? `Filtrar: ${getSelectedPropertyLabel()}` 
                            : 'Filtrar propiedades'
                          }
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {Object.values(filters.propertyFilters).flat().length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {Object.values(filters.propertyFilters).flat().length}
                          </Badge>
                        )}
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">
                          {selectedPropertyFilter 
                            ? `Filtrar: ${getSelectedPropertyLabel()}` 
                            : 'Filtrar por propiedades'
                          }
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (selectedPropertyFilter) {
                              handlePropertyFilterChange(selectedPropertyFilter, []);
                            }
                          }}
                        >
                          Limpiar
                        </Button>
                      </div>
                      
                      <Select value={selectedPropertyFilter} onValueChange={setSelectedPropertyFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar propiedad" />
                        </SelectTrigger>
                        <SelectContent>
                          {sensitiveProperties.map(property => {
                            const column = columns.find(col => col.key === property);
                            return (
                              <SelectItem key={property} value={property}>
                                {column?.label || property}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>

                      {selectedPropertyFilter && (
                        <div className="space-y-2">
                          <Input 
                            placeholder="Buscar valores..." 
                            value={propertySearchTerm}
                            onChange={(e) => setPropertySearchTerm(e.target.value)}
                          />
                          <div className="max-h-48 overflow-y-auto space-y-1">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={!filters.propertyFilters[selectedPropertyFilter]?.length}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    handlePropertyFilterChange(selectedPropertyFilter, []);
                                  }
                                }}
                              />
                              <span className="text-sm">Todos</span>
                            </label>
                            {getFilteredUniqueValues(selectedPropertyFilter, propertySearchTerm).map(value => (
                              <label key={value} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={filters.propertyFilters[selectedPropertyFilter]?.includes(value) || false}
                                  onChange={(e) => {
                                    const currentValues = filters.propertyFilters[selectedPropertyFilter] || [];
                                    if (e.target.checked) {
                                      handlePropertyFilterChange(selectedPropertyFilter, [...currentValues, value]);
                                    } else {
                                      handlePropertyFilterChange(selectedPropertyFilter, currentValues.filter(v => v !== value));
                                    }
                                  }}
                                />
                                <span className="text-sm truncate">{value}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Desktop Layout */
        <>
          {/* Search and Export */}
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={searchPlaceholder}
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleExport} variant="outline" className="ml-4">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>

          {/* Sort and Filter Controls */}
          <div className="flex items-center space-x-4 flex-wrap gap-y-2">
            {/* Sort Controls */}
            <div className="flex items-center space-x-2">
              {currentSortBy && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSortOrder}
                  className="p-1 h-8 w-8"
                >
                  {filters.sortOrder === 'asc' ? (
                    <ArrowUp className="h-4 w-4" />
                  ) : (
                    <ArrowDown className="h-4 w-4" />
                  )}
                </Button>
              )}
              <Select
                value={currentSortBy}
                onValueChange={(value) => handleSortChange(value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  {columns.filter(col => col.sortable !== false).map(column => (
                    <SelectItem key={column.key} value={column.key}>
                      {column.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Column Filter */}
            {currentSortBy && isCurrentColumnFilterable() && (
              <Popover 
                open={columnFilterOpen} 
                onOpenChange={(open) => {
                  setColumnFilterOpen(open);
                  if (!open) setColumnSearchTerm('');
                }}
              >
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <span>Filtrar: {getCurrentColumnLabel()}</span>
                    {getTotalColumnFilterCount() > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {getTotalColumnFilterCount()}
                      </Badge>
                    )}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">
                        Filtrar: {getCurrentColumnLabel()}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearColumnFilter(currentSortBy)}
                      >
                        Limpiar
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Input 
                        placeholder="Buscar valores..." 
                        value={columnSearchTerm}
                        onChange={(e) => setColumnSearchTerm(e.target.value)}
                      />
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={!filters.columnFilters[currentSortBy]?.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleColumnFilterChange(currentSortBy, []);
                              }
                            }}
                          />
                          <span>Todos</span>
                        </label>
                        {getFilteredUniqueValues(currentSortBy, columnSearchTerm).map(value => (
                          <label key={value} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={filters.columnFilters[currentSortBy]?.includes(value) || false}
                              onChange={(e) => {
                                const currentValues = filters.columnFilters[currentSortBy] || [];
                                if (e.target.checked) {
                                  handleColumnFilterChange(currentSortBy, [...currentValues, value]);
                                } else {
                                  handleColumnFilterChange(currentSortBy, currentValues.filter(v => v !== value));
                                }
                              }}
                            />
                            <span className="text-sm">{value}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* Property Filter */}
            {sensitiveProperties.length > 0 && (
              <Popover 
                open={propertyFilterOpen} 
                onOpenChange={(open) => {
                  setPropertyFilterOpen(open);
                  if (!open) setPropertySearchTerm('');
                }}
              >
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <span>
                      {selectedPropertyFilter 
                        ? `Filtrar: ${getSelectedPropertyLabel()}` 
                        : 'Filtrar propiedades'
                      }
                    </span>
                    {Object.values(filters.propertyFilters).flat().length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {Object.values(filters.propertyFilters).flat().length}
                      </Badge>
                    )}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">
                        {selectedPropertyFilter 
                          ? `Filtrar: ${getSelectedPropertyLabel()}` 
                          : 'Filtrar por propiedades'
                        }
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (selectedPropertyFilter) {
                            handlePropertyFilterChange(selectedPropertyFilter, []);
                          }
                        }}
                      >
                        Limpiar
                      </Button>
                    </div>
                    
                    <Select value={selectedPropertyFilter} onValueChange={setSelectedPropertyFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar propiedad" />
                      </SelectTrigger>
                      <SelectContent>
                        {sensitiveProperties.map(property => {
                          const column = columns.find(col => col.key === property);
                          return (
                            <SelectItem key={property} value={property}>
                              {column?.label || property}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>

                    {selectedPropertyFilter && (
                      <div className="space-y-2">
                        <Input 
                          placeholder="Buscar valores..." 
                          value={propertySearchTerm}
                          onChange={(e) => setPropertySearchTerm(e.target.value)}
                        />
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={!filters.propertyFilters[selectedPropertyFilter]?.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handlePropertyFilterChange(selectedPropertyFilter, []);
                                }
                              }}
                            />
                            <span>Todos</span>
                          </label>
                          {getFilteredUniqueValues(selectedPropertyFilter, propertySearchTerm).map(value => (
                            <label key={value} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={filters.propertyFilters[selectedPropertyFilter]?.includes(value) || false}
                                onChange={(e) => {
                                  const currentValues = filters.propertyFilters[selectedPropertyFilter] || [];
                                  if (e.target.checked) {
                                    handlePropertyFilterChange(selectedPropertyFilter, [...currentValues, value]);
                                  } else {
                                    handlePropertyFilterChange(selectedPropertyFilter, currentValues.filter(v => v !== value));
                                  }
                                }}
                              />
                              <span className="text-sm">{value}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </>
      )}

      {/* Results count and clear filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm text-muted-foreground space-y-2 sm:space-y-0">
        <span>Mostrando {filteredData.length} de {data.length} elementos</span>
        {(filters.search || activeFiltersCount > 0 || filters.sortBy) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-muted-foreground hover:text-foreground self-start sm:self-auto"
          >
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  );
}

// Custom hook for managing filter state
export function useDataTableFilters(): [DataTableFilters, (filters: DataTableFilters) => void] {
  const [filters, setFilters] = useState<DataTableFilters>({
    search: '',
    sortBy: '',
    sortOrder: 'asc',
    columnFilters: {},
    propertyFilters: {},
  });

  return [filters, setFilters];
}
