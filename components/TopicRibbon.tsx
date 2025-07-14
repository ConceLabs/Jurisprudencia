import React from 'react';

interface TopicRibbonProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  isLoading: boolean;
}

const TopicRibbon: React.FC<TopicRibbonProps> = ({ suggestions, onSuggestionClick, isLoading }) => {
  if (isLoading) {
    return (
      <div className="w-full overflow-x-hidden pb-2">
        <div className="flex items-center gap-2 animate-pulse">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="flex-shrink-0 px-3 py-1.5 h-7 w-48 bg-slate-200 dark:bg-slate-700 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return <div className="text-center text-xs text-slate-400 dark:text-slate-500 pb-2">No hay sugerencias disponibles en este momento.</div>;
  }

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex items-center gap-2">
        {suggestions.map((text, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(text)}
            className="flex-shrink-0 px-3 py-1.5 text-sm font-medium text-primary-700 dark:text-primary-300 bg-primary-100 dark:bg-primary-900/50 rounded-full hover:bg-primary-200 dark:hover:bg-primary-800/60 transition-colors"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TopicRibbon;