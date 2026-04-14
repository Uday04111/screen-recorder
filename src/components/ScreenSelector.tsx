import { useState } from 'react';
import { Monitor, AppWindow, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ScreenSource } from '@/types';

interface ScreenSelectorProps {
  sources: ScreenSource[];
  selectedSource: ScreenSource | null;
  onSelect: (source: ScreenSource) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export function ScreenSelector({
  sources,
  selectedSource,
  onSelect,
  onRefresh,
  isLoading,
}: ScreenSelectorProps) {
  const [filter, setFilter] = useState<'all' | 'screen' | 'window'>('all');

  // Filter sources based on type
  const filteredSources = sources.filter((source) => {
    if (filter === 'screen') {
      return source.id.startsWith('screen:');
    }
    if (filter === 'window') {
      return source.id.startsWith('window:');
    }
    return true;
  });

  // Separate screens and windows
  const screens = filteredSources.filter((s) => s.id.startsWith('screen:'));
  const windows = filteredSources.filter((s) => s.id.startsWith('window:'));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Select Source</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
          className="flex-1"
        >
          All
        </Button>
        <Button
          variant={filter === 'screen' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('screen')}
          className="flex-1 gap-2"
        >
          <Monitor className="w-4 h-4" />
          Screens
        </Button>
        <Button
          variant={filter === 'window' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('window')}
          className="flex-1 gap-2"
        >
          <AppWindow className="w-4 h-4" />
          Windows
        </Button>
      </div>

      {/* Sources list */}
      <ScrollArea className="flex-1 -mx-2 px-2">
        {sources.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Monitor className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No sources available</p>
            <p className="text-sm mt-1">Click refresh to load sources</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Screens section */}
            {(filter === 'all' || filter === 'screen') && screens.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  Screens
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {screens.map((source) => (
                    <SourceCard
                      key={source.id}
                      source={source}
                      isSelected={selectedSource?.id === source.id}
                      onClick={() => onSelect(source)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Windows section */}
            {(filter === 'all' || filter === 'window') && windows.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
                  <AppWindow className="w-4 h-4" />
                  Windows
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {windows.map((source) => (
                    <SourceCard
                      key={source.id}
                      source={source}
                      isSelected={selectedSource?.id === source.id}
                      onClick={() => onSelect(source)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// Individual source card component
interface SourceCardProps {
  source: ScreenSource;
  isSelected: boolean;
  onClick: () => void;
}

function SourceCard({ source, isSelected, onClick }: SourceCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative group rounded-xl overflow-hidden border-2 transition-all duration-200
        ${isSelected 
          ? 'border-blue-500 ring-2 ring-blue-500/20' 
          : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
        }
      `}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-slate-100 relative">
        <img
          src={source.thumbnail}
          alt={source.name}
          className="w-full h-full object-cover"
        />
        
        {/* Selection overlay */}
        {isSelected && (
          <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
            <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              Selected
            </div>
          </div>
        )}
      </div>

      {/* Name */}
      <div className="p-3 bg-white">
        <p className="text-sm font-medium text-slate-900 truncate" title={source.name}>
          {source.name}
        </p>
      </div>
    </button>
  );
}
