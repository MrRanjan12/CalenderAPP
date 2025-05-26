import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CalendarDays, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';  // import translation hook
import './i18n';

export default function PanchangCalendar() {
  const { t } = useTranslation();  // initialize translation
  const [panchang, setPanchang] = useState(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState(null);

  const fetchPanchang = async () => {
    setLoading(true);
    setError(null);
    setPanchang(null);

    try {
      const response = await axios.get('https://calenderapp-duqh.onrender.com/', {
        params: { date }
      });

      setPanchang(response.data.panchang);
    } catch (err) {
      console.error('Failed to fetch Panchang data:', err.message);
      setError(t('error'));  // use translated error message
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPanchang();
  }, [date]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 to-orange-200 py-10 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-orange-600">
            <CalendarDays className="w-6 h-6" />
            <h1 className="text-2xl font-bold">{t('title')}</h1>
          </div>
          <button
            onClick={fetchPanchang}
            className="text-gray-600 hover:text-orange-600 transition"
            title={t('refresh')}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('select_date')}:
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring focus:ring-orange-300"
          />
        </div>

        {loading && (
          <div className="text-center py-4 text-orange-500 animate-pulse">
            {t('loading')}
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg">
            {error}
          </div>
        )}

        {panchang && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {Object.entries(panchang).map(([key, value]) => (
              <div
                key={key}
                className="bg-orange-50 border border-orange-200 rounded-lg p-3 shadow-sm hover:bg-orange-100 transition"
              >
                <h2 className="font-semibold text-orange-800 text-sm">
                  {t(key)} {/* Use translation keys for dynamic labels */}
                </h2>
                <p className="text-gray-700 text-sm mt-1">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
