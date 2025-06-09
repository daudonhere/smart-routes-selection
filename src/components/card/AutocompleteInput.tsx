'use client';

import { useState, useEffect } from 'react';
import { useRouteStore } from '@/stores/routesStore';
import { fetchAutocompleteSuggestions } from '@/libs/geocoding';
import { LocationInfo } from '@/libs/types';
import { Loader2 } from 'lucide-react';

interface AutocompleteInputProps {
    value: string;
    onValueChange: (value: string) => void;
    onSelect: (locationInfo: LocationInfo) => void;
    placeholder: string;
}

export default function AutocompleteInput({ value, onValueChange, onSelect, placeholder }: AutocompleteInputProps) {
    const [suggestions, setSuggestions] = useState<LocationInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const userLocation = useRouteStore((state) => state.userLocation);

    useEffect(() => {
        if (value.length < 3) {
            setSuggestions([]);
            return;
        }

        setIsLoading(true);
        const handler = setTimeout(() => {
            fetchAutocompleteSuggestions(value, userLocation).then(results => {
                setSuggestions(results);
                setIsLoading(false);
            });
        }, 300);

        return () => {
            clearTimeout(handler);
            setIsLoading(false);
        };
    }, [value, userLocation]);

    const handleSelect = (locationInfo: LocationInfo) => {
        onSelect(locationInfo);
        setSuggestions([]);
    };

    return (
        <div className="relative w-full">
            <input
                type="text"
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                placeholder={placeholder}
                autoComplete="off"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md shadow-sm outline-none focus:border-indigo-400"
            />
            {isLoading && <Loader2 className="absolute top-2.5 right-3 h-5 w-5 text-gray-400 animate-spin" />}
            
            {suggestions.length > 0 && (
                <ul className="absolute z-20 w-full mt-1 bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                    {suggestions.map((item, index) => (
                        <li
                            key={`${item.name}-${index}`}
                            onClick={() => handleSelect(item)}
                            className="px-3 py-2 text-sm text-gray-300 cursor-pointer hover:bg-indigo-600 hover:text-white"
                        >
                            {item.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}