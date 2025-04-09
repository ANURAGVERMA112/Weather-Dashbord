import React, { useState, useEffect } from "react";
import SearchBar from "../components/SearchBar";
import WeatherCard from "../components/WeatherCard";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import RecentSearches from "../components/RecentSearches";
import ForecastSection from "../components/ForecastSection";
import { fetchWeatherByCity, fetchForecastByCity } from "../services/weatherService";
import { WeatherData, RecentCity, ForecastData } from "../types/weather";
import { CloudSun } from "lucide-react";
import { useToast } from "../components/ui/use-toast";

const MAX_RECENT_SEARCHES = 5;
const LOCAL_STORAGE_KEY = "recentSearches";

const Index: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isForecastLoading, setIsForecastLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<RecentCity[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const savedSearches = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
  }, []);

  const saveToRecentSearches = (city: RecentCity) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter(
        (item) => item.name.toLowerCase() !== city.name.toLowerCase()
      );
      const updated = [city, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const fetchWeather = async (city: string, refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const data = await fetchWeatherByCity(city);
      setWeatherData(data);
      
      // Save to recent searches
      if (!refresh) {
        saveToRecentSearches({
          name: data.name,
          country: data.sys.country
        });
      }
      
      // Fetch forecast data after weather data
      setIsForecastLoading(true);
      try {
        const forecastData = await fetchForecastByCity(city);
        setForecastData(forecastData);
      } catch (forecastErr) {
        console.error("Forecast error:", forecastErr);
        // We don't set error state here as we still have the main weather data
      } finally {
        setIsForecastLoading(false);
      }
      
      if (refresh) {
        toast({
          title: "Weather Updated",
          description: `Latest weather data for ${data.name} has been loaded.`,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch weather data");
      setWeatherData(null);
      setForecastData(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleSearch = (city: string) => {
    fetchWeather(city);
  };

  const handleRefresh = () => {
    if (weatherData) {
      fetchWeather(weatherData.name, true);
    }
  };

  const handleRecentCitySelect = (cityName: string) => {
    fetchWeather(cityName);
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12">
      <div className="mb-8 flex items-center">
        <CloudSun className="h-8 w-8 text-blue-500 mr-2" />
        <h1 className="text-3xl font-bold">Weather Dashboard</h1>
      </div>
      
      <SearchBar onSearch={handleSearch} isLoading={isLoading} />
      
      <RecentSearches 
        searches={recentSearches}
        onSelect={handleRecentCitySelect}
        isLoading={isLoading}
      />
      
      <div className="mt-8 w-full flex flex-col items-center">
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : weatherData ? (
          <>
            <WeatherCard 
              data={weatherData} 
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
            />
            <ForecastSection 
              data={forecastData}
              isLoading={isForecastLoading}
            />
          </>
        ) : (
          <div className="text-center p-10 max-w-lg">
            <CloudSun className="h-16 w-16 text-blue-300 mx-auto mb-4" />
            <h2 className="text-xl font-medium mb-2">Weather Dashboard</h2>
            <p className="text-gray-500">
              Search for a city to see the current weather conditions.
            </p>
          </div>
        )}
      </div>
      
      <div className="mt-auto pt-8 text-center text-xs text-gray-500">
        <p>Data provided by OpenWeatherMap</p>
        <p className="mt-1">
          Note: Please add your API key in the weatherService.ts file.
        </p>
      </div>
    </div>
  );
};

export default Index;
