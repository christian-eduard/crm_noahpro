import React, { useState, useEffect } from 'react';
import Button from './Button';
import TagBadge from './TagBadge';

const TagManager = ({ leadId, currentTags = [], onClose, onUpdate }) => {
    const [availableTags, setAvailableTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState(currentTags);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#3B82F6');
    const [showCreateTag, setShowCreateTag] = useState(false);

    useEffect(() => {
        fetchAvailableTags();
    }, []);

    const fetchAvailableTags = async () => {
        try {
            const response = await fetch('http://localhost:3002/api/tags');
            if (response.ok) {
                const tags = await response.json();
                setAvailableTags(tags);
            }
        } catch (error) {
            console.error('Error fetching tags:', error);
        }
    };

    const createTag = async () => {
        try {
            const response = await fetch('http://localhost:3002/api/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newTagName, color: newTagColor })
            });

            if (response.ok) {
                const newTag = await response.json();
                setAvailableTags([...availableTags, newTag]);
                setNewTagName('');
                setShowCreateTag(false);
                addTagToLead(newTag);
            }
        } catch (error) {
            console.error('Error creating tag:', error);
        }
    };

    const addTagToLead = async (tag) => {
        try {
            const response = await fetch(`http://localhost:3002/api/tags/lead/${leadId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tagId: tag.id })
            });

            if (response.ok) {
                setSelectedTags([...selectedTags, tag]);
                onUpdate && onUpdate();
            }
        } catch (error) {
            console.error('Error adding tag to lead:', error);
        }
    };

    const removeTagFromLead = async (tagId) => {
        try {
            const response = await fetch(`http://localhost:3002/api/tags/lead/${leadId}/${tagId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setSelectedTags(selectedTags.filter(t => t.id !== tagId));
                onUpdate && onUpdate();
            }
        } catch (error) {
            console.error('Error removing tag from lead:', error);
        }
    };

    const toggleTag = (tag) => {
        const isSelected = selectedTags.find(t => t.id === tag.id);
        if (isSelected) {
            removeTagFromLead(tag.id);
        } else {
            addTagToLead(tag);
        }
    };

    const popularColors = [
        '#EF4444', '#F97316', '#F59E0B', '#EAB308',
        '#84CC16', '#22C55E', '#10B981', '#14B8A6',
        '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
        '#8B5CF6', '#A855F7', '#D946EF', '#EC4899'
    ];

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Gestionar Tags</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Selected Tags */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tags Seleccionados
                    </label>
                    <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                        {selectedTags.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">No hay tags seleccionados</p>
                        ) : (
                            selectedTags.map(tag => (
                                <TagBadge key={tag.id} tag={tag} onRemove={removeTagFromLead} />
                            ))
                        )}
                    </div>
                </div>

                {/* Available Tags */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tags Disponibles
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                        {availableTags.map(tag => {
                            const isSelected = selectedTags.find(t => t.id === tag.id);
                            return (
                                <button
                                    key={tag.id}
                                    onClick={() => toggleTag(tag)}
                                    className={`p-2 rounded-lg text-sm font-medium transition-all ${isSelected
                                            ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-gray-800'
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                                        }`}
                                    style={{
                                        backgroundColor: `${tag.color}20`,
                                        color: tag.color
                                    }}
                                >
                                    {tag.name} {isSelected && '✓'}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Create New Tag */}
                {!showCreateTag ? (
                    <Button
                        variant="secondary"
                        onClick={() => setShowCreateTag(true)}
                        size="sm"
                        className="w-full"
                    >
                        + Crear Nuevo Tag
                    </Button>
                ) : (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Nombre del Tag
                            </label>
                            <input
                                type="text"
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                placeholder="Ej: Cliente Premium"
                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Color
                            </label>
                            <div className="grid grid-cols-8 gap-2">
                                {popularColors.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setNewTagColor(color)}
                                        className={`w-8 h-8 rounded-lg transition-all ${newTagColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                                            }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <Button
                                variant="secondary"
                                onClick={() => setShowCreateTag(false)}
                                size="sm"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={createTag}
                                disabled={!newTagName.trim()}
                                size="sm"
                            >
                                Crear Tag
                            </Button>
                        </div>
                    </div>
                )}

                <div className="mt-6 flex justify-end">
                    <Button onClick={onClose}>
                        Cerrar
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default TagManager;
