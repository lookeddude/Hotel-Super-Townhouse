'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export const COUNTRIES = [
  // Popular (shown first)
  { code: 'IN', name: 'India',          dial: '+91',  flag: '🇮🇳' },
  { code: 'AE', name: 'UAE',            dial: '+971', flag: '🇦🇪' },
  { code: 'US', name: 'USA',            dial: '+1',   flag: '🇺🇸' },
  { code: 'GB', name: 'UK',             dial: '+44',  flag: '🇬🇧' },
  { code: 'AU', name: 'Australia',      dial: '+61',  flag: '🇦🇺' },
  { code: 'CA', name: 'Canada',         dial: '+1',   flag: '🇨🇦' },
  { code: 'SG', name: 'Singapore',      dial: '+65',  flag: '🇸🇬' },
  { code: 'SA', name: 'Saudi Arabia',   dial: '+966', flag: '🇸🇦' },
  { code: 'QA', name: 'Qatar',          dial: '+974', flag: '🇶🇦' },
  { code: 'KW', name: 'Kuwait',         dial: '+965', flag: '🇰🇼' },
  { code: 'BH', name: 'Bahrain',        dial: '+973', flag: '🇧🇭' },
  { code: 'OM', name: 'Oman',           dial: '+968', flag: '🇴🇲' },
  { code: 'MY', name: 'Malaysia',       dial: '+60',  flag: '🇲🇾' },
  { code: 'NP', name: 'Nepal',          dial: '+977', flag: '🇳🇵' },
  { code: 'LK', name: 'Sri Lanka',      dial: '+94',  flag: '🇱🇰' },
  { code: 'BD', name: 'Bangladesh',     dial: '+880', flag: '🇧🇩' },
  { code: 'PK', name: 'Pakistan',       dial: '+92',  flag: '🇵🇰' },
  // Rest of the world
  { code: 'AF', name: 'Afghanistan',    dial: '+93',  flag: '🇦🇫' },
  { code: 'AL', name: 'Albania',        dial: '+355', flag: '🇦🇱' },
  { code: 'DZ', name: 'Algeria',        dial: '+213', flag: '🇩🇿' },
  { code: 'AR', name: 'Argentina',      dial: '+54',  flag: '🇦🇷' },
  { code: 'AM', name: 'Armenia',        dial: '+374', flag: '🇦🇲' },
  { code: 'AT', name: 'Austria',        dial: '+43',  flag: '🇦🇹' },
  { code: 'AZ', name: 'Azerbaijan',     dial: '+994', flag: '🇦🇿' },
  { code: 'BE', name: 'Belgium',        dial: '+32',  flag: '🇧🇪' },
  { code: 'BR', name: 'Brazil',         dial: '+55',  flag: '🇧🇷' },
  { code: 'BG', name: 'Bulgaria',       dial: '+359', flag: '🇧🇬' },
  { code: 'KH', name: 'Cambodia',       dial: '+855', flag: '🇰🇭' },
  { code: 'CL', name: 'Chile',          dial: '+56',  flag: '🇨🇱' },
  { code: 'CN', name: 'China',          dial: '+86',  flag: '🇨🇳' },
  { code: 'CO', name: 'Colombia',       dial: '+57',  flag: '🇨🇴' },
  { code: 'HR', name: 'Croatia',        dial: '+385', flag: '🇭🇷' },
  { code: 'CY', name: 'Cyprus',         dial: '+357', flag: '🇨🇾' },
  { code: 'CZ', name: 'Czech Republic', dial: '+420', flag: '🇨🇿' },
  { code: 'DK', name: 'Denmark',        dial: '+45',  flag: '🇩🇰' },
  { code: 'EG', name: 'Egypt',          dial: '+20',  flag: '🇪🇬' },
  { code: 'ET', name: 'Ethiopia',       dial: '+251', flag: '🇪🇹' },
  { code: 'FI', name: 'Finland',        dial: '+358', flag: '🇫🇮' },
  { code: 'FR', name: 'France',         dial: '+33',  flag: '🇫🇷' },
  { code: 'GE', name: 'Georgia',        dial: '+995', flag: '🇬🇪' },
  { code: 'DE', name: 'Germany',        dial: '+49',  flag: '🇩🇪' },
  { code: 'GH', name: 'Ghana',          dial: '+233', flag: '🇬🇭' },
  { code: 'GR', name: 'Greece',         dial: '+30',  flag: '🇬🇷' },
  { code: 'HK', name: 'Hong Kong',      dial: '+852', flag: '🇭🇰' },
  { code: 'HU', name: 'Hungary',        dial: '+36',  flag: '🇭🇺' },
  { code: 'ID', name: 'Indonesia',      dial: '+62',  flag: '🇮🇩' },
  { code: 'IR', name: 'Iran',           dial: '+98',  flag: '🇮🇷' },
  { code: 'IQ', name: 'Iraq',           dial: '+964', flag: '🇮🇶' },
  { code: 'IE', name: 'Ireland',        dial: '+353', flag: '🇮🇪' },
  { code: 'IL', name: 'Israel',         dial: '+972', flag: '🇮🇱' },
  { code: 'IT', name: 'Italy',          dial: '+39',  flag: '🇮🇹' },
  { code: 'JP', name: 'Japan',          dial: '+81',  flag: '🇯🇵' },
  { code: 'JO', name: 'Jordan',         dial: '+962', flag: '🇯🇴' },
  { code: 'KZ', name: 'Kazakhstan',     dial: '+7',   flag: '🇰🇿' },
  { code: 'KE', name: 'Kenya',          dial: '+254', flag: '🇰🇪' },
  { code: 'KR', name: 'South Korea',    dial: '+82',  flag: '🇰🇷' },
  { code: 'LB', name: 'Lebanon',        dial: '+961', flag: '🇱🇧' },
  { code: 'LY', name: 'Libya',          dial: '+218', flag: '🇱🇾' },
  { code: 'MX', name: 'Mexico',         dial: '+52',  flag: '🇲🇽' },
  { code: 'MA', name: 'Morocco',        dial: '+212', flag: '🇲🇦' },
  { code: 'MM', name: 'Myanmar',        dial: '+95',  flag: '🇲🇲' },
  { code: 'NL', name: 'Netherlands',    dial: '+31',  flag: '🇳🇱' },
  { code: 'NZ', name: 'New Zealand',    dial: '+64',  flag: '🇳🇿' },
  { code: 'NG', name: 'Nigeria',        dial: '+234', flag: '🇳🇬' },
  { code: 'NO', name: 'Norway',         dial: '+47',  flag: '🇳🇴' },
  { code: 'PH', name: 'Philippines',    dial: '+63',  flag: '🇵🇭' },
  { code: 'PL', name: 'Poland',         dial: '+48',  flag: '🇵🇱' },
  { code: 'PT', name: 'Portugal',       dial: '+351', flag: '🇵🇹' },
  { code: 'RO', name: 'Romania',        dial: '+40',  flag: '🇷🇴' },
  { code: 'RU', name: 'Russia',         dial: '+7',   flag: '🇷🇺' },
  { code: 'ZA', name: 'South Africa',   dial: '+27',  flag: '🇿🇦' },
  { code: 'ES', name: 'Spain',          dial: '+34',  flag: '🇪🇸' },
  { code: 'SE', name: 'Sweden',         dial: '+46',  flag: '🇸🇪' },
  { code: 'CH', name: 'Switzerland',    dial: '+41',  flag: '🇨🇭' },
  { code: 'TW', name: 'Taiwan',         dial: '+886', flag: '🇹🇼' },
  { code: 'TZ', name: 'Tanzania',       dial: '+255', flag: '🇹🇿' },
  { code: 'TH', name: 'Thailand',       dial: '+66',  flag: '🇹🇭' },
  { code: 'TR', name: 'Turkey',         dial: '+90',  flag: '🇹🇷' },
  { code: 'UG', name: 'Uganda',         dial: '+256', flag: '🇺🇬' },
  { code: 'UA', name: 'Ukraine',        dial: '+380', flag: '🇺🇦' },
  { code: 'UZ', name: 'Uzbekistan',     dial: '+998', flag: '🇺🇿' },
  { code: 'VN', name: 'Vietnam',        dial: '+84',  flag: '🇻🇳' },
  { code: 'YE', name: 'Yemen',          dial: '+967', flag: '🇾🇪' },
  { code: 'ZM', name: 'Zambia',         dial: '+260', flag: '🇿🇲' },
  { code: 'ZW', name: 'Zimbabwe',       dial: '+263', flag: '🇿🇼' },
];

interface PhoneInputProps {
  value?: string;
  onChange: (fullNumber: string) => void;
  id?: string;
  placeholder?: string;
  inputClassName?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
}

export function PhoneInput({
  value = '',
  onChange,
  id,
  placeholder = '99999 00000',
  inputClassName = '',
  required,
  disabled,
  error,
}: PhoneInputProps) {
  const defaultCountry = COUNTRIES[0]; // India +91

  // Detect initial country from value
  const detectCountry = (val: string) => {
    if (!val) return defaultCountry;
    const match = COUNTRIES.find(c => val.startsWith(c.dial + ' ') || val.startsWith(c.dial));
    return match ?? defaultCountry;
  };

  const getNumber = (val: string, country: typeof COUNTRIES[0]) => {
    if (!val) return '';
    const prefix = country.dial + ' ';
    if (val.startsWith(prefix)) return val.slice(prefix.length);
    if (val.startsWith(country.dial)) return val.slice(country.dial.length).trim();
    return val;
  };

  const [country, setCountry] = useState(() => detectCountry(value));
  const [number, setNumber] = useState(() => getNumber(value, detectCountry(value)));
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Sync if value changes externally (e.g. form reset)
  useEffect(() => {
    if (!value) { setNumber(''); return; }
    const c = detectCountry(value);
    setCountry(c);
    setNumber(getNumber(value, c));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const emit = (c: typeof COUNTRIES[0], n: string) => {
    onChange(`${c.dial} ${n}`.trim());
  };

  const filtered = search.trim()
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dial.includes(search)
      )
    : COUNTRIES;

  return (
    <div ref={ref} className="relative flex w-full">
      {/* Country selector button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={`flex shrink-0 items-center gap-1.5 px-3 py-2 bg-surface border border-r-0 rounded-l-lg text-sm font-medium text-on-surface hover:bg-surface-container transition-colors select-none ${error ? 'border-error' : 'border-outline-variant'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className="text-base leading-none">{country.flag}</span>
        <span className="text-xs text-on-surface-variant">{country.dial}</span>
        <ChevronDown size={12} className={`text-on-surface-variant transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Phone number input */}
      <input
        id={id}
        type="tel"
        value={number}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        onChange={e => {
          setNumber(e.target.value);
          emit(country, e.target.value);
        }}
        className={`flex-1 min-w-0 px-3 py-2 bg-surface border rounded-r-lg text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${error ? 'border-error focus:ring-error/20 focus:border-error' : 'border-outline-variant'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${inputClassName}`}
      />

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 z-[999] mt-1 w-72 bg-white rounded-xl border border-outline-variant shadow-xl overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-outline-variant bg-surface">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-white border border-outline-variant rounded-lg">
              <Search size={13} className="text-on-surface-variant shrink-0" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search country or code..."
                className="flex-1 text-xs bg-transparent outline-none text-on-surface placeholder:text-on-surface-variant/60"
              />
            </div>
          </div>
          {/* List */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-xs text-on-surface-variant text-center">No country found</p>
            ) : (
              filtered.map(c => (
                <button
                  key={`${c.code}-${c.dial}`}
                  type="button"
                  onClick={() => {
                    setCountry(c);
                    setOpen(false);
                    setSearch('');
                    emit(c, number);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors hover:bg-primary/5 ${country.code === c.code && country.dial === c.dial ? 'bg-primary/10 text-primary font-medium' : 'text-on-surface'}`}
                >
                  <span className="text-base leading-none w-6 shrink-0">{c.flag}</span>
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-xs text-on-surface-variant shrink-0">{c.dial}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
