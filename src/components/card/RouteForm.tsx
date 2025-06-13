import { useRouteStore } from "@/stores/routesStore";
import AutocompleteInput from "./AutocompleteInput";

interface RouteFormProps {
  pricePerKm: string;
  setPricePerKm: (value: string) => void;
  selectedCurrency: string;
  setSelectedCurrency: (value: string) => void;
  currencies: { code: string, name: string, symbol: string }[];
}

export default function RouteForm({ 
  pricePerKm, 
  setPricePerKm, 
  selectedCurrency, 
  setSelectedCurrency,
  currencies 
}: RouteFormProps) {
  const includeTolls = useRouteStore((state) => state.includeTolls);
  const setIncludeTolls = useRouteStore((state) => state.setIncludeTolls);
  const departureAddress = useRouteStore((state) => state.departureAddress);
  const destinationAddress = useRouteStore((state) => state.destinationAddress);
  const transportMode = useRouteStore((state) => state.transportMode);
  const isRouteLoading = useRouteStore((state) => state.isRouteLoading);
  const setDepartureFromInput = useRouteStore((state) => state.setDepartureFromInput);
  const setDestinationFromInput = useRouteStore((state) => state.setDestinationFromInput);
  const fetchRoutes = useRouteStore((state) => state.fetchRoutes);
  const setPoint = useRouteStore((state) => state.setPoint);
  const isActionLocked = useRouteStore((state) => state.isActionLocked);
  
  const isButtonDisabled = isRouteLoading || !departureAddress.trim() || !destinationAddress.trim() || !pricePerKm.trim() || isActionLocked;

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isActionLocked) return;
    fetchRoutes();
  };

  return (
    <fieldset disabled={isActionLocked} className="flex flex-col gap-2 w-full disabled:cursor-not-allowed">
      <form onSubmit={handleFormSubmit} className="flex flex-col gap-2 w-full">
        <AutocompleteInput
          value={departureAddress}
          onValueChange={setDepartureFromInput}
          onSelect={(location) => setPoint('departure', location)}
          placeholder="Departure"
        />
        <AutocompleteInput
          value={destinationAddress}
          onValueChange={setDestinationFromInput}
          onSelect={(location) => setPoint('destination', location)}
          placeholder="Destination"
        />

        {(transportMode === 'car' || transportMode === 'truck') && (
          <div className="ml-1 flex items-center justify-start">
            <input
              type="checkbox"
              id="includeTolls"
              checked={includeTolls}
              onChange={(e) => setIncludeTolls(e.target.checked)}
              className="h-4 w-4 rounded border line-senary background-tertiary color-quinary focus:ring-tertiary disabled:cursor-not-allowed "
            />
            <label htmlFor="includeTolls" className="ml-2 block text-sm color-senary font-semibold">
              Toll Road
            </label>
          </div>
        )}

        <div className="flex flex-row items-center gap-2">
          <select
            value={selectedCurrency}
            disabled={isButtonDisabled}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="cursor-pointer px-2 py-1 text-sm font-bold background-tertiary color-quinary border line-senary rounded-sm shadow-sm outline-none focus:border-yellow-200 color-quinary"
          >
            {currencies.map(c => 
              <option key={c.code} value={c.code} className='background-tertiary color-quinary text-sm font-semibold'>
                  {c.name}
              </option>
            )}
          </select>
          <input
            type="text"
            inputMode="decimal"
            value={pricePerKm}
            onChange={(e) => /^\d*\.?\d*$/.test(e.target.value) && setPricePerKm(e.target.value)}
            placeholder="Price/KM"
            className="w-full py-1 px-2 text-sm font-bold background-tertiary border line-senary rounded-sm shadow-sm outline-none focus:border-yellow-200 color-quinary"
          />
        </div>

        <button
          type="submit"
          disabled={isButtonDisabled}
          className="cursor-pointer w-full mt-1 background-senary hover:bg-yellow-300 color-primary font-semibold py-1.5 px-4 rounded-sm focus:outline-none focus:shadow-outline disabled:cursor-not-allowed disabled:opacity-70 transition-colors"
        >
          {isRouteLoading ? 'Calculating...' : 'Search'}
        </button>
      </form>
    </fieldset>
  );
}