import { Trash2 } from 'lucide-react';

export const SearchGroupList = ({ searches, onSelect, onDelete, activeTab }) => {
    // Filter searches if needed? Currently all searches are shown, user drills down to see filter status

    // We can add a helper to sum stats per search if backend doesn't provide it
    // Backend provides results_count. We might want processed count later.

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
            {searches.map((search) => (
                <div
                    key={search.id}
                    onClick={() => onSelect(search.id)}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md hover:border-orange-300 transition-all group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg group-hover:bg-orange-100 dark:group-hover:bg-orange-900/40 transition-colors">
                            <span className="text-2xl">🔍</span>
                            {/* Or use business type icon if available/mapped */}
                        </div>
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                            {new Date(search.created_at).toLocaleDateString()}
                        </span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('¿Estás seguro de eliminar esta búsqueda?')) {
                                    onDelete(search.id);
                                }
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Eliminar búsqueda"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1 truncate">
                        {search.query}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 truncate flex items-center gap-1">
                        📍 {search.location}
                    </p>

                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                            {search.results_count} Prospectos
                        </span>
                        <span className="text-orange-600 dark:text-orange-400 font-medium group-hover:translate-x-1 transition-transform">
                            Ver listado →
                        </span>
                    </div>
                </div>
            ))
            }

            {
                searches.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        <p className="text-gray-500">No hay búsquedas registradas.</p>
                    </div>
                )
            }
        </div >
    );
};
