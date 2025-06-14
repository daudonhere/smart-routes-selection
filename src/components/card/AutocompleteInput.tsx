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
                onFocus={() => setIsFocused(true)}
                onBlur={handleBlur}
                placeholder={placeholder}
                autoComplete="off"
                className="w-full p-1.5 font-semibold background-tertiary color-quinary border line-senary rounded-sm shadow-sm outline-none focus:border-yellow-300 text-sm lg:text-xs lg:p-1.5 2xl:text-lg 2xl:p-2"
            />
            {isLoading && (
                <Loader2 className="absolute h-4 w-4 color-quinary animate-spin top-1.5 right-2 2xl:top-3 2xl:right-4" />
            )}
            
            {suggestions.length > 0 && isFocused && (
                <ul className="absolute z-20 w-full mt-2 background-tertiary color-quinary border line-senary rounded-sm shadow-lg max-h-60 overflow-auto">
                    {suggestions.map((item, index) => (
                        <li
                            key={`${item.name}-${index}`}
                            onClick={() => handleSelect(item)}
                            className="p-1.5 border-b line-nonary font-semibold color-quinary cursor-pointer hover:bg-yellow-300 hover:text-black text-sm lg:text-xs 2xl:text-lg"
                        >
                            {item.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}