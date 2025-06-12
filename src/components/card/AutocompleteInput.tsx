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
    const [isFocused, setIsFocused] = useState(false);
    const userLocation = useRouteStore((state) => state.userLocation);

    useEffect(() => {
        if (value.length < 3 || !isFocused) {
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
    }, [value, userLocation, isFocused]);

    const handleSelect = (locationInfo: LocationInfo) => {
        onSelect(locationInfo);
        setSuggestions([]);
        setIsFocused(false);
    };

    const handleBlur = () => {
        setTimeout(() => {
            setIsFocused(false);
        }, 150);
    };

    return (
        <div className="relative w-full">
            <input
                type="text"
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                onFocus={() => setIsFocused(true)} // REVISI: Set fokus saat input diklik
                onBlur={handleBlur}                 // REVISI: Handle saat fokus keluar
                placeholder={placeholder}
                autoComplete="off"
                className="w-full py-1 px-2 background-quaternary color-senary border line-quinary rounded-md shadow-sm outline-none focus:border-yellow-300"
            />
            {isLoading && <Loader2 className="absolute top-2.5 right-3 h-5 w-5 color-quinary animate-spin" />}
            
            {suggestions.length > 0 && isFocused && (
                <ul className="absolute z-20 w-full mt-1 bg-neutral-900 border line-quinary rounded-md shadow-lg max-h-60 overflow-auto">
                    {suggestions.map((item, index) => (
                        <li
                            key={`${item.name}-${index}`}
                            onClick={() => handleSelect(item)}
                            className="px-3 py-2 text-sm color-senary cursor-pointer hover:bg-yellow-400 hover:text-black"
                        >
                            {item.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}